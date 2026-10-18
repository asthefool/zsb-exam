<script setup>
// 今日计划（对齐 UI 库 Today.tsx 结构）：统计卡 + AI 建议 + 今日任务 + 本周学习时长
//        + 科目掌握度 + 每日一题，全部接真实接口数据
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  getOverview, getCurrentPlan, getSubjects, getQuestions,
  getWrongQuestions, submitAnswer, checkInTask
} from '../../api';
import { useUserStore } from '../../stores/user';
import { difficultyMeta } from '../../constants';

const router = useRouter();
const userStore = useUserStore();

const loading = ref(true);
const error = ref(false);
const overview = ref(null);
const plan = ref(null);
const subjects = ref([]);
const mastery = reactive({}); // subject_id -> 掌握度汇总（来自 overview.mastery）
const weakList = ref([]);
const selectedSubject = ref(null);

// ---- 每日一题 ----
const daily = ref(null);
const dailyResult = ref(null);
const dailyPicked = ref(null); // 单选/判断：选中的 key
const dailyLoading = ref(false);
const dailyDiff = computed(() => difficultyMeta(daily.value?.difficulty ?? 2));

const nickname = computed(() => userStore.profile?.nickname || userStore.profile?.username || '同学');

// 已备考天数：以注册时间为起点（真实数据）
const studyDays = computed(() => {
  const created = userStore.profile?.created_at;
  if (!created) return null;
  return Math.max(1, Math.floor((Date.now() - new Date(created).getTime()) / 86400000));
});

// 距考试天数：来自当前计划的考试日期（真实数据）
const examInfo = computed(() => {
  const p = overview.value?.plan_progress;
  if (!p || !p.exam_date) return null;
  const date = String(p.exam_date).slice(0, 10);
  const diff = Math.ceil((new Date(`${date}T00:00:00`) - new Date(new Date().toDateString())) / 86400000);
  const d = new Date(`${date}T00:00:00`);
  return { date, daysLeft: diff >= 0 ? diff : 0, label: `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日` };
});

// 综合预估分 = Σ 科目掌握度 × 单科满分（与题库、学情报告同一口径）
const estimate = computed(() => overview.value?.mastery?.estimate?.score || 0);
const estimateMax = computed(() => overview.value?.mastery?.estimate?.max || 400);
const evaluatedCount = computed(() => overview.value?.mastery?.estimate?.evaluated || 0);

const todayLabel = (() => {
  const d = new Date();
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日 周${week}`;
})();

// 连续打卡：当前计划中连续完成任务的天数（真实数据）
const streak = computed(() => {
  const map = new Set();
  for (const t of plan.value?.tasks || []) {
    if (t.status === 'done') map.add(String(t.task_date).slice(0, 10));
  }
  let n = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(Date.now() - i * 86400000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (map.has(key)) n++;
    else if (i > 0 || !map.has(key)) break;
  }
  return n;
});

// ---- 任务解析：真实计划内容为「【类型】科目：正文（约 X 分钟）」----
function parseTask(content) {
  const raw = String(content || '');
  const minutes = /(\d+)\s*分钟/.exec(raw);
  let title = raw.replace(/^【[^】]*】/, '').trim();
  let subject = '';
  const m = /^(.{1,8}?)[:：]/.exec(title);
  if (m) {
    subject = m[1];
    title = title.slice(m[0].length).trim();
  }
  return { title: title || raw, subject, minutes: minutes ? Number(minutes[1]) : 0 };
}

const todayTasks = computed(() => (overview.value?.today_tasks || []).map((t) => ({ ...t, ...parseTask(t.content) })));
const todayDone = computed(() => todayTasks.value.filter((t) => t.status === 'done').length);
const todayMinutes = computed(() => todayTasks.value.reduce((a, t) => a + (t.minutes || 0), 0));

// 本周学习时长：当前计划任务按天聚合时长（分钟→小时，真实数据）
const weekBars = computed(() => {
  const map = new Map();
  for (const t of plan.value?.tasks || []) {
    const d = String(t.task_date).slice(0, 10);
    const min = parseTask(t.content).minutes || 0;
    map.set(d, (map.get(d) || 0) + min);
  }
  const names = ['日', '一', '二', '三', '四', '五', '六'];
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const h = Math.round(((map.get(key) || 0) / 60) * 10) / 10;
    days.push({ key, label: names[d.getDay()], h, today: key === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}` });
  }
  return days;
});
const weekHours = computed(() => Math.round(weekBars.value.reduce((a, d) => a + d.h, 0) * 10) / 10);
const weekMax = computed(() => Math.max(...weekBars.value.map((d) => d.h), 0.1));

