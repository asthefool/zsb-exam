// 路由总装：按任务书五类接口域组织（用户 / 题库 / 错题 / 计划 / AI 服务 + 管理端 + 健康检查）
const router = require('express').Router();
const { ok } = require('../utils/response');

router.get('/health', (req, res) => ok(res, { status: 'up', time: new Date().toISOString() }));

router.use('/', require('./auth'));     // 用户域：auth + user + home
router.use('/', require('./exam'));     // 题库域 + 错题域
router.use('/', require('./plan'));      // 计划域 + AI 服务域
router.use('/', require('./admin'));    // 管理端

module.exports = router;
