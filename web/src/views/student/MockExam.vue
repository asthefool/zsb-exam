<script setup>
// 模拟考场（对齐 UI 库 Exam.tsx 结构）：试卷列表 → 计时答题（答题卡）→ 成绩单逐题解析
// 题目从真实题库抽取，交卷逐题判分并归集错题
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getSubjects, getQuestions, submitAnswer } from '../../api';

const route = useRoute();
const router = useRouter();

// 试卷预设：题量/限时/满分为组卷参数
const papers = [
  { id: 'mock-1', kind: '模拟卷', title: '2027 专升本全真模拟卷（一）', subject: '综合', count: 5, min: 30, full: 150 },
  { id: 'real-2025', kind: '历年真题', title: '2025 年统考真题', subject: '综合', count: 5, min: 30, full: 150 },
  { id: 'real-2024', kind: '历年真题', title: '2024 年统考真题', subject: '综合', count: 5, min: 30, full: 150 },
  { id: 'spec-math', kind: '专项卷', title: '高等数学阶段测验（极限与导数）', subject: '高等数学', count: 5, min: 30, full: 150 }
];
const smartPaper = { id: 'smart', kind: '模拟卷', title: '智能组卷（综合自测）', subject: '综合', count: 5, min: 30, full: 150 };

const subjects = ref([]);
const lastScores = reactive({}); // paperId -> { score, full }

const exam = ref(null); // { paper, questions, answers, results, idx, left, elapsed }
const mode = computed(() => (exam.value ? (exam.value.results ? 'result' : 'doing') : 'list'));

const loading = ref(false);
let timer = null;

const current = computed(() => (exam.value ? exam.value.questions[exam.value.idx] : null));
const answeredCount = computed(() => (exam.value ? Object.keys(exam.value.answers).filter((k) => exam.value.answers[k]).length : 0));
const timeText = computed(() => {
  if (!exam.value) return '';
  const s = Math.max(0, exam.value.left);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
});
const urgent = computed(() => exam.value && exam.value.left < 300);

function fmt(s) {
  return `${Math.floor(s / 60)} 分 ${s % 60} 秒`;
}

// 判分结果统计
const scoreInfo = computed(() => {
  if (!exam.value || !exam.value.results) return null;
  const total = exam.value.questions.length;
  const right = Object.values(exam.value.results).filter((r) => r.is_correct).length;
  return {
    total, right,
    score: total ? Math.round((right / total) * exam.value.paper.full) : 0,
    full: exam.value.paper.full
  };
});

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
function optionText(q, key) {
  const k = String(key ?? '').trim();
  if (q.q_type === 'judge') return k.toLowerCase() === 'true' ? '正确（√）' : '错误（×）';
  return parseOptions(q).filter((o) => k.toUpperCase().includes(o.key)).map((o) => o.text).join('、') || k;
}
function userAnswerText(q, key) {
  return key ? optionText(q, key) : '未作答';
}

// ---- 开始考试 ----
async function startExam(paper) {
  loading.value = true;
  try {
    const subj = subjects.value.find((s) => s.name === paper.subject);
    const data = await getQuestions({ subject_id: subj ? subj.id : undefined, page: 1, size: paper.count });
    const questions = (data.list || []).slice(0, paper.count);
    if (!questions.length) {
      ElMessage.warning('题库暂无可用题目，无法开始考试');
      return;
    }
    exam.value = {
      paper: { ...paper, count: questions.length },
      questions,
      answers: {},
      results: null,
      idx: 0,
      left: paper.min * 60,
      elapsed: 0
    };
    startTimer();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) {
    /* 拦截器已提示 */
  } finally {
    loading.value = false;
  }
}

function startTimer() {
  stopTimer();
  timer = setInterval(() => {
    if (!exam.value) return stopTimer();
    exam.value.left -= 1;
    exam.value.elapsed += 1;
    if (exam.value.left <= 0) {
      stopTimer();
      ElMessage.warning('考试时间到，已自动交卷');
      doSubmit();
    }
  }, 1000);
}
function stopTimer() {
  if (timer) { clearInterval(timer); timer = null; }
}
onUnmounted(stopTimer);

function pick(key) {
  if (!exam.value || exam.value.results) return;
  exam.value.answers = { ...exam.value.answers, [current.value.id]: key };
}
function goto(i) {
  if (exam.value && i >= 0 && i < exam.value.questions.length) exam.value.idx = i;
}

async function askSubmit() {
  if (!exam.value) return;
  const unanswered = exam.value.questions.length - answeredCount.value;
  if (unanswered > 0) {
    try {
      await ElMessageBox.confirm(`还有 ${unanswered} 题未作答，未作答按错误计入。确认交卷？`, '交卷', {
        type: 'warning', confirmButtonText: '确认交卷', cancelButtonText: '继续答题'
      });
    } catch (e) { return; }
  }
  doSubmit();
}

