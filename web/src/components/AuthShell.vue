<script setup>
// 登录/注册页壳：深色分栏版式（左侧品牌区 + 右侧表单区），表单控件样式统一在此定义
import { computed, ref } from 'vue';

defineProps({
  title: { type: String, required: true },
  sub: { type: String, required: true }
});

const previewRef = ref(null);
const PREVIEW_TILT = 6;

function onPreviewMove(e) {
  const el = previewRef.value;
  const rect = el.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const px = x / rect.width - 0.5;
  const py = y / rect.height - 0.5;
  el.style.transform = `perspective(600px) rotateX(${-py * PREVIEW_TILT}deg) rotateY(${px * PREVIEW_TILT}deg) translateZ(12px)`;
  el.style.boxShadow = '0 40px 70px -18px rgba(0, 0, 0, 0.55)';
  el.style.backgroundImage = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.6), transparent 60%)`;
}

function onPreviewLeave() {
  const el = previewRef.value;
  el.style.transform = '';
  el.style.boxShadow = '';
  el.style.backgroundImage = '';
}

/* ---- 左侧产品示意数据（纯展示，示例数据） ---- */
const todayText = computed(() => {
  const d = new Date();
  return `${d.getMonth() + 1}月${d.getDate()}日 周${'日一二三四五六'[d.getDay()]}`;
});

const tasks = [
  { name: '高等数学 · 极限与连续', sub: '刷题 20 道，正确率 85%', meta: '38 分钟', status: 'done' },
  { name: '大学英语 · 阅读理解', sub: '精读 2 篇', meta: '40 分钟', status: 'done' },
  { name: '错题复盘', sub: '昨日错题 8 道', meta: '15 分钟', status: 'done' },
  { name: '计算机基础 · 操作系统', sub: '进行中，已做 9 / 15 题', meta: '进行中', status: 'doing' }
];
const doneCount = tasks.filter((t) => t.status === 'done').length;
const donePercent = Math.round((doneCount / tasks.length) * 100);

const weak = [
  { name: '定积分', rate: 42 },
  { name: '定语从句', rate: 55 },
  { name: '进程调度', rate: 61 }
];
</script>

<template>
  <div class="auth-shell">
    <aside class="brand-panel">
      <div class="logo">
        <div class="logo-name">专升本<span>智能备考</span></div>
      </div>

      <div class="brand-main">
        <div>
          <h1>
            <span>刷题练习</span>
            <span>错题诊断</span>
            <span>计划执行</span>
          </h1>
          <p class="lede">AI 根据你的答题轨迹，每天排好最该学的内容，让每一小时都用在刀刃上。</p>
        </div>

        <div>
          <div ref="previewRef" class="preview" role="img" :aria-label="`今日计划界面示意：${tasks.length} 项任务已完成 ${doneCount} 项，薄弱知识点为定积分、定语从句、进程调度`" @mousemove="onPreviewMove" @mouseleave="onPreviewLeave">
            <div class="pv-head">
              <div>
                <div class="pv-title">今日计划</div>
                <div class="pv-sub">{{ todayText }}</div>
              </div>
              <div class="pv-count"><strong>{{ doneCount }}</strong> / {{ tasks.length }} 项已完成</div>
            </div>
            <div class="bar"><i :style="{ width: donePercent + '%' }"></i></div>

            <ul class="tasks">
              <li v-for="t in tasks" :key="t.name" class="task" :class="t.status">
                <svg v-if="t.status === 'done'" viewBox="0 0 20 20" aria-hidden="true">
                  <circle cx="10" cy="10" r="9" fill="var(--primary)" />
                  <path d="M6 10.4l2.6 2.6L14 7.6" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <svg v-else-if="t.status === 'doing'" viewBox="0 0 20 20" aria-hidden="true">
                  <circle cx="10" cy="10" r="8.2" fill="none" stroke="var(--primary)" stroke-width="1.8" />
                  <circle cx="10" cy="10" r="3.4" fill="var(--primary)" />
                </svg>
                <svg v-else viewBox="0 0 20 20" aria-hidden="true">
                  <circle cx="10" cy="10" r="8.2" fill="none" stroke="var(--line-strong)" stroke-width="1.8" />
                </svg>
                <div>
                  <div class="t-name">{{ t.name }}</div>
                  <div class="t-sub">{{ t.sub }}</div>
                </div>
                <div class="t-meta">{{ t.meta }}</div>
              </li>
            </ul>

            <div class="weak">
              <div class="weak-label">近期薄弱知识点 · 正确率</div>
              <div v-for="w in weak" :key="w.name" class="weak-row" :class="{ low: w.rate < 50 }">
                <span>{{ w.name }}</span>
                <div class="bar"><i :style="{ width: w.rate + '%' }"></i></div>
                <span class="num">{{ w.rate }}%</span>
              </div>
            </div>
          </div>
          <p class="caption">产品界面示意，数据仅为示例</p>
        </div>
      </div>

      <div class="brand-foot">2027 年专升本统考备考平台</div>
    </aside>

    <section class="form-panel">
      <div class="form-wrap">
        <div class="logo m-logo">
          <div class="logo-name">专升本<span>智能备考</span></div>
        </div>

        <h2>{{ title }}</h2>
        <p class="sub">{{ sub }}</p>

        <div class="form-body">
          <slot />
        </div>

        <div class="auth-foot">
          <slot name="foot" />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.auth-shell {
  --bg: #ffffff;
  --bg-brand: #f3f6fb;
  --surface: #ffffff;
  --ink: #111a2e;
  --ink-2: #465168;
  --ink-3: #5f697e;
  --line: #cbd3e1;
  --line-strong: #aeb9cc;
  --line-soft: #e3e8f1;
  --primary: #1f55d6;
  --primary-hover: #1946b4;
  --link: #1f55d6;
  --primary-soft: #e9effd;
  --primary-soft-ink: #1a44ae;
  --ring: rgba(31, 85, 214, 0.18);
  --warn: #b96a00;
  --err: #d1342f;
  --navy: #0b2159;
  --mono: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace;

  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  background: var(--bg);
  color: var(--ink);
  font: 14px/1.5 var(--font);
  -webkit-font-smoothing: antialiased;
}

/* ---------- 左侧深色品牌区 ---------- */
.brand-panel {
  display: flex;
  flex-direction: column;
  padding-block: clamp(24px, 4vh, 48px) clamp(20px, 3vh, 36px);
  padding-left: max(clamp(32px, 5vw, 72px), env(safe-area-inset-left, 0px));
  padding-right: max(clamp(32px, 5vw, 72px), env(safe-area-inset-right, 0px));
  background-color: var(--navy);
  background-image:
    radial-gradient(ellipse 70% 50% at 15% 105%, rgba(59, 107, 232, 0.35), transparent 70%),
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: auto, 48px 48px, 48px 48px;
  color: #fff;
}
.logo { display: flex; align-items: center; }
/* 品牌字标：高级版标题样式（思源宋体 600，字距 0.16em） */
.logo-name {
  font: 600 17px/1.2 var(--font-serif);
  letter-spacing: 0.16em;
}
.logo-name span { font-weight: 400; opacity: 0.72; }

.brand-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: safe center;
  gap: clamp(20px, 4vh, 40px);
  width: 100%;
  max-width: 520px;
  min-width: 0;
  padding-block: clamp(16px, 3vh, 40px);
}
/* 标语标题：高级版 h1 样式（思源宋体 500，字距 0.14em） */
h1 {
  margin: 0;
  font: 500 clamp(32px, 2.6vw, 42px) / 1.65 var(--font-serif);
  letter-spacing: 0.14em;
  color: #fff;
}
h1 span { display: block; }
.lede {
  margin: 16px 0 0;
  max-width: 28em;
  font-size: 15px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.76);
}

.preview {
  border-radius: 12px;
  background: var(--surface);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.28);
  padding: 20px;
  transition: transform 0.2s ease-out, box-shadow 0.3s ease;
  will-change: transform;
}
.pv-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}
.pv-head > div:first-child { min-width: 0; }
.pv-title { font-size: 15px; font-weight: 600; color: var(--ink); }
.pv-sub { font-size: 12px; color: var(--ink-3); }
.pv-count {
  font-size: 13px;
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.pv-count strong { font-size: 20px; font-weight: 600; color: var(--link); }
.bar {
  height: 6px;
  margin-top: 12px;
  border-radius: 999px;
  background: var(--line-soft);
  overflow: hidden;
}
.bar > i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--primary);
}

.tasks {
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 2px;
}
.task {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 9px 10px;
  border-radius: 8px;
}
.task.doing { background: var(--primary-soft); }
.task > svg { display: block; width: 20px; height: 20px; }
.t-name { font-size: 14px; font-weight: 500; color: var(--ink); }
.task.done .t-name { color: var(--ink-2); }
.t-sub { font-size: 12px; color: var(--ink-3); }
.task.doing .t-sub { color: var(--primary-soft-ink); }
.t-meta {
  font-size: 12px;
  color: var(--ink-3);
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.task.doing .t-meta { color: var(--primary-soft-ink); font-weight: 500; }

.weak {
  margin-top: 14px;
  padding-top: 16px;
  border-top: 1px solid var(--line-soft);
}
.weak-label {
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--ink-3);
  letter-spacing: 0.04em;
}
.weak-row {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr) 40px;
  align-items: center;
  gap: 12px;
  padding-block: 5px;
  font-size: 13px;
  color: var(--ink);
}
.weak-row .bar { margin: 0; }
.weak-row .num {
  text-align: right;
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
}
.weak-row.low .bar > i { background: var(--warn); }
.weak-row.low .num { color: var(--warn); font-weight: 500; }
.caption { margin: 12px 0 0; font-size: 12px; color: rgba(255, 255, 255, 0.62); }
.brand-foot { font-size: 13px; color: rgba(255, 255, 255, 0.62); }

/* ---------- 右侧表单区 ---------- */
.form-panel {
  display: flex;
  align-items: safe center;
  justify-content: center;
  padding-block: clamp(24px, 5vh, 48px);
  padding-left: max(clamp(16px, 4vw, 48px), env(safe-area-inset-left, 0px));
  padding-right: max(clamp(16px, 4vw, 48px), env(safe-area-inset-right, 0px));
  background: var(--bg);
}
.form-wrap { width: 100%; max-width: 360px; min-width: 0; }
.m-logo { display: none; margin-bottom: 40px; color: var(--ink); }
/* 页面标题：高级版 h2 样式（思源宋体 600 28px，字距 0.06em） */
h2 {
  margin: 0;
  font: 600 28px / 1.35 var(--font-serif);
  letter-spacing: 0.06em;
  color: var(--ink);
}
.sub { margin: 8px 0 32px; color: var(--ink-2); }
.auth-foot { margin-top: 24px; text-align: center; color: var(--ink-2); }

.form-body :deep(.auth-field + .auth-field) { margin-top: 20px; }
.form-body :deep(.auth-label) {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--ink);
}
.form-body :deep(.auth-hint) { font-size: 12px; font-weight: 400; color: var(--ink-3); }
.form-body :deep(.auth-control) { position: relative; }
.form-body :deep(.auth-control input) {
  width: 100%;
  height: 40px;
  padding: 0 12px 0 38px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface);
  color: var(--ink);
  font: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.form-body :deep(.auth-control.plain input) { padding-left: 12px; }
.form-body :deep(.auth-control.has-toggle input) { padding-right: 44px; }
.form-body :deep(.auth-control input::placeholder) { color: var(--ink-3); }
.form-body :deep(.auth-control input:hover) { border-color: var(--line-strong); }
.form-body :deep(.auth-control input:focus) {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--ring);
}
.form-body :deep(.auth-control input[aria-invalid="true"]) { border-color: var(--err); }
.form-body :deep(.auth-control input[aria-invalid="true"]:focus) {
  box-shadow: 0 0 0 3px rgba(209, 52, 47, 0.18);
}
.form-body :deep(.auth-ico) {
  position: absolute;
  left: 12px;
  top: 50%;
  width: 16px;
  height: 16px;
  margin-top: -8px;
  color: var(--ink-3);
  pointer-events: none;
}
.form-body :deep(.auth-toggle) {
  position: absolute;
  right: 4px;
  top: 4px;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--ink-3);
  cursor: pointer;
}
.form-body :deep(.auth-toggle:hover) { color: var(--ink); background: var(--bg-brand); }
.form-body :deep(.auth-toggle svg) { width: 16px; height: 16px; display: block; }
.form-body :deep(.auth-err) { margin: 6px 0 0; font-size: 12px; color: var(--err); }
.form-body :deep(.auth-submit) {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  border: 0;
  border-radius: 6px;
  background: var(--primary);
  color: #fff;
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.form-body :deep(.auth-submit:hover) { background: var(--primary-hover); }
.form-body :deep(.auth-submit[disabled]) { opacity: 0.75; cursor: default; }
.form-body :deep(.auth-link) { font-weight: 500; color: var(--link); text-decoration: none; }
.form-body :deep(.auth-link:hover) { text-decoration: underline; }
.auth-foot :deep(.auth-link) { font-weight: 500; color: var(--link); text-decoration: none; }
.auth-foot :deep(.auth-link:hover) { text-decoration: underline; }

/* 矮屏（笔记本常见视口）：收起示意卡片中的薄弱知识点，压缩标题行高，避免左栏溢出出现滚动条 */
@media (min-width: 961px) and (max-height: 860px) {
  .weak { display: none; }
  h1 { line-height: 1.4; }
  .brand-main { gap: 20px; }
}

/* 窄屏：收起左侧品牌区 */
@media (max-width: 960px) {
  .auth-shell { grid-template-columns: minmax(0, 1fr); }
  .brand-panel { display: none; }
  .m-logo { display: flex; }
  .form-panel { align-items: flex-start; }
}
</style>
