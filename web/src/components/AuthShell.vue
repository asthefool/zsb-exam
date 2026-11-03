<script setup>
// 登录/注册统一基础壳：全屏沉浸流光背景 + 悬浮质感毛玻璃交互卡片（Glassmorphism）
defineProps({
  title: { type: String, required: true },
  sub: { type: String, required: true }
});
</script>

<template>
  <div class="auth-root">
    <!-- 沉浸式动态弥散光斑背景层 -->
    <div class="glow-bg" aria-hidden="true">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="mesh-grid"></div>
    </div>

    <!-- 页面核心内容容器 -->
    <main class="auth-container">
      <!-- 顶部品牌 Header -->
      <header class="brand-header">
        <div class="brand-badge">
          <span class="badge-dot"></span>
          <span class="badge-text">专升本智能备考 · AI 提分闭环</span>
        </div>
        <div class="logo-box">
          <div class="logo-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <h1 class="logo-text">专升本<span>智能备考</span></h1>
        </div>
      </header>

      <!-- 悬浮毛玻璃主卡片 -->
      <section class="glass-card">
        <div class="card-inner-glow" aria-hidden="true"></div>
        <div class="card-head">
          <h2 class="card-title">{{ title }}</h2>
          <p class="card-sub">{{ sub }}</p>
        </div>

        <div class="card-body">
          <slot />
        </div>

        <footer class="card-foot">
          <slot name="foot" />
        </footer>
      </section>

      <!-- 底部版权/标语信息 -->
      <footer class="page-footer">
        <span>2027 年专升本统考备考平台 · 智能练习 · 错题诊断 · 提分计划</span>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.auth-root {
  --bg-deep: #0a0f1d;
  --bg-deep-2: #0f172a;
  --primary: #2563eb;
  --primary-light: #3b82f6;
  --primary-glow: rgba(59, 130, 246, 0.45);
  --accent-cyan: #06b6d4;
  --accent-purple: #8b5cf6;
  --glass-surface: rgba(15, 23, 42, 0.72);
  --glass-border: rgba(255, 255, 255, 0.12);
  --glass-border-focus: rgba(96, 165, 250, 0.5);
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --line-soft: rgba(255, 255, 255, 0.08);

  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-deep);
  color: var(--text-primary);
  font-family: var(--font, system-ui, -apple-system, sans-serif);
  overflow-x: hidden;
  padding: 32px 16px;
  box-sizing: border-box;
}

/* 弥散光斑与沉浸背景 */
.glow-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.65;
  will-change: transform;
}

.orb-1 {
  top: -10%;
  left: 20%;
  width: 520px;
  height: 520px;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.55) 0%, rgba(30, 58, 138, 0.1) 70%);
  animation: floatOrb1 18s ease-in-out infinite alternate;
}

.orb-2 {
  bottom: -15%;
  right: 15%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.45) 0%, rgba(37, 99, 235, 0.08) 70%);
  animation: floatOrb2 22s ease-in-out infinite alternate;
}

.orb-3 {
  top: 40%;
  left: -10%;
  width: 440px;
  height: 440px;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, transparent 70%);
  animation: floatOrb3 20s ease-in-out infinite alternate;
}

@keyframes floatOrb1 {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(60px, 40px) scale(1.08); }
  100% { transform: translate(-40px, 70px) scale(0.95); }
}

@keyframes floatOrb2 {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-50px, -60px) scale(1.1); }
  100% { transform: translate(40px, -30px) scale(0.92); }
}

@keyframes floatOrb3 {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(50px, -40px) scale(1.12); }
  100% { transform: translate(-30px, 50px) scale(0.96); }
}

/* 微质感科技网格 */
.mesh-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.9) 20%, rgba(0, 0, 0, 0.2) 80%);
  -webkit-mask-image: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.9) 20%, rgba(0, 0, 0, 0.2) 80%);
}

/* 核心容器 */
.auth-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 品牌头部 */
.brand-header {
  text-align: center;
  margin-bottom: 24px;
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 9999px;
  margin-bottom: 14px;
}

.badge-dot {
  width: 6px;
  height: 6px;
  background-color: var(--accent-cyan);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--accent-cyan);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}

.badge-text {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.06em;
  color: #cbd5e1;
}

.logo-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.8), rgba(139, 92, 246, 0.8));
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: #fff;
  box-shadow: 0 8px 16px -4px rgba(37, 99, 235, 0.5);
}

.logo-icon svg {
  width: 20px;
  height: 20px;
}

