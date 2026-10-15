const pool = require('../dao/pool');
const { CODES, BizError } = require('../utils/errors');
const wrongDao = require('../dao/wrongDao');
const questionDao = require('../dao/questionDao');
const answerDao = require('../dao/answerDao');
const answerService = require('./answerService');

// 错题本（F4）：所有接口以令牌 user_id 取数，杜绝越权
function assertOwner(record, userId) {
  if (!record) throw new BizError(CODES.NOT_FOUND, '错题记录不存在');
  if (record.user_id !== userId) throw new BizError(CODES.NOT_FOUND, '错题记录不存在');
}

// 严格解析 mastered 入参：仅 1/'1'/true 为已掌握，其余视为未掌握，避免 "false" 真值陷阱
function parseMastered(v) {
  return v === 1 || v === '1' || v === true ? 1 : 0;
}

async function list(userId, params) {
  const { list, total } = await wrongDao.list(userId, params);
  return { list, total, page: params.page, size: params.size };
}

// 错题详情：不含答案/解析，避免重练前泄题；答案仅在重练判分结果中返回
async function detail(userId, id) {
  const record = await wrongDao.findById(id);
  assertOwner(record, userId);
  const q = await questionDao.findById(record.question_id);
  if (!q) throw new BizError(CODES.NOT_FOUND, '关联题目不存在');
  const history = await answerDao.listByUserQuestion(userId, record.question_id);
  return {
    id: record.id,
    question_id: record.question_id,
    wrong_count: record.wrong_count,
    last_wrong_at: record.last_wrong_at,
    mastered: record.mastered,
    question: {
      subject_id: q.subject_id,
      subject_name: q.subject_name,
      q_type: q.q_type,
      content: q.content,
      options: q.options,
      difficulty: q.difficulty
    },
    history
  };
}

// 错题重练（F4/F6）：复用判分事务逻辑；答对置为已掌握
// 注意：submit 内部已提交答题事务，此处 setMastered 为辅助标记；失败不回滚答题，
// 仅降级返回 mastered=0 并记日志，避免“答题已记但接口 500”误导前端重试。
async function repractice(userId, id, { user_answer }) {
  const record = await wrongDao.findById(id);
  assertOwner(record, userId);
  const result = await answerService.submit(userId, {
    question_id: record.question_id,
    user_answer,
    source: 'wrong_redo'
  });
  if (result.is_correct) {
    try {
      await wrongDao.setMastered(pool, id, 1);
    } catch (e) {
      console.error('[repractice] setMastered failed:', e.message);
      return { ...result, mastered: 0, masteredSynced: false };
    }
  }
  return { ...result, mastered: result.is_correct ? 1 : 0 };
}

async function markMastered(userId, id, { mastered }) {
  const record = await wrongDao.findById(id);
  assertOwner(record, userId);
  const v = parseMastered(mastered);
  await wrongDao.setMastered(pool, id, v);
  return { mastered: v };
}

// ---- 管理端错题管理（F8）：跨考生查看与维护 ----
async function adminList(params) {
  const { list, total } = await wrongDao.adminList(params);
  return { list, total };
}

async function adminStats() {
  const s = await wrongDao.adminStats();
  // SUM 聚合返回 DECIMAL（字符串），统一转数字供前端直接使用
  return {
    total: Number(s.total),
    unmastered: Number(s.unmastered),
    user_total: Number(s.user_total),
    today_wrong: Number(s.today_wrong)
  };
}

// 管理员代标掌握状态（如线下辅导后统一标记）
async function adminSetMastered(id, { mastered }) {
  const record = await wrongDao.findById(id);
  if (!record) throw new BizError(CODES.NOT_FOUND, '错题记录不存在');
  const v = parseMastered(mastered);
  await wrongDao.setMastered(pool, id, v);
  return { id, mastered: v };
}

// 管理员删除错题记录：历史作答记录与 AI 讲解留痕不受影响
async function adminRemove(id) {
  const affected = await wrongDao.remove(id);
  if (!affected) throw new BizError(CODES.NOT_FOUND, '错题记录不存在');
  return { id };
}

module.exports = { list, detail, repractice, markMastered, adminList, adminStats, adminSetMastered, adminRemove };
