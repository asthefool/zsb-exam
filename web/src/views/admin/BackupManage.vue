<script setup>
// 数据备份（任务书 F8-7）：管理员对系统数据进行备份与维护
// 一键备份（导出结构 + 数据 SQL 脚本）、备份下载、完整性校验、删除，附各表数据概览
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  adminBackupOverview, adminListBackups, adminCreateBackup,
  adminVerifyBackup, adminDeleteBackup
} from '../../api';
import { STORAGE_KEYS } from '../../constants.js';

const TABLE_LABEL = {
  users: '用户表',
  subjects: '科目字典',
  questions: '题库题目',
  answer_records: '答题记录',
  wrong_questions: '错题记录',
  review_plans: '复习计划',
  plan_tasks: '计划任务',
  ai_generations: 'AI 生成记录',
  system_settings: '系统设置'
};

const overview = reactive({
  tables: [], total_rows: 0, db_bytes: 0, backup_count: 0, backup_bytes: 0, backup_dir: 'server/backups'
});
const list = ref([]);
const total = ref(0);
const page = ref(1);
const size = 10;
const pages = ref(1);
const loading = ref(false);
const loadError = ref(false);
const creating = ref(false);
const actingId = ref(0);

function formatBytes(n) {
  const v = Number(n) || 0;
  if (v >= 1024 * 1024) return `${(v / 1024 / 1024).toFixed(1)} MB`;
  if (v >= 1024) return `${(v / 1024).toFixed(1)} KB`;
  return `${v} B`;
}
function formatTime(v) {
  return v ? String(v).replace('T', ' ').slice(0, 16) : '—';
}

async function loadOverview() {
  try {
    Object.assign(overview, (await adminBackupOverview()) || {});
  } catch (e) { /* 概览失败不影响备份列表 */ }
}