.logo-text {
  font-family: var(--font-serif, serif);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #ffffff;
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.logo-text span {
  font-weight: 400;
  background: linear-gradient(120deg, #93c5fd, #c4b5fd);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-left: 4px;
}

/* 核心毛玻璃卡片 */
.glass-card {
  position: relative;
  width: 100%;
  background: var(--glass-surface);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  box-shadow:
    0 24px 50px -12px rgba(0, 0, 0, 0.65),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset,
    0 1px 0 rgba(255, 255, 255, 0.2) inset;
  padding: 32px 30px;
  box-sizing: border-box;
  overflow: hidden;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.glass-card:hover {
  border-color: rgba(255, 255, 255, 0.18);
  box-shadow:
    0 30px 60px -12px rgba(0, 0, 0, 0.75),
    0 0 0 1px rgba(255, 255, 255, 0.12) inset,
    0 1px 0 rgba(255, 255, 255, 0.28) inset;
}

.card-inner-glow {
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(147, 197, 253, 0.8), transparent);
}

.card-head {
  text-align: center;
  margin-bottom: 24px;
}

.card-title {
  font-family: var(--font-serif, serif);
  font-size: 22px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  letter-spacing: 0.03em;
}

.card-sub {
  margin-top: 6px;
  font-size: 13.5px;
  color: var(--text-secondary);
}

/* 表单主体插槽统一样式支持 */
.card-body :deep(.auth-field + .auth-field) {
  margin-top: 18px;
}

.card-body :deep(.auth-label) {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 7px;
  font-size: 13.5px;
  font-weight: 500;
  color: #e2e8f0;
}

.card-body :deep(.auth-hint) {
  font-size: 12px;
  color: var(--text-muted);
}

.card-body :deep(.auth-control) {
  position: relative;
  display: flex;
  align-items: center;
}

.card-body :deep(.auth-control input) {
  width: 100%;
  height: 44px;
  padding: 0 14px 0 40px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  color: #f8fafc;
  font-size: 14px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
}

.card-body :deep(.auth-control.plain input) {
  padding-left: 14px;
}

.card-body :deep(.auth-control.has-toggle input) {
  padding-right: 42px;
}

.card-body :deep(.auth-control input::placeholder) {
  color: #64748b;
}

.card-body :deep(.auth-control input:hover) {
  border-color: rgba(255, 255, 255, 0.22);
  background: rgba(15, 23, 42, 0.75);
}

.card-body :deep(.auth-control input:focus) {
  border-color: #60a5fa;
  background: rgba(15, 23, 42, 0.85);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25), 0 0 16px rgba(59, 130, 246, 0.2);
}

.card-body :deep(.auth-control input[aria-invalid="true"]) {
  border-color: #f87171;
}

.card-body :deep(.auth-control input[aria-invalid="true"]:focus) {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25);
}

.card-body :deep(.auth-ico) {
  position: absolute;
  left: 13px;
  width: 17px;
  height: 17px;
  color: #94a3b8;
  pointer-events: none;
  transition: color 0.2s;
}

.card-body :deep(.auth-control:focus-within .auth-ico) {
  color: #60a5fa;
}

.card-body :deep(.auth-toggle) {
  position: absolute;
  right: 6px;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s;
}

.card-body :deep(.auth-toggle:hover) {
  color: #f8fafc;
  background: rgba(255, 255, 255, 0.08);
}

.card-body :deep(.auth-toggle svg) {
  width: 16px;
  height: 16px;
}

.card-body :deep(.auth-err) {
  margin: 6px 0 0 2px;
  font-size: 12px;
  color: #f87171;
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-body :deep(.auth-submit) {
  width: 100%;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 22px;
  border: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, #2563eb, #1d4fd7);
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
  box-shadow: 0 6px 20px -2px rgba(37, 99, 235, 0.5), 0 1px 0 rgba(255, 255, 255, 0.25) inset;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-body :deep(.auth-submit:hover:not(:disabled)) {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 8px 24px -2px rgba(59, 130, 246, 0.6), 0 1px 0 rgba(255, 255, 255, 0.3) inset;
  transform: translateY(-1px);
}

.card-body :deep(.auth-submit:active:not(:disabled)) {
  transform: translateY(0);
}

.card-body :deep(.auth-submit[disabled]) {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.card-foot {
  margin-top: 22px;
  text-align: center;
  font-size: 13.5px;
  color: var(--text-secondary);
}

.card-body :deep(.auth-link),
.card-foot :deep(.auth-link) {
  color: #60a5fa;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.15s;
}

.card-body :deep(.auth-link:hover),
.card-foot :deep(.auth-link:hover) {
  color: #93c5fd;
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* 底部标语 */
.page-footer {
  margin-top: 24px;
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
  letter-spacing: 0.02em;
}

@media (max-width: 480px) {
  .auth-root {
    padding: 20px 12px;
  }
  .glass-card {
    padding: 26px 20px;
    border-radius: 16px;
  }
  .card-title {
    font-size: 20px;
  }
  .logo-text {
    font-size: 22px;
  }
  .page-footer {
    font-size: 11px;
  }
}
</style>