// AI 建议文案：基于真实数据的规则提示
const advice = computed(() => {
  const wrong = overview.value?.wrong_count || 0;
  const acc = overview.value?.accuracy || 0;
  const p = overview.value?.plan_progress;
  const parts = [];
  if (wrong > 0) parts.push(`你还有 ${wrong} 道未掌握的错题，建议优先回炉重练`);
  if (p && p.percent < 100 && p.total) parts.push(`当前计划完成 ${p.done}/${p.total}，今日任务记得打卡`);
  if (acc >= 70) parts.push(`近期正确率 ${acc}%，状态不错，可以适当提高难题占比`);
  else if (acc > 0) parts.push(`近期正确率 ${acc}%，建议先夯实基础题再进阶`);
  if (!parts.length) parts.push('开始刷题后，这里会根据你的错题分布给出学习建议');
  return parts.join('；') + '。';
});

// ---- 科目掌握度：null 表示样本不足，页面只显示"再做 N 题可评估" ----
function masteryOf(id) {
  return mastery[id]?.mastery ?? null;
}

async function selectSubject(s) {
  selectedSubject.value = s;
  try {
    const data = await getWrongQuestions({ subject_id: s.id, mastered: 0, page: 1, size: 3 });
    weakList.value = data.list || [];
  } catch (e) {
    weakList.value = [];
  }
}

// ---- 每日一题：按日期取单选题，作答走真实判分 ----
// 换一题次数，每次累加才能切到下一题；按用户保存，刷新后保留
const dailyKey = `daily_shift_${localStorage.getItem('userId') || 0}`;
const dailyShift = ref(Number(localStorage.getItem(dailyKey)) || 0);

async function loadDaily() {
  dailyLoading.value = true;
  dailyResult.value = null;
  dailyPicked.value = null;
  try {
    const probe = await getQuestions({ q_type: 'single', page: 1, size: 1 });
    const pages = Math.max(1, probe.total || 1);
    const dayIndex = Math.floor(Date.now() / 86400000) + dailyShift.value;
    const data = await getQuestions({ q_type: 'single', page: (dayIndex % pages) + 1, size: 1 });
    daily.value = data.list[0] || null;
    if (!daily.value) {
      const fallback = await getQuestions({ page: 1, size: 1 });
      daily.value = fallback.list[0] || null;
    }
  } catch (e) {
    daily.value = null;
  } finally {
    dailyLoading.value = false;
  }
}

function nextDaily() {
  dailyShift.value += 1;
  localStorage.setItem(dailyKey, String(dailyShift.value));
  return loadDaily();
}

const dailyOptions = computed(() => {
  if (!daily.value) return [];
  const o = daily.value.options;
  let list = typeof o === 'string' ? (() => { try { return JSON.parse(o); } catch { return []; } })() : (Array.isArray(o) ? o : []);
  if (!Array.isArray(list) || !list.length) return [];
  return list.map((x, i) => ({
    key: x.key || 'ABCD'[i],
    text: typeof x === 'string' ? x : x.text
  }));
});

async function onDailyPick(key) {
  if (dailyResult.value) return;
  dailyPicked.value = key;
  try {
    dailyResult.value = await submitAnswer({ question_id: daily.value.id, user_answer: key });
  } catch (e) {
    dailyPicked.value = null;
  }
}

function isDailyRight(key) {
  if (!dailyResult.value) return false;
  return String(dailyResult.value.correct_answer || '').trim().toUpperCase().includes(String(key).toUpperCase());
}

// ---- 任务打卡 ----
async function onCheckIn(task) {
  if (task.status === 'done' || task._checking) return;
  task._checking = true;
  try {
    const res = await checkInTask(task.id);
    const real = (overview.value?.today_tasks || []).find((x) => x.id === task.id);
    if (real) real.status = 'done';
    const t = (plan.value?.tasks || []).find((x) => x.id === task.id);
    if (t) t.status = 'done';
    if (res && res.progress && overview.value) {
      overview.value.plan_progress = { ...overview.value.plan_progress, ...res.progress };
    }
  } finally {
    task._checking = false;
  }
}

