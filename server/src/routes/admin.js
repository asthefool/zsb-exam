// 管理端路由组（F8）：整组挂 requireRole('admin')，考生访问返回 40301（AC9）
// 覆盖任务书管理员七项：登录（auth）、用户管理、题库管理、错题管理、复习计划管理、AI 服务管理、数据备份
const router = require('express').Router();
const { ok, wrap, requireFields, pager } = require('../utils/response');
const adminService = require('../services/adminService');
const wrongService = require('../services/wrongService');
const planService = require('../services/planService');
const aiService = require('../services/aiService');
const backupService = require('../services/backupService');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

router.use(verifyToken, requireRole('admin'));

// ---- 题库管理（F8-3）----
router.get('/admin/questions', wrap(async (req, res) => {
  const p = pager(req.query);
  const data = await adminService.listQuestions({ keyword: req.query.keyword, ...p });
  ok(res, { ...data, page: p.page, size: p.size });
}));

router.post('/admin/questions', wrap(async (req, res) => {
  ok(res, await adminService.createQuestion(req.body), '题目已创建');
}));

router.put('/admin/questions/:id', wrap(async (req, res) => {
  ok(res, await adminService.updateQuestion(Number(req.params.id), req.body), '题目已更新');
}));

router.delete('/admin/questions/:id', wrap(async (req, res) => {
  await adminService.deleteQuestion(Number(req.params.id));
  ok(res, null, '题目已删除（软删，考生端不再展示）');
}));

// ---- 用户管理（F8-2）----
router.get('/admin/users', wrap(async (req, res) => {
  const p = pager(req.query);
  const data = await adminService.listUsers({
    role: req.query.role, status: req.query.status, ...p
  });
  ok(res, { ...data, page: p.page, size: p.size });
}));

router.patch('/admin/users/:id/status', wrap(async (req, res) => {
  requireFields(req.body, ['status']);
  ok(res, await adminService.setUserStatus(req.user.id, Number(req.params.id), req.body), '状态已更新');
}));

// ---- 错题管理（F8-4）：跨考生查看与维护 ----
router.get('/admin/wrong-questions/stats', wrap(async (req, res) => {
  ok(res, await wrongService.adminStats());
}));

router.get('/admin/wrong-questions', wrap(async (req, res) => {
  const p = pager(req.query);
  const data = await wrongService.adminList({
    keyword: req.query.keyword, userId: req.query.user_id,
    subjectId: req.query.subject_id, mastered: req.query.mastered, ...p
  });
  ok(res, { ...data, page: p.page, size: p.size });
}));

router.patch('/admin/wrong-questions/:id/mastered', wrap(async (req, res) => {
  requireFields(req.body, ['mastered']);
  ok(res, await wrongService.adminSetMastered(Number(req.params.id), req.body), '掌握状态已更新');
}));

router.delete('/admin/wrong-questions/:id', wrap(async (req, res) => {
  ok(res, await wrongService.adminRemove(Number(req.params.id)), '错题记录已删除');
}));

// ---- 复习计划管理（F8-5）：跨考生查看与维护 ----
router.get('/admin/plans/stats', wrap(async (req, res) => {
  ok(res, await planService.adminStats());
}));

router.get('/admin/plans', wrap(async (req, res) => {
  const p = pager(req.query);
  const data = await planService.adminList({
    keyword: req.query.keyword, userId: req.query.user_id,
    status: req.query.status, ...p
  });
  ok(res, { ...data, page: p.page, size: p.size });
}));

router.get('/admin/plans/:id', wrap(async (req, res) => {
  ok(res, await planService.adminDetail(Number(req.params.id)));
}));

router.patch('/admin/plans/:id/status', wrap(async (req, res) => {
  requireFields(req.body, ['status']);
  ok(res, await planService.adminSetStatus(Number(req.params.id), req.body), '计划状态已更新');
}));

router.delete('/admin/plans/:id', wrap(async (req, res) => {
  ok(res, await planService.adminRemove(Number(req.params.id)), '复习计划已删除（含任务）');
}));

// ---- AI 服务管理（F8-6）：配置查看/切换、连通测试、调用记录 ----
router.get('/admin/ai/config', wrap(async (req, res) => {
  ok(res, await aiService.adminConfig());
}));

router.put('/admin/ai/config', wrap(async (req, res) => {
  ok(res, await aiService.adminUpdateConfig(req.body), 'AI 配置已保存并生效');
}));

router.post('/admin/ai/test', wrap(async (req, res) => {
  ok(res, await aiService.adminTestConnection());
}));

router.get('/admin/ai/stats', wrap(async (req, res) => {
  ok(res, await aiService.adminStats());
}));

router.get('/admin/ai/generations', wrap(async (req, res) => {
  const p = pager(req.query);
  const data = await aiService.adminListGenerations({
    keyword: req.query.keyword, userId: req.query.user_id,
    genType: req.query.gen_type, status: req.query.status,
    provider: req.query.provider, ...p
  });
  ok(res, { ...data, page: p.page, size: p.size });
}));

router.get('/admin/ai/generations/:id', wrap(async (req, res) => {
  ok(res, await aiService.adminGenerationDetail(Number(req.params.id)));
}));

// ---- 数据备份（F8-7）：备份生成、下载、校验、删除与数据概览 ----
router.get('/admin/backup/overview', wrap(async (req, res) => {
  ok(res, await backupService.overview());
}));

router.get('/admin/backups', wrap(async (req, res) => {
  const p = pager(req.query);
  const data = await backupService.list(p);
  ok(res, { ...data, page: p.page, size: p.size });
}));

router.post('/admin/backups', wrap(async (req, res) => {
  ok(res, await backupService.create(req.user.id), '数据备份已生成');
}));

router.get('/admin/backups/:id/download', wrap(async (req, res) => {
  const { filePath, filename } = await backupService.prepareDownload(Number(req.params.id));
  res.download(filePath, filename, (err) => {
    if (err) console.error('[backup] 备份文件下载失败:', err.message);
  });
}));

router.post('/admin/backups/:id/verify', wrap(async (req, res) => {
  ok(res, await backupService.verify(Number(req.params.id)));
}));

router.delete('/admin/backups/:id', wrap(async (req, res) => {
  ok(res, await backupService.remove(Number(req.params.id)), '备份已删除');
}));

module.exports = router;
