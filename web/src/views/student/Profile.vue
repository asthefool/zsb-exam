<script setup>
// 个人中心（对齐 UI 库 Profile.tsx 结构）：账号信息 + 修改昵称
import { reactive, ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '../../stores/user';

const userStore = useUserStore();
const user = ref({});
const saving = ref(false);
const error = ref(false);
const form = reactive({ nickname: '' });

const nickCount = computed(() => `${form.nickname.length}/32`);
const avatarChar = computed(() => (user.value.nickname || user.value.username || '同').slice(0, 1));

function formatDate(v) {
  return v ? String(v).replace('T', ' ').slice(0, 16) : '—';
}

async function load() {
  error.value = false;
  try {
    user.value = (await userStore.fetchProfile()) || {};
    form.nickname = user.value.nickname || '';
  } catch (e) {
    user.value = {};
    error.value = true;
  }
}

async function onSave() {
  if (!form.nickname.trim()) {
    ElMessage.warning('昵称不能为空');
    return;
  }
  saving.value = true;
  try {
    await userStore.saveProfile({ nickname: form.nickname.trim() });
    ElMessage.success('昵称已更新');
    await load();
  } catch (e) {
    /* 保存失败由全局拦截器提示 */
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="page-pad">
    <div class="page-head">
      <div>
        <h1>个人中心</h1>
        <p class="sub">查看账号信息，修改展示昵称。</p>
      </div>
    </div>

    <div v-if="error" class="alert">
      <span class="alert-main">账号信息加载失败</span>
      <button class="btn btn-ghost" @click="load()">重新加载</button>
    </div>

    <div class="grid-profile">
      <!-- 账号信息 -->
      <section class="panel">
        <div class="panel-head"><h2>账号信息</h2></div>
        <div class="profile-top">
          <span class="avatar">{{ avatarChar }}</span>
          <div>
            <div class="name">{{ user.nickname || user.username || '—' }}</div>
            <div class="text-xs muted">计算机科学与技术 备考中</div>
          </div>
        </div>
        <dl class="info-list">
          <div class="info-row">
            <dt>用户名</dt>
            <dd>{{ user.username || '—' }}</dd>
          </div>
          <div class="info-row">
            <dt>昵称</dt>
            <dd>{{ user.nickname || '—' }}</dd>
          </div>
          <div class="info-row">
            <dt>角色</dt>
            <dd>
              <span class="tag" :class="user.role === 'admin' ? 'tag-bad' : 'tag-brand'">
                {{ user.role === 'admin' ? '管理员' : '考生' }}
              </span>
            </dd>
          </div>
          <div class="info-row">
            <dt>注册时间</dt>
            <dd>{{ formatDate(user.created_at) }}</dd>
          </div>
        </dl>
      </section>

      <!-- 修改昵称 -->
      <section class="panel align-start">
        <div class="panel-head"><h2>修改昵称</h2></div>
        <div class="nick-form">
          <div>
            <div class="form-label"><span>新昵称</span><span class="hint">{{ nickCount }}</span></div>
            <input v-model="form.nickname" class="field" maxlength="32" placeholder="请输入新昵称" />
          </div>
          <div>
            <button class="btn btn-primary" :disabled="saving" @click="onSave">
              {{ saving ? '保存中…' : '保存' }}
            </button>
          </div>
          <div class="notice">
            <span aria-hidden>ⓘ</span>
            忘记密码等账号安全操作请联系管理员在后台处理
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.grid-profile {
  display: grid;
  gap: 24px;
  grid-template-columns: 1fr;
}
@media (min-width: 1024px) {
  .grid-profile { grid-template-columns: 10fr 14fr; }
}
.align-start { align-self: start; }
.profile-top {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 20px 0;
}
.avatar {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 20px;
  font-weight: 700;
}
.name { font-size: 15px; font-weight: 700; }
.info-list {
  margin: 16px 0 0;
  border-top: 1px solid var(--border);
}
.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}
.info-row:last-child { border-bottom: none; }
.info-row dt { color: var(--text-2); margin: 0; }
.info-row dd { margin: 0; }
.nick-form {
  max-width: 420px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.notice {
  display: flex;
  gap: 8px;
  border-radius: 8px;
  background: var(--bg);
  padding: 12px;
  font-size: 12px;
  line-height: 1.625;
  color: var(--text-2);
}
</style>
