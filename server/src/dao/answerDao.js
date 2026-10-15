const pool = require('./pool');

// answer_records 答题记录：写操作支持外部传入事务连接
async function create(conn, { userId, questionId, userAnswer, isCorrect, source }) {
  const [ret] = await (conn || pool).query(
    `INSERT INTO answer_records (user_id, question_id, user_answer, is_correct, source)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, questionId, userAnswer, isCorrect, source || 'practice']);
  return ret.insertId;
}

// 某用户某题的历史作答记录（错题详情用）
async function listByUserQuestion(userId, questionId) {
  const [rows] = await pool.query(
    `SELECT id, user_answer, is_correct, source, answered_at FROM answer_records
     WHERE user_id = ? AND question_id = ? ORDER BY answered_at DESC, id DESC LIMIT 20`,
    [userId, questionId]);
  return rows;
}

// 累计做题量与正确数（首页概览）
async function statsByUser(userId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total, COALESCE(SUM(is_correct), 0) AS correct
     FROM answer_records WHERE user_id = ?`, [userId]);
  return rows[0];
}

// 用户全部作答（按时间升序，掌握度计算用）
async function listWithQuestion(userId) {
  const [rows] = await pool.query(
    `SELECT a.question_id, a.is_correct, a.answered_at, q.subject_id, q.q_type
     FROM answer_records a JOIN questions q ON q.id = a.question_id
     WHERE a.user_id = ? ORDER BY a.answered_at, a.id`, [userId]);
  return rows;
}

// 近 7 日正确率（计划生成上下文）
async function recentAccuracy(userId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total, COALESCE(SUM(is_correct), 0) AS correct
     FROM answer_records WHERE user_id = ? AND answered_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
    [userId]);
  return rows[0];
}

module.exports = { create, listByUserQuestion, statsByUser, listWithQuestion, recentAccuracy };
