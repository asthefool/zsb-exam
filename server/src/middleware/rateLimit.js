const { CODES, BizError } = require('../utils/errors');

// 轻量内存滑动窗口限流（单进程部署适用；多实例需替换为集中式限流）
// keyFn 决定限流维度：登录按 IP，AI 接口按用户
function rateLimit({ windowMs = 60000, max = 5, keyFn }) {
  const hits = new Map(); // key -> number[]（时间戳序列）
  return (req, res, next) => {
    const key = keyFn(req);
    const now = Date.now();
    const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (arr.length >= max) {
      return next(new BizError(CODES.RATE_LIMITED, '请求过于频繁，请稍后再试', 429));
    }
    arr.push(now);
    if (arr.length) hits.set(key, arr);
    else hits.delete(key);
    // 定期清理空窗 key，避免长期运行 Map 无界增长
    if (hits.size > 10000) {
      for (const [k, v] of hits) {
        const kept = v.filter((t) => now - t < windowMs);
        if (!kept.length) hits.delete(k);
        else hits.set(k, kept);
      }
    }
    next();
  };
}

module.exports = { rateLimit };
