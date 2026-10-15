const pool = require('../dao/pool');
const { CODES, BizError } = require('../utils/errors');
const provider = require('../ai/provider');
const planEngine = require('../ai/planEngine');
const planDao = require('../dao/planDao');
const questionDao = require('../dao/questionDao');
const wrongDao = require('../dao/wrongDao');
const answerDao = require('../dao/answerDao');
const aiGenDao = require('../dao/aiGenDao');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// 本地时区「今天」字符串（禁止 toISOString，避免 UTC 使东八区差一天）
function localTodayStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 严格日期校验：格式 YYYY-MM-DD 且为真实存在的日期（拦截 2026-13-99、2026-02-31 等）
function isValidDateStr(s) {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` === s;
}

// 计划任务校验（逐条过滤）：保留含 task_date / content 且日期落在 [today, examDate] 的任务
// 日期容忍 "YYYY-MM-DDTHH:mm:ss" 等扩展格式（截取前 10 位）；过滤后至少 1 条合法即采用，最多 200 条
function filterValidTasks(tasks, { todayStr, examDate } = {}) {
  if (!Array.isArray(tasks)) return null;
  const valid = tasks.map((t) => {
    if (!t || !t.content) return null;
    const d = String(t.task_date || '').trim().slice(0, 10);
    if (!isValidDateStr(d)) return null;
    if (todayStr && d < todayStr) return null;
    if (examDate && d > examDate) return null;
    return {
      task_date: d,
      time_slot: String(t.time_slot || '').slice(0, 16),
      content: String(t.content).slice(0, 490),
      ref_question_ids: null
    };
  }).filter(Boolean).slice(0, 200);
  return valid.length ? valid : null;
}

// 去 markdown 代码围栏，提取首个 JSON 数组，提高 LLM 输出鲁棒性
function extractJsonArray(text) {
  if (!text) return null;
  let s = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  const start = s.indexOf('[');
  const end = s.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) return null;
  s = s.slice(start, end + 1);
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// target_subjects 兼容：字符串 "1,2" / 数组 [1,2] / 空
function parseTargetIds(input) {
  if (Array.isArray(input)) return input.map(Number).filter(Boolean);
  if (typeof input === 'number') return [input].filter(Boolean);
  return String(input || '').split(',').map((s) => Number(String(s).trim())).filter(Boolean);
}

// 智能复习计划（F6，AC6）：组装学习数据 → AI 生成 → 校验 → 旧计划归档 → 落库
async function generate(userId, { exam_date, target_subjects, daily_minutes }) {
  if (exam_date && !isValidDateStr(exam_date)) {
    throw new BizError(CODES.BAD_REQUEST, '考试日期格式应为 YYYY-MM-DD 且为合法日期');
  }
  const todayStr = localTodayStr();
  const daysLeft = exam_date
    ? Math.ceil((new Date(`${exam_date}T00:00:00`) - new Date(`${todayStr}T00:00:00`)) / 86400000)
    : 14;
  if (daysLeft < 1) throw new BizError(CODES.BAD_REQUEST, '考试日期需晚于今天');
  if (daysLeft > 365) throw new BizError(CODES.BAD_REQUEST, '考试日期过远（上限 365 天）');

  const minutes = daily_minutes == null || daily_minutes === '' ? 60 : Number(daily_minutes);
  if (!Number.isInteger(minutes) || minutes < 5 || minutes > 480) {
    throw new BizError(CODES.BAD_REQUEST, '每日复习时长须为 5～480 的整数（分钟）');
  }

  const subjects = await questionDao.listSubjects();
  const targetIds = parseTargetIds(target_subjects);
  const targetSubjects = subjects.filter((s) => !targetIds.length || targetIds.includes(s.id));
  const wrongDist = await wrongDao.distributionBySubject(userId);
  const wrongSample = await wrongDao.sampleUnmastered(userId, 30);
  const recent = await answerDao.recentAccuracy(userId);
  const recentAccuracy = recent.total ? `${Math.round((Number(recent.correct) / recent.total) * 100)}%` : '暂无数据';

  // 明天日期：显式锚定到提示词，避免模型编造 task_date 年份
  const tomorrowStr = (() => {
    const d = new Date(`${todayStr}T00:00:00`);
    d.setDate(d.getDate() + 1);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  })();

  // 组装上下文与 Prompt（双模共用），由 Provider 生成任务数组
  const planContext = {
    daysLeft, subjects: targetSubjects, wrongDist, wrongSample,
    dailyMinutes: minutes
  };
  const prompt = provider.renderTemplate('plan.md', {
    today: todayStr,
    tomorrow: tomorrowStr,
    days_left: daysLeft,
    target_subjects: targetSubjects.map((s) => s.name).join('、') || '全部科目',
    daily_minutes: planContext.dailyMinutes,
    wrong_distribution: wrongDist.map((w) => `${w.subject_name || w.subject_id}=${w.wrong_total}题`).join('；') || '暂无错题',
    recent_accuracy: recentAccuracy
  });

  let tasks;
  let usedProvider = provider.getProviderName();
  const startedAt = Date.now();
  try {
    if (usedProvider === 'llm') {
      const ret = await provider.generate('plan', { prompt, planContext });
      usedProvider = ret.provider;
      // LLM 输出可能带 ```json 围栏或前后缀，先提取再解析；逐条过滤保留合法任务
      const parsed = extractJsonArray(ret.content);
      const valid = parsed && filterValidTasks(parsed, { todayStr, examDate: exam_date || null });
      if (!valid) {
        // 留下原始输出样例便于排查格式问题（截断避免刷屏）
        console.warn('[plan] LLM 输出结构校验未通过，回退 mock 规则引擎。输出样例：',
          String(ret.content || '').slice(0, 300));
        tasks = planEngine.buildTasks(planContext);
        usedProvider = `${usedProvider}+mock-fallback`;
      } else {
        tasks = valid;
      }
    } else {
      tasks = planEngine.buildTasks(planContext); // mock：规则引擎直接生成
    }
  } catch (e) {
    if (e instanceof BizError) throw e;
    // 计划失败同样留痕（与讲解链路一致），便于排查；留痕失败不掩盖主错误
    try {
      await aiGenDao.create(pool, {
        user_id: userId, gen_type: 'plan', ref_type: 'review_plan', ref_id: 0,
        question_version: null, provider: usedProvider, prompt,
        content: '', status: 'failed', duration_ms: Date.now() - startedAt,
        error_msg: String(e.message || e).slice(0, 255)
      });
    } catch (_) { /* ignore */ }
    throw new BizError(CODES.AI_UPSTREAM, `复习计划生成失败：${e.message}`);
  }

  // 事务：旧 active 计划置 archived（重新生成场景）→ 新计划与任务落库
  const conn = await pool.getConnection();
  let planId;
  try {
    await conn.beginTransaction();
    await planDao.archiveActive(conn, userId);
    const targetStr = targetIds.length ? targetIds.join(',') : null;
    planId = await planDao.createPlan(conn, {
      userId, examDate: exam_date || null,
      targetSubjects: targetStr, dailyMinutes: planContext.dailyMinutes
    });
    for (const t of tasks) {
      await planDao.createTask(conn, { plan_id: planId, ...t });
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }

  // AI 生成留痕：计划多态关联 review_plans，回写 plan.ai_generation_id
  // 留痕在事务外，失败只记日志不抛错，避免“计划已建但接口 500”导致前端重复生成
  try {
    const genId = await aiGenDao.create(pool, {
      user_id: userId, gen_type: 'plan', ref_type: 'review_plan', ref_id: planId,
      question_version: null, provider: usedProvider, prompt,
      content: JSON.stringify(tasks), status: 'success', duration_ms: Date.now() - startedAt
    });
    await planDao.setAiGeneration(pool, planId, genId);
  } catch (e) {
    console.error('[plan] AI 留痕失败（计划已生成，不影响返回）:', e.message);
  }

  return current(userId);
}