async function load() {
  loading.value = true;
  loadError.value = false;
  try {
    const res = await adminListBackups({ page: page.value, size });
    list.value = (res && res.list) || [];
    total.value = (res && res.total) || 0;
    pages.value = Math.max(1, Math.ceil(total.value / size));
  } catch (e) {
    loadError.value = true;
    list.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

async function onCreate() {
  if (creating.value) return;
  try {
    await ElMessageBox.confirm(
      '立即备份当前系统数据？将导出全部业务表的结构与数据为 SQL 脚本，可下载保存。',
      '备份确认',
      { type: 'warning', confirmButtonText: '开始备份', cancelButtonText: '取消' }
    );
  } catch (e) { return; }
  creating.value = true;
  try {
    const res = await adminCreateBackup();
    ElMessage.success(`备份完成：${res.filename}（${res.row_count} 行数据）`);
    await Promise.all([load(), loadOverview()]);
  } catch (e) {
    /* 失败由全局拦截器提示 */
  } finally {
    creating.value = false;
  }
}

// 下载走 fetch + Blob：接口带令牌鉴权，无法直接用浏览器地址栏下载
async function onDownload(row) {
  if (actingId.value) return;
  actingId.value = row.id;
  try {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    const base = import.meta.env.VITE_API_BASE || '/api';
    const resp = await fetch(`${base}/admin/backups/${row.id}/download`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(body.message || '下载失败');
    }
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = row.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    ElMessage.success('备份文件已开始下载');
  } catch (e) {
    ElMessage.error(e.message || '备份文件下载失败');
  } finally {
    actingId.value = 0;
  }
}

async function onVerify(row) {
  if (actingId.value) return;
  actingId.value = row.id;
  try {
    const res = await adminVerifyBackup(row.id);
    if (res.ok) ElMessage.success('完整性校验通过，文件与记录一致');
    else ElMessage.warning(res.message || '完整性校验未通过');
  } catch (e) {
    /* 失败由全局拦截器提示 */
  } finally {
    actingId.value = 0;
  }
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm(
      `删除备份文件「${row.filename}」？删除后不可恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    );
  } catch (e) { return; }
  actingId.value = row.id;
  try {
    await adminDeleteBackup(row.id);
    ElMessage.success('备份已删除');
    await Promise.all([load(), loadOverview()]);
  } catch (e) {
    /* 失败由全局拦截器提示 */
  } finally {
    actingId.value = 0;
  }
}

onMounted(async () => {
  await Promise.all([loadOverview(), load()]);
});
</script>

<template>
  <div class="page-pad">
    <div class="page-head">
      <div>
        <h1>数据备份</h1>
        <p class="sub">备份系统数据并维护备份文件，备份脚本可直接导入 MySQL 恢复。</p>
      </div>
      <button class="btn btn-primary" :disabled="creating" @click="onCreate">
        {{ creating ? '备份中…' : '立即备份' }}
      </button>
    </div>

    <div class="stat-grid">
      <section class="panel stat-card">
        <div class="label">业务数据表</div>
        <div class="value-row"><span class="value">{{ overview.tables.length }}</span><span class="unit">张</span></div>
        <div class="note">备份覆盖全部业务表</div>
      </section>
      <section class="panel stat-card">
        <div class="label">数据总行数</div>
        <div class="value-row"><span class="value">{{ overview.total_rows }}</span><span class="unit">行</span></div>
        <div class="note">当前库业务数据规模</div>
      </section>
      <section class="panel stat-card">
        <div class="label">数据库占用</div>
        <div class="value-row"><span class="value">{{ formatBytes(overview.db_bytes) }}</span></div>
        <div class="note">数据与索引合计</div>
      </section>
      <section class="panel stat-card">
        <div class="label">备份文件</div>
        <div class="value-row"><span class="value">{{ overview.backup_count }}</span><span class="unit">份</span></div>
        <div class="note">合计 {{ formatBytes(overview.backup_bytes) }}</div>
      </section>
    </div>

    <!-- 数据概览 -->
    <section class="panel">
      <div class="panel-head">
        <h2>数据概览</h2>
        <span class="extra">备份目录：{{ overview.backup_dir }}</span>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr><th>数据表</th><th>表名</th><th class="num">数据行数</th></tr>
          </thead>
          <tbody>
            <tr v-for="t in overview.tables" :key="t.table">
              <td>{{ TABLE_LABEL[t.table] || t.table }}</td>
              <td class="muted">{{ t.table }}</td>
              <td class="num">{{ t.rows }} 行</td>
            </tr>
            <tr v-if="!overview.tables.length" class="empty">
              <td colspan="3">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 备份记录 -->
    <section class="panel" v-loading="loading">
      <div class="panel-head">
        <h2>备份记录</h2>
      </div>

      <div v-if="loadError" class="alert" style="margin: 0 20px 16px">
        <span class="alert-main">备份记录加载失败</span>
        <button class="btn btn-ghost" @click="load()">重新加载</button>
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th><th>备份文件</th><th class="num">文件大小</th><th class="num">数据量</th>
              <th>创建人</th><th>创建时间</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in list" :key="b.id">
              <td class="muted">{{ b.id }}</td>
              <td class="name">{{ b.filename }}</td>
              <td class="num">{{ formatBytes(b.file_size) }}</td>
              <td class="num">{{ b.table_count }} 表 / {{ b.row_count }} 行</td>
              <td>{{ b.created_by_name || '—' }}</td>
              <td class="muted">{{ formatTime(b.created_at) }}</td>
              <td class="cell-actions">
                <button class="btn btn-ghost btn-xs" :disabled="actingId" @click="onDownload(b)">下载</button>
                <button class="btn btn-ghost btn-xs" :disabled="actingId" @click="onVerify(b)">校验</button>
                <button class="btn btn-danger btn-xs" :disabled="actingId" @click="onDelete(b)">删除</button>
              </td>
            </tr>
            <tr v-if="!list.length && !loading" class="empty">
              <td colspan="7">暂无备份，点击右上角「立即备份」生成</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pager">
        <span>共 {{ total }} 份</span>
        <button class="btn btn-ghost" :disabled="page <= 1" @click="page--; load()">上一页</button>
        <span class="page-num">{{ page }} / {{ pages }}</span>
        <button class="btn btn-ghost" :disabled="page >= pages" @click="page++; load()">下一页</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.name { font-weight: 500; }
.cell-actions { white-space: nowrap; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
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
