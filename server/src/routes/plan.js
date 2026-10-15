// 计划与 AI 服务域路由（F5/F6）
const router = require('express').Router();
const { ok, wrap, requireFields } = require('../utils/response');
const planService = require('../services/planService');
const aiService = require('../services/aiService');
const { verifyToken } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');
const aiConfig = require('../ai/aiConfig');

// AI 接口按用户限流；讲解与计划分桶，避免一类操作耗尽另一类配额
// 阈值动态取 aiConfig（管理员后台调整后立即生效，无需重启）
const explainRate = rateLimit({
  windowMs: 60000,
  max: () => aiConfig.get().rateLimitPerMin,
  keyFn: (req) => `ai-explain:${req.user && req.user.id}`
});
const planRate = rateLimit({
  windowMs: 60000,
  max: () => aiConfig.get().rateLimitPerMin,
  keyFn: (req) => `ai-plan:${req.user && req.user.id}`
});

router.post('/plans/generate', verifyToken, planRate, wrap(async (req, res) => {
  const data = await planService.generate(req.user.id, req.body || {});
  ok(res, data, '复习计划已生成');
}));

router.get('/plans/current', verifyToken, wrap(async (req, res) => {
  ok(res, await planService.current(req.user.id));
}));

router.get('/plans', verifyToken, wrap(async (req, res) => {
  ok(res, await planService.listHistory(req.user.id));
}));

router.patch('/plan-tasks/:id/check-in', verifyToken, wrap(async (req, res) => {
  ok(res, await planService.checkIn(req.user.id, Number(req.params.id)), '打卡成功');
}));

// ---- AI 服务（F5）----
router.get('/ai/config', verifyToken, wrap(async (req, res) => {
  ok(res, await aiService.getConfig());
}));

router.get('/ai/explanations', verifyToken, wrap(async (req, res) => {
  requireFields(req.query, ['wrong_question_id']);
  const data = await aiService.getCachedExplanation(req.user.id, Number(req.query.wrong_question_id));
  ok(res, data); // 无缓存时 data=null，由前端决定是否触发生成
}));

router.post('/ai/explanations', verifyToken, explainRate, wrap(async (req, res) => {
  requireFields(req.body, ['wrong_question_id']);
  ok(res, await aiService.generateExplanation(req.user.id, req.body));
}));

module.exports = router;
