<script setup>
// 登录页：真实登录接口与跳转校验保持不变，新风格适配 AuthShell 毛玻璃质感
import { onMounted, reactive, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '../../stores/user';
import AuthShell from '../../components/AuthShell.vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const REMEMBER_KEY = 'login_remembered_username';

const form = reactive({ username: '', password: '', remember: false });
const err = reactive({ username: '', password: '' });
const busy = ref(false);
const showPwd = ref(false);

// 演示账号只在开发环境显示，生产构建自动隐藏
const showDemo = import.meta.env.DEV;
const demoAccounts = [
  { role: '考生', username: 'zsbtest2026', password: '123456' },
  { role: '管理员', username: 'admin', password: 'admin123' }
];

function fillDemo(a) {
  form.username = a.username;
  form.password = a.password;
  err.username = '';
  err.password = '';
}

function check(field) {
  err[field] = form[field].trim() ? '' : field === 'username' ? '请输入用户名' : '请输入密码';
  return !err[field];
}

onMounted(() => {
  try {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      form.username = saved;
      form.remember = true;
    }
  } catch (e) {
    /* 隐私模式下可能不可用，忽略 */
  }
});

async function onSubmit() {
  if (![check('username'), check('password')].every(Boolean)) return;
  busy.value = true;
  try {
    const user = await userStore.login(form);
    try {
      if (form.remember) localStorage.setItem(REMEMBER_KEY, form.username);
      else localStorage.removeItem(REMEMBER_KEY);
    } catch (e) {
      /* 忽略 */
    }
    ElMessage.success(`欢迎回来，${user.nickname || user.username}`);
    // redirect 仅接受站内绝对路径，防止开放重定向
    const redirect = typeof route.query.redirect === 'string'
      && route.query.redirect.startsWith('/')
      && !route.query.redirect.startsWith('//')
      ? route.query.redirect
      : (user.role === 'admin' ? '/admin/questions' : '/');
    router.push(redirect);
  } catch (e) {
    /* 登录失败由全局拦截器提示具体错误（40102/40302 等） */
  } finally {
    busy.value = false;
  }
}

function onForgot() {
  ElMessage.info('如忘记密码，请联系系统管理员重置账号密码');
}
</script>

