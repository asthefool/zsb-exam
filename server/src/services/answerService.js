const pool = require('../dao/pool');
const { CODES, BizError } = require('../utils/errors');
const questionDao = require('../dao/questionDao');
const answerDao = require('../dao/answerDao');
const wrongDao = require('../dao/wrongDao');

// 判分规则：单选精确匹配；多选排序后比对；判断题 true/false
function judge(q, userAnswer) {
  const ua = String(userAnswer || '').trim();
  if (!ua) return false;
  if (q.q_type === 'multiple') {
    // 只保留 A-Z 字母，兼容 "A,B" / "A B" / "ab" 等输入
    const norm = (s) => String(s || '').replace(/[^A-Za-z]/g, '')
      .toUpperCase().split('').sort().join('');
    return norm(ua) === norm(q.answer);
  }
  if (q.q_type === 'judge') {
    const lower = ua.toLowerCase();
    const truthy = { true: 'true', 1: 'true', 't': 'true', 'a': 'true', '对': 'true', '正确': 'true', '√': 'true' };
    const falsy = { false: 'false', 0: 'false', 'f': 'false', 'b': 'false', '错': 'false', '错误': 'false', '×': 'false', 'x': 'false' };
    const map = { ...truthy, ...falsy };
    const normUa = map[lower] !== undefined ? map[lower] : lower;
    return normUa === String(q.answer || '').trim().toLowerCase();
  }
  return ua.toUpperCase() === String(q.answer || '').trim().toUpperCase();
}

// 提交作答并判分（F3/F4，AC2/AC3）：
// 单事务内写答题记录 + 错题归集 upsert，任一失败整体回滚
async function submit(userId, { question_id, user_answer, source }) {
  const q = await questionDao.findById(question_id);
  if (!q || q.status !== 1 || q.deleted_at) throw new BizError(CODES.NOT_FOUND, '题目不存在或已下架');
  const answerStr = String(user_answer ?? '');
  if (answerStr.length > 32) throw new BizError(CODES.BAD_REQUEST, '答案长度超限（上限 32 字符）');
  const src = ['practice', 'wrong_redo', 'plan_task'].includes(source) ? source : 'practice';
  const isCorrect = judge(q, answerStr);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await answerDao.create(conn, {
      userId, questionId: q.id, userAnswer: String(user_answer || ''), isCorrect: isCorrect ? 1 : 0, source: src
    });
    if (!isCorrect) {
      await wrongDao.upsertWrong(conn, userId, q.id);
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }

  return {
    is_correct: isCorrect,
    correct_answer: q.answer,
    analysis: q.analysis || ''
  };
}

module.exports = { submit, judge };
