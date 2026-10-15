// 统一业务错误码（与架构文档附录 B 一致）
const CODES = {
  OK: 0,
  BAD_REQUEST: 40001,   // 参数校验失败
  UNAUTHORIZED: 40101,  // 未登录或令牌过期
  BAD_CREDENTIAL: 40102,// 账号或密码错误
  FORBIDDEN: 40301,     // 权限不足
  DISABLED: 40302,      // 账号已禁用
  NOT_FOUND: 40401,     // 资源不存在
  CONFLICT: 40901,      // 状态冲突（用户名重复、重复打卡等）
  RATE_LIMITED: 42901,  // 请求过于频繁
  INTERNAL: 50001,      // 服务器内部错误
  AI_UPSTREAM: 50201,   // AI 上游失败或超时
  AI_NOT_CONFIGURED: 50202 // AI 服务未配置
};

// 业务异常：服务层抛出，由统一错误处理中间件映射响应
class BizError extends Error {
  constructor(code, message, httpStatus = 200) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

module.exports = { CODES, BizError };
