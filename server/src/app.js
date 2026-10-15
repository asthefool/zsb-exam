// Express 入口：装配中间件与路由
// 中间件链：json 解析 → 请求日志 → 路由（含认证 / 角色 / 限流）→ 统一错误处理
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const config = require('./config');

const app = express();
// 基础安全头（无 helmet 依赖时的轻量替代）
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use('/api', routes);
// 未知路由统一 40401，保持 {code,message,data} 约定
app.use('/api', (req, res) => {
  const { fail } = require('./utils/response');
  const { CODES } = require('./utils/errors');
  return fail(res, 404, CODES.NOT_FOUND, '接口不存在');
});
app.use(errorHandler);

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`[zsb-exam] server listening on http://localhost:${config.port}`);
  });
}

module.exports = app;
