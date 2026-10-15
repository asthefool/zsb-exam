// AI Provider 适配层：对上层暴露统一 generate(type, context) 接口
// AI_PROVIDER=mock → 内置规则模板；AI_PROVIDER=llm → OpenAI 兼容端点，代码零改动切换
// 实际取值经 aiConfig（.env 默认 + 后台运行时覆盖），管理员切换配置后立即生效
const fs = require('fs');
const path = require('path');
const aiConfig = require('./aiConfig');
const mockProvider = require('./mockProvider');
const llmProvider = require('./llmProvider');

// Prompt 模板以文件管理，变量占位符 {{key}} 由服务层填充
// 启动后常驻内存缓存，避免每请求同步读文件阻塞事件循环
const tplCache = new Map();
function renderTemplate(name, vars) {
  if (!tplCache.has(name)) {
    tplCache.set(name, fs.readFileSync(path.join(__dirname, 'prompts', name), 'utf8'));
  }
  const tpl = tplCache.get(name);
  return tpl.replace(/\{\{(\w+)\}\}/g, (m, k) => (vars[k] === undefined ? '' : String(vars[k])));
}

function getProviderName() {
  return aiConfig.get().provider === 'llm' ? 'llm' : 'mock';
}

async function generate(type, context) {
  await aiConfig.ensureLoaded(); // 确保后台覆盖配置已生效
  if (getProviderName() === 'llm') return llmProvider.generate(type, context);
  return mockProvider.generate(type, context);
}

// /api/ai/config：向前端暴露当前模式与可用性，驱动降级提示
function status() {
  const cfg = aiConfig.get();
  const provider = getProviderName();
  const base = aiConfig.safeView();
  if (provider === 'mock') {
    return { ...base, provider, available: true, message: '当前为内置模拟模式（mock），AI 输出由规则模板生成，仅供参考' };
  }
  return cfg.apiKey
    ? { ...base, provider, available: true, message: `已接入大模型：${cfg.model}` }
    : { ...base, provider, available: false, message: '已选择 llm 模式但未配置 API Key，AI 功能暂不可用' };
}

module.exports = { generate, renderTemplate, status, getProviderName };
