const pool = require('./pool');

// system_settings 系统设置（key-value）：AI 运行时配置等可由管理员后台修改的项
async function get(k) {
  const [rows] = await pool.query('SELECT v FROM system_settings WHERE k = ?', [k]);
  return rows.length ? rows[0].v : undefined;
}

async function getAll() {
  const [rows] = await pool.query('SELECT k, v FROM system_settings');
  const map = {};
  for (const r of rows) map[r.k] = r.v;
  return map;
}

// upsert：存在即覆盖，值统一存字符串（JSON 由调用方序列化）
async function set(k, v) {
  await pool.query(
    `INSERT INTO system_settings (k, v) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE v = VALUES(v)`, [k, v == null ? null : String(v)]);
}

async function remove(k) {
  await pool.query('DELETE FROM system_settings WHERE k = ?', [k]);
}

module.exports = { get, getAll, set, remove };
