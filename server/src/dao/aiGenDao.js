const pool = require('./pool');

// ai_generations AI 生成记录与缓存
async function create(conn, g) {
  const [ret] = await (conn || pool).query(
    `INSERT INTO ai_generations
       (user_id, gen_type, ref_type, ref_id, question_version, provider, prompt, content, status, duration_ms, error_msg)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [g.user_id, g.gen_type, g.ref_type, g.ref_id, g.question_version || null,
     g.provider, g.prompt || null, g.content, g.status || 'success',
     g.duration_ms == null ? null : Number(g.duration_ms), g.error_msg || null]);
  return ret.insertId;
}

// 讲解缓存查询：同用户同错题最近一条 success 记录（调用方比对 question_version 判版本失效）
async function findLatestExplain(userId, wrongQuestionId) {
  const [rows] = await pool.query(
    `SELECT * FROM ai_generations
     WHERE user_id = ? AND gen_type = 'explain' AND ref_type = 'wrong_question'
       AND ref_id = ? AND status = 'success'
     ORDER BY id DESC LIMIT 1`, [userId, wrongQuestionId]);
  return rows[0] || null;
}

// ---- 管理端（F8 AI 服务管理）：调用记录查询与统计 ----
async function adminList({ keyword, userId, genType, status, provider, offset, size }) {
  const conds = [];
  const params = [];
  if (keyword) {
    // 关键词匹配用户名/昵称或生成内容（错误信息）
    conds.push('(u.username LIKE ? OR u.nickname LIKE ? OR g.error_msg LIKE ?)');
    const like = `%${keyword}%`;
    params.push(like, like, like);
  }
  if (userId) { conds.push('g.user_id = ?'); params.push(Number(userId)); }
  if (genType) { conds.push('g.gen_type = ?'); params.push(genType); }
  if (status) { conds.push('g.status = ?'); params.push(status); }
  if (provider) { conds.push('g.provider LIKE ?'); params.push(`%${provider}%`); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT g.id, g.user_id, g.gen_type, g.ref_type, g.ref_id, g.provider,
            g.status, g.duration_ms, g.error_msg, g.created_at,
            CHAR_LENGTH(g.content) AS content_length,
            u.username, u.nickname
     FROM ai_generations g
     LEFT JOIN users u ON u.id = g.user_id
     ${where} ORDER BY g.id DESC LIMIT ? OFFSET ?`, [...params, size, offset]);
  const [cnt] = await pool.query(
    `SELECT COUNT(*) AS total FROM ai_generations g LEFT JOIN users u ON u.id = g.user_id ${where}`, params);
  return { list: rows, total: cnt[0].total };
}

// 记录详情：含完整提示词与生成内容，供管理员排查审计
async function findById(id) {
  const [rows] = await pool.query(
    `SELECT g.*, u.username, u.nickname FROM ai_generations g
     LEFT JOIN users u ON u.id = g.user_id WHERE g.id = ?`, [id]);
  return rows[0] || null;
}

// 调用统计：总量/成功率/平均耗时 + 按功能类型分布 + 近 7 天调用量
async function stats() {
  const [overall] = await pool.query(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(status = 'success'), 0) AS success,
            COALESCE(SUM(status = 'failed'), 0) AS failed,
            COALESCE(SUM(DATE(created_at) = CURDATE()), 0) AS today,
            ROUND(AVG(duration_ms)) AS avg_duration_ms
     FROM ai_generations`);
  const [byType] = await pool.query(
    `SELECT gen_type, COUNT(*) AS total, COALESCE(SUM(status = 'success'), 0) AS success
     FROM ai_generations GROUP BY gen_type`);
  const [byProvider] = await pool.query(
    `SELECT provider, COUNT(*) AS total FROM ai_generations GROUP BY provider ORDER BY total DESC LIMIT 5`);
  const [trend] = await pool.query(
    `SELECT DATE(created_at) AS day, COUNT(*) AS total,
            COALESCE(SUM(status = 'success'), 0) AS success
     FROM ai_generations
     WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY DATE(created_at) ORDER BY day`);
  return { overall: overall[0], by_type: byType, by_provider: byProvider, trend };
}

module.exports = { create, findLatestExplain, adminList, findById, stats };
