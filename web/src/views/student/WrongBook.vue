<script setup>
// 错题本（对齐 UI 库 Mistakes.tsx 结构）：统计卡 + 筛选面板 + 错题卡片 + 详情抽屉（重练/AI 讲解）
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getSubjects, getWrongQuestions, getWrongDetail, repracticeWrong, markMastered } from '../../api';
import QuestionCard from '../../components/QuestionCard.vue';
import ExplainPanel from '../../components/ExplainPanel.vue';

const route = useRoute();
const router = useRouter();

const STATUS_TABS = ['未掌握', '已掌握', '全部'];
const typeName = { single: '单选', multiple: '多选', judge: '判断' };

const subjects = ref([]);
const list = ref([]);
const total = ref(0);
const loading = ref(false);
const loadingMore = ref(false);
const filter = reactive({ subject_id: '', mastered: '0', page: 1 });

const stats = reactive({ total: 0, unmastered: 0, mastered: 0 });

const drawer = ref(false);
const detail = ref(null);
const detailLoading = ref(false);
const repracticeResult = ref(null);
const repracticing = ref(false);

function statusLabel(v) {
  return STATUS_TABS.find((t) => (t === '未掌握' && v === '0') || (t === '已掌握' && v === '1') || (t === '全部' && v === ''));
}

function setStatus(t) {
  filter.mastered = t === '未掌握' ? '0' : t === '已掌握' ? '1' : '';
  onFilterChange();
}

async function loadStats() {
  try {
    const [all, un, done] = await Promise.all([
      getWrongQuestions({ page: 1, size: 1 }),
      getWrongQuestions({ mastered: 0, page: 1, size: 1 }),
      getWrongQuestions({ mastered: 1, page: 1, size: 1 })
    ]);
    stats.total = all.total || 0;
    stats.unmastered = un.total || 0;
    stats.mastered = done.total || 0;
  } catch (e) { /* 统计失败不影响列表 */ }
}

let listSeq = 0;
async function load({ append = false } = {}) {
  const seq = ++listSeq;
  if (append) loadingMore.value = true;
  else loading.value = true;
  try {
    // 手机端刷新时重新拉取已加载的全部页，避免列表被截成当前页
    const mobileRefresh = !append && window.matchMedia('(max-width: 767px)').matches;
    const pageNums = mobileRefresh
      ? Array.from({ length: filter.page }, (_, i) => i + 1)
      : [filter.page];
    const results = await Promise.all(pageNums.map((page) => getWrongQuestions({
      subject_id: filter.subject_id || undefined,
      mastered: filter.mastered === '' ? undefined : filter.mastered,
      page, size: 10
    })));
    if (seq !== listSeq) return;
    const rows = results.flatMap((r) => r.list);
    list.value = append ? [...list.value, ...rows] : rows;
    total.value = results[0].total;
    if (!append) loadStats();
  } finally {
    if (seq === listSeq) {
      loading.value = false;
      loadingMore.value = false;
    }
  }
}

// 手机端「加载更多」：追加下一页，已加载的列表保留
function loadMore() {
  filter.page += 1;
  load({ append: true });
}

function onFilterChange() {
  filter.page = 1;
  load();
}

function pickSubject(id) {
  filter.subject_id = id;
  onFilterChange();
}

async function openDetail(row) {
  repracticeResult.value = null;
  detail.value = null;
  drawer.value = true;
  detailLoading.value = true;
  try {
    detail.value = await getWrongDetail(row.id);
  } finally {
    detailLoading.value = false;
  }
}

async function onRepractice(payload) {
  if (repracticing.value) return;
  repracticing.value = true;
  try {
    const r = await repracticeWrong(detail.value.id, { user_answer: payload.user_answer });
    repracticeResult.value = r;
    if (r.is_correct) {
      if (r.masteredSynced === false) {
        ElMessage.warning('已作答正确，但掌握标记同步失败，请手动标记掌握');
        detail.value.mastered = 0;
      } else {
        ElMessage.success('回答正确，本题已自动标记为已掌握');
        detail.value.mastered = 1;
      }
    } else {
      detail.value.wrong_count = (detail.value.wrong_count || 0) + 1;
      ElMessage.warning('回答错误，错误次数已累加，建议查看 AI 讲解');
    }
    load();
  } finally {
    repracticing.value = false;
  }
}

