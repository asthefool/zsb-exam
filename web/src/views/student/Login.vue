<script setup>
// 登录页（对齐 UI 库 Auth.tsx Login）：Label + field + 行内校验错误，真实登录接口
import { reactive, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '../../stores/user';
import AuthShell from '../../components/AuthShell.vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const form = reactive({ username: '', password: '' });
const err = reactive({ username: '', password: '' });
const busy = ref(false);

function check(field) {
  err[field] = form[field].trim() ? '' : field === 'username' ? '请输入用户名' : '请输入密码';
  return !err[field];
}

async function onSubmit() {
  if (![check('username'), check('password')].every(Boolean)) return;
  busy.value = true;
  try {
    const user = await userStore.login(form);
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
</script>

<template>
  <AuthShell title="欢迎回来" sub="登录后开始今天的学习计划">
    <form class="form-fields" @submit.prevent="onSubmit" novalidate>
      <div>
        <div class="form-label"><span>用户名</span></div>
        <input
          v-model="form.username"
          class="field"
          placeholder="请输入用户名"
          @blur="check('username')"
        />
        <div v-if="err.username" class="form-error">{{ err.username }}</div>
      </div>
      <div>
        <div class="form-label"><span>密码</span></div>
        <input
          v-model="form.password"
          class="field"
          type="password"
          placeholder="请输入密码"
          @blur="check('password')"
        />
        <div v-if="err.password" class="form-error">{{ err.password }}</div>
      </div>
      <button class="btn btn-primary btn-block" type="submit" :disabled="busy">
        {{ busy ? '登录中…' : '登 录' }}
      </button>
      <p class="demo-hint">
        演示账号：zsbtest2026 / 123456（考生）<br />
        管理员账号：admin / admin123
      </p>
    </form>
    <template #foot>
      还没有账号？
      <router-link class="link" to="/register">立即注册</router-link>
    </template>
  </AuthShell>
</template>

<style scoped>
.link { font-weight: 500; color: var(--primary); text-decoration: none; }
.link:hover { text-decoration: underline; }
.demo-hint {
  margin-top: 16px;
  text-align: center;
  font-size: 12px;
  line-height: 1.8;
  color: var(--text-2);
}
</style>
