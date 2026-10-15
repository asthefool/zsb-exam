// LLM Provider：对接 OpenAI 兼容 /chat/completions 端点
// 配置取自 aiConfig（.env 默认 + 管理员后台运行时覆盖）；超时 AI_TIMEOUT_MS，失败重试 1 次
const aiConfig = require('./aiConfig');
const { CODES, BizError } = require('../utils/errors');

async function chatOnce(messages, cfg) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);
  try {
    const resp = await fetch(`${cfg.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`
      },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        temperature: 0.3
      }),
      signal: controller.signal
    });
    if (!resp.ok) throw new Error(`LLM HTTP ${resp.status}`);
    const data = await resp.json();
    const text = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content : '';
    if (!text) throw new Error('LLM 返回内容为空');
    return text;
  } finally {
    clearTimeout(timer);
  }
}

async function chat(messages, cfg) {
  try {
    return await chatOnce(messages, cfg);
  } catch (e) {
    // 重试网络错误/上游 5xx；4xx（Key 或参数错误）与超时直接抛：
    // 超时说明模型本次输出过慢，盲目重试只会让用户再等一个完整超时周期
    const msg = String(e.message || '');
    const isTimeout = e.name === 'AbortError' || /abort/i.test(msg);
    if (isTimeout || /LLM HTTP 4\d\d/.test(msg)) throw e;
    return chatOnce(messages, cfg);
  }
}

// type: 'explain' | 'plan'；context.prompt 由服务层按模板填充
async function generate(type, context) {
  await aiConfig.ensureLoaded();
  const cfg = aiConfig.get();
  if (!cfg.apiKey) {
    throw new BizError(CODES.AI_NOT_CONFIGURED, 'AI 服务未配置 API Key，请在后台「AI 服务管理」配置或切换 mock 模式');
  }
  try {
    const content = await chat([
      { role: 'system', content: '你是一位专升本考试辅导专家。' },
      { role: 'user', content: context.prompt }
    ], cfg);
    return { content, provider: cfg.model };
  } catch (e) {
    if (e instanceof BizError) throw e;
    throw new BizError(CODES.AI_UPSTREAM, `AI 上游调用失败或超时：${e.message}`);
  }
}

module.exports = { generate };
