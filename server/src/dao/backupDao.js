const pool = require('./pool');

// backups 数据备份记录
async function create(b) {
  const [ret] = await pool.query(
    `INSERT INTO backups (filename, file_size, table_count, row_count, sha256, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [b.filename, b.file_size, b.table_count, b.row_count, b.sha256, b.created_by || null]);
  return ret.insertId;
}

async function list({ offset, size }) {
  const [rows] = await pool.query(
    `SELECT b.*, u.username AS created_by_name
     FROM backups b LEFT JOIN users u ON u.id = b.created_by
     ORDER BY b.id DESC LIMIT ? OFFSET ?`, [size, offset]);
  const [cnt] = await pool.query('SELECT COUNT(*) AS total FROM backups');
  return { list: rows, total: cnt[0].total };
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT b.*, u.username AS created_by_name
     FROM backups b LEFT JOIN users u ON u.id = b.created_by
     WHERE b.id = ?`, [id]);
  return rows[0] || null;
}

async function remove(id) {
  const [ret] = await pool.query('DELETE FROM backups WHERE id = ?', [id]);
  return ret.affectedRows || 0;
}

module.exports = { create, list, findById, remove };
