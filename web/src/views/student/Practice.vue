<script setup>
// 智能题库（对齐 UI 库 Bank.tsx 结构）：科目 Segmented + 进度列表 + 推荐练习，答题会话走真实判分
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getOverview, getSubjects, getQuestions, getWrongQuestions, submitAnswer } from '../../api';

const route = useRoute();
const router = useRouter();

const SESSION_SIZE = 10;
const Q_TYPES = [
  { value: 'single', label: '单选题' },
  { value: 'multiple', label: '多选题' },
  { value: 'judge', label: '判断题' }
];
const DIFFS = ['全部', '简单', '中等', '困难'];
const diffStyle = {
  简单: 'tag-ok',
  中等: 'tag-warn',
  困难: 'tag-bad',
  综合: 'tag-brand',
  随机: 'tag-muted'
};

const subjects = ref([]);
const subject = ref(null); // 当前科目（源码默认第一个）
const diff = ref('全部');

const typeStats = reactive({});   // q_type -> 题量
const chapterOf = reactive({});   // q_type -> 章节掌握度（来自 overview.mastery，当前科目）
const recWrongCount = ref(0);

const session = ref(null); // { title, subjectName, list, idx, results }
const loading = ref(false);
const error = ref(false);
const submitting = ref(false);

const current = computed(() => (session.value ? session.value.list[session.value.idx] : null));
const currentResult = computed(() => (session.value && current.value ? session.value.results[current.value.id] : null));
const answeredCount = computed(() => (session.value ? Object.keys(session.value.results).length : 0));

// 推荐练习条目（结构对齐源码 practiceSets 行）
const recItems = computed(() => {
  const items = [];
  if (recWrongCount.value) {
    items.push({ key: 'wrong', title: '错题回炉', diff: '综合', count: recWrongCount.value, min: 20, act: 'wrong' });
  }
  items.push(
    { key: 'easy', title: '简单练习', diff: '简单', count: SESSION_SIZE, min: 15, act: { difficulty: 1 } },
    { key: 'mid', title: '中等练习', diff: '中等', count: SESSION_SIZE, min: 20, act: { difficulty: 2 } },
    { key: 'hard', title: '困难练习', diff: '困难', count: SESSION_SIZE, min: 25, act: { difficulty: 3 } },
    { key: 'mix', title: '混合自测', diff: '随机', count: SESSION_SIZE, min: 20, act: {} }
  );
  return items;
});
const shownRec = computed(() => recItems.value.filter((p) => diff.value === '全部' || p.diff === diff.value));

async function loadStats() {
  const s = subject.value;
  await Promise.all(Q_TYPES.map(async (t) => {
    try {
      const d = await getQuestions({ subject_id: s ? s.id : undefined, q_type: t.value, page: 1, size: 1 });
      if (subject.value !== s) return;
      typeStats[t.value] = d.total || 0;
    } catch (e) {
      typeStats[t.value] = 0;
    }
  }));
  for (const k of Object.keys(chapterOf)) delete chapterOf[k];
  recWrongCount.value = 0;
  try {
    const ov = await getOverview();
    if (subject.value !== s) return;
    const row = (ov.mastery?.subjects || []).find((x) => s && x.subject_id === s.id);
    for (const c of row?.chapters || []) chapterOf[c.q_type] = c;
  } catch (e) { /* 掌握度加载失败不影响刷题 */ }
  try {
    const d = await getWrongQuestions({ subject_id: s ? s.id : undefined, mastered: 0, page: 1, size: 1 });
    if (subject.value !== s) return;
    recWrongCount.value = d.total || 0;
  } catch (e) { /* 无错题数据不影响刷题 */ }
}

// 章节掌握度：null 表示样本不足
function masteryOf(t) {
  return chapterOf[t]?.mastery ?? null;
}

function pickSubject(s) {
  subject.value = s;
  session.value = null;
  loadStats();
}

