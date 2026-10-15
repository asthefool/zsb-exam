const pool = require('./pool');

// wrong_questions 错题记录
async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM wrong_questions WHERE id = ?', [id]);
  return rows[0] || null;
}

async function findByUserQuestion(userId, questionId) {
  const [rows] = await pool.query(
    'SELECT * FROM wrong_questions WHERE user_id = ? AND question_id = ?', [userId, questionId]);
  return rows[0] || null;
}

// 判分事务内调用：答错 upsert（唯一键保证不重复建条，错误次数累加）
async function upsertWrong(conn, userId, questionId) {
  await (conn || pool).query(
    `INSERT INTO wrong_questions (user_id, question_id, wrong_count, last_wrong_at, mastered)
     VALUES (?, ?, 1, NOW(), 0)
     ON DUPLICATE KEY UPDATE wrong_count = wrong_count + 1, last_wrong_at = NOW(), mastered = 0`,
    [userId, questionId]);
}

// 错题列表：联查题目与科目，支持科目 / 掌握状态筛选
// 已软删/停用题目不再出现（与 sampleUnmastered 口径一致）
async function list(userId, { subjectId, mastered, offset, size }) {
  const conds = ['w.user_id = ?', 'q.status = 1', 'q.deleted_at IS NULL'];
  const params = [userId];
  if (subjectId) { conds.push('q.subject_id = ?'); params.push(Number(subjectId)); }
  if (mastered !== undefined && mastered !== '') { conds.push('w.mastered = ?'); params.push(Number(mastered)); }
  const where = `WHERE ${conds.join(' AND ')}`;
  const [rows] = await pool.query(
    `SELECT w.id, w.question_id, w.wrong_count, w.last_wrong_at, w.mastered,
            q.subject_id, q.q_type, q.content, q.options, q.difficulty, s.name AS subject_name
     FROM wrong_questions w
     JOIN questions q ON q.id = w.question_id
     LEFT JOIN subjects s ON s.id = q.subject_id
     ${where} ORDER BY w.last_wrong_at DESC LIMIT ? OFFSET ?`,
    [...params, size, offset]);
  const [cnt] = await pool.query(
    `SELECT COUNT(*) AS total FROM wrong_questions w JOIN questions q ON q.id = w.question_id ${where}`,
    params);
  return { list: rows, total: cnt[0].total };
}

async function setMastered(conn, id, mastered) {
  await (conn || pool).query('UPDATE wrong_questions SET mastered = ? WHERE id = ?', [mastered, id]);
}

async function countActive(userId) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS total FROM wrong_questions WHERE user_id = ? AND mastered = 0', [userId]);
  return rows[0].total;
}

// 按科目聚合的未掌握错题分布（计划生成上下文）
async function distributionBySubject(userId) {
  const [rows] = await pool.query(
    `SELECT q.subject_id, s.name AS subject_name, COUNT(*) AS wrong_total,
            SUM(w.wrong_count) AS wrong_times
     FROM wrong_questions w
     JOIN questions q ON q.id = w.question_id
     LEFT JOIN subjects s ON s.id = q.subject_id
     WHERE w.user_id = ? AND w.mastered = 0
     GROUP BY q.subject_id, s.name ORDER BY wrong_total DESC`, [userId]);
  return rows;
}

// 取未掌握错题样本（计划任务引用具体题目）
async function sampleUnmastered(userId, limit = 30) {
  const [rows] = await pool.query(
    `SELECT w.question_id, q.subject_id FROM wrong_questions w
     JOIN questions q ON q.id = w.question_id
     WHERE w.user_id = ? AND w.mastered = 0 AND q.status = 1 AND q.deleted_at IS NULL
     ORDER BY w.wrong_count DESC, w.last_wrong_at DESC LIMIT ?`, [userId, limit]);
  return rows;
}

module.exports = {
  findById, findByUserQuestion, upsertWrong, list, setMastered,
  countActive, distributionBySubject, sampleUnmastered
};
