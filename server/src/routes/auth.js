// 认证与用户域路由（F1/F7/F2）
const router = require('express').Router();
const { ok, wrap, requireFields, pager } = require('../utils/response');
const authService = require('../services/authService');
const userService = require('../services/userService');
const homeService = require('../services/homeService');
const { verifyToken } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');

// 登录接口按 IP 限流，防暴力破解
const loginRate = rateLimit({ windowMs: 60000, max: 10, keyFn: (req) => req.ip });

router.post('/auth/register', wrap(async (req, res) => {
  requireFields(req.body, ['username', 'password']);
  const user = await authService.register(req.body);
  ok(res, user, '注册成功');
}));

router.post('/auth/login', loginRate, wrap(async (req, res) => {
  requireFields(req.body, ['username', 'password']);
  const data = await authService.login(req.body);
  ok(res, data, '登录成功');
}));

// 登出为无状态实现：前端清除令牌即可，服务端仅做令牌有效性确认
router.post('/auth/logout', verifyToken, wrap(async (req, res) => {
  ok(res, null, '已退出登录');
}));

router.get('/user/profile', verifyToken, wrap(async (req, res) => {
  ok(res, await userService.getProfile(req.user.id));
}));

router.put('/user/profile', verifyToken, wrap(async (req, res) => {
  requireFields(req.body, ['nickname']);
  ok(res, await userService.updateProfile(req.user.id, req.body), '更新成功');
}));

router.get('/home/overview', verifyToken, wrap(async (req, res) => {
  ok(res, await homeService.overview(req.user.id));
}));

module.exports = router;