// 交卷：逐题真实判分（未作答按错误计入并归集错题，同时给出正确答案与解析）
async function doSubmit() {
  if (!exam.value || exam.value.results) return;
  loading.value = true;
  stopTimer();
  try {
    const results = {};
    for (const q of exam.value.questions) {
      try {
        results[q.id] = await submitAnswer({
          question_id: q.id,
          user_answer: exam.value.answers[q.id] || '未作答'
        });
      } catch (e) {
        results[q.id] = { is_correct: false, correct_answer: '—', analysis: '' };
      }
    }
    exam.value.results = results;
    const right = Object.values(results).filter((r) => r.is_correct).length;
    const score = exam.value.questions.length
      ? Math.round((right / exam.value.questions.length) * exam.value.paper.full) : 0;
    lastScores[exam.value.paper.id] = { score, full: exam.value.paper.full };
    localStorage.setItem(`exam_last_${exam.value.paper.id}`, JSON.stringify(lastScores[exam.value.paper.id]));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } finally {
    loading.value = false;
  }
}

function backToList() {
  stopTimer();
  exam.value = null;
}

onMounted(async () => {
  try {
    subjects.value = await getSubjects();
  } catch (e) { subjects.value = []; }
  for (const p of [smartPaper, ...papers]) {
    try {
      const raw = localStorage.getItem(`exam_last_${p.id}`);
      if (raw) lastScores[p.id] = JSON.parse(raw);
    } catch (e) { /* 忽略坏缓存 */ }
  }
  if (route.query.smart === '1') startExam(smartPaper);
});
</script>

<template>
  <div v-loading="loading" class="page-pad">
    <!-- ===== 答题中 ===== -->
    <template v-if="mode === 'doing'">
      <div class="page-head">
        <div>
          <h1>{{ exam.paper.title }}</h1>
          <p class="sub">已作答 {{ answeredCount }} / {{ exam.questions.length }}</p>
        </div>
        <div class="exam-actions">
          <div class="timer" :class="{ urgent }">{{ timeText }}</div>
          <button class="btn btn-primary" @click="askSubmit">交卷</button>
        </div>
      </div>

      <div class="grid-exam">
        <section class="panel q-panel">
          <div class="text-xs muted">第 {{ exam.idx + 1 }} 题，{{ current.subject_name || current.subject_id || '综合' }}</div>
          <p class="q-text">{{ current.content }}</p>
          <div class="opt-list">
            <button
              v-for="o in (current.q_type === 'judge'
                ? [{ key: 'true', text: '正确（√）' }, { key: 'false', text: '错误（×）' }]
                : parseOptions(current))"
              :key="o.key"
              class="opt"
              :class="{ selected: exam.answers[current.id] === o.key }"
              @click="pick(o.key)"
            >
              <span class="key-circle">{{ o.key.length === 1 ? o.key : (o.key === 'true' ? '√' : '×') }}</span>
              {{ o.text }}
            </button>
          </div>
          <div class="q-actions">
            <button class="btn btn-ghost" :disabled="exam.idx === 0" @click="goto(exam.idx - 1)">上一题</button>
            <button v-if="exam.idx < exam.questions.length - 1" class="btn btn-primary" @click="goto(exam.idx + 1)">下一题</button>
            <button v-else class="btn btn-primary" @click="askSubmit">完成并交卷</button>
          </div>
        </section>

        <aside class="panel panel-pad align-start">
          <div class="ans-title">答题卡</div>
          <div class="ans-grid">
            <button
              v-for="(q, i) in exam.questions"
              :key="q.id"
              class="ans-item"
              :class="{ current: i === exam.idx, done: !!exam.answers[q.id] }"
              @click="goto(i)"
            >{{ i + 1 }}</button>
          </div>
          <div class="ans-legend">
            <span class="legend-item"><i class="dot done"></i>已答</span>
            <span class="legend-item"><i class="dot"></i>未答</span>
          </div>
        </aside>
      </div>
    </template>

    <!-- ===== 成绩单 ===== -->
    <template v-else-if="mode === 'result'">
      <div class="page-head">
        <div>
          <h1>成绩单</h1>
          <p class="sub">{{ exam.paper.title }}</p>
        </div>
        <button class="btn btn-ghost" @click="backToList">返回考场</button>
      </div>

      <div class="stat-grid three">
        <div class="panel stat-card">
          <div class="label">得分</div>
          <div class="value-row">
            <span class="value text-brand">{{ scoreInfo.score }}</span>
            <span class="unit">/ {{ scoreInfo.full }}</span>
          </div>
        </div>
        <div class="panel stat-card">
          <div class="label">答对题数</div>
          <div class="value-row">
            <span class="value">{{ scoreInfo.right }}</span>
            <span class="unit">/ {{ scoreInfo.total }}</span>
          </div>
        </div>
        <div class="panel stat-card">
          <div class="label">用时</div>
          <div class="value-row">
            <span class="value">{{ fmt(exam.elapsed) }}</span>
          </div>
        </div>
      </div>

      <ul class="panel row-list">
        <li v-for="(q, i) in exam.questions" :key="q.id" class="review-row">
          <div class="review-main">
            <span class="tag" :class="exam.results[q.id]?.is_correct ? 'tag-ok' : 'tag-bad'">
              {{ exam.results[q.id]?.is_correct ? '答对' : (exam.answers[q.id] ? '答错' : '未答') }}
            </span>
            <div class="review-body">
              <div class="review-text">{{ i + 1 }}. {{ q.content }}</div>
              <div class="review-answers">
                你的答案：{{ userAnswerText(q, exam.answers[q.id]) }}，正确答案：{{ optionText(q, exam.results[q.id]?.correct_answer) }}
              </div>
              <p v-if="exam.results[q.id]?.analysis" class="analysis">
                <span class="analysis-label">AI 解析</span>
                {{ exam.results[q.id].analysis }}
              </p>
            </div>
          </div>
        </li>
      </ul>
    </template>

    <!-- ===== 试卷列表 ===== -->
    <template v-else>
      <div class="page-head">
        <div>
          <h1>模拟考场</h1>
          <p class="sub">全真计时，交卷后 AI 逐题解析并更新你的预估分。</p>
        </div>
      </div>

      <ul class="panel row-list">
        <li v-for="e in [smartPaper, ...papers]" :key="e.id" class="exam-row">
          <div class="exam-main">
            <div class="exam-title-row">
              <span class="tag tag-brand">{{ e.kind }}</span>
              <span class="exam-title">{{ e.title }}</span>
            </div>
            <div class="exam-meta">{{ e.subject }}，共 {{ e.count }} 题，限时 {{ e.min }} 分钟</div>
          </div>
          <div v-if="lastScores[e.id]" class="exam-score">
            <div class="score-num">{{ lastScores[e.id].score }}<span class="score-unit"> / {{ lastScores[e.id].full }}</span></div>
            <div class="exam-meta">上次得分</div>
          </div>
          <span v-else class="text-xs muted">未开始</span>
          <button v-if="lastScores[e.id]" class="btn btn-ghost" @click="startExam(e)">重新作答</button>
          <button v-else class="btn btn-primary" @click="startExam(e)">开始考试</button>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.stat-grid.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }

