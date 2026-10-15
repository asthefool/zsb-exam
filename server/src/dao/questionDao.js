const pool = require('./pool');

// subjects / questions 表数据访问
async function listSubjects() {
  const [rows] = await pool.query('SELECT id, name, sort FROM subjects ORDER BY sort, id');
  return rows;
}

// 考生端题目列表：仅启用且未软删，不含答案与解析
async function listQuestions({ subjectId, qType, offset, size }) {
  const conds = ['status = 1', 'deleted_at IS NULL'];
  const params = [];
  if (subjectId) { conds.push('subject_id = ?'); params.push(Number(subjectId)); }
  if (qType) { conds.push('q_type = ?'); params.push(qType); }
  const where = `WHERE ${conds.join(' AND ')}`;
  const [rows] = await pool.query(
    `SELECT id, subject_id, q_type, content, options, difficulty FROM questions ${where}
     ORDER BY id LIMIT ? OFFSET ?`, [...params, size, offset]);
  const [cnt] = await pool.query(`SELECT COUNT(*) AS total FROM questions ${where}`, params);
  return { list: rows, total: cnt[0].total };
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT q.*, s.name AS subject_name FROM questions q
     LEFT JOIN subjects s ON s.id = q.subject_id
     WHERE q.id = ?`,
    [id]
  );
  return rows[0] || null;
}

// 管理端题目列表：含全部状态，支持关键词检索
// keyword 中 %/_/| 转义，避免全匹配；转义符用 | 而非 \，避免反斜杠在字符串字面量中二次转义
async function adminList({ keyword, offset, size }) {
  const conds = ['q.deleted_at IS NULL'];
  const params = [];
  if (keyword) {
    const esc = String(keyword).replace(/[|%_]/g, (m) => `|${m}`);
    conds.push("q.content LIKE ? ESCAPE '|'");
    params.push(`%${esc}%`);
  }
  const where = `WHERE ${conds.join(' AND ')}`;
  const [rows] = await pool.query(
    `SELECT q.*, s.name AS subject_name FROM questions q
     LEFT JOIN subjects s ON s.id = q.subject_id ${where}
     ORDER BY q.id DESC LIMIT ? OFFSET ?`, [...params, size, offset]);
  const [cnt] = await pool.query(`SELECT COUNT(*) AS total FROM questions q ${where}`, params);
  return { list: rows, total: cnt[0].total };
}

async function create(q) {
  const [ret] = await pool.query(
    `INSERT INTO questions (subject_id, q_type, content, options, answer, analysis, difficulty, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [q.subject_id, q.q_type, q.content, q.options ? JSON.stringify(q.options) : null,
     q.answer, q.analysis || null, q.difficulty || 2, q.status === undefined ? 1 : q.status]);
  return ret.insertId;
}

async function update(id, q) {
  await pool.query(
    `UPDATE questions SET subject_id = ?, q_type = ?, content = ?, options = ?,
       answer = ?, analysis = ?, difficulty = ?, status = ? WHERE id = ?`,
    [q.subject_id, q.q_type, q.content, q.options ? JSON.stringify(q.options) : null,
     q.answer, q.analysis || null, q.difficulty || 2, q.status === undefined ? 1 : q.status, id]);
}

// 软删：停用并记录删除时间，历史作答与错题引用不断链
async function softDelete(id) {
  await pool.query('UPDATE questions SET status = 0, deleted_at = NOW() WHERE id = ?', [id]);
}

// 题库规模：按科目、题型统计启用题目数（覆盖率分母）
async function bankStats() {
  const [rows] = await pool.query(
    `SELECT subject_id, q_type, COUNT(*) AS total FROM questions
     WHERE status = 1 AND deleted_at IS NULL GROUP BY subject_id, q_type`);
  return rows;
}

module.exports = { listSubjects, listQuestions, findById, adminList, create, update, softDelete, bankStats };
