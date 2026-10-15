<script setup>
// 用户管理（对齐 UI 库 admin/UserManage.tsx 结构）：筛选 + 原生表格 + 启用/禁用（带确认）
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminListUsers, adminSetUserStatus } from '../../api';

const SELF = Number(localStorage.getItem('userId')) || 0;

const users = ref([]);
const loading = ref(false);
const loadError = ref(false);

const filter = reactive({ role: '', status: '' });
const applied = reactive({ role: '', status: '' });
const toggling = ref(false);

const rows = computed(() => users.value.filter((u) =>
  (!applied.role || u.role === applied.role) &&
  (!applied.status || String(u.status) === applied.status)
));

async function load() {
  loading.value = true;
  loadError.value = false;
  try {
    const res = await adminListUsers({ page: 1, size: 50 });
    users.value = (res && res.list) || [];
  } catch (e) {
    loadError.value = true;
    users.value = [];
  } finally {
    loading.value = false;
  }
}

function search() {
  applied.role = filter.role;
  applied.status = filter.status;
}

async function toggleStatus(u) {
  if (toggling.value) return;
  const next = u.status ? 0 : 1;
  try {
    await ElMessageBox.confirm(
      `确定${next ? '启用' : '禁用'}用户「${u.username}」？`,
      next ? '启用确认' : '禁用确认',
      { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }
    );
  } catch (e) { return; }
  toggling.value = true;
  try {
    await adminSetUserStatus(u.id, next);
    u.status = next;
    ElMessage.success(next ? '已启用' : '已禁用');
  } catch (e) {
    /* 失败由全局拦截器提示 */
  } finally {
    toggling.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section class="panel" v-loading="loading">
    <div class="panel-head">
      <h2>用户管理</h2>
    </div>

    <div class="toolbar">
      <select v-model="filter.role" class="field field-w140" aria-label="角色">
        <option value="">全部角色</option>
        <option value="student">考生</option>
        <option value="admin">管理员</option>
      </select>
      <select v-model="filter.status" class="field field-w140" aria-label="状态">
        <option value="">全部状态</option>
        <option value="1">正常</option>
        <option value="0">禁用</option>
      </select>
      <button class="btn btn-ghost" @click="search">查询</button>
    </div>

    <div v-if="loadError" class="alert" style="margin: 0 20px 16px">
      <span class="alert-main">用户列表加载失败</span>
      <button class="btn btn-ghost" @click="load()">重新加载</button>
    </div>

    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th><th>用户名</th><th>昵称</th><th>角色</th><th>状态</th><th>注册时间</th><th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in rows" :key="u.id">
            <td class="muted">{{ u.id }}</td>
            <td class="name">{{ u.username }}</td>
            <td>{{ u.nickname || '—' }}</td>
            <td>
              <span class="tag" :class="u.role === 'admin' ? 'tag-bad' : 'tag-brand'">
                {{ u.role === 'admin' ? '管理员' : '考生' }}
              </span>
            </td>
            <td>
              <span class="tag" :class="u.status ? 'tag-ok' : 'tag-bad'">{{ u.status ? '正常' : '禁用' }}</span>
            </td>
            <td class="muted">{{ String(u.created_at || '').replace('T', ' ').slice(0, 16) }}</td>
            <td>
              <button
                class="btn"
                :class="u.status ? 'btn-danger' : 'btn-ok'"
                :disabled="u.id === SELF || toggling"
                @click="toggleStatus(u)"
              >{{ u.status ? '禁用' : '启用' }}</button>
            </td>
          </tr>
          <tr v-if="!rows.length && !loading" class="empty">
            <td colspan="7">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="footer-count">共 {{ rows.length }} 条</div>
  </section>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
}
.field-w140 { width: 140px; }
.name { font-weight: 500; }
.btn-ok {
  background: var(--card);
  border-color: rgba(18, 128, 92, 0.3);
  color: var(--green);
  padding: 6px 14px;
}
.btn-ok:hover:not(:disabled) { background: var(--green-soft); }
.footer-count {
  padding: 16px 20px;
  text-align: right;
  font-size: 14px;
  color: var(--text-2);
}
</style>
