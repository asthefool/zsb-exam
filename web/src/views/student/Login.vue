<script setup>
// 登录页：真实登录接口与跳转校验保持不变，版式由 AuthShell 提供
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
  // TODO: 跳转到找回密码页面
}
</script>

<template>
  <AuthShell title="欢迎回来" sub="登录后开始今天的学习计划">
    <form novalidate @submit.prevent="onSubmit">
      <div class="auth-field">
        <label class="auth-label" for="username">用户名</label>
        <div class="auth-control">
          <svg class="auth-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="5.5" r="2.75" /><path d="M2.75 13.5c.5-2.4 2.6-3.75 5.25-3.75s4.75 1.35 5.25 3.75" /></svg>
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
        <p v-if="err.username" class="auth-err">{{ err.username }}</p>
      </div>

      <div class="auth-field">
        <label class="auth-label" for="password">密码</label>
        <div class="auth-control has-toggle">
          <svg class="auth-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.75" y="7" width="10.5" height="6.75" rx="1.5" /><path d="M5.25 7V5.25a2.75 2.75 0 015.5 0V7" /></svg>
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
            <svg v-if="!showPwd" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 8s2.3-4.5 6.5-4.5S14.5 8 14.5 8 12.2 12.5 8 12.5 1.5 8 1.5 8z" /><circle cx="8" cy="8" r="2" /></svg>
            <svg v-else viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 2.5l11 11" /><path d="M6.6 4a6.4 6.4 0 011.4-.5c4.2 0 6.5 4.5 6.5 4.5a11 11 0 01-1.9 2.4M4.3 5.3A11 11 0 001.5 8s2.3 4.5 6.5 4.5c1 0 1.9-.3 2.7-.7" /><path d="M6.6 6.7a2 2 0 002.7 2.7" /></svg>
          </button>
        </div>
        <p v-if="err.password" class="auth-err">{{ err.password }}</p>
      </div>

      <div class="row">
        <label class="check" for="remember">
          <input id="remember" v-model="form.remember" type="checkbox" />
          记住我
        </label>
        <a href="#forgot" class="auth-link" @click.prevent="onForgot">忘记密码？</a>
      </div>

      <button class="auth-submit" type="submit" :disabled="busy">
        {{ busy ? '登录中…' : '登 录' }}
      </button>
    </form>

    <!-- 演示账号：只在开发环境显示，打包上线后自动消失 -->
    <div v-if="showDemo" class="demo">
      <div class="demo-head">
        <span class="demo-title">演示账号</span>
        <span class="pill">仅开发环境</span>
      </div>
      <div v-for="a in demoAccounts" :key="a.username" class="demo-row">
        <span class="demo-role">{{ a.role }}</span>
        <span class="cred">{{ a.username }} / {{ a.password }}</span>
        <button type="button" class="fill" @click="fillDemo(a)">一键填入</button>
      </div>
    </div>

    <template #foot>
      还没有账号？
      <router-link class="auth-link" to="/register">立即注册</router-link>
    </template>
  </AuthShell>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 16px 0 24px;
}
.check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--ink-2);
  cursor: pointer;
}
.check input { width: 16px; height: 16px; margin: 0; accent-color: var(--primary); cursor: pointer; }

.demo {
  margin-top: 32px;
  padding: 12px 14px;
  background: var(--bg-brand);
  border: 1px solid var(--line-soft);
  border-radius: 8px;
}
.demo-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 6px;
}
.demo-title { font-size: 12px; font-weight: 500; color: var(--ink-2); }
.pill {
  padding: 0 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: 11px;
  line-height: 18px;
  color: var(--ink-3);
}
.demo-row {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding-block: 8px;
  border-top: 1px solid var(--line-soft);
}
.demo-role { font-size: 13px; color: var(--ink-2); }
.cred {
  font: 400 12.5px/1.4 var(--mono);
  color: var(--ink);
  overflow-wrap: anywhere;
}
.fill {
  height: 26px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--surface);
  color: var(--link);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.fill:hover { background: var(--primary-soft); border-color: var(--primary); }
</style>
