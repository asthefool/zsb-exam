<script setup>
// 复习计划（对齐 UI 库 Plan.tsx 结构）：生成表单 + 折叠任务列表 + 打卡，全部真实接口
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getSubjects, generatePlan, getCurrentPlan, checkInTask, getAiConfig } from '../../api';

const subjects = ref([]);
const plan = ref(null);
const loading = ref(false);
const generating = ref(false);
const planError = ref(false);
const aiMode = ref('');

const form = reactive({ exam_date: '', picked: [], minutes: 120 });
const openDates = ref([]);
const marking = ref(null);

const today = (() => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
})();

const daysLeft = computed(() => {
  if (!form.exam_date) return null;
  const diff = Math.ceil((new Date(`${form.exam_date}T00:00:00`) - new Date(`${today}T00:00:00`)) / 86400000);
  return diff >= 0 ? diff : null;
});

const aiLabel = computed(() => (aiMode.value === 'llm' ? '真实大模型' : aiMode.value === 'mock' ? '规则引擎（模拟）' : ''));

// 任务按日期分组（对齐源码折叠列表）
const dayGroups = computed(() => {
  const map = new Map();
  for (const t of plan.value?.tasks || []) {
    const d = String(t.task_date).slice(0, 10);
    if (!map.has(d)) map.set(d, []);
    map.get(d).push({ ...t, text: String(t.content || '').replace(/^【[^】]*】/, '').trim() });
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, tasks]) => ({ date, label: date === today ? '今天' : '', tasks }));
});

const allTasks = computed(() => plan.value?.tasks || []);
const doneCount = computed(() => allTasks.value.filter((t) => t.status === 'done').length);
const pct = computed(() => (allTasks.value.length ? Math.round((doneCount.value / allTasks.value.length) * 100) : 0));

const periodStyle = {
  上午: 'tag-ok',
  下午: 'tag-warn',
  晚上: 'tag-brand'
};

function toggleDate(date) {
  const i = openDates.value.indexOf(date);
  if (i >= 0) openDates.value.splice(i, 1);
  else openDates.value.push(date);
}

function toggleSubject(id) {
  const i = form.picked.indexOf(id);
  if (i >= 0) form.picked.splice(i, 1);
  else form.picked.push(id);
}

function stepMinutes(delta) {
  form.minutes = Math.min(600, Math.max(15, form.minutes + delta));
}

async function load() {
  loading.value = true;
  try {
    const [subsRes, currentRes, aiRes] = await Promise.allSettled([getSubjects(), getCurrentPlan(), getAiConfig()]);
    subjects.value = subsRes.status === 'fulfilled' ? (subsRes.value || []) : [];
    planError.value = currentRes.status === 'rejected';
    plan.value = currentRes.status === 'fulfilled' ? currentRes.value : null;
    aiMode.value = (aiRes.status === 'fulfilled' && aiRes.value && aiRes.value.provider) || '';
    if (plan.value) {
      const g = dayGroups.value.find((d) => d.date === today) || dayGroups.value[0];
      openDates.value = g ? [g.date] : [];
      if (plan.value.exam_date) form.exam_date = String(plan.value.exam_date).slice(0, 10);
    }
  } finally {
    loading.value = false;
  }
}

async function onGenerate() {
  if (plan.value) {
    try {
      await ElMessageBox.confirm('重新生成会归档当前计划并新建一份，历史打卡记录保留。确定继续？', '重新生成计划', {
        confirmButtonText: '重新生成', cancelButtonText: '取消', type: 'warning'
      });
    } catch (e) {
      return;
    }
  }
  generating.value = true;
  try {
    const res = await generatePlan({
      exam_date: form.exam_date || undefined,
      target_subjects: form.picked.length ? form.picked.join(',') : undefined,
      daily_minutes: form.minutes
    });
    plan.value = res;
    const g = dayGroups.value.find((d) => d.date === today) || dayGroups.value[0];
    openDates.value = g ? [g.date] : [];
    ElMessage.success('复习计划已生成');
  } catch (e) {
    /* 生成失败（含 50201/50202/限流）由全局拦截器提示具体原因 */
  } finally {
    generating.value = false;
  }
}

async function punch(task) {
  if (marking.value) return;
  marking.value = task.id;
  try {
    const res = await checkInTask(task.id);
    task.status = 'done';
    const real = (plan.value?.tasks || []).find((x) => x.id === task.id);
    if (real) real.status = 'done';
    if (res && res.progress && plan.value) plan.value.progress = res.progress;
    ElMessage.success('打卡成功，继续保持');
  } finally {
    marking.value = null;
  }
}

onMounted(load);
</script>

