const { CODES, BizError } = require('../utils/errors');
const { fail } = require('../utils/response');

// 统一错误处理：业务错误按约定错误码返回，未知错误兜底 50001 并记日志
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof BizError) {
    return fail(res, err.httpStatus, err.code, err.message);
  }
  // express.json 语法错误映射为参数错误，而非 500
  if (err && (err.type === 'entity.parse.failed' || err instanceof SyntaxError)) {
    return fail(res, 400, CODES.BAD_REQUEST, '请求体 JSON 格式错误');
  }
  console.error('[unhandled]', err);
  return fail(res, 500, CODES.INTERNAL, '服务器内部错误');
}

module.exports = errorHandler;
