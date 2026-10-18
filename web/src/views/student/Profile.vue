<script setup>
// 个人中心（任务书 F7）：管理个人信息
// 账号信息展示 + 个人资料编辑（昵称/性别/手机/邮箱/目标院校/签名） + 修改密码
import { reactive, ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '../../stores/user';
import { changePassword } from '../../api';
import { GENDER_LABEL } from '../../constants.js';

const userStore = useUserStore();
const user = ref({});
const saving = ref(false);
const error = ref(false);
const form = reactive({
  nickname: '', gender: 'secret', phone: '', email: '', target_school: '', bio: ''
});
const nickCount = computed(() => `${form.nickname.length}/32`);
const bioCount = computed(() => `${form.bio.length}/200`);
const avatarChar = computed(() => (user.value.nickname || user.value.username || '同').slice(0, 1));
const studyDays = computed(() => {
  const created = user.value.created_at;
  if (!created) return null;
  return Math.max(1, Math.floor((Date.now() - new Date(created).getTime()) / 86400000));
});

const pwd = reactive({ old_password: '', new_password: '', confirm: '' });
const pwdSaving = ref(false);

function formatDate(v) {
  return v ? String(v).replace('T', ' ').slice(0, 16) : '—';
}

async function load() {
  error.value = false;
  try {
    user.value = (await userStore.fetchProfile()) || {};
    form.nickname = user.value.nickname || '';
    form.gender = user.value.gender || 'secret';
    form.phone = user.value.phone || '';
    form.email = user.value.email || '';
    form.target_school = user.value.target_school || '';
    form.bio = user.value.bio || '';
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
    await userStore.saveProfile({
      nickname: form.nickname.trim(),
      gender: form.gender,
      phone: form.phone.trim(),
      email: form.email.trim(),
      target_school: form.target_school.trim(),
      bio: form.bio.trim()
    });
    ElMessage.success('个人资料已更新');
    await load();
  } catch (e) {
    /* 保存失败由全局拦截器提示 */
  } finally {
    saving.value = false;
  }
}

async function onChangePassword() {
  if (!pwd.old_password || !pwd.new_password) {
    ElMessage.warning('请输入原密码与新密码');
    return;
  }
  if (pwd.new_password.length < 6) {
    ElMessage.warning('新密码长度至少 6 位');
    return;
  }
  if (pwd.new_password !== pwd.confirm) {
    ElMessage.warning('两次输入的新密码不一致');
    return;
  }
  pwdSaving.value = true;
  try {
    await changePassword({
      old_password: pwd.old_password,
      new_password: pwd.new_password
    });
    ElMessage.success('密码已修改，下次登录请使用新密码');
    pwd.old_password = '';
    pwd.new_password = '';
    pwd.confirm = '';
  } catch (e) {
    /* 失败由全局拦截器提示 */
  } finally {
    pwdSaving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="page-pad">
    <div class="page-head">
      <div>
        <h1>个人中心</h1>
        <p class="sub">管理个人资料与账号安全。</p>
      </div>
    </div>

    <div v-if="error" class="alert">
      <span class="alert-main">账号信息加载失败</span>
      <button class="btn btn-ghost" @click="load()">重新加载</button>
    </div>

    <div class="grid-profile">
      <!-- 账号信息 -->
      <!-- 摘要卡：头像、昵称与备考天数；完整字段在右侧编辑 -->
      <section class="panel summary-card">
        <span class="avatar">{{ avatarChar }}</span>
        <div class="summary-name">{{ user.nickname || user.username || '同学' }}</div>
        <div class="text-xs muted">@{{ user.username || '—' }}</div>
        <div class="summary-days">
          <span class="summary-num">{{ studyDays ?? '—' }}</span>
          <span class="muted text-sm">{{ studyDays === null ? '注册后开始计算备考天数' : '天备考' }}</span>
        </div>
        <div class="summary-meta">
          <span v-if="user.target_school" class="tag tag-brand">{{ user.target_school }}</span>
          <span class="tag" :class="user.role === 'admin' ? 'tag-bad' : 'tag-muted'">{{ user.role === 'admin' ? '管理员' : '考生' }}</span>
        </div>
        <div class="text-xs muted">注册于 {{ formatDate(user.created_at) }}</div>
      </section>

      <div class="col-stack">
        <!-- 编辑资料 -->
        <section class="panel">
          <div class="panel-head"><h2>编辑资料</h2></div>
          <div class="profile-form">
            <div>
              <div class="form-label"><span>昵称</span><span class="hint">{{ nickCount }}</span></div>
              <input v-model="form.nickname" class="field" maxlength="32" placeholder="请输入昵称" />
            </div>
            <div>
              <div class="form-label"><span>性别</span></div>
              <div class="btn-row">
                <button
                  v-for="(label, key) in GENDER_LABEL"
                  :key="key"
                  class="type-btn"
                  :class="{ active: form.gender === key }"
                  @click="form.gender = key"
                >{{ label }}</button>
              </div>
            </div>
            <div class="two-col">
              <div>
                <div class="form-label"><span>手机号</span></div>
                <input v-model="form.phone" class="field" maxlength="11" placeholder="11 位手机号（可留空）" />
              </div>
              <div>
                <div class="form-label"><span>邮箱</span></div>
                <input v-model="form.email" class="field" maxlength="64" placeholder="常用邮箱（可留空）" />
              </div>
            </div>
            <div>
              <div class="form-label"><span>目标院校</span></div>
              <input v-model="form.target_school" class="field" maxlength="64" placeholder="备考目标院校（可留空）" />
            </div>
            <div>
              <div class="form-label"><span>个性签名</span><span class="hint">{{ bioCount }}</span></div>
              <textarea v-model="form.bio" class="field" rows="2" maxlength="200" placeholder="写一句备考宣言（可留空）"></textarea>
            </div>
            <div>
              <button class="btn btn-primary" :disabled="saving" @click="onSave">
                {{ saving ? '保存中…' : '保存资料' }}
              </button>
            </div>
          </div>
        </section>

        <!-- 修改密码 -->
        <section class="panel">
          <div class="panel-head"><h2>修改密码</h2></div>
          <div class="profile-form">
            <div>
              <div class="form-label"><span>原密码</span></div>
              <input v-model="pwd.old_password" class="field" type="password" maxlength="32" placeholder="请输入原密码" />
            </div>
            <div class="two-col">
              <div>
                <div class="form-label"><span>新密码</span><span class="hint">至少 6 位</span></div>
                <input v-model="pwd.new_password" class="field" type="password" maxlength="32" placeholder="请输入新密码" />
              </div>
              <div>
                <div class="form-label"><span>确认新密码</span></div>
                <input v-model="pwd.confirm" class="field" type="password" maxlength="32" placeholder="再次输入新密码" />
              </div>
            </div>
            <div>
              <button class="btn btn-primary" :disabled="pwdSaving" @click="onChangePassword">
                {{ pwdSaving ? '提交中…' : '修改密码' }}
              </button>
            </div>
            <div class="notice">
              <span aria-hidden>ⓘ</span>
              修改成功后下次登录请使用新密码；忘记密码可联系管理员在后台处理
            </div>
          </div>
        </section>
      </div>
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
.col-stack { display: flex; flex-direction: column; gap: 24px; min-width: 0; }
.summary-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 32px 24px;
  text-align: center;
  align-self: start;
}
.avatar {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 26px;
  font-weight: 700;
}
.summary-name { font-size: 18px; font-weight: 700; }
.summary-days {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 8px;
}
.summary-num { font-size: 36px; font-weight: 700; line-height: 1; color: var(--primary); }
.summary-meta { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.profile-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}
.two-col {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
}
.two-col > div { flex: 1; min-width: 200px; }
.btn-row { display: flex; gap: 8px; }
.type-btn {
  border: 1px solid var(--border);
  background: var(--card);
  border-radius: 8px;
  padding: 6px 16px;
  font-size: 14px;
  color: var(--text);
  transition: border-color 0.15s, background-color 0.15s, color 0.15s;
}
.type-btn:hover { border-color: rgba(29, 79, 215, 0.6); }
.type-btn.active { border-color: var(--primary); background: var(--primary-soft); color: var(--primary); }
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