async function load() {
  loading.value = true;
  error.value = false;
  try {
    await userStore.fetchProfile().catch(() => {});
    const [ov, planRes, subs] = await Promise.allSettled([
      getOverview(), getCurrentPlan(), getSubjects()
    ]);
    overview.value = ov.status === 'fulfilled' ? ov.value : null;
    if (ov.status !== 'fulfilled') error.value = true;
    plan.value = planRes.status === 'fulfilled' ? planRes.value : null;
    subjects.value = subs.status === 'fulfilled' ? (subs.value || []) : [];

    for (const s of overview.value?.mastery?.subjects || []) mastery[s.subject_id] = s;

    if (subjects.value.length) await selectSubject(subjects.value[0]);
    await loadDaily();
  } catch (e) {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div v-loading="loading" class="page-pad m-flow">
    <!-- 页头 -->
    <div class="page-head">
      <div>
        <p class="m-date">{{ todayLabel }}</p>
        <h1>早上好，{{ nickname }}</h1>
        <p class="sub">
          <template v-if="studyDays">已持续备考 {{ studyDays }} 天</template><template v-if="examInfo">，距离考试还有 {{ examInfo.daysLeft }} 天。</template><template v-else>。</template>
        </p>
      </div>
    </div>

    <!-- 移动端概览卡（桌面端隐藏，统计卡在移动端隐藏） -->
    <div class="m-hero">
      <div class="m-hero-top">
        <div>
          <div class="m-hero-label">综合预估分</div>
          <div class="m-hero-score">
            <span>{{ estimate }}</span>
            <small>/ {{ estimateMax }}</small>
          </div>
          <div class="m-hero-sub">已评估 {{ evaluatedCount }}/{{ subjects.length }} 科</div>
        </div>
        <div class="m-hero-right">
          <div class="m-hero-label">距离考试</div>
          <div v-if="examInfo" class="m-hero-days">{{ examInfo.daysLeft }}<small>天</small></div>
          <div v-else class="m-hero-days-empty">未设置</div>
          <div class="m-hero-sub">连续打卡 {{ streak }} 天</div>
        </div>
      </div>
      <button class="m-hero-foot" @click="router.push('/report')">
        <span>查看学情报告</span>
        <span aria-hidden="true">›</span>
      </button>
    </div>

    <div v-if="error" class="alert">
      <span class="alert-main">学习概览加载失败</span>
      <button class="btn btn-ghost" @click="load()">重新加载</button>
    </div>

    <!-- 统计卡 -->
    <div class="stat-grid">
      <div class="panel stat-card">
        <div class="label">距离考试</div>
        <div class="value-row">
          <span class="value">{{ examInfo ? examInfo.daysLeft : '—' }}</span>
          <span class="unit">天</span>
        </div>
        <div class="note">{{ examInfo ? examInfo.label : '尚未生成复习计划' }}</div>
      </div>
      <div class="panel stat-card">
        <div class="label">今日完成</div>
        <div class="value-row">
          <span class="value">{{ todayDone }}/{{ todayTasks.length }}</span>
          <span class="unit">项</span>
        </div>
        <div class="note">{{ todayTasks.length ? `进度 ${Math.round((todayDone / todayTasks.length) * 100)}%` : '暂无今日任务' }}</div>
      </div>
      <div class="panel stat-card">
        <div class="label">综合预估分</div>
        <div class="value-row">
          <span class="value">{{ estimate }}</span>
          <span class="unit">/ 400</span>
        </div>
        <div class="note">{{ estimate ? '由正确率推估' : '做满 10 题后开始评估' }}</div>
      </div>
      <div class="panel stat-card">
        <div class="label">连续打卡</div>
        <div class="value-row">
          <span class="value">{{ streak }}</span>
          <span class="unit">天</span>
        </div>
        <div class="note">连续完成任务的天数</div>
      </div>
    </div>

    <!-- AI 建议 -->
    <div class="ai-bar">
      <span class="ai-badge">AI 建议</span>
      <p class="ai-text">{{ advice }}</p>
      <button class="btn btn-primary" @click="router.push('/wrong-book')">查看错题</button>
    </div>

    <!-- 今日学习计划 + 本周学习时长 -->
    <div class="grid-plan">
      <section class="panel m-today">
        <div class="panel-head">
          <h2>今日学习计划</h2>
          <div class="head-right">
            <span class="extra">{{ todayMinutes ? `共 ${todayMinutes} 分钟` : `共 ${todayTasks.length} 项` }}</span>
            <button class="btn-text" @click="router.push('/plan')">管理计划</button>
          </div>
        </div>
        <ul v-if="todayTasks.length" class="row-list">
          <li v-for="t in todayTasks" :key="t.id">
            <button class="task-row" :class="{ done: t.status === 'done' }" @click="onCheckIn(t)">
              <span class="check" aria-hidden>{{ t.status === 'done' ? '✓' : '' }}</span>
              <span class="time">{{ t.time_slot || '待定' }}</span>
              <span class="task-main">
                <span class="task-title">{{ t.title }}</span>
                <span v-if="t.subject" class="task-sub">{{ t.subject }}</span>
              </span>
              <span v-if="t.minutes" class="task-min">{{ t.minutes }} 分钟</span>
            </button>
          </li>
        </ul>
        <div v-else class="empty-tip">
          {{ overview && overview.plan_progress === null ? '还没有生效中的复习计划' : '今天没有安排任务，可到计划页查看完整安排' }}
          <div class="mt-4">
            <button class="btn btn-primary" @click="router.push('/plan')">
              {{ overview && overview.plan_progress === null ? '去生成复习计划' : '管理计划' }}
            </button>
          </div>
        </div>
      </section>

      <section class="panel panel-pad align-start m-week">
        <div class="flex-between">
          <h2>本周学习时长</h2>
          <span class="text-xs muted">共 {{ weekHours.toFixed(1) }} 小时</span>
        </div>
        <div class="bar-chart">
          <div v-for="d in weekBars" :key="d.key" class="bar-col" :title="`${d.h} 小时`">
            <span class="bar-value">{{ d.h }}</span>
            <div class="bar" :class="{ today: d.today }" :style="{ height: `${(d.h / weekMax) * 78}%` }"></div>
          </div>
        </div>
        <div class="bar-labels">
          <span v-for="d in weekBars" :key="d.key" class="bar-label">{{ d.label }}</span>
        </div>
        <p v-if="weekHours === 0" class="bar-empty">本周还没有学习记录，完成第一项今日任务后，柱状图会在这里开始累计</p>
      </section>
    </div>

    <!-- 科目掌握度 -->
    <section class="panel m-mastery">
      <div class="panel-head">
        <h2>科目掌握度</h2>
      </div>
      <div class="grid-mastery">
        <div class="mastery-list">
          <button
            v-for="s in subjects"
            :key="s.id"
            class="mastery-item"
            :class="{ active: selectedSubject && selectedSubject.id === s.id }"
            @click="selectSubject(s)"
          >
            <div class="mastery-top">
              <span class="mastery-name">{{ s.name }}</span>
              <span class="mastery-score">
                <b v-if="masteryOf(s.id) !== null">{{ masteryOf(s.id) }}</b>
                <span v-else class="mastery-need">再做 {{ mastery[s.id]?.need_more ?? 10 }} 题可评估</span>
              </span>
            </div>
            <div class="progress">
              <div class="fill" :style="{ width: `${masteryOf(s.id) ?? 0}%` }"></div>
              <div class="target" :style="{ left: '85%' }" :title="'目标 85'"></div>
            </div>
            <div class="mastery-cov">覆盖 {{ mastery[s.id]?.coverage ?? 0 }}%</div>
          </button>
          <div class="mastery-note">竖线为目标分数</div>
        </div>
        <div class="weak-panel">
          <div class="weak-head">
            <h3>{{ selectedSubject ? `${selectedSubject.name}优先攻克` : '优先攻克' }}</h3>
            <span class="text-xs muted">未掌握 {{ mastery[selectedSubject?.id]?.wrong_count ?? 0 }} 道</span>
          </div>
          <ul v-if="weakList.length" class="weak-list">
            <li v-for="w in weakList" :key="w.id" class="weak-row">
              <span class="weak-name">{{ w.content }}</span>
              <button class="btn btn-ghost btn-xs" @click="router.push({ path: '/practice', query: { subject: selectedSubject.id } })">专项练习</button>
            </li>
          </ul>
          <div v-else class="empty-tip">该科目暂无未掌握错题，继续保持</div>
        </div>
      </div>
    </section>

    <!-- 每日一题 -->
    <section class="panel panel-pad m-daily">
      <div class="flex-between">
        <h2>每日一题</h2>
        <span class="tag" :class="dailyDiff.cls">{{ dailyDiff.label }}</span>
      </div>
      <template v-if="daily">
        <p class="q-text">{{ daily.content }}</p>
        <div class="opt-grid">
          <button
            v-for="o in dailyOptions"
            :key="o.key"
            class="opt"
            :disabled="!!dailyResult"
            :class="{
              right: dailyResult && isDailyRight(o.key),
              wrong: dailyResult && dailyPicked === o.key && !isDailyRight(o.key),
              dimmed: dailyResult && !isDailyRight(o.key) && dailyPicked !== o.key
            }"
            @click="onDailyPick(o.key)"
          >
            <span class="key">{{ o.key }}</span>
            <span class="opt-text">{{ o.text }}</span>
            <span v-if="dailyResult && isDailyRight(o.key)" class="verdict ok">正确</span>
            <span v-else-if="dailyResult && dailyPicked === o.key" class="verdict bad">错误</span>
          </button>
        </div>
        <div v-if="dailyResult" class="ai-analysis">
          <p class="analysis-text">
            <span class="analysis-label">AI 解析</span>
            {{ dailyResult.analysis || '暂无解析' }}
          </p>
          <button class="btn btn-ghost" @click="nextDaily">换一题</button>
        </div>
      </template>
      <div v-else class="empty-tip">{{ dailyLoading ? '题目加载中……' : '暂无题目' }}</div>
    </section>
  </div>
</template>

<style scoped>
.head-right { display: flex; align-items: center; gap: 12px; }
.ai-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  border-radius: 12px;
  border: 1px solid var(--primary-border);
  background: var(--primary-soft);
  padding: 20px;
}
.ai-badge {
  border-radius: 6px;
  background: var(--primary);
  color: #fff;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
}
.ai-text { flex: 1; min-width: 0; font-size: 14px; line-height: 1.625; }
@media (max-width: 767px) {
  .ai-bar { flex-direction: column; align-items: stretch; gap: 12px; padding: 16px; }
  .ai-badge { align-self: flex-start; }
  .ai-bar .btn { width: 100%; }
}

