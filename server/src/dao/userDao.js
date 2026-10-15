const pool = require('./pool');

// users 表数据访问：全部参数化查询
async function findByUsername(username) {
  const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0] || null;
}

// 修改密码用：只取密码哈希，避免整行敏感字段外泄
async function findPasswordHash(id) {
  const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [id]);
  return rows.length ? rows[0].password_hash : null;
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT id, username, nickname, gender, phone, email, target_school, bio, avatar,
            role, status, created_at
     FROM users WHERE id = ?`, [id]);
  return rows[0] || null;
}

async function create({ username, passwordHash, nickname, role = 'student' }) {
  const [ret] = await pool.query(
    'INSERT INTO users (username, password_hash, nickname, role) VALUES (?, ?, ?, ?)',
    [username, passwordHash, nickname || username, role]);
  return ret.insertId;
}

// 个人资料：白名单字段动态更新（昵称 + 性别/手机/邮箱/目标院校/签名/头像）
const PROFILE_FIELDS = ['nickname', 'gender', 'phone', 'email', 'target_school', 'bio', 'avatar'];

async function updateProfile(id, patch) {
  const sets = [];
  const params = [];
  for (const f of PROFILE_FIELDS) {
    if (patch[f] !== undefined) {
      sets.push(`${f} = ?`);
      params.push(patch[f]);
    }
  }
  if (!sets.length) return findById(id);
  params.push(id);
  await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);
  return findById(id);
}

async function updatePassword(id, passwordHash) {
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
}

async function list({ role, status, offset, size }) {
  const conds = [];
  const params = [];
  if (role) { conds.push('role = ?'); params.push(role); }
  if (status !== undefined && status !== '') { conds.push('status = ?'); params.push(Number(status)); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT id, username, nickname, gender, phone, email, target_school, role, status, created_at
     FROM users ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, size, offset]);
  const [cnt] = await pool.query(`SELECT COUNT(*) AS total FROM users ${where}`, params);
  return { list: rows, total: cnt[0].total };
}

async function setStatus(id, status) {
  await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
}

module.exports = { findByUsername, findPasswordHash, findById, create, updateProfile, updatePassword, list, setStatus };
