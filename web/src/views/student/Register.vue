<script setup>
// 注册页：用户名 3-32 位字母数字下划线，密码 ≥6 位；与 AuthShell 新视觉规范完全同步
import { reactive, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { registerUser } from '../../api';
import AuthShell from '../../components/AuthShell.vue';

const router = useRouter();
const form = reactive({ username: '', nickname: '', password: '', confirm: '' });
const err = reactive({ username: '', password: '', confirm: '' });
const busy = ref(false);
const showPwd = ref(false);
const showConfirm = ref(false);

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
    ElMessage.success('注册成功，请使用新账号登录');
    router.push('/login');
  } catch (e) {
    /* 注册失败（40901 撞名等）由全局拦截器提示具体错误 */
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <AuthShell title="创建考生账号" sub="开启专属智能备考路径，冲刺理想本科院校">
    <form novalidate @submit.prevent="onSubmit">
      <!-- 用户名 -->
      <div class="auth-field">
        <label class="auth-label" for="reg-username">
          <span>用户名</span>
          <span class="auth-hint">3-32 位字符</span>
        </label>
        <div class="auth-control">
          <svg class="auth-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="8" cy="5.5" r="2.75" />
            <path d="M2.75 13.5c.5-2.4 2.6-3.75 5.25-3.75s4.75 1.35 5.25 3.75" />
          </svg>
          <input
            id="reg-username"
            v-model="form.username"
            type="text"
            placeholder="支持字母、数字或下划线"
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

      <!-- 昵称（可选） -->
      <div class="auth-field">
        <label class="auth-label" for="reg-nickname">
          <span>考生昵称（可选）</span>
          <span class="auth-hint">{{ nickCount }}</span>
        </label>
        <div class="auth-control">
          <svg class="auth-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M13.5 3.5a2.121 2.121 0 0 1 0 3L5 15l-4 1 1-4 8.5-8.5a2.121 2.121 0 0 1 3 0z" />
          </svg>
          <input
            id="reg-nickname"
            v-model="form.nickname"
            type="text"
            maxlength="32"
            placeholder="展示昵称，随时可在个人中心修改"
          />
        </div>
      </div>

      <!-- 密码 -->
      <div class="auth-field">
        <label class="auth-label" for="reg-password">
          <span>登录密码</span>
          <span class="auth-hint">至少 6 位</span>
        </label>
        <div class="auth-control has-toggle">
          <svg class="auth-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="2.75" y="7" width="10.5" height="6.75" rx="1.5" />
            <path d="M5.25 7V5.25a2.75 2.75 0 015.5 0V7" />
          </svg>
          <input
            id="reg-password"
            v-model="form.password"
            :type="showPwd ? 'text' : 'password'"
            placeholder="请输入密码（至少 6 位）"
            autocomplete="new-password"
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

      <!-- 确认密码 -->
      <div class="auth-field">
        <label class="auth-label" for="reg-confirm">确认登录密码</label>
        <div class="auth-control has-toggle">
          <svg class="auth-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="2.75" y="7" width="10.5" height="6.75" rx="1.5" />
            <path d="M5.25 7V5.25a2.75 2.75 0 015.5 0V7" />
          </svg>
          <input
            id="reg-confirm"
            v-model="form.confirm"
            :type="showConfirm ? 'text' : 'password'"
            placeholder="请再次输入上方密码"
            autocomplete="new-password"
            :aria-invalid="err.confirm ? 'true' : 'false'"
            @blur="check('confirm')"
            @input="err.confirm = ''"
          />
          <button
            type="button"
            class="auth-toggle"
            :aria-label="showConfirm ? '隐藏密码' : '显示密码'"
            :aria-pressed="showConfirm"
            @click="showConfirm = !showConfirm"
          >
            <svg v-if="!showConfirm" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
        <p v-if="err.confirm" class="auth-err">
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="7"/><line x1="8" y1="5" x2="8" y2="8.5"/><circle cx="8" cy="11.5" r="0.75" fill="currentColor"/></svg>
          {{ err.confirm }}
        </p>
      </div>

      <!-- 提交按钮 -->
      <button class="auth-submit" type="submit" :disabled="busy">
        <svg v-if="busy" class="spin-ico" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="32" stroke-linecap="round" />
        </svg>
        <span>{{ busy ? '正在创建账号…' : '立即注册' }}</span>
      </button>
    </form>

    <template #foot>
      <span>已有账号？</span>
      <router-link class="auth-link" to="/login">返回登录</router-link>
    </template>
  </AuthShell>
</template>

<style scoped>
.spin-ico {
  width: 18px;
  height: 18px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}
</style>