const toggling = ref(false);
async function toggleMastered(row) {
  if (toggling.value) return;
  toggling.value = true;
  try {
    const target = row ? 1 - row.mastered : 1;
    try {
      await ElMessageBox.confirm(target ? '确认标记为已掌握？标记后默认列表不再显示' : '确认取消掌握标记？', target ? '标记掌握' : '取消掌握', {
        confirmButtonText: '确认', cancelButtonText: '取消'
      });
    } catch {
      return;
    }
    const id = row ? row.id : detail.value.id;
    await markMastered(id, target);
    ElMessage.success('操作成功');
    if (!row) detail.value.mastered = target;
    load();
  } catch (e) {
    /* 请求失败由全局拦截器提示 */
  } finally {
    toggling.value = false;
  }
}

function goPractice(row) {
  const sid = row && row.subject_id !== undefined ? row.subject_id : detail.value?.question?.subject_id;
  router.push({ path: '/practice', query: sid ? { subject: sid } : {} });
}

const pages = computed(() => Math.max(1, Math.ceil(total.value / 10)));

onMounted(async () => {
  try {
    subjects.value = await getSubjects();
  } catch (e) { subjects.value = []; }
  const q = Number(route.query.subject);
  if (q && subjects.value.some((s) => s.id === q)) filter.subject_id = q;
  await load();
});
</script>

<template>
  <div v-loading="loading" class="page-pad">
    <div class="page-head">
      <div>
        <h1>错题本</h1>
        <p class="sub">每道错题都会按遗忘曲线安排回炉，连续答对即可标记掌握。</p>
      </div>
    </div>

    <!-- 统计卡 -->
    <div class="stat-grid three">
      <div class="panel stat-card">
        <div class="label">错题总数</div>
        <div class="value-row">
          <span class="value">{{ stats.total }}</span>
          <span class="unit">道</span>
        </div>
        <div class="note">自动收录，无需手动整理</div>
      </div>
      <div class="panel stat-card">
        <div class="label">待掌握</div>
        <div class="value-row">
          <span class="value">{{ stats.unmastered }}</span>
          <span class="unit">道</span>
        </div>
        <div class="note">建议今日回炉 {{ Math.min(3, stats.unmastered) }} 道</div>
      </div>
      <div class="panel stat-card">
        <div class="label">掌握率</div>
        <div class="value-row">
          <span class="value">{{ stats.total ? Math.round((stats.mastered / stats.total) * 100) : 0 }}</span>
          <span class="unit">%</span>
        </div>
        <div class="note">{{ stats.mastered ? `已掌握 ${stats.mastered} 道` : '从第一道错题开始吧' }}</div>
      </div>
    </div>

    <!-- 筛选 -->
    <div class="panel filter-panel">
      <div class="seg">
        <button
          v-for="t in STATUS_TABS"
          :key="t"
          class="seg-item"
          :class="{ active: statusLabel(filter.mastered) === t }"
          @click="setStatus(t)"
        >{{ t }}</button>
      </div>
      <div class="chip-row">
        <button class="chip" :class="{ active: filter.subject_id === '' }" @click="pickSubject('')">全部科目</button>
        <button
          v-for="s in subjects"
          :key="s.id"
          class="chip"
          :class="{ active: filter.subject_id === s.id }"
          @click="pickSubject(s.id)"
        >{{ s.name }}</button>
      </div>
    </div>

    <!-- 列表 -->
    <ul v-if="list.length" class="list">
      <li v-for="row in list" :key="row.id" class="panel item">
        <div class="tag-row">
          <span class="tag tag-brand">{{ row.subject_name || '未知科目' }}</span>
          <span class="tag tag-muted">{{ typeName[row.q_type] || row.q_type }}</span>
          <span class="tag tag-bad">错 {{ row.wrong_count }} 次</span>
          <span class="tag" :class="row.mastered ? 'tag-ok' : 'tag-warn'">{{ row.mastered ? '已掌握' : '未掌握' }}</span>
        </div>
        <p class="stem">{{ row.content }}</p>
        <div class="acts">
          <button class="btn btn-primary" @click="openDetail(row)">查看 / AI 讲解</button>
          <button class="btn btn-ghost" @click="goPractice(row)">相似题推荐</button>
          <button class="btn btn-ghost" :disabled="toggling" @click="toggleMastered(row)">
            {{ row.mastered ? '取消掌握' : '标记掌握' }}
          </button>
        </div>
      </li>
    </ul>
    <div v-else-if="!loading" class="panel empty-tip">当前筛选下暂无错题</div>

    <!-- 手机端：加载更多 -->
    <div v-if="total > 10" class="m-more">
      <span class="text-sm muted">已显示 {{ list.length }} / {{ total }} 条</span>
      <button
        v-if="list.length < total"
        class="btn btn-ghost m-more-btn"
        :disabled="loadingMore"
        @click="loadMore"
      >{{ loadingMore ? '加载中…' : '加载更多' }}</button>
      <span v-else class="text-sm muted">已全部显示</span>
    </div>

    <!-- 分页（桌面端） -->
    <div v-if="total > 10" class="pager">
      <span class="text-sm muted">共 {{ total }} 条</span>
      <button class="btn btn-ghost" :disabled="filter.page <= 1" @click="filter.page--; load()">上一页</button>
      <span class="text-sm">{{ filter.page }} / {{ pages }}</span>
      <button class="btn btn-ghost" :disabled="filter.page >= pages" @click="filter.page++; load()">下一页</button>
    </div>

    <!-- 详情抽屉 -->
    <el-drawer v-model="drawer" title="错题详情" size="min(560px, 100%)">
      <div v-loading="detailLoading">
        <template v-if="detail">
          <div class="tag-row">
            <span class="tag tag-brand">{{ detail.question?.subject_name || detail.question?.subject_id }}</span>
            <span class="tag tag-bad">错 {{ detail.wrong_count }} 次</span>
            <span class="tag" :class="detail.mastered ? 'tag-ok' : 'tag-warn'">{{ detail.mastered ? '已掌握' : '未掌握' }}</span>
          </div>
          <p class="drawer-stem">{{ detail.question?.content }}</p>

          <QuestionCard
            :key="`q-${detail.question_id}-${repracticeResult ? 'r' : 'p'}`"
            :question="{ id: detail.question_id, ...detail.question }"
            :result="repracticeResult"
            @submit="onRepractice"
          />

          <div class="divider-title">
            <span class="t">AI 错题讲解</span>
            <span class="line"></span>
          </div>
          <ExplainPanel :key="`exp-${detail.id}`" :wrong-question-id="detail.id" />
        </template>
      </div>
      <template v-if="detail" #footer>
        <button class="btn btn-ghost" :disabled="toggling" @click="toggleMastered(null)">
          {{ detail.mastered ? '取消掌握' : '标记已掌握' }}
        </button>
        <button class="btn btn-ghost" @click="goPractice(null)">相似题推荐</button>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.stat-grid.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
