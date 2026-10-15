const pool = require('./pool');

// users 表数据访问：全部参数化查询
async function findByUsername(username) {
  const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, username, nickname, role, status, created_at FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

async function create({ username, passwordHash, nickname, role = 'student' }) {
  const [ret] = await pool.query(
    'INSERT INTO users (username, password_hash, nickname, role) VALUES (?, ?, ?, ?)',
    [username, passwordHash, nickname || username, role]);
  return ret.insertId;
}

async function updateProfile(id, { nickname }) {
  await pool.query('UPDATE users SET nickname = ? WHERE id = ?', [nickname, id]);
  return findById(id);
}

async function list({ role, status, offset, size }) {
  const conds = [];
  const params = [];
  if (role) { conds.push('role = ?'); params.push(role); }
  if (status !== undefined && status !== '') { conds.push('status = ?'); params.push(Number(status)); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT id, username, nickname, role, status, created_at FROM users ${where}
     ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, size, offset]);
  const [cnt] = await pool.query(`SELECT COUNT(*) AS total FROM users ${where}`, params);
  return { list: rows, total: cnt[0].total };
}

async function setStatus(id, status) {
  await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
}

module.exports = { findByUsername, findById, create, updateProfile, list, setStatus };