<template>
  <div v-loading="loading" class="page-pad">
    <div class="page-head">
      <div>
        <h1>复习计划</h1>
        <p class="sub">告诉 AI 考试日期和每日时长，自动排出每天的学习任务。</p>
      </div>
    </div>

    <!-- 生成表单 -->
    <section class="panel panel-pad">
      <div class="flex-between">
        <h2>生成智能复习计划</h2>
        <span v-if="aiLabel" class="tag tag-muted">{{ aiLabel }}</span>
      </div>
      <div class="form">
        <div>
          <div class="form-label"><span>考试日期</span></div>
          <div class="field-row">
            <input
              v-model="form.exam_date"
              class="field field-auto"
              type="date"
              :min="today"
            />
            <span v-if="daysLeft !== null" class="text-sm muted">距离考试还有 {{ daysLeft }} 天</span>
          </div>
        </div>
        <div class="form-wide">
          <div class="form-label inline"><span>目标科目</span><span class="hint">不选则覆盖全部科目</span></div>
          <div class="subject-chips">
            <button
              v-for="s in subjects"
              :key="s.id"
              class="subject-chip"
              :class="{ active: form.picked.includes(s.id) }"
              :aria-pressed="form.picked.includes(s.id)"
              @click="toggleSubject(s.id)"
            >{{ form.picked.includes(s.id) ? '✓ ' : '' }}{{ s.name }}</button>
          </div>
        </div>
        <div class="form-minutes">
          <div class="form-label"><span>每日复习时长</span></div>
          <div class="field-row">
            <div class="stepper">
              <button aria-label="减少" @click="stepMinutes(-15)">−</button>
              <span class="stepper-value">{{ form.minutes }}</span>
              <button aria-label="增加" @click="stepMinutes(15)">+</button>
            </div>
            <span class="text-sm muted">分钟</span>
          </div>
        </div>
        <div class="field-row form-wide">
          <button class="btn btn-primary" :disabled="generating || !form.exam_date" @click="onGenerate">
            {{ generating ? '生成中…' : '生成计划' }}
          </button>
          <span v-if="plan" class="text-xs muted">重新生成会归档当前计划并新建</span>
        </div>
      </div>
    </section>

    <div v-if="planError" class="alert">
      <span class="alert-main">当前复习计划加载失败</span>
      <button class="btn btn-ghost" @click="load()">重新加载</button>
    </div>

    <!-- 当前计划 -->
    <section v-if="plan" class="panel">
      <div class="panel-head wrap">
        <h2>当前复习计划</h2>
        <span class="extra">
          进度 {{ doneCount }}/{{ allTasks.length }}（{{ pct }}%）<template v-if="plan.exam_date">，考试日 {{ String(plan.exam_date).slice(0, 10) }}</template><template v-if="plan.daily_minutes">，每日 {{ plan.daily_minutes }} 分钟</template>
        </span>
      </div>
      <div class="plan-progress">
        <div class="progress progress-lg">
          <div class="fill" :style="{ width: `${pct}%` }"></div>
        </div>
      </div>
      <ul class="row-list">
        <li v-for="g in dayGroups" :key="g.date">
          <button class="day-row" :aria-expanded="openDates.includes(g.date)" @click="toggleDate(g.date)">
            <span class="chevron" :class="{ open: openDates.includes(g.date) }">›</span>
            <span class="day-title">{{ g.date }}{{ g.label ? `（${g.label}）` : '' }}</span>
            <span class="tag tag-muted">{{ g.tasks.length }} 项</span>
          </button>
          <ul v-if="openDates.includes(g.date)" class="task-list">
            <li v-for="t in g.tasks" :key="t.id" class="task-row">
              <span class="tag period" :class="periodStyle[t.time_slot] || 'tag-muted'">{{ t.time_slot || '未定' }}</span>
              <span class="task-text" :class="{ done: t.status === 'done' }">{{ t.text }}</span>
              <span v-if="t.status === 'done'" class="done-mark">✓ 已完成</span>
              <button
                v-else
                class="btn btn-ghost btn-xs"
                :disabled="marking === t.id"
                @click="punch(t)"
              >{{ marking === t.id ? '打卡中…' : '打卡完成' }}</button>
            </li>
          </ul>
        </li>
      </ul>
    </section>
    <div v-else-if="!loading && !planError" class="panel empty-tip">还没有复习计划，先在上方生成一份吧</div>
  </div>
</template>

<style scoped>
.form {
  margin-top: 20px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px 32px;
}
.form-wide { grid-column: 1 / -1; }
.form-label.inline { justify-content: flex-start; gap: 8px; }
@media (min-width: 1024px) {
  .form { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .form-minutes { grid-row: 1; grid-column: 2; }
}
.field-row { display: flex; align-items: center; gap: 12px; }
.field-auto { width: auto; }
.subject-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.subject-chip {
  border: 1px solid var(--border);
  background: var(--card);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 14px;
  color: var(--text);
  transition: border-color 0.15s, background-color 0.15s, color 0.15s;
}
.subject-chip:hover { border-color: rgba(29, 79, 215, 0.6); }
.subject-chip.active { border-color: var(--primary); background: var(--primary-soft); color: var(--primary); }
.stepper {
  display: inline-flex;
  align-items: center;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 8px;
}
.stepper button {
  border: none;
  background: transparent;
  padding: 8px 12px;
  color: var(--text-2);
  font-size: 15px;
}
.stepper button:hover { background: var(--bg); }
.stepper-value {
  width: 64px;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
}
.panel-head.wrap { flex-wrap: wrap; gap: 8px; }
.plan-progress { padding: 16px 20px 0; }

/* 日期折叠行 */
.day-row {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
  border: none;
  background: transparent;
  padding: 16px 20px;
  text-align: left;
}
.day-row:hover { background: var(--bg); }
.chevron {
  color: var(--text-2);
  transition: transform 0.15s;
  display: inline-block;
}
.chevron.open { transform: rotate(90deg); }
.day-title { font-size: 14px; font-weight: 500; }

/* 任务行 */
.task-list { padding-bottom: 8px; }
.task-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 20px 10px 48px;
}
.period { width: 48px; justify-content: center; flex-shrink: 0; }
.task-text { flex: 1; font-size: 14px; }
.task-text.done { color: var(--text-2); text-decoration: line-through; }
.done-mark { font-size: 12px; font-weight: 500; color: var(--green); flex-shrink: 0; }
.btn-xs { padding: 4px 12px; font-size: 12px; }
</style>
