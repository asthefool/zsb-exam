// AI 连接自检：npm run ai:test
// 用于验证 .env 中配置的真实大模型（AI_PROVIDER=llm）连通性：
// 通过则打印模型返回片段；mock 模式仅提示无需外部连接
require('dotenv').config();
const config = require('../src/config');
const provider = require('../src/ai/provider');

(async () => {
  console.log(`[ai:test] provider = ${config.ai.provider} | model = ${config.ai.model} | baseUrl = ${config.ai.baseUrl}`);
  if (config.ai.provider !== 'llm') {
    console.log('[ai:test] 当前为 mock 模式（内置规则引擎），无需外部连接。');
    console.log('[ai:test] 如需测试真实大模型：在 server/.env 设置 AI_PROVIDER=llm 并填好 AI_BASE_URL / AI_MODEL / AI_API_KEY');
    process.exit(0);
  }
  if (!config.ai.apiKey) {
    console.error('[ai:test] ✗ AI_API_KEY 未配置，无法调用大模型');
    process.exit(1);
  }
  try {
    const r = await provider.generate('explain', { prompt: '连接测试：请只回复四个字「连接成功」。' });
    console.log('[ai:test] 模型返回：', String(r.content).slice(0, 200).replace(/\n/g, ' '));
    console.log('[ai:test] ✓ 大模型连接正常');
    process.exit(0);
  } catch (e) {
    console.error('[ai:test] ✗ 调用失败：', e.message);
    process.exit(1);
  }
})();