/* 列表行 */
.exam-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 24px;
  padding: 20px;
}
.exam-main { min-width: 220px; flex: 1; }
.exam-title-row { display: flex; align-items: center; gap: 8px; }
.exam-title { font-size: 15px; font-weight: 500; }
.exam-meta { margin-top: 6px; font-size: 12px; color: var(--text-2); }
.exam-score { min-width: 120px; text-align: right; }
.score-num { font-size: 18px; font-weight: 700; }
.score-unit { font-size: 12px; font-weight: 400; color: var(--text-2); }

/* 答题中 */
.exam-actions { display: flex; align-items: center; gap: 16px; }
.timer {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.timer.urgent { border-color: var(--red); color: var(--red); }
.grid-exam {
  display: grid;
  gap: 24px;
  grid-template-columns: 1fr;
  max-width: 1000px;
  margin: 0 auto;
}
@media (min-width: 1024px) {
  .grid-exam { grid-template-columns: 1fr 240px; }
}
.align-start { align-self: start; }
.q-panel { padding: 24px; }
.q-text { margin-top: 12px; font-size: 18px; line-height: 1.625; }
.opt-list { margin-top: 24px; display: flex; flex-direction: column; gap: 12px; }
.q-actions { margin-top: 24px; display: flex; justify-content: space-between; }

/* 答题卡 */
.ans-title { font-size: 14px; font-weight: 500; }
.ans-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
.ans-item {
  aspect-ratio: 1;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text-2);
  font-size: 14px;
  transition: border-color 0.15s, background-color 0.15s, color 0.15s;
}
.ans-item:hover { border-color: rgba(29, 79, 215, 0.6); }
.ans-item.done { border-color: rgba(29, 79, 215, 0.3); background: var(--primary-soft); color: var(--primary); }
.ans-item.current { border-color: var(--primary); background: var(--primary); color: #fff; }
.ans-legend {
  margin-top: 16px;
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-2);
}
.legend-item { display: flex; align-items: center; gap: 6px; }
.dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  border: 1px solid var(--border);
}
.dot.done { background: var(--primary-soft); border-color: rgba(29, 79, 215, 0.3); }

/* 成绩单解析行 */
.review-row { padding: 20px; }
.review-main { display: flex; align-items: flex-start; gap: 12px; }
.review-body { min-width: 0; flex: 1; }
.review-text { font-size: 14px; font-weight: 500; line-height: 1.6; }
.review-answers { margin-top: 8px; font-size: 12px; color: var(--text-2); }
.analysis {
  margin-top: 8px;
  border-radius: 8px;
  background: var(--bg);
  padding: 12px;
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
