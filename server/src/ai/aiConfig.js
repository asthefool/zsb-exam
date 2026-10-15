// AI 运行时配置：.env（config.ai）为默认值，system_settings 中的覆盖项优先生效
// 管理员在后台「AI 服务管理」保存即生效，无需重启服务；查看接口对 API Key 做脱敏
const config = require('../config');
const settingsDao = require('../dao/settingsDao');

const KEYS = {
  provider: 'ai_provider',
  baseUrl: 'ai_base_url',
  model: 'ai_model',
  apiKey: 'ai_api_key',
  timeoutMs: 'ai_timeout_ms',
  rateLimitPerMin: 'ai_rate_limit_per_min'
};
const VALID_PROVIDERS = ['mock', 'llm'];

let overrides = null;   // 已加载的覆盖项（部分字段），null 表示尚未加载
let loadPromise = null; // 并发去重：同一时刻只加载一次

function parseOverrides(all) {
  const o = {};
  const raw = all[KEYS.provider];
  if (raw !== undefined && raw !== '') o.provider = String(raw).toLowerCase();
  if (all[KEYS.baseUrl] !== undefined && all[KEYS.baseUrl] !== '') o.baseUrl = String(all[KEYS.baseUrl]);
  if (all[KEYS.model] !== undefined && all[KEYS.model] !== '') o.model = String(all[KEYS.model]);
  // API Key 允许被显式清空（存空串即清除），因此以「键是否存在」判断覆盖
  if (all[KEYS.apiKey] !== undefined) o.apiKey = String(all[KEYS.apiKey]);
  const t = Number(all[KEYS.timeoutMs]);
  if (Number.isInteger(t) && t > 0) o.timeoutMs = t;
  const r = Number(all[KEYS.rateLimitPerMin]);
  if (Number.isInteger(r) && r > 0) o.rateLimitPerMin = r;
  return o;
}

async function load() {
  try {
    overrides = parseOverrides(await settingsDao.getAll());
  } catch (e) {
    // 表不存在或库暂不可用时回退 .env 默认，不让 AI 配置阻塞服务
    console.warn('[aiConfig] 加载运行时配置失败，回退 .env 默认值：', e.message);
    overrides = {};
  }
  return get();
}

function ensureLoaded() {
  if (!loadPromise) {
    loadPromise = load().finally(() => { loadPromise = null; });
  }
  return loadPromise;
}

// 合并后的当前配置（同步读内存，未加载时等价 .env 默认）
function get() {
  const base = config.ai;
  const o = overrides || {};
  return {
    provider: VALID_PROVIDERS.includes(o.provider) ? o.provider : base.provider,
    baseUrl: o.baseUrl || base.baseUrl,
    model: o.model || base.model,
    // 覆盖项存在即生效（含空串 = 已清除密钥）
    apiKey: o.apiKey !== undefined ? o.apiKey : base.apiKey,
    timeoutMs: o.timeoutMs || base.timeoutMs,
    rateLimitPerMin: o.rateLimitPerMin || base.rateLimitPerMin
  };
}

function maskKey(key) {
  if (!key) return '';
  if (key.length <= 8) return '***';
  return `${key.slice(0, 3)}***${key.slice(-4)}`;
}

// 对外（含考生端 /ai/config）的安全视图：不返回明文密钥
function safeView() {
  const cur = get();
  return {
    provider: cur.provider,
    model: cur.model,
    base_url: cur.baseUrl,
    timeout_ms: cur.timeoutMs,
    rate_limit_per_min: cur.rateLimitPerMin,
    api_key_set: !!cur.apiKey,
    api_key_masked: maskKey(cur.apiKey),
    // 生效来源：runtime=后台覆盖，env=.env 默认
    source: overrides && Object.keys(overrides).length ? 'runtime' : 'env'
  };
}

// 后台更新：逐项校验后落库并热更新内存；api_key 传 null/undefined 表示不变，传 '' 表示清除
async function update(patch = {}) {
  const cur = get();
  const next = { ...cur };
  const touched = {};

  if (patch.provider !== undefined) {
    const v = String(patch.provider).toLowerCase();
    if (!VALID_PROVIDERS.includes(v)) {
      throw new Error('provider 仅支持 mock 或 llm');
    }
    next.provider = v;
    touched[KEYS.provider] = v;
  }
  if (patch.baseUrl !== undefined) {
    const v = String(patch.baseUrl).trim().replace(/\/$/, '');
    if (!/^https?:\/\/.+/.test(v)) throw new Error('base_url 须为 http(s) 地址');
    if (v.length > 200) throw new Error('base_url 过长');
    next.baseUrl = v;
    touched[KEYS.baseUrl] = v;
  }
  if (patch.model !== undefined) {
    const v = String(patch.model).trim();
    if (!v || v.length > 100) throw new Error('model 必填且不超过 100 字');
    next.model = v;
    touched[KEYS.model] = v;
  }
  if (patch.apiKey !== undefined && patch.apiKey !== null) {
    const v = String(patch.apiKey);
    if (v.length > 200) throw new Error('api_key 过长');
    next.apiKey = v;
    touched[KEYS.apiKey] = v;
  }
  if (patch.timeoutMs !== undefined) {
    const v = Number(patch.timeoutMs);
    if (!Number.isInteger(v) || v < 1000 || v > 600000) {
      throw new Error('timeout_ms 须为 1000～600000 的整数');
    }
    next.timeoutMs = v;
    touched[KEYS.timeoutMs] = v;
  }
  if (patch.rateLimitPerMin !== undefined) {
    const v = Number(patch.rateLimitPerMin);
    if (!Number.isInteger(v) || v < 1 || v > 1000) {
      throw new Error('rate_limit_per_min 须为 1～1000 的整数');
    }
    next.rateLimitPerMin = v;
    touched[KEYS.rateLimitPerMin] = v;
  }

  for (const [k, v] of Object.entries(touched)) {
    await settingsDao.set(k, v);
  }
  await ensureLoaded(); // 从库重读，保证内存与库一致
  return safeView();
}

module.exports = { KEYS, ensureLoaded, load, get, update, safeView, maskKey };
