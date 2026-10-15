<script setup>
// AI 讲解面板（对齐 UI 库 ExplainPanel.tsx 视觉）：骨架/失败/成功三态
// 内容来自真实接口（缓存优先 → 按需生成），按「错因分析 / 解题思路与步骤 / 知识点提示」分段渲染
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { getCachedExplanation, generateExplanation, getAiConfig } from '../api';

const props = defineProps({
  wrongQuestionId: { type: [Number, String], required: true }
});
const emit = defineEmits(['explained']);

const status = ref('loading'); // loading | success | failed
const explanation = ref(null);
const aiConfig = ref(null);
const failedReason = ref('');
const regenError = ref('');
const loading = ref(false);
let reqToken = 0;

const SECTION_META = [
  { t: '错因分析', icon: 'M12 9v4M12 17h.01M10.3 4l-8 14a2 2 0 001.7 3h16a2 2 0 001.7-3l-8-14a2 2 0 00-3.4 0z' },
  { t: '解题思路与步骤', icon: 'M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0012 3z' },
  { t: '知识点提示', icon: 'M5 4h14v16H5zM9 9h6M9 13h4' }
];

// 将讲解内容按「## 一、xxx」分段；无法解析时整体作为一段
const sections = computed(() => {
  const raw = String(explanation.value?.content || '');
  if (!raw) return [];
  // split 后 parts[0] 是首个小节标题之前的前言，正文与小节一一对应时用 i+1 取值
  // 切分需吃掉整行标题，否则标题文字会残留为正文首行
  const parts = raw.split(/^##\s*[一二三]、.*$/m);
  const heads = [...raw.matchAll(/^##\s*([一二三]、[^\n]+)/gm)].map((m) => m[1].replace(/^[一二三]、/, ''));
  const clean = (s) => s
    .replace(/^\s*---\s*$/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^\s*>\s?/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (heads.length) {
    return heads.map((h, i) => ({
      t: SECTION_META[i] ? SECTION_META[i].t : h,
      icon: SECTION_META[i] ? SECTION_META[i].icon : SECTION_META[2].icon,
      body: clean(parts[i + 1] || '')
    }));
  }
  // 无分段标记：去掉模拟标注首行后整体展示
  return [{ t: '讲解内容', icon: SECTION_META[1].icon, body: clean(raw.replace(/^【[^】]*】[^\n]*\n?/, '')) }];
});

const providerLabel = computed(() => {
  const p = explanation.value?.provider || aiConfig.value?.provider || '';
  return p === 'mock' ? '规则引擎（模拟）' : '真实大模型';
});
// llm 模式下 provider 存的是模型名（如 mimo-v2.6-flash），单独展示
const modelName = computed(() => {
  const p = explanation.value?.provider || '';
  return p && p !== 'mock' && p !== 'llm' ? p : '';
});

function reasonFromError(e) {
  const body = (e && e.response && e.response.data) || e || {};
  const code = body.code ?? (e && e.code);
  if (code === 42901) return '请求过于频繁，请稍后再试';
  if (code === 50202) return 'AI 服务未配置，请联系管理员';
  if (code === 50201) return 'AI 上游服务暂不可用，请稍后重试';
  return body.message || (e && e.message) || '网络异常，请稍后重试';
}

async function doGenerate(force, token) {
  loading.value = true;
  if (!explanation.value) status.value = 'loading';
  try {
    const r = await generateExplanation(props.wrongQuestionId, force);
    if (token !== reqToken) return;
    explanation.value = r;
    status.value = 'success';
    regenError.value = '';
    if (!r.cached) ElMessage.success('讲解已生成');
    emit('explained', r);
  } catch (e) {
    if (token !== reqToken) return;
    const reason = reasonFromError(e);
    if (explanation.value) {
      regenError.value = reason;
    } else {
      failedReason.value = reason;
      status.value = 'failed';
    }
  } finally {
    if (token === reqToken) loading.value = false;
  }
}

async function init() {
  const token = ++reqToken;
  status.value = 'loading';
  explanation.value = null;
  failedReason.value = '';
  regenError.value = '';
  try {
    aiConfig.value = await getAiConfig();
  } catch (e) { aiConfig.value = null; }
  try {
    const cached = await getCachedExplanation(props.wrongQuestionId);
    if (token !== reqToken) return;
    if (cached) {
      explanation.value = cached;
      status.value = 'success';
      return;
    }
  } catch (e) { /* 无缓存则走生成 */ }
  if (token !== reqToken) return;
  await doGenerate(0, token);
}

function regenerate() { doGenerate(1, ++reqToken); }
function retry() { init(); }

watch(() => props.wrongQuestionId, (nv, ov) => {
  if (nv !== ov) init();
});
onMounted(init);
</script>

<template>
  <div>
    <!-- 加载骨架 -->
    <template v-if="status === 'loading'">
      <div class="skeleton">
        <div v-for="(w, i) in [90, 100, 70, 95, 60, 85]" :key="i" class="skeleton-bar" :style="{ width: `${w}%` }"></div>
      </div>
      <p class="hint">AI 讲解生成中，最多约需 1 分钟，请稍候……</p>
    </template>

    <!-- 失败 -->
    <template v-else-if="status === 'failed'">
      <div class="fail-box">
        <div class="fail-title">AI 讲解生成失败</div>
        <p class="fail-reason">
          {{ failedReason || (aiConfig && !aiConfig.available ? aiConfig.message : '上游服务暂不可用，请稍后重试') }}
        </p>
        <div class="mt-3">
          <button class="btn btn-primary" @click="retry()">重试</button>
        </div>
      </div>
    </template>

    <!-- 成功 -->
    <template v-else>
      <div class="source-row">
        <span class="tag tag-warn">来源：{{ providerLabel }}</span>
        <span v-if="modelName" class="tag tag-muted">{{ modelName }}</span>
        <span v-if="explanation.cached" class="tag tag-muted">缓存</span>
      </div>
      <div v-if="regenError" class="fail-box mt-3">
        <div class="fail-title">重新生成失败：{{ regenError }}</div>
      </div>
      <div class="sections">
        <div v-for="(s, i) in sections" :key="s.t" class="section">
          <div class="section-head">
            <span class="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path :d="s.icon" />
              </svg>
            </span>
            {{ ['一', '二', '三'][i] || '·' }}、{{ s.t }}
          </div>
          <p class="section-body">{{ s.body }}</p>
        </div>
      </div>
      <div class="panel-foot">
        <span class="hint">AI 生成，仅供参考</span>
        <button class="btn btn-ghost btn-sm" :disabled="loading" @click="regenerate()">
          {{ loading ? '生成中…' : '重新生成' }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.skeleton { display: flex; flex-direction: column; gap: 12px; }
.skeleton-bar {
  height: 12px;
  border-radius: 4px;
  background: var(--border);
  animation: pulse 1.4s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
.hint { font-size: 12px; color: var(--text-2); }
.fail-box {
  border-radius: 12px;
  border: 1px solid rgba(192, 53, 43, 0.2);
  background: var(--red-soft);
  padding: 16px;
}
.fail-title { font-size: 14px; font-weight: 500; color: var(--red); }
.fail-reason { margin-top: 4px; font-size: 14px; color: rgba(192, 53, 43, 0.8); }
.source-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 12px; }
.sections { margin-top: 16px; display: flex; flex-direction: column; gap: 12px; }
.section {
  border-radius: 12px;
  background: var(--bg);
  padding: 16px;
}
.section-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
}
.section-icon {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: var(--primary-soft);
  color: var(--primary);
}
.section-icon svg { width: 14px; height: 14px; }
.section-body {
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.625;
  color: var(--text-2);
  white-space: pre-wrap;
}
.panel-foot {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.btn-sm { padding: 6px 12px; font-size: 14px; }
</style>
