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

// 按科目、题型聚合的未掌握错题数（掌握度面板用）
async function unmasteredBySubjectType(userId) {
  const [rows] = await pool.query(
    `SELECT q.subject_id, q.q_type, COUNT(*) AS wrong_total
     FROM wrong_questions w
     JOIN questions q ON q.id = w.question_id
     WHERE w.user_id = ? AND w.mastered = 0 AND q.status = 1 AND q.deleted_at IS NULL
     GROUP BY q.subject_id, q.q_type`, [userId]);
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

// ---- 管理端（F8 错题管理）：跨考生查询与维护 ----
// 关键词模糊匹配考生用户名/昵称或题干；不筛已软删题目，便于管理员追溯
async function adminList({ keyword, userId, subjectId, mastered, offset, size }) {
  const conds = [];
  const params = [];
  if (keyword) {
    conds.push('(u.username LIKE ? OR u.nickname LIKE ? OR q.content LIKE ?)');
    const like = `%${keyword}%`;
    params.push(like, like, like);
  }
  if (userId) { conds.push('w.user_id = ?'); params.push(Number(userId)); }
  if (subjectId) { conds.push('q.subject_id = ?'); params.push(Number(subjectId)); }
  if (mastered !== undefined && mastered !== '') { conds.push('w.mastered = ?'); params.push(Number(mastered)); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT w.id, w.user_id, w.question_id, w.wrong_count, w.last_wrong_at, w.mastered, w.created_at,
            u.username, u.nickname,
            q.subject_id, q.q_type, q.content, q.difficulty, q.status AS question_status, q.deleted_at,
            s.name AS subject_name
     FROM wrong_questions w
     JOIN users u ON u.id = w.user_id
     JOIN questions q ON q.id = w.question_id
     LEFT JOIN subjects s ON s.id = q.subject_id
     ${where} ORDER BY w.last_wrong_at DESC, w.id DESC LIMIT ? OFFSET ?`,
    [...params, size, offset]);
  const [cnt] = await pool.query(
    `SELECT COUNT(*) AS total FROM wrong_questions w
     JOIN users u ON u.id = w.user_id JOIN questions q ON q.id = w.question_id ${where}`, params);
  return { list: rows, total: cnt[0].total };
}

// 管理端概览：错题总量、未掌握量、涉及考生数、今日新增
async function adminStats() {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(mastered = 0), 0) AS unmastered,
            COUNT(DISTINCT user_id) AS user_total,
            COALESCE(SUM(DATE(last_wrong_at) = CURDATE()), 0) AS today_wrong
     FROM wrong_questions`);
  return rows[0];
}

// 管理员删除错题记录（硬删；相关 AI 讲解记录保留在 ai_generations 供审计）
async function remove(id) {
  const [ret] = await pool.query('DELETE FROM wrong_questions WHERE id = ?', [id]);
  return ret.affectedRows || 0;
}

module.exports = {
  findById, findByUserQuestion, upsertWrong, list, setMastered,
  countActive, distributionBySubject, unmasteredBySubjectType, sampleUnmastered,
  adminList, adminStats, remove
};
