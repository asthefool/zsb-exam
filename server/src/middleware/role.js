const { CODES, BizError } = require('../utils/errors');

// 角色校验：仅 /api/admin 路由组使用，考生访问返回 40301（对应 AC9）
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return next(new BizError(CODES.UNAUTHORIZED, '未登录或令牌已过期', 401));
    if (req.user.role !== role) return next(new BizError(CODES.FORBIDDEN, '权限不足', 403));
    next();
  };
}

module.exports = { requireRole };