.m-date,
.m-hero { display: none; }
@media (max-width: 767px) {
  .m-date { display: block; font-size: 13px; color: var(--text-2); }
  .page-head .sub { display: none; }
  .page-head h1 { margin-top: 4px; }
  .stat-grid { display: none; }
  .m-hero {
    display: block;
    overflow: hidden;
    border-radius: 16px;
    background: var(--primary);
    color: #fff;
  }
  .m-hero-top {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 20px 20px 16px;
  }
  .m-hero-right { text-align: right; }
  .m-hero-label { font-size: 13px; color: rgba(255, 255, 255, 0.8); }
  .m-hero-score {
    margin-top: 4px;
    display: flex;
    align-items: baseline;
    gap: 4px;
    font-size: 48px;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.025em;
  }
  .m-hero-score small { font-size: 16px; font-weight: 400; color: rgba(255, 255, 255, 0.7); }
  .m-hero-days {
    margin-top: 4px;
    font-size: 32px;
    font-weight: 700;
    line-height: 1.2;
  }
  .m-hero-days small { margin-left: 4px; font-size: 16px; font-weight: 400; }
  .m-hero-days-empty {
    margin-top: 8px;
    font-size: 16px;
    font-weight: 500;
    line-height: 1.4;
  }
  .m-hero-sub { margin-top: 6px; font-size: 12px; color: rgba(255, 255, 255, 0.8); }
  .m-hero-foot {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    background: transparent;
    padding: 14px 20px;
    font-size: 14px;
    color: #fff;
  }
}
.grid-plan {
  display: grid;
  gap: 24px;
  grid-template-columns: 1fr;
}
@media (min-width: 1280px) {
  .grid-plan { grid-template-columns: 1.4fr 1fr; }
}
.align-start { align-self: start; }

