// 全局配置：全部可变项经 .env 注入，.env 不入版本库
require('dotenv').config();

// JWT 密钥缺失时拒绝启动，避免回退到源码内公开密钥被伪造 admin 令牌
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  console.error('[config] 缺少环境变量 JWT_SECRET，服务拒绝启动。请在 server/.env 中配置后重试（参考 .env.example）。');
  process.exit(1);
}

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES || '7d'
  },
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'zsb_exam'
  },
  ai: {
    provider: (process.env.AI_PROVIDER || 'mock').toLowerCase(), // mock | llm
    baseUrl: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    apiKey: process.env.AI_API_KEY || '',
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '30000', 10),
    rateLimitPerMin: parseInt(process.env.AI_RATE_LIMIT_PER_MIN || '5', 10)
  }
};
