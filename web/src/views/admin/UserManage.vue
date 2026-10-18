<script setup>
// 用户管理：筛选（角色/状态）+ 分页表格；启用/禁用（带确认）
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminListUsers, adminSetUserStatus, adminUserStats } from '../../api';

const SELF = Number(localStorage.getItem('userId')) || 0;

const stats = reactive({ total: 0, student_total: 0, admin_total: 0, disabled_total: 0 });
const users = ref([]);
const total = ref(0);
const loading = ref(false);
const loadError = ref(false);
const toggling = ref(false);

const query = reactive({ page: 1, size: 10, role: '', status: '' });
const pages = computed(() => Math.max(1, Math.ceil(total.value / query.size)));

let listSeq = 0;
async function load() {
  const seq = ++listSeq;
  loading.value = true;
  loadError.value = false;
  try {
    const res = await adminListUsers({
      role: query.role || undefined,
      status: query.status === '' ? undefined : query.status,
      page: query.page,
      size: query.size
    });
    if (seq !== listSeq) return;
    users.value = (res && res.list) || [];
    total.value = (res && res.total) || 0;
  } catch (e) {
    if (seq !== listSeq) return;
    loadError.value = true;
    users.value = [];
    total.value = 0;
  } finally {
    if (seq === listSeq) loading.value = false;
  }
}

async function loadStats() {
  try {
    Object.assign(stats, (await adminUserStats()) || {});
  } catch (e) { /* 统计失败不影响列表 */ }
}

function search() {
  query.page = 1;
  load();
}

function resetFilters() {
  query.role = '';
  query.status = '';
  query.page = 1;
  load();
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
    loadStats();
  } catch (e) {
    /* 失败由全局拦截器提示 */
  } finally {
    toggling.value = false;
  }
}

onMounted(() => {
  loadStats();
  load();
});
</script>

<template>
  <div class="page-pad">
    <div class="page-head">
      <div>
        <h1>用户管理</h1>
        <p class="sub">查看考生与管理员账号，支持按角色与账号状态筛选，可启用或禁用账号。</p>
      </div>
    </div>

    <div class="stat-grid">
      <section class="panel stat-card">
        <div class="label">账号总数</div>
        <div class="value-row"><span class="value">{{ stats.total }}</span><span class="unit">个</span></div>
        <div class="note">考生与管理员合计</div>
      </section>
      <section class="panel stat-card">
        <div class="label">考生</div>
        <div class="value-row"><span class="value">{{ stats.student_total }}</span><span class="unit">人</span></div>
        <div class="note">普通考生账号</div>
      </section>
      <section class="panel stat-card">
        <div class="label">管理员</div>
        <div class="value-row"><span class="value">{{ stats.admin_total }}</span><span class="unit">人</span></div>
        <div class="note">后台管理账号</div>
      </section>
      <section class="panel stat-card">
        <div class="label">已禁用</div>
        <div class="value-row"><span class="value">{{ stats.disabled_total }}</span><span class="unit">个</span></div>
        <div class="note">无法登录的账号</div>
      </section>
    </div>

    <section class="panel" v-loading="loading">
      <div class="toolbar">
        <el-select v-model="query.role" class="field-w140" placeholder="角色" aria-label="角色">
          <el-option label="全部角色" value="" />
          <el-option label="考生" value="student" />
          <el-option label="管理员" value="admin" />
        </el-select>
        <el-select v-model="query.status" class="field-w140" placeholder="状态" aria-label="状态">
          <el-option label="全部状态" value="" />
          <el-option label="正常" value="1" />
          <el-option label="禁用" value="0" />
        </el-select>
        <button class="btn btn-ghost" @click="search">查询</button>
        <button class="btn btn-text" @click="resetFilters">重置</button>
      </div>

      <div v-if="loadError" class="alert" style="margin: 0 20px 16px">
        <span class="alert-main">用户列表加载失败</span>
        <button class="btn btn-ghost" @click="load()">重新加载</button>
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th><th>用户名</th><th>昵称</th><th>手机号</th><th>邮箱</th><th>角色</th><th>状态</th><th>注册时间</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td class="muted">{{ u.id }}</td>
              <td class="name">{{ u.username }}</td>
              <td>{{ u.nickname || '—' }}</td>
              <td class="muted">{{ u.phone || '—' }}</td>
              <td class="muted">{{ u.email || '—' }}</td>
              <td>
                <span class="tag" :class="u.role === 'admin' ? 'tag-bad' : 'tag-brand'">
                  {{ u.role === 'admin' ? '管理员' : '考生' }}
                </span>
              </td>
              <td>
                <span class="tag" :class="u.status ? 'tag-ok' : 'tag-bad'">{{ u.status ? '正常' : '禁用' }}</span>
              </td>
              <td class="muted">{{ String(u.created_at || '').replace('T', ' ').slice(0, 16) }}</td>
              <td class="cell-actions">
                <button
                  class="btn btn-xs"
                  :class="u.status ? 'btn-danger' : 'btn-ok'"
                  :disabled="u.id === SELF || toggling"
                  @click="toggleStatus(u)"
                >{{ u.status ? '禁用' : '启用' }}</button>
              </td>
            </tr>
            <tr v-if="!users.length && !loading" class="empty">
              <td colspan="9">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pager">
        <span>共 {{ total }} 条</span>
        <button class="btn btn-ghost" :disabled="query.page <= 1" @click="query.page--; load()">上一页</button>
        <span class="page-num">{{ query.page }} / {{ pages }}</span>
        <button class="btn btn-ghost" :disabled="query.page >= pages" @click="query.page++; load()">下一页</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.field-w140 { width: 140px; }
.name { font-weight: 500; white-space: nowrap; }
.cell-actions { white-space: nowrap; }
.btn-xs { padding: 6px 14px; font-size: 14px; }
.btn-ok {
  background: var(--card);
  border-color: rgba(18, 128, 92, 0.3);
  color: var(--green);
}
.btn-ok:hover:not(:disabled) { background: var(--green-soft); }
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
}
.pager {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  font-size: 14px;
  color: var(--text-2);
}
.page-num { color: var(--text); }
</style>