/* 任务行 */
.task-row {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 16px;
  border: none;
  background: transparent;
  padding: 16px 20px;
  text-align: left;
  transition: background-color 0.15s;
}
.task-row:hover { background: var(--bg); }
.check {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: 999px;
  border: 1px solid rgba(91, 103, 121, 0.5);
  color: #fff;
  font-size: 11px;
}
.task-row.done .check { background: var(--green); border-color: var(--green); }
.time { width: 48px; flex-shrink: 0; font-size: 14px; color: var(--text-2); }
.task-main { flex: 1; min-width: 0; }
.task-title { display: block; font-size: 14px; font-weight: 500; }
.task-row.done .task-title { color: var(--text-2); text-decoration: line-through; font-weight: 400; }
.task-sub { display: block; margin-top: 2px; font-size: 12px; color: var(--text-2); }
.task-min { font-size: 12px; color: var(--text-2); flex-shrink: 0; }

/* 周图表 */
.bar-chart {
  margin-top: 24px;
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 160px;
}
.bar-col {
  display: flex;
  height: 100%;
  flex: 1;
  flex-direction: column;
  justify-content: flex-end;
  gap: 8px;
}
.bar-value {
  text-align: center;
  font-size: 12px;
  color: var(--text-2);
  opacity: 0;
  transition: opacity 0.15s;
}
.bar-col:hover .bar-value { opacity: 1; }
.bar {
  width: 100%;
  border-radius: 6px 6px 2px 2px;
  background: rgba(29, 79, 215, 0.25);
  min-height: 2px;
  transition: background-color 0.15s;
}
.bar.today { background: var(--primary); }
.bar-col:hover .bar { background: rgba(29, 79, 215, 0.5); }
.bar-col:hover .bar.today { background: var(--primary); }
.bar-labels {
  margin-top: 8px;
  display: flex;
  gap: 12px;
  border-top: 1px solid var(--border);
  padding-top: 8px;
}
.bar-label { flex: 1; text-align: center; font-size: 12px; color: var(--text-2); }
.bar-empty { margin-top: 16px; font-size: 13px; color: var(--text-2); text-align: center; }
@media (max-width: 767px) {
  .bar-chart { margin-top: 16px; height: 96px; gap: 8px; }
  .bar-labels { margin-top: 6px; }
}