@media (max-width: 767px) {
  .stat-grid.three {
    gap: 0;
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--card);
  }
  .stat-grid.three .stat-card {
    border: none;
    border-radius: 0;
    background: transparent;
    padding: 14px 10px;
  }
  .stat-grid.three .stat-card + .stat-card { border-left: 1px solid var(--border); }
  .stat-grid.three .value { font-size: 22px; }
  .stat-grid.three .note { font-size: 11px; line-height: 1.4; }
}
.filter-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}
.chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
@media (max-width: 767px) {
  /* 手机端筛选区吸顶：全宽铺满，科目单行横向滑动，避免吸顶区过高 */
  .filter-panel {
    position: sticky;
    top: 0;
    z-index: 20;
    gap: 10px;
    margin-left: -14px;
    margin-right: -14px;
    padding: 12px 14px;
    border-radius: 0;
    border-width: 0 0 1px;
    background: var(--card);
  }
  .filter-panel .seg {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    width: 100%;
    border-radius: 10px;
  }
  .filter-panel .seg-item {
    width: 100%;
    height: 34px;
    padding: 0;
    text-align: center;
  }
  .chip-row {
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
    margin: 0 -14px;
    padding: 0 14px;
  }
  .chip-row::-webkit-scrollbar { display: none; }
  .chip-row > * { flex-shrink: 0; }
  .chip { height: 32px; padding: 0 14px; }

  .list .item { padding: 16px; }
  .list .item .acts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    margin-top: 14px;
  }
  .list .item .acts > .btn { width: 100%; min-height: 40px; }
  .list .item .acts > .btn:first-child { grid-column: 1 / -1; }
}
.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.item { padding: 20px; }
.tag-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 12px; }
.stem {
  margin-top: 12px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.625;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.acts { margin-top: 16px; display: flex; flex-wrap: wrap; gap: 8px; }
.pager {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  font-size: 14px;
  color: var(--text-2);
}
.m-more { display: none; }
@media (max-width: 767px) {
  .pager { display: none; }
  .m-more {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 8px 0 4px;
  }
  .m-more-btn { width: 100%; min-height: 44px; }
}
.drawer-stem {
  margin-top: 16px;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.75;
}
</style>