<template>
  <AuthShell title="欢迎回来" sub="登录后开启今日个性化学习计划">
    <form novalidate @submit.prevent="onSubmit">
      <!-- 用户名输入 -->
      <div class="auth-field">
        <label class="auth-label" for="username">用户名</label>
        <div class="auth-control">
          <svg class="auth-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="8" cy="5.5" r="2.75" />
            <path d="M2.75 13.5c.5-2.4 2.6-3.75 5.25-3.75s4.75 1.35 5.25 3.75" />
          </svg>
          <input
            id="username"
            v-model.trim="form.username"
            type="text"
            placeholder="请输入用户名"
            autocomplete="username"
            :aria-invalid="err.username ? 'true' : 'false'"
            @blur="check('username')"
            @input="err.username = ''"
          />
        </div>
        <p v-if="err.username" class="auth-err">
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="7"/><line x1="8" y1="5" x2="8" y2="8.5"/><circle cx="8" cy="11.5" r="0.75" fill="currentColor"/></svg>
          {{ err.username }}
        </p>
      </div>

      <!-- 密码输入 -->
      <div class="auth-field">
        <label class="auth-label" for="password">密码</label>
        <div class="auth-control has-toggle">
          <svg class="auth-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="2.75" y="7" width="10.5" height="6.75" rx="1.5" />
            <path d="M5.25 7V5.25a2.75 2.75 0 015.5 0V7" />
          </svg>
          <input
            id="password"
            v-model="form.password"
            :type="showPwd ? 'text' : 'password'"
            placeholder="请输入密码"
            autocomplete="current-password"
            :aria-invalid="err.password ? 'true' : 'false'"
            @blur="check('password')"
            @input="err.password = ''"
          />
          <button
            type="button"
            class="auth-toggle"
            :aria-label="showPwd ? '隐藏密码' : '显示密码'"
            :aria-pressed="showPwd"
            @click="showPwd = !showPwd"
          >
            <svg v-if="!showPwd" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M1.5 8s2.3-4.5 6.5-4.5S14.5 8 14.5 8 12.2 12.5 8 12.5 1.5 8 1.5 8z" />
              <circle cx="8" cy="8" r="2" />
            </svg>
            <svg v-else viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M2.5 2.5l11 11" />
              <path d="M6.6 4a6.4 6.4 0 011.4-.5c4.2 0 6.5 4.5 6.5 4.5a11 11 0 01-1.9 2.4M4.3 5.3A11 11 0 001.5 8s2.3 4.5 6.5 4.5c1 0 1.9-.3 2.7-.7" />
              <path d="M6.6 6.7a2 2 0 002.7 2.7" />
            </svg>
          </button>
        </div>
        <p v-if="err.password" class="auth-err">
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="7"/><line x1="8" y1="5" x2="8" y2="8.5"/><circle cx="8" cy="11.5" r="0.75" fill="currentColor"/></svg>
          {{ err.password }}
        </p>
      </div>

      <!-- 选项行：记住我 与 忘记密码 -->
      <div class="row">
        <label class="custom-check" for="remember">
          <input id="remember" v-model="form.remember" type="checkbox" />
          <span class="check-box" aria-hidden="true">
            <svg viewBox="0 0 12 12" fill="none"><path d="M2.5 6.5L4.5 8.5L9.5 3.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
          <span class="check-label">记住账号</span>
        </label>
        <a href="#forgot" class="auth-link" @click.prevent="onForgot">忘记密码？</a>
      </div>

      <!-- 登录提交按钮 -->
      <button class="auth-submit" type="submit" :disabled="busy">
        <svg v-if="busy" class="spin-ico" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="32" stroke-linecap="round" />
        </svg>
        <span>{{ busy ? '正在安全登录…' : '登 录' }}</span>
      </button>
    </form>

    <!-- 演示账号模块：仅开发环境显示，融入半透明磨砂风格 -->
    <div v-if="showDemo" class="demo-card">
      <div class="demo-header">
        <div class="demo-badge-wrap">
          <span class="demo-sparkle" aria-hidden="true">✨</span>
          <span class="demo-title">开发演示快捷填入</span>
        </div>
        <span class="demo-tag">Dev Only</span>
      </div>
      <div class="demo-list">
        <div v-for="a in demoAccounts" :key="a.username" class="demo-item">
          <div class="demo-meta">
            <span class="demo-role">{{ a.role }}</span>
            <code class="demo-cred">{{ a.username }} / {{ a.password }}</code>
          </div>
          <button type="button" class="btn-fill" @click="fillDemo(a)">填入</button>
        </div>
      </div>
    </div>

    <!-- 底部跳转卡槽 -->
    <template #foot>
      <span>还没有账号？</span>
      <router-link class="auth-link" to="/register">立即免费注册</router-link>
    </template>
  </AuthShell>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 16px 0 20px;
}

/* 精致自定义复选框 */
.custom-check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 13.5px;
  cursor: pointer;
  user-select: none;
  transition: color 0.15s;
}

.custom-check:hover {
  color: #f1f5f9;
}

.custom-check input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.check-box {
  width: 17px;
  height: 17px;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(15, 23, 42, 0.6);
  display: grid;
  place-items: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.check-box svg {
  width: 10px;
  height: 10px;
  opacity: 0;
  transform: scale(0.6);
  transition: all 0.15s ease-out;
}

.custom-check input:checked + .check-box {
  background: #2563eb;
  border-color: #3b82f6;
  box-shadow: 0 0 10px rgba(37, 99, 235, 0.4);
}

.custom-check input:checked + .check-box svg {
  opacity: 1;
  transform: scale(1);
}

.custom-check input:focus-visible + .check-box {
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.5);
}

.check-label {
  line-height: 1;
}

/* 提交加载旋转 */
.spin-ico {
  width: 18px;
  height: 18px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

/* 演示账号面板 */
.demo-card {
  margin-top: 24px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  backdrop-filter: blur(8px);
}

.demo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.demo-badge-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.demo-sparkle {
  font-size: 12px;
}

.demo-title {
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
  letter-spacing: 0.02em;
}

.demo-tag {
  font-size: 10.5px;
  padding: 2px 7px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 9999px;
  color: #94a3b8;
  font-weight: 500;
}

.demo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.demo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  transition: background 0.15s;
}

.demo-item:hover {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(255, 255, 255, 0.12);
}

.demo-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.demo-role {
  font-size: 11.5px;
  font-weight: 600;
  color: #93c5fd;
  flex-shrink: 0;
  padding: 1px 6px;
  background: rgba(37, 99, 235, 0.2);
  border-radius: 4px;
}

.demo-cred {
  font-family: 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace;
  font-size: 12px;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-fill {
  height: 24px;
  padding: 0 10px;
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 6px;
  background: rgba(37, 99, 235, 0.15);
  color: #93c5fd;
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.btn-fill:hover {
  background: #2563eb;
  color: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
}
</style>
