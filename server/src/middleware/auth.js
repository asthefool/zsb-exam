const { CODES, BizError } = require('../utils/errors');
const jwtUtil = require('../utils/jwt');
const userDao = require('../dao/userDao');

// 认证中间件：解析 Authorization: Bearer <token>，注入 req.user = { id, role }
// 验签通过后回查账号状态：被禁用（或已删除）账号的既有 token 立即失效
function verifyToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return next(new BizError(CODES.UNAUTHORIZED, '未登录或令牌已过期', 401));
  let payload;
  try {
    payload = jwtUtil.verify(token);
  } catch (e) {
    return next(new BizError(CODES.UNAUTHORIZED, '未登录或令牌已过期', 401));
  }
  userDao.findById(payload.uid).then((user) => {
    if (!user) return next(new BizError(CODES.UNAUTHORIZED, '未登录或令牌已过期', 401));
    if (user.status !== 1) return next(new BizError(CODES.DISABLED, '账号已被禁用，请联系管理员', 403));
    // 角色以数据库当前值为准，避免降权后旧令牌仍带原角色
    req.user = { id: payload.uid, role: user.role };
    next();
  }).catch(next);
}

module.exports = { verifyToken };
