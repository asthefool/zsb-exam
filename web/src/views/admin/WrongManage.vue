<script setup>
// 错题管理（任务书 F8-4）：管理员查看与管理考生错题数据
// 顶部统计卡 + 关键词/科目/掌握状态筛选 + 分页表格；支持代标掌握状态与删除错题记录
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminWrongStats, adminListWrong, adminSetWrongMastered, adminDeleteWrong, getSubjects } from '../../api';
import { Q_TYPE_LABEL } from '../../constants.js';

const typeName = Q_TYPE_LABEL;

const stats = reactive({ total: 0, unmastered: 0, user_total: 0, today_wrong: 0 });
const subjects = ref([]);
const list = ref([]);
const total = ref(0);
const loading = ref(false);
const loadError = ref(false);
const acting = ref(false);

const query = reactive({ page: 1, size: 10, keyword: '', kwInput: '', subject_id: '', mastered: '' });
const pages = computed(() => Math.max(1, Math.ceil(total.value / query.size)));

function brief(text, n = 36) {
  const s = String(text || '');
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

function formatTime(v) {
  return v ? String(v).replace('T', ' ').slice(0, 16) : '—';
}

let listSeq = 0;
async function load() {
  const seq = ++listSeq;
  loading.value = true;
  loadError.value = false;
  try {
    const res = await adminListWrong({
      keyword: query.keyword || undefined,
      subject_id: query.subject_id || undefined,
      mastered: query.mastered === '' ? undefined : query.mastered,
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
    Object.assign(stats, (await adminWrongStats()) || {});
  } catch (e) { /* 统计失败不影响列表 */ }
}

function search() {
  query.keyword = query.kwInput.trim();
  query.page = 1;
  load();
}

function resetFilters() {
  query.kwInput = '';
  query.keyword = '';
  query.subject_id = '';
  query.mastered = '';
  query.page = 1;
  load();
}

async function toggleMastered(row) {
  if (acting.value) return;
  const next = row.mastered ? 0 : 1;
  acting.value = true;
  try {
    await adminSetWrongMastered(row.id, next);
    row.mastered = next;
    ElMessage.success(next ? '已标记为已掌握' : '已标记为未掌握');
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
      `删除考生「${row.nickname || row.username}」的这条错题记录？历史作答记录保留，考生错题本中不再显示该条。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    );
  } catch (e) { return; }
  acting.value = true;
  try {
    await adminDeleteWrong(row.id);
    ElMessage.success('错题记录已删除');
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
  try {
    subjects.value = await getSubjects();
  } catch (e) { subjects.value = []; }
  await load();
});
</script>

<template>
  <div class="page-pad">
    <div class="page-head">
      <div>
        <h1>错题管理</h1>
        <p class="sub">查看与管理考生的错题数据，支持按考生、科目与掌握状态筛选。</p>
      </div>
    </div>

    <div class="stat-grid">
      <section class="panel stat-card">
        <div class="label">错题总数</div>
        <div class="value-row"><span class="value">{{ stats.total }}</span><span class="unit">条</span></div>
        <div class="note">全部考生累计错题</div>
      </section>
      <section class="panel stat-card">
        <div class="label">未掌握</div>
        <div class="value-row"><span class="value">{{ stats.unmastered }}</span><span class="unit">条</span></div>
        <div class="note">仍需重点复习</div>
      </section>
      <section class="panel stat-card">
        <div class="label">涉及考生</div>
        <div class="value-row"><span class="value">{{ stats.user_total }}</span><span class="unit">人</span></div>
        <div class="note">有错题记录的考生数</div>
      </section>
      <section class="panel stat-card">
        <div class="label">今日新增</div>
        <div class="value-row"><span class="value">{{ stats.today_wrong }}</span><span class="unit">条</span></div>
        <div class="note">今天产生的错题</div>
      </section>
    </div>

    <section class="panel" v-loading="loading">
      <div class="toolbar">
        <input
          v-model="query.kwInput"
          class="field field-search"
          placeholder="按考生账号或题干搜索"
          @keyup.enter="search"
        />
        <select v-model="query.subject_id" class="field field-w140" aria-label="科目">
          <option value="">全部科目</option>
          <option v-for="s in subjects" :key="s.id" :value="String(s.id)">{{ s.name }}</option>
        </select>
        <select v-model="query.mastered" class="field field-w140" aria-label="掌握状态">
          <option value="">全部状态</option>
          <option value="0">未掌握</option>
          <option value="1">已掌握</option>
        </select>
        <button class="btn btn-ghost" @click="search">查询</button>
        <button class="btn btn-text" @click="resetFilters">重置</button>
      </div>

      <div v-if="loadError" class="alert" style="margin: 0 20px 16px">
        <span class="alert-main">错题列表加载失败</span>
        <button class="btn btn-ghost" @click="load()">重新加载</button>
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th><th>考生</th><th>题目</th><th>科目</th><th>题型</th>
              <th>错误次数</th><th>最近错题时间</th><th>状态</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="w in list" :key="w.id">
              <td class="muted">{{ w.id }}</td>
              <td class="name">{{ w.nickname || w.username }}</td>
              <td class="cell-content" :title="w.content">{{ brief(w.content) }}</td>
              <td>{{ w.subject_name || '—' }}</td>
              <td><span class="tag tag-muted">{{ typeName[w.q_type] || w.q_type }}</span></td>
              <td>{{ w.wrong_count }} 次</td>
              <td class="muted">{{ formatTime(w.last_wrong_at) }}</td>
              <td>
                <span class="tag" :class="w.mastered ? 'tag-ok' : 'tag-warn'">
                  {{ w.mastered ? '已掌握' : '未掌握' }}
                </span>
              </td>
              <td class="cell-actions">
                <button class="btn btn-ghost btn-xs" :disabled="acting" @click="toggleMastered(w)">
                  {{ w.mastered ? '标为未掌握' : '标为已掌握' }}
                </button>
                <button class="btn btn-danger btn-xs" :disabled="acting" @click="onDelete(w)">删除</button>
              </td>
            </tr>
            <tr v-if="!list.length && !loading" class="empty">
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
.field-search { width: 240px; }
.field-w140 { width: 140px; }
.name { font-weight: 500; white-space: nowrap; }
.cell-content { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cell-actions { white-space: nowrap; }
.btn-xs { padding: 6px 14px; font-size: 14px; }
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
