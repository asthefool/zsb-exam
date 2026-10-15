const { CODES, BizError } = require('../utils/errors');
const provider = require('../ai/provider');
const wrongDao = require('../dao/wrongDao');
const questionDao = require('../dao/questionDao');
const answerDao = require('../dao/answerDao');
const aiGenDao = require('../dao/aiGenDao');
const wrongService = require('./wrongService');

// 题目 updated_at 格式归一（讲解缓存版本比对用）
// 统一格式化为「本地墙钟时间」字符串：mysql2 开启 dateStrings:true 后 DATETIME 以字符串返回，
// 此处兼容 Date 与字符串两种输入，两侧同口径才能保证往返比对一致；
// 若改为 UTC（toISOString）会造成二次偏移，缓存永不命中
function normTime(v) {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const Q_TYPE_TEXT = { single: '单选题', multiple: '多选题', judge: '判断题' };

// AI 配置查询（F5/F6）：驱动前端降级提示
async function getConfig() {
  return provider.status();
}

// 错题讲解缓存查询（F5）：同用户同错题最近 success 且题目版本未变
async function getCachedExplanation(userId, wrongQuestionId) {
  const record = await wrongDao.findById(wrongQuestionId);
  if (!record || record.user_id !== userId) throw new BizError(CODES.NOT_FOUND, '错题记录不存在');
  const q = await questionDao.findById(record.question_id);
  const cached = await aiGenDao.findLatestExplain(userId, wrongQuestionId);
  if (!cached) return null;
  if (normTime(cached.question_version) !== normTime(q && q.updated_at)) return null; // 题目已修改，缓存失效
  return {
    content: cached.content, provider: cached.provider, cached: true,
    notice: 'AI 生成，仅供参考'
  };
}

// 生成错题讲解（F5，AC4/AC5）：先查缓存，未命中调用 Provider，结果落 ai_generations
async function generateExplanation(userId, { wrong_question_id, force }) {
  const record = await wrongDao.findById(wrong_question_id);
  if (!record || record.user_id !== userId) throw new BizError(CODES.NOT_FOUND, '错题记录不存在');
  const q = await questionDao.findById(record.question_id);
  if (!q) throw new BizError(CODES.NOT_FOUND, '关联题目不存在');

  if (!force) {
    const cached = await getCachedExplanation(userId, wrong_question_id);
    if (cached) return cached;
  }

  // 最近一次作答记录作为「考生答案」输入
  const history = await answerDao.listByUserQuestion(userId, q.id);
  const lastAnswer = history.length ? history[0].user_answer : '';

  const subject = await questionDao.listSubjects();
  const subjectName = (subject.find((s) => s.id === q.subject_id) || {}).name || '';

  const context = {
    q_type: q.q_type, subject_name: subjectName, content: q.content,
    options: q.options, user_answer: lastAnswer, answer: q.answer,
    analysis: q.analysis, wrong_count: record.wrong_count
  };
  const prompt = provider.renderTemplate('explain.md', {
    q_type_text: Q_TYPE_TEXT[q.q_type] || q.q_type,
    subject_name: subjectName,
    content: q.content,
    options_text: q.options ? JSON.stringify(q.options) : '（无选项）',
    user_answer: lastAnswer || '未作答',
    answer: q.answer,
    analysis: q.analysis || '（暂无）'
  });

  const startedAt = Date.now();
  try {
    const ret = await provider.generate('explain', { prompt, context });
    const durationMs = Date.now() - startedAt;
    // 结构校验：须包含三个固定小节
    const c = ret.content;
    const valid = c.includes('错因分析') && c.includes('解题思路') && c.includes('知识点提示');
    if (!valid) throw new Error('讲解结构校验未通过（缺少固定小节）');
    const genId = await aiGenDao.create(null, {
      user_id: userId, gen_type: 'explain', ref_type: 'wrong_question', ref_id: wrong_question_id,
      question_version: normTime(q.updated_at), provider: ret.provider, prompt,
      content: c, status: 'success', duration_ms: durationMs
    });
    return {
      id: genId, content: c, provider: ret.provider, cached: false,
      notice: 'AI 生成，仅供参考'
    };
  } catch (e) {
    // 失败也留痕，便于排查（AC5）；error_msg 统一截断 255，与计划链路一致
    if (e instanceof BizError && e.code === CODES.AI_NOT_CONFIGURED) throw e;
    await aiGenDao.create(null, {
      user_id: userId, gen_type: 'explain', ref_type: 'wrong_question', ref_id: wrong_question_id,
      question_version: normTime(q.updated_at), provider: provider.getProviderName(), prompt,
      content: '', status: 'failed', duration_ms: Date.now() - startedAt,
      error_msg: String(e.message || e).slice(0, 255)
    }).catch(() => {});
    if (e instanceof BizError) throw e;
    throw new BizError(CODES.AI_UPSTREAM, 'AI 讲解生成失败或超时，请稍后重试');
  }
}

// ---- 管理端 AI 服务管理（F8）----
const aiConfig = require('../ai/aiConfig');

// 当前服务配置（脱敏）+ 可用性提示，后台配置页展示用
async function adminConfig() {
  await aiConfig.ensureLoaded();
  return { ...provider.status(), ...aiConfig.safeView() };
}

// 更新运行时配置：落 system_settings 并热生效；校验失败转 BizError
async function adminUpdateConfig(patch) {
  try {
    return await aiConfig.update(patch || {});
  } catch (e) {
    throw new BizError(CODES.BAD_REQUEST, e.message || '配置项不合法');
  }
}

// 连通性测试：按当前配置发一条最小请求，验证端点/密钥/模型可用并测耗时
async function adminTestConnection() {
  await aiConfig.ensureLoaded();
  const cfg = aiConfig.get();
  if (cfg.provider === 'mock') {
    return { ok: true, provider: 'mock', model: cfg.model, duration_ms: 0, message: '当前为 mock 模式，无需外部连通' };
  }
  if (!cfg.apiKey) {
    return { ok: false, provider: cfg.provider, model: cfg.model, duration_ms: 0, message: '未配置 API Key，无法连通' };
  }
  const startedAt = Date.now();
  try {
    const ret = await provider.generate('explain', {
      prompt: '连通性测试：请只回复「连通正常」四个字，不要输出任何其他内容。'
    });
    return {
      ok: true, provider: cfg.provider, model: ret.provider,
      duration_ms: Date.now() - startedAt,
      message: `连通正常，返回样例：${String(ret.content).trim().slice(0, 20)}`
    };
  } catch (e) {
    return {
      ok: false, provider: cfg.provider, model: cfg.model,
      duration_ms: Date.now() - startedAt,
      message: `连通失败：${e.message || e}`
    };
  }
}

// 调用记录：分页 + 筛选（类型/状态/用户/关键词/提供方）
async function adminListGenerations(params) {
  const { list, total } = await aiGenDao.adminList(params);
  return { list, total };
}

async function adminGenerationDetail(id) {
  const record = await aiGenDao.findById(id);
  if (!record) throw new BizError(CODES.NOT_FOUND, 'AI 调用记录不存在');
  return record;
}

async function adminStats() {
  const s = await aiGenDao.stats();
  const num = (v) => (v == null ? 0 : Number(v));
  return {
    overall: {
      total: num(s.overall.total),
      success: num(s.overall.success),
      failed: num(s.overall.failed),
      today: num(s.overall.today),
      avg_duration_ms: s.overall.avg_duration_ms == null ? null : num(s.overall.avg_duration_ms)
    },
    by_type: s.by_type.map((r) => ({ gen_type: r.gen_type, total: num(r.total), success: num(r.success) })),
    by_provider: s.by_provider.map((r) => ({ provider: r.provider, total: num(r.total) })),
    trend: s.trend.map((r) => ({ day: r.day, total: num(r.total), success: num(r.success) }))
  };
}

module.exports = {
  getConfig, getCachedExplanation, generateExplanation,
  adminConfig, adminUpdateConfig, adminTestConnection,
  adminListGenerations, adminGenerationDetail, adminStats
};