// 当前 active 计划 + 任务列表 + 实时聚合进度（AC7）
async function current(userId) {
  const plan = await planDao.findActive(userId);
  if (!plan) return null;
  const tasks = await planDao.listTasks(plan.id);
  const p = await planDao.progress(plan.id);
  return {
    ...plan,
    tasks,
    progress: {
      done: Number(p.done), total: p.total,
      percent: p.total ? Math.round((Number(p.done) / p.total) * 100) : 0
    }
  };
}

async function listHistory(userId) {
  const plans = await planDao.listByUser(userId);
  const result = [];
  for (const plan of plans) {
    const p = await planDao.progress(plan.id);
    result.push({
      ...plan,
      progress: { done: Number(p.done), total: p.total,
        percent: p.total ? Math.round((Number(p.done) / p.total) * 100) : 0 }
    });
  }
  return result;
}

// 任务打卡：原子置 done 并记 done_at，重复/并发打卡返回 40901
async function checkIn(userId, taskId) {
  const task = await planDao.findTaskById(taskId);
  if (!task) throw new BizError(CODES.NOT_FOUND, '计划任务不存在');
  const [[plan]] = await pool.query('SELECT * FROM review_plans WHERE id = ?', [task.plan_id]);
  if (!plan || plan.user_id !== userId) throw new BizError(CODES.NOT_FOUND, '计划任务不存在');
  const affected = await planDao.checkInTask(taskId);
  if (!affected) throw new BizError(CODES.CONFLICT, '该任务已完成打卡，请勿重复操作');
  const p = await planDao.progress(task.plan_id);
  return {
    task_id: taskId, status: 'done',
    progress: { done: Number(p.done), total: p.total,
      percent: p.total ? Math.round((Number(p.done) / p.total) * 100) : 0 }
  };
}

