// 管理端路由组（F8）：整组挂 requireRole('admin')，考生访问返回 40301（AC9）
const router = require('express').Router();
const { ok, wrap, requireFields, pager } = require('../utils/response');
const adminService = require('../services/adminService');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

router.use(verifyToken, requireRole('admin'));

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

module.exports = router;
