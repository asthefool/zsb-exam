<script setup>
// 登录/注册页壳：左侧品牌栏 + 右侧表单区（对齐 UI 库 Auth.tsx Shell）
defineProps({
  title: { type: String, required: true },
  sub: { type: String, required: true }
});
</script>

<template>
  <div class="auth-shell">
    <div class="brand-side">
      <div class="brand-row">
        <div class="brand-mark">升</div>
        <div class="brand-name">专升本智能备考</div>
      </div>
      <div>
        <div class="slogan">刷题练习<br />错题诊断<br />计划执行</div>
        <p class="slogan-sub">AI 根据你的答题轨迹，每天排好最该学的内容，让每一小时都用在刀刃上。</p>
      </div>
      <div class="brand-foot">2027 年专升本统考备考平台</div>
    </div>
    <div class="form-side">
      <div class="form-wrap">
        <h1 class="title">{{ title }}</h1>
        <p class="sub">{{ sub }}</p>
        <div class="form-body">
          <slot />
        </div>
        <div class="foot">
          <slot name="foot" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr;
}
@media (min-width: 1024px) {
  .auth-shell { grid-template-columns: 1.05fr 1fr; }
}
.brand-side {
  display: none;
  flex-direction: column;
  justify-content: space-between;
  background: var(--primary);
  color: #fff;
  padding: 48px;
}
@media (min-width: 1024px) {
  .brand-side { display: flex; }
}
.brand-row { display: flex; align-items: center; gap: 12px; }
.brand-mark {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #fff;
  color: var(--primary);
  font-size: 18px;
  font-weight: 700;
}
.brand-name { font-size: 18px; font-weight: 700; }
.slogan {
  font-size: 36px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.025em;
}
.slogan-sub {
  margin-top: 20px;
  max-width: 384px;
  font-size: 14px;
  line-height: 1.625;
  color: rgba(255, 255, 255, 0.75);
}
.brand-foot { font-size: 12px; color: rgba(255, 255, 255, 0.6); }
.form-side {
  display: grid;
  place-items: center;
  padding: 48px 24px;
}
.form-wrap { width: 100%; max-width: 400px; }
.title { font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }
.sub { margin-top: 4px; font-size: 14px; color: var(--text-2); }
.form-body { margin-top: 32px; }
.form-body :deep(.form-fields) { display: flex; flex-direction: column; }
.form-body :deep(.form-fields > *) + * { margin-top: 20px; }
.foot { margin-top: 24px; text-align: center; font-size: 14px; color: var(--text-2); }
</style>
