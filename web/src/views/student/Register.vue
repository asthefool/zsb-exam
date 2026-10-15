<script setup>
// 注册页：用户名 3-32 位字母数字下划线，密码 ≥6 位；版式由 AuthShell 提供
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
    <form novalidate @submit.prevent="onSubmit">
      <div class="auth-field">
        <label class="auth-label" for="reg-username">用户名</label>
        <div class="auth-control plain">
          <input
            id="reg-username"
            v-model="form.username"
            type="text"
            placeholder="3-32 位字母、数字或下划线"
            autocomplete="username"
            :aria-invalid="err.username ? 'true' : 'false'"
            @blur="check('username')"
            @input="err.username = ''"
          />
        </div>
        <p v-if="err.username" class="auth-err">{{ err.username }}</p>
      </div>

      <div class="auth-field">
        <label class="auth-label" for="reg-nickname">
          <span>昵称（可选）</span>
          <span class="auth-hint">{{ nickCount }}</span>
        </label>
        <div class="auth-control plain">
          <input
            id="reg-nickname"
            v-model="form.nickname"
            type="text"
            maxlength="32"
            placeholder="用于展示，可随时修改"
          />
        </div>
      </div>

      <div class="auth-field">
        <label class="auth-label" for="reg-password">密码</label>
        <div class="auth-control plain">
          <input
            id="reg-password"
            v-model="form.password"
            type="password"
            placeholder="至少 6 位"
            autocomplete="new-password"
            :aria-invalid="err.password ? 'true' : 'false'"
            @blur="check('password')"
            @input="err.password = ''"
          />
        </div>
        <p v-if="err.password" class="auth-err">{{ err.password }}</p>
      </div>

      <div class="auth-field">
        <label class="auth-label" for="reg-confirm">确认密码</label>
        <div class="auth-control plain">
          <input
            id="reg-confirm"
            v-model="form.confirm"
            type="password"
            autocomplete="new-password"
            :aria-invalid="err.confirm ? 'true' : 'false'"
            @blur="check('confirm')"
            @input="err.confirm = ''"
          />
        </div>
        <p v-if="err.confirm" class="auth-err">{{ err.confirm }}</p>
      </div>

      <button class="auth-submit" type="submit" :disabled="busy">
        {{ busy ? '提交中…' : '注 册' }}
      </button>
    </form>

    <template #foot>
      已有账号？
      <router-link class="auth-link" to="/login">去登录</router-link>
    </template>
  </AuthShell>
</template>
