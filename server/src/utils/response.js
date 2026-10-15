const { CODES } = require('./errors');

// 统一响应结构：{ code, message, data }，code 非 0 表示业务错误
function ok(res, data = null, message = 'ok') {
  res.json({ code: CODES.OK, message, data });
}

function fail(res, httpStatus, code, message) {
  res.status(httpStatus).json({ code, message, data: null });
}

// 异步控制器包装器：异常统一进入错误处理中间件
function wrap(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// 简单参数校验：缺少必填字段即抛 40001
function requireFields(body, fields) {
  const { BizError } = require('./errors');
  for (const f of fields) {
    if (body[f] === undefined || body[f] === null || body[f] === '') {
      throw new BizError(CODES.BAD_REQUEST, `缺少必填参数：${f}`, 200);
    }
  }
}

// 分页参数解析（默认 page=1, size=20）
function pager(query) {
  const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
  const size = Math.min(100, Math.max(1, parseInt(query.size || '20', 10) || 20));
  return { page, size, offset: (page - 1) * size };
}

module.exports = { ok, fail, wrap, requireFields, pager };
