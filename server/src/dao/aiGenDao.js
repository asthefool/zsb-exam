const pool = require('./pool');

// ai_generations AI 生成记录与缓存
async function create(conn, g) {
  const [ret] = await (conn || pool).query(
    `INSERT INTO ai_generations
       (user_id, gen_type, ref_type, ref_id, question_version, provider, prompt, content, status, error_msg)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [g.user_id, g.gen_type, g.ref_type, g.ref_id, g.question_version || null,
     g.provider, g.prompt || null, g.content, g.status || 'success', g.error_msg || null]);
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

module.exports = { create, findLatestExplain };