// ---- 管理端复习计划管理（F8）：跨考生查看与维护 ----
function shapeProgress(p) {
  return {
    done: Number(p.done), total: p.total,
    percent: p.total ? Math.round((Number(p.done) / p.total) * 100) : 0
  };
}

async function adminList(params) {
  const { list, total } = await planDao.adminList(params);
  return {
    list: list.map((p) => ({ ...p, progress: shapeProgress({ done: p.task_done, total: p.task_total }) })),
    total
  };
}

// 计划详情：计划主体 + 任务列表 + 实时进度（供后台抽屉查看）
async function adminDetail(id) {
  const plan = await planDao.findWithUser(id);
  if (!plan) throw new BizError(CODES.NOT_FOUND, '复习计划不存在');
  const tasks = await planDao.listTasks(id);
  const p = await planDao.progress(id);
  return { ...plan, tasks, progress: shapeProgress(p) };
}

// 状态流转：置 active 时先归档该考生原有 active 计划，保持「同用户仅一个 active」
const PLAN_STATUS = ['active', 'archived', 'finished'];
async function adminSetStatus(id, { status }) {
  if (!PLAN_STATUS.includes(status)) {
    throw new BizError(CODES.BAD_REQUEST, '状态值仅支持 active、archived、finished');
  }
  const plan = await planDao.findWithUser(id);
  if (!plan) throw new BizError(CODES.NOT_FOUND, '复习计划不存在');
  if (status === 'active' && plan.status !== 'active') {
    await planDao.archiveActive(pool, plan.user_id);
  }
  await planDao.setStatus(id, status);
  return { id, status };
}

// 删除计划：任务随外键级联删除；AI 生成留痕保留在 ai_generations
async function adminRemove(id) {
  const affected = await planDao.remove(id);
  if (!affected) throw new BizError(CODES.NOT_FOUND, '复习计划不存在');
  return { id };
}

async function adminStats() {
  const s = await planDao.adminStats();
  // SUM 聚合返回 DECIMAL（字符串），统一转数字供前端直接使用
  return {
    total: Number(s.total),
    active: Number(s.active_cnt),
    task_total: Number(s.task_total),
    task_done: Number(s.task_done)
  };
}

module.exports = {
  generate, current, listHistory, checkIn,
  adminList, adminDetail, adminSetStatus, adminRemove, adminStats
};
