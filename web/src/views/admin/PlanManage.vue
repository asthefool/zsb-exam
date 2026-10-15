<script setup>
// 复习计划管理（任务书 F8-5）：管理员查看与管理考生复习计划
// 统计卡 + 筛选 + 分页表格；抽屉查看计划任务明细，支持状态流转（归档/完结/恢复）与删除
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  adminPlanStats, adminListPlans, adminGetPlan, adminSetPlanStatus, adminDeletePlan
} from '../../api';

const STATUS_LABEL = { active: '执行中', archived: '已归档', finished: '已完成' };

const stats = reactive({ total: 0, active: 0, task_total: 0, task_done: 0 });
const list = ref([]);
const total = ref(0);
const loading = ref(false);
const loadError = ref(false);
const acting = ref(false);

const query = reactive({ page: 1, size: 10, keyword: '', kwInput: '', status: '' });
const pages = computed(() => Math.max(1, Math.ceil(total.value / query.size)));

const drawerVisible = ref(false);
const drawerLoading = ref(false);
const detail = ref(null);

function formatTime(v) {
  return v ? String(v).replace('T', ' ').slice(0, 16) : '—';
}
function formatDate(v) {
  return v ? String(v).slice(0, 10) : '—';
}

let listSeq = 0;
async function load() {
  const seq = ++listSeq;
  loading.value = true;
  loadError.value = false;
  try {
    const res = await adminListPlans({
      keyword: query.keyword || undefined,
      status: query.status || undefined,
      page: query.page,
      size: query.size
    });
    if (seq !== listSeq) return;
    list.value = (res && res.list) || [];
    total.value = (res && res.total) || 0;
  } catch (e) {
    if (seq !== listSeq) return;
    loadError.value = true;
    list.value = [];
    total.value = 0;
  } finally {
    if (seq === listSeq) loading.value = false;
  }
}

async function loadStats() {
  try {
    Object.assign(stats, (await adminPlanStats()) || {});
  } catch (e) { /* 统计失败不影响列表 */ }
}

function search() {
  query.keyword = query.kwInput.trim();
  query.page = 1;
  load();
}

async function openDetail(row) {
  drawerVisible.value = true;
  drawerLoading.value = true;
  detail.value = null;
  try {
    detail.value = await adminGetPlan(row.id);
  } catch (e) {
    /* 失败由全局拦截器提示 */
  } finally {
    drawerLoading.value = false;
  }
}