// ---- 答题会话 ----
async function startSession({ q_type = '', difficulty = 0, title = '' } = {}) {
  loading.value = true;
  error.value = false;
  session.value = null;
  try {
    const data = await getQuestions({
      subject_id: subject.value ? subject.value.id : undefined,
      q_type: q_type || undefined,
      page: 1, size: 20
    });
    let list = data.list || [];
    if (difficulty) list = list.filter((q) => Number(q.difficulty) === difficulty);
    list = list.slice(0, SESSION_SIZE);
    if (!list.length) {
      error.value = true;
      return;
    }
    session.value = {
      title: title || (q_type ? Q_TYPES.find((t) => t.value === q_type).label : '综合练习'),
      subjectName: subject.value ? subject.value.name : '综合',
      list, idx: 0, results: {}
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

function startRec(item) {
  if (item.act === 'wrong') {
    router.push({ path: '/wrong-book', query: subject.value ? { subject: subject.value.id } : {} });
    return;
  }
  startSession({ ...item.act, title: item.title });
}

async function onAnswer(payload) {
  if (submitting.value) return;
  submitting.value = true;
  try {
    session.value.results[payload.question_id] = await submitAnswer(payload);
  } finally {
    submitting.value = false;
  }
}

// ---- 会话内作答状态 ----
const picked = ref({}); // questionId -> key
function isPicked(key) {
  return current.value && picked.value[current.value.id] === key;
}
function isRight(key) {
  if (!currentResult.value) return false;
  const ca = String(currentResult.value.correct_answer ?? '').trim();
  if (current.value.q_type === 'judge') return ca.toLowerCase() === String(key).toLowerCase();
  return ca.toUpperCase().includes(String(key).toUpperCase());
}
function pick(key) {
  if (currentResult.value || !current.value) return;
  picked.value = { ...picked.value, [current.value.id]: key };
}
const pickedAnswer = computed(() => (current.value ? picked.value[current.value.id] : ''));
const answerText = computed(() => {
  if (!currentResult.value) return '';
  const ca = String(currentResult.value.correct_answer ?? '').trim();
  if (current.value.q_type === 'judge') {
    return ca.toLowerCase() === 'true' ? '正确（√）' : ca.toLowerCase() === 'false' ? '错误（×）' : ca;
  }
  return ca;
});
async function submitCurrent() {
  const key = pickedAnswer.value;
  if (!key || !current.value) return;
  await onAnswer({ question_id: current.value.id, user_answer: key });
}

function next() {
  if (session.value && session.value.idx < session.value.list.length - 1) session.value.idx += 1;
}
function prev() {
  if (session.value && session.value.idx > 0) session.value.idx -= 1;
}
function exitSession() {
  session.value = null;
}

onMounted(async () => {
  try {
    subjects.value = await getSubjects();
  } catch (e) { subjects.value = []; }
  const q = Number(route.query.subject);
  subject.value = subjects.value.find((s) => s.id === q) || subjects.value[0] || null;
  await loadStats();
});
</script>

<template>
  <div v-loading="loading" class="page-pad">
    <!-- 答题会话 -->
    <template v-if="session">
      <div class="page-head">
        <div>
          <h1>{{ session.title }}</h1>
          <p class="sub">已作答 {{ answeredCount }} / {{ session.list.length }}</p>
        </div>
        <div class="flex-between" style="gap: 16px">
          <button class="btn btn-ghost" @click="exitSession">退出练习</button>
        </div>
      </div>

      <section v-if="current" class="panel panel-pad q-panel">
        <div class="text-xs muted">第 {{ session.idx + 1 }} 题，{{ session.subjectName }}</div>
        <p class="q-text">{{ current.content }}</p>

        <!-- 选项（对齐源码 Exam 答题选项） -->
        <div class="opt-list">
          <button
            v-for="o in (current.q_type === 'judge'
              ? [{ key: 'true', text: '正确（√）' }, { key: 'false', text: '错误（×）' }]
              : parseOptions(current))"
            :key="o.key"
            class="opt"
            :disabled="!!currentResult"
            :class="{
              selected: !currentResult && isPicked(o.key),
              right: currentResult && isRight(o.key),
              wrong: currentResult && isPicked(o.key) && !isRight(o.key),
              dimmed: currentResult && !isRight(o.key) && !isPicked(o.key)
            }"
            @click="pick(o.key)"
          >
            <span class="key-circle">{{ o.key.length === 1 ? o.key : (o.key === 'true' ? '√' : '×') }}</span>
            <span class="opt-text">{{ o.text }}</span>
            <span v-if="currentResult && isRight(o.key)" class="verdict ok">正确</span>
            <span v-else-if="currentResult && isPicked(o.key)" class="verdict bad">错误</span>
          </button>
        </div>

        <div v-if="!currentResult" class="q-actions">
          <button class="btn btn-ghost" :disabled="session.idx === 0" @click="prev">上一题</button>
          <button
            class="btn btn-primary"
            :disabled="!pickedAnswer"
            @click="submitCurrent"
          >{{ session.idx < session.list.length - 1 ? '下一题' : '完成本轮' }}</button>
        </div>
        <template v-else>
          <div class="result-block" :class="currentResult.is_correct ? 'ok' : 'bad'">
            <div class="result-title">{{ currentResult.is_correct ? '✓ 回答正确' : '✕ 回答错误' }}</div>
            <div class="result-sub">正确答案：{{ answerText }}</div>
          </div>
          <p class="analysis">
            <span class="analysis-label">AI 解析</span>
            {{ currentResult.analysis || '暂无解析' }}
          </p>
          <div class="q-actions">
            <button class="btn btn-ghost" :disabled="session.idx === 0" @click="prev">上一题</button>
            <button v-if="session.idx < session.list.length - 1" class="btn btn-primary" @click="next">下一题</button>
            <button v-else class="btn btn-primary" @click="exitSession">完成本轮</button>
          </div>
        </template>
      </section>
    </template>

    <!-- 题库面板 -->
    <template v-else>
      <div class="page-head">
        <div>
          <h1>智能题库</h1>
          <p class="sub">按章节刷题，AI 会根据正确率自动推荐下一组练习。</p>
        </div>
        <button class="btn btn-primary" @click="router.push('/exam?smart=1')">智能组卷</button>
      </div>

      <div class="seg">
        <button
          v-for="s in subjects"
          :key="s.id"
          class="seg-item"
          :class="{ active: subject && subject.id === s.id }"
          @click="pickSubject(s)"
        >{{ s.name }}</button>
      </div>

      <div v-if="error" class="alert">
        <span class="alert-main">题目加载失败或当前筛选下暂无题目</span>
        <button class="btn btn-ghost" @click="error = false">重新加载</button>
      </div>

      <div class="grid-bank">
        <!-- 章节进度 -->
        <section class="panel">
          <div class="panel-head">
            <h2>章节进度</h2>
            <span class="extra">共 {{ Q_TYPES.reduce((a, t) => a + (typeStats[t.value] || 0), 0) }} 题</span>
          </div>
          <ul class="row-list">
            <li v-for="t in Q_TYPES" :key="t.value" class="chapter-row">
              <div class="chapter-main">
                <div class="chapter-name">{{ t.label }}</div>
                <div class="progress">
                  <div class="fill" :style="{ width: `${masteryOf(t.value) ?? 0}%` }"></div>
                </div>
                <div class="chapter-meta">
                  覆盖 {{ chapterOf[t.value]?.coverage ?? 0 }}%，已做 {{ chapterOf[t.value]?.answered ?? 0 }} / {{ typeStats[t.value] || 0 }} 题
                </div>
              </div>
              <div class="chapter-acc">
                <div v-if="masteryOf(t.value) !== null" class="acc-num" :class="{ bad: masteryOf(t.value) < 60 }">{{ masteryOf(t.value) }}%</div>
                <div v-else class="acc-need">再做 {{ chapterOf[t.value]?.need_more ?? 10 }} 题可评估</div>
                <div class="acc-label">掌握度</div>
              </div>
              <button
                class="btn btn-ghost"
                :disabled="!typeStats[t.value]"
                @click="startSession({ q_type: t.value, title: t.label })"
              >继续刷题</button>
            </li>
          </ul>
        </section>

        <!-- 推荐练习 -->
        <section class="panel align-start">
          <div class="panel-head">
            <h2>推荐练习</h2>
            <select v-model="diff" class="field select-sm" aria-label="难度">
              <option v-for="d in DIFFS" :key="d">{{ d }}</option>
            </select>
          </div>
          <ul v-if="shownRec.length" class="row-list">
            <li v-for="p in shownRec" :key="p.key" class="rec-row">
              <div class="rec-main">
                <div class="rec-title">{{ p.title }}</div>
                <div class="rec-meta">
                  <span class="tag" :class="diffStyle[p.diff]">{{ p.diff }}</span>
                  <span>{{ p.count }} 题</span>
                  <span>约 {{ p.min }} 分钟</span>
                </div>
              </div>
              <button class="btn btn-ghost" @click="startRec(p)">开始</button>
            </li>
          </ul>
          <div v-else class="empty-tip">该难度下暂无推荐练习</div>
        </section>
      </div>
    </template>
  </div>
</template>

<script>
// 选项解析（模板中引用）
function parseOptions(q) {
  if (!q || !q.options) return [];
  let list = q.options;
  if (typeof list === 'string') {
    try { list = JSON.parse(list); } catch { list = []; }
  }
  if (!Array.isArray(list)) return [];
  return list.map((x, i) => ({
    key: (x && x.key) || 'ABCD'[i],
    text: typeof x === 'string' ? x : (x && x.text) || ''
  }));
}
export default { methods: { parseOptions } };
</script>

<style scoped>
.grid-bank {
  display: grid;
  gap: 24px;
  grid-template-columns: 1fr;
}
@media (min-width: 1280px) {
  .grid-bank { grid-template-columns: 1.3fr 1fr; }
}
.align-start { align-self: start; }

/* 章节行 */
.chapter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 24px;
  padding: 16px 20px;
}
.chapter-main { min-width: 160px; flex: 1; }
.chapter-name { font-size: 14px; font-weight: 500; }
.chapter-main .progress { margin-top: 8px; }
.chapter-meta { margin-top: 6px; font-size: 12px; color: var(--text-2); }
.chapter-acc { width: 64px; text-align: right; }
.acc-num { font-size: 18px; font-weight: 700; }
.acc-num.bad { color: var(--red); }
.acc-label { font-size: 12px; color: var(--text-2); }
.acc-need { font-size: 12px; color: var(--text-2); }

/* 推荐行 */
.rec-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
}
.rec-main { min-width: 0; flex: 1; }
.rec-title { font-size: 14px; font-weight: 500; }
.rec-meta {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-2);
}
.select-sm {
  width: auto;
  padding: 4px 8px;
  font-size: 14px;
}

/* 答题会话 */
.q-panel { padding: 24px; }
.q-text {
  margin-top: 12px;
  font-size: 18px;
  line-height: 1.625;
}
.opt-list {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.opt-text { flex: 1; }
.q-actions {
  margin-top: 24px;
  display: flex;
  justify-content: space-between;
}
.result-block {
  margin-top: 16px;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
}
.result-block.ok { background: var(--green-soft); color: var(--green); }
.result-block.bad { background: var(--red-soft); color: var(--red); }
.result-title { font-weight: 500; }
.result-sub { margin-top: 2px; font-size: 12px; opacity: 0.8; }
.analysis {
  margin-top: 12px;
  border-radius: 8px;
  background: var(--bg);
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.625;
  color: var(--text-2);
}
.analysis-label {
  margin-right: 8px;
  font-weight: 500;
  color: var(--primary);
}
</style>
