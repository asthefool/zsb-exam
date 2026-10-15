const pool = require('./pool');

// review_plans / plan_tasks 复习计划
async function createPlan(conn, { userId, examDate, targetSubjects, dailyMinutes }) {
  const [ret] = await (conn || pool).query(
    `INSERT INTO review_plans (user_id, exam_date, target_subjects, daily_minutes, status)
     VALUES (?, ?, ?, ?, 'active')`,
    [userId, examDate || null, targetSubjects || null, dailyMinutes || null]);
  return ret.insertId;
}

async function archiveActive(conn, userId) {
  await (conn || pool).query(
    "UPDATE review_plans SET status = 'archived' WHERE user_id = ? AND status = 'active'", [userId]);
}

async function setAiGeneration(conn, planId, aiGenerationId) {
  await (conn || pool).query(
    'UPDATE review_plans SET ai_generation_id = ? WHERE id = ?', [aiGenerationId, planId]);
}

async function findActive(userId) {
  const [rows] = await pool.query(
    "SELECT * FROM review_plans WHERE user_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1",
    [userId]);
  return rows[0] || null;
}

async function listByUser(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM review_plans WHERE user_id = ? ORDER BY id DESC', [userId]);
  return rows;
}

async function createTask(conn, t) {
  const [ret] = await (conn || pool).query(
    `INSERT INTO plan_tasks (plan_id, task_date, time_slot, content, ref_question_ids)
     VALUES (?, ?, ?, ?, ?)`,
    [t.plan_id, t.task_date, t.time_slot || '', t.content,
     t.ref_question_ids ? JSON.stringify(t.ref_question_ids) : null]);
  return ret.insertId;
}

async function listTasks(planId) {
  const [rows] = await pool.query(
    'SELECT * FROM plan_tasks WHERE plan_id = ? ORDER BY task_date, id', [planId]);
  return rows;
}

async function findTaskById(id) {
  const [rows] = await pool.query('SELECT * FROM plan_tasks WHERE id = ?', [id]);
  return rows[0] || null;
}

async function checkInTask(id) {
  // 原子打卡：仅 pending 可置 done，返回影响行数供调用方判重复/并发
  const [ret] = await pool.query(
    "UPDATE plan_tasks SET status = 'done', done_at = NOW() WHERE id = ? AND status = 'pending'", [id]);
  return ret.affectedRows || 0;
}

// 计划进度：done / total 实时聚合，不冗余存储
async function progress(planId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total, COALESCE(SUM(status = 'done'), 0) AS done
     FROM plan_tasks WHERE plan_id = ?`, [planId]);
  return rows[0];
}

async function todayTasks(userId) {
  const [rows] = await pool.query(
    `SELECT pt.* FROM plan_tasks pt
     JOIN review_plans rp ON rp.id = pt.plan_id
     WHERE rp.user_id = ? AND rp.status = 'active' AND pt.task_date = CURDATE()
     ORDER BY pt.id`, [userId]);
  return rows;
}

// ---- 管理端（F8 复习计划管理）：跨考生查询与维护 ----
async function adminList({ keyword, userId, status, offset, size }) {
  const conds = [];
  const params = [];
  if (keyword) {
    conds.push('(u.username LIKE ? OR u.nickname LIKE ?)');
    const like = `%${keyword}%`;
    params.push(like, like);
  }
  if (userId) { conds.push('rp.user_id = ?'); params.push(Number(userId)); }
  if (status) { conds.push('rp.status = ?'); params.push(status); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT rp.*, u.username, u.nickname,
            (SELECT COUNT(*) FROM plan_tasks t WHERE t.plan_id = rp.id) AS task_total,
            (SELECT COUNT(*) FROM plan_tasks t WHERE t.plan_id = rp.id AND t.status = 'done') AS task_done
     FROM review_plans rp
     JOIN users u ON u.id = rp.user_id
     ${where} ORDER BY rp.id DESC LIMIT ? OFFSET ?`, [...params, size, offset]);
  const [cnt] = await pool.query(
    `SELECT COUNT(*) AS total FROM review_plans rp JOIN users u ON u.id = rp.user_id ${where}`, params);
  return { list: rows, total: cnt[0].total };
}

async function findWithUser(id) {
  const [rows] = await pool.query(
    `SELECT rp.*, u.username, u.nickname FROM review_plans rp
     JOIN users u ON u.id = rp.user_id WHERE rp.id = ?`, [id]);
  return rows[0] || null;
}

// 状态流转：active/archived/finished（管理员归档或完结考生计划）
async function setStatus(id, status) {
  const [ret] = await pool.query('UPDATE review_plans SET status = ? WHERE id = ?', [status, id]);
  return ret.affectedRows || 0;
}

// 删除计划：plan_tasks 建表时 ON DELETE CASCADE，任务一并删除
async function remove(id) {
  const [ret] = await pool.query('DELETE FROM review_plans WHERE id = ?', [id]);
  return ret.affectedRows || 0;
}

async function adminStats() {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(status = 'active'), 0) AS active_cnt,
            (SELECT COUNT(*) FROM plan_tasks) AS task_total,
            (SELECT COUNT(*) FROM plan_tasks WHERE status = 'done') AS task_done
     FROM review_plans`);
  return rows[0];
}

module.exports = {
  createPlan, archiveActive, setAiGeneration, findActive, listByUser,
  createTask, listTasks, findTaskById, checkInTask, progress, todayTasks,
  adminList, findWithUser, setStatus, remove, adminStats
};