// 状态流转：置执行中会先归档该考生原执行中计划（后端保证同用户仅一个 active）
async function changeStatus(row) {
  const next = row.status === 'active' ? 'archived' : 'active';
  try {
    await ElMessageBox.confirm(
      next === 'archived'
        ? `归档考生「${row.nickname || row.username}」的复习计划？归档后考生端不再展示，可随时恢复。`
        : `将该计划恢复为执行中？该考生原有的执行中计划会自动归档。`,
      next === 'archived' ? '归档确认' : '恢复确认',
      { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }
    );
  } catch (e) { return; }
  acting.value = true;
  try {
    await adminSetPlanStatus(row.id, next);
    ElMessage.success(next === 'archived' ? '计划已归档' : '计划已恢复执行');
    load();
    loadStats();
  } catch (e) {
    /* 失败由全局拦截器提示 */
  } finally {
    acting.value = false;
  }
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm(
      `删除考生「${row.nickname || row.username}」的复习计划？其下 ${row.task_total} 条任务与打卡进度将一并删除。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    );
  } catch (e) { return; }
  acting.value = true;
  try {
    await adminDeletePlan(row.id);
    ElMessage.success('复习计划已删除');
    if (drawerVisible.value) drawerVisible.value = false;
    load();
    loadStats();
  } catch (e) {
    /* 失败由全局拦截器提示 */
  } finally {
    acting.value = false;
  }
}

onMounted(async () => {
  loadStats();
  await load();
});
</script>

<template>
  <div class="page-pad">
    <div class="page-head">
      <div>
        <h1>复习计划管理</h1>
        <p class="sub">查看与管理考生的复习计划与打卡任务。</p>
      </div>
    </div>

    <div class="stat-grid">
      <section class="panel stat-card">
        <div class="label">计划总数</div>
        <div class="value-row"><span class="value">{{ stats.total }}</span><span class="unit">个</span></div>
        <div class="note">含历史归档计划</div>
      </section>
      <section class="panel stat-card">
        <div class="label">执行中</div>
        <div class="value-row"><span class="value">{{ stats.active }}</span><span class="unit">个</span></div>
        <div class="note">考生当前执行的计划</div>
      </section>
      <section class="panel stat-card">
        <div class="label">任务总数</div>
        <div class="value-row"><span class="value">{{ stats.task_total }}</span><span class="unit">条</span></div>
        <div class="note">全部计划任务累计</div>
      </section>
      <section class="panel stat-card">
        <div class="label">已完成任务</div>
        <div class="value-row"><span class="value">{{ stats.task_done }}</span><span class="unit">条</span></div>
        <div class="note">打卡完成的任务</div>
      </section>
    </div>

    <section class="panel" v-loading="loading">
      <div class="toolbar">
        <input
          v-model="query.kwInput"
          class="field field-search"
          placeholder="按考生账号搜索"
          @keyup.enter="search"
        />
        <select v-model="query.status" class="field field-w140" aria-label="计划状态">
          <option value="">全部状态</option>
          <option value="active">执行中</option>
          <option value="archived">已归档</option>
          <option value="finished">已完成</option>
        </select>
        <button class="btn btn-ghost" @click="search">查询</button>
      </div>

      <div v-if="loadError" class="alert" style="margin: 0 20px 16px">
        <span class="alert-main">计划列表加载失败</span>
        <button class="btn btn-ghost" @click="load()">重新加载</button>
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th><th>考生</th><th>状态</th><th>考试日期</th><th>每日时长</th>
              <th>任务进度</th><th>创建时间</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in list" :key="p.id">
              <td class="muted">{{ p.id }}</td>
              <td class="name">{{ p.nickname || p.username }}</td>
              <td>
                <span class="tag" :class="p.status === 'active' ? 'tag-ok' : p.status === 'finished' ? 'tag-brand' : 'tag-muted'">
                  {{ STATUS_LABEL[p.status] || p.status }}
                </span>
              </td>
              <td>{{ formatDate(p.exam_date) }}</td>
              <td>{{ p.daily_minutes ? `${p.daily_minutes} 分钟` : '—' }}</td>
              <td>
                <div class="progress-cell">
                  <div class="progress">
                    <div class="fill" :style="{ width: `${p.progress.percent}%` }"></div>
                  </div>
                  <span class="muted text-xs">{{ p.progress.done }}/{{ p.progress.total }}</span>
                </div>
              </td>
              <td class="muted">{{ formatTime(p.created_at) }}</td>
              <td class="cell-actions">
                <button class="btn btn-ghost btn-xs" @click="openDetail(p)">查看任务</button>
                <button class="btn btn-ghost btn-xs" :disabled="acting" @click="changeStatus(p)">
                  {{ p.status === 'active' ? '归档' : '恢复执行' }}
                </button>
                <button class="btn btn-danger btn-xs" :disabled="acting" @click="onDelete(p)">删除</button>
              </td>
            </tr>
            <tr v-if="!list.length && !loading" class="empty">
              <td colspan="8">暂无数据</td>
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

    <!-- 计划任务明细 -->
    <el-drawer v-model="drawerVisible" :title="`复习计划 #${detail ? detail.id : ''}`" size="480px">
      <div v-loading="drawerLoading">
        <template v-if="detail">
          <dl class="info-list">
            <div class="info-row"><dt>考生</dt><dd>{{ detail.nickname || detail.username }}</dd></div>
            <div class="info-row"><dt>状态</dt><dd>{{ STATUS_LABEL[detail.status] || detail.status }}</dd></div>
            <div class="info-row"><dt>考试日期</dt><dd>{{ formatDate(detail.exam_date) }}</dd></div>
            <div class="info-row"><dt>每日时长</dt><dd>{{ detail.daily_minutes ? `${detail.daily_minutes} 分钟` : '—' }}</dd></div>
            <div class="info-row">
              <dt>任务进度</dt>
              <dd>{{ detail.progress.done }}/{{ detail.progress.total }}（{{ detail.progress.percent }}%）</dd>
            </div>
          </dl>

          <div class="divider-title"><span class="t">任务清单</span><span class="line"></span></div>
          <ul class="row-list task-list">
            <li v-for="t in detail.tasks" :key="t.id" class="task-item">
              <span class="tag" :class="t.status === 'done' ? 'tag-ok' : 'tag-muted'">
                {{ t.status === 'done' ? '已完成' : '待完成' }}
              </span>
              <div class="task-main">
                <div class="task-date">{{ formatDate(t.task_date) }}{{ t.time_slot ? `（${t.time_slot}）` : '' }}</div>
                <div class="task-content">{{ t.content }}</div>
              </div>
            </li>
            <li v-if="!detail.tasks.length" class="empty-tip">该计划暂无任务</li>
          </ul>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.field-search { width: 220px; }
.field-w140 { width: 140px; }
.name { font-weight: 500; white-space: nowrap; }
.cell-actions { white-space: nowrap; }
.btn-xs { padding: 6px 12px; font-size: 13px; }
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
}
.progress-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 140px;
}
.progress-cell .progress { flex: 1; }
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

.info-list { margin: 0; border-top: 1px solid var(--border); }
.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}
.info-row dt { color: var(--text-2); margin: 0; }
.info-row dd { margin: 0; }
.task-list { margin-top: 0; }
.task-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
}
.task-main { min-width: 0; }
.task-date { font-size: 12px; color: var(--text-2); }
.task-content { margin-top: 2px; font-size: 14px; line-height: 1.6; }
</style>