/* 移动端区块顺序：概览 → AI 建议 → 今日计划 → 每日一题 → 科目掌握度 → 本周时长 */
@media (max-width: 767px) {
  .m-flow.page-pad { display: flex; flex-direction: column; gap: 24px; }
  .m-flow.page-pad > * { margin-top: 0; }
  .grid-plan { display: contents; }
  .m-hero { order: 1; }
  .ai-bar { order: 2; }
  .m-today { order: 3; }
  .m-daily { order: 4; }
  .m-mastery { order: 5; }
  .m-week { order: 6; align-self: stretch; }
}

/* 科目掌握度 */
.grid-mastery {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}
@media (min-width: 1024px) {
  .grid-mastery { grid-template-columns: 1fr 1.1fr; }
}
.mastery-list { border-bottom: 1px solid var(--border); padding: 8px; }
@media (min-width: 1024px) {
  .mastery-list { border-bottom: none; border-right: 1px solid var(--border); }
}
.mastery-item {
  display: block;
  width: 100%;
  border: none;
  background: transparent;
  border-radius: 8px;
  padding: 14px 16px;
  text-align: left;
  transition: background-color 0.15s;
}
.mastery-item:hover { background: var(--bg); }
.mastery-item.active { background: var(--primary-soft); }
.mastery-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.mastery-name { font-size: 14px; font-weight: 500; }
.mastery-item.active .mastery-name { color: var(--primary); }
.mastery-score { font-size: 14px; }
.mastery-score b { font-weight: 700; }
.mastery-need { font-size: 12px; color: var(--text-2); }
.mastery-cov { margin-top: 6px; font-size: 12px; color: var(--text-2); }
.mastery-item .progress { margin-top: 10px; }
.mastery-note { padding: 4px 16px 8px; font-size: 12px; color: var(--text-2); }
.weak-panel { padding: 20px; }
@media (min-width: 640px) {
  .weak-panel { padding: 24px; }
}
.weak-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.weak-list {
  list-style: none;
  margin: 16px 0 0;
  padding: 0;
}
.weak-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}
.weak-row:last-child { border-bottom: none; }
.weak-name {
  font-size: 14px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.btn-xs { padding: 4px 12px; font-size: 12px; }

/* 每日一题 */
.q-text {
  margin-top: 16px;
  max-width: 768px;
  font-size: 16px;
  line-height: 1.625;
}
.opt-grid {
  margin-top: 20px;
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;
}
@media (min-width: 768px) {
  .opt-grid { grid-template-columns: 1fr 1fr; }
}
.opt { align-items: flex-start; }
.opt-text { flex: 1; }
.ai-analysis {
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  border-radius: 8px;
  background: var(--bg);
  padding: 16px;
}
.analysis-text {
  max-width: 768px;
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
