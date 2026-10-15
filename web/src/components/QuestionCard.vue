<script setup>
// 错题重练卡片（对齐 UI 库 Mistakes.tsx 抽屉内作答区）：选项 + 提交判分 + 结果块
import { ref, computed, watch } from 'vue';

const props = defineProps({
  question: { type: Object, required: true },
  // 判分结果（由父组件持有，保证一次作答）
  result: { type: Object, default: null }
});
const emit = defineEmits(['submit']);

const picked = ref('');
// 切题自动重置选中，避免残留上题答案
watch(() => props.question && props.question.id, () => { picked.value = ''; }, { immediate: true });

const options = computed(() => {
  const q = props.question;
  if (!q) return [];
  if (q.q_type === 'judge') {
    return [
      { key: 'true', text: '正确（√）' },
      { key: 'false', text: '错误（×）' }
    ];
  }
  let list = q.options;
  if (typeof list === 'string') {
    try { list = JSON.parse(list); } catch { list = []; }
  }
  if (!Array.isArray(list)) return [];
  return list.map((x, i) => ({
    key: (x && x.key) || 'ABCD'[i],
    text: typeof x === 'string' ? x : (x && x.text) || ''
  }));
});

function isRight(key) {
  if (!props.result) return false;
  const ca = String(props.result.correct_answer ?? '').trim();
  if (props.question.q_type === 'judge') return ca.toLowerCase() === String(key).toLowerCase();
  return ca.toUpperCase().includes(String(key).toUpperCase());
}

function pick(key) {
  if (!props.result) picked.value = key;
}

function submit() {
  if (!picked.value) return;
  emit('submit', { question_id: props.question.id, user_answer: picked.value });
}

// 结果块文案：正确答案：A，选项文本
const answerText = computed(() => {
  if (!props.result) return '';
  const ca = String(props.result.correct_answer ?? '').trim();
  if (props.question.q_type === 'judge') {
    return ca.toLowerCase() === 'true' ? '正确（√）' : ca.toLowerCase() === 'false' ? '错误（×）' : ca;
  }
  const texts = options.value.filter((o) => ca.toUpperCase().includes(o.key)).map((o) => o.text);
  return texts.length ? `${ca}，${texts.join('、')}` : ca;
});
</script>

<template>
  <div>
    <div class="opt-stack">
      <button
        v-for="o in options"
        :key="o.key"
        class="opt"
        :disabled="!!result"
        :class="{
          selected: !result && picked === o.key,
          right: result && isRight(o.key),
          wrong: result && picked === o.key && !isRight(o.key),
          dimmed: result && !isRight(o.key) && picked !== o.key
        }"
        @click="pick(o.key)"
      >
        <span class="key">{{ o.key.length === 1 ? o.key : (o.key === 'true' ? '√' : '×') }}</span>
        <span class="opt-text">{{ o.text }}</span>
      </button>
    </div>

    <div v-if="!result" class="submit-row">
      <button class="btn btn-primary" :disabled="!picked" @click="submit">提交答案</button>
    </div>

    <template v-else>
      <div class="result-block" :class="result.is_correct ? 'ok' : 'bad'">
        <div class="result-title">{{ result.is_correct ? '✓ 回答正确' : '✕ 回答错误' }}</div>
        <div class="result-sub">正确答案：{{ answerText }}</div>
      </div>
      <div v-if="picked" class="mine">你的答案：{{ picked.length === 1 ? picked : picked }}</div>
    </template>
  </div>
</template>

<style scoped>
.opt-stack { margin-top: 16px; display: flex; flex-direction: column; gap: 10px; }
.opt {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px;
  text-align: left;
  font-size: 14px;
  line-height: 1.6;
  background: var(--card);
  color: var(--text);
  transition: border-color 0.15s, background-color 0.15s, opacity 0.15s;
}
.opt:hover:not(:disabled) { border-color: rgba(29, 79, 215, 0.6); }
.opt.selected { border-color: var(--primary); background: var(--primary-soft); }
.opt.right { border-color: var(--green); background: var(--green-soft); }
.opt.wrong { border-color: var(--red); background: var(--red-soft); }
.opt.dimmed { opacity: 0.6; }
.opt:disabled { cursor: not-allowed; }
.opt .key { font-weight: 700; color: var(--text-2); flex-shrink: 0; }
.opt-text { flex: 1; }
.submit-row { margin-top: 16px; }
.result-block {
  margin-top: 16px;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
}
.result-block.ok { background: var(--green-soft); color: var(--green); }
.result-block.bad { background: var(--red-soft); color: var(--red); }
.result-title { font-weight: 500; }
.result-sub { margin-top: 2px; font-size: 12px; opacity: 0.8; }
.mine { margin-top: 12px; font-size: 12px; color: var(--text-2); }
</style>
