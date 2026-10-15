<script setup>
// 注册页（对齐 UI 库 Auth.tsx Register）：用户名 3-32 位字母数字下划线，密码 ≥6 位
import { reactive, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { registerUser } from '../../api';
import AuthShell from '../../components/AuthShell.vue';

const router = useRouter();
const form = reactive({ username: '', nickname: '', password: '', confirm: '' });
const err = reactive({ username: '', password: '', confirm: '' });
const busy = ref(false);

const nickCount = computed(() => `${form.nickname.length}/32`);

function check(field) {
  if (field === 'username') {
    err.username = !form.username
      ? '请输入用户名'
      : /^[a-zA-Z0-9_]{3,32}$/.test(form.username)
        ? '' : '3-32 位字母、数字或下划线';
  } else if (field === 'password') {
    err.password = !form.password
      ? '请输入密码'
      : form.password.length >= 6 ? '' : '密码长度至少 6 位';
  } else {
    err.confirm = !form.confirm
      ? '请再次输入密码'
      : form.confirm === form.password ? '' : '两次输入的密码不一致';
  }
  return !err[field];
}

async function onSubmit() {
  const ok = ['username', 'password', 'confirm'].map(check).every(Boolean);
  if (!ok) return;
  busy.value = true;
  try {
    await registerUser({
      username: form.username,
      password: form.password,
      nickname: form.nickname
    });
    ElMessage.success('注册成功，请登录');
    router.push('/login');
  } catch (e) {
    /* 注册失败（40901 撞名等）由全局拦截器提示具体错误 */
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <AuthShell title="注册账号" sub="创建账号，开始你的备考之旅">
    <form class="form-fields" @submit.prevent="onSubmit" novalidate>
      <div>
        <div class="form-label"><span>用户名</span></div>
        <input
          v-model="form.username"
          class="field"
          placeholder="3-32 位字母、数字或下划线"
          @blur="check('username')"
        />
        <div v-if="err.username" class="form-error">{{ err.username }}</div>
      </div>
      <div>
        <div class="form-label"><span>昵称（可选）</span><span class="hint">{{ nickCount }}</span></div>
        <input
          v-model="form.nickname"
          class="field"
          maxlength="32"
          placeholder="用于展示，可随时修改"
        />
      </div>
      <div>
        <div class="form-label"><span>密码</span></div>
        <input
          v-model="form.password"
          class="field"
          type="password"
          placeholder="至少 6 位"
          @blur="check('password')"
        />
        <div v-if="err.password" class="form-error">{{ err.password }}</div>
      </div>
      <div>
        <div class="form-label"><span>确认密码</span></div>
        <input
          v-model="form.confirm"
          class="field"
          type="password"
          @blur="check('confirm')"
        />
        <div v-if="err.confirm" class="form-error">{{ err.confirm }}</div>
      </div>
      <button class="btn btn-primary btn-block" type="submit" :disabled="busy">
        {{ busy ? '提交中…' : '注 册' }}
      </button>
    </form>
    <template #foot>
      已有账号？
      <router-link class="link" to="/login">去登录</router-link>
    </template>
  </AuthShell>
</template>

<style scoped>
.link { font-weight: 500; color: var(--primary); text-decoration: none; }
.link:hover { text-decoration: underline; }
</style>
