<script setup>
// 学情报告（对齐 UI 库 Report.tsx 结构）：统计卡 + 预估分趋势 + 能力雷达 + 学习热力图 + AI 诊断
// 真实数据：答题统计 / 错题分布 / 计划任务；推导部分在页面标注
import { ref, reactive, computed, onMounted } from 'vue';
import { getOverview, getCurrentPlan, getSubjects, getQuestions, getWrongQuestions } from '../../api';

const overview = ref(null);
const plan = ref(null);
const subjects = ref([]);
const mastery = reactive({});
const loading = ref(true);
const error = ref(false);
const range = ref('近 7 周');

const estimate = computed(() => Math.round((overview.value?.accuracy || 0) * 4));

const statCards = computed(() => [
  {
    label: '综合预估分', value: estimate.value, unit: '/ 400',
    note: `目标 330，还差 ${Math.max(0, 330 - estimate.value)} 分`
  },
  {
    label: '累计刷题', value: (overview.value?.total_answers || 0).toLocaleString(), unit: '道',
    note: `平均正确率 ${overview.value?.accuracy || 0}%`
  },
  {
    label: '未掌握错题', value: overview.value?.wrong_count || 0, unit: '道',
    note: (overview.value?.wrong_count || 0) ? '建议优先回炉' : '暂无积压'
  },
  {
    label: '计划进度', value: overview.value?.plan_progress?.percent ?? 0, unit: '%',
    note: overview.value?.plan_progress
      ? `已完成 ${overview.value.plan_progress.done}/${overview.value.plan_progress.total} 项`
      : '尚未生成复习计划'
  }
]);

function masteryOf(id) {
  const m = mastery[id];
  if (!m || !m.total) return 0;
  return Math.max(0, Math.min(100, Math.round(((m.total - m.wrong) / m.total) * 100)));
}

// ---- 预估分趋势（示例曲线：按当前预估分回推，页面标注） ----
const trendCount = computed(() => (range.value === '近 7 周' ? 7 : 5));
const trendPoints = computed(() => {
  const cur = estimate.value || 240;
  const start = Math.max(40, cur - 58);
  const n = trendCount.value;
  return Array.from({ length: n }, (_, i) => Math.round(start + ((cur - start) * i) / (n - 1)));
});
const trendLabels = computed(() => {
  const n = trendCount.value;
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? '本周' : `第 ${i + 1} 周`));
});
const trendRise = computed(() => trendPoints.value[trendPoints.value.length - 1] - trendPoints.value[0]);

// 源码 Trend 规格：viewBox 560x200，pad 28，三条横线 + 悬停数值
const TW = 560, TH = 200, TPAD = 28;
const trendMin = computed(() => Math.max(0, Math.floor((Math.min(...trendPoints.value) - 15) / 10) * 10));
const trendMax = computed(() => Math.ceil((Math.max(...trendPoints.value) + 15) / 10) * 10);
const trendGeo = computed(() => {
  const pts = trendPoints.value;
  const min = trendMin.value, max = trendMax.value;
  const coords = pts.map((v, i) => [
    TPAD + (i * (TW - TPAD * 2)) / (pts.length - 1),
    TH - TPAD - ((v - min) / (max - min || 1)) * (TH - TPAD * 2)
  ]);
  const ticks = [max, Math.round((max + min) / 2), min].map((v) => ({
    v,
    y: TH - TPAD - ((v - min) / (max - min || 1)) * (TH - TPAD * 2)
  }));
  return {
    coords,
    ticks,
    line: coords.map((p) => p.join(',')).join(' ')
  };
});
const hoverIdx = ref(null);

// ---- 能力雷达（源码 Radar 规格：240x240，轴标签在外圈 1.2 倍处） ----
const dims = computed(() => {
  const list = subjects.value.slice(0, 4).map((s) => ({ n: s.name, v: masteryOf(s.id), t: 85 }));
  list.push({ n: '正确率', v: overview.value?.accuracy || 0, t: 85 });
  return list.length >= 3 ? list : [];
});
const RC = 120, RR = 86;
function radarPt(i, k, n) {
  const a = (Math.PI * 2 * i) / n - Math.PI / 2;
  return [RC + Math.cos(a) * RR * k, RC + Math.sin(a) * RR * k];
}
function radarPoly(vals) {
  const n = dims.value.length;
  return vals.map((v, i) => radarPt(i, v / 100, n).map((x) => x.toFixed(1)).join(',')).join(' ');
}

// ---- 学习热力图（源码：grid-flow-col grid-rows-7，格子透明度表示强度） ----
const heatWeeks = computed(() => (range.value === '近 7 周' ? 7 : 5));
const heatmap = computed(() => {
  const map = new Map();
  for (const t of plan.value?.tasks || []) {
    const d = String(t.task_date).slice(0, 10);
    if (t.status === 'done') map.set(d, (map.get(d) || 0) + 1);
  }
  const n = heatWeeks.value * 7;
  const cells = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const done = map.get(key) || 0;
    const v = Math.min(1, done / 3);
    cells.push({ key, done, opacity: done === 0 ? 0.06 : 0.15 + v * 0.85 });
  }
  return cells;
});

// ---- AI 诊断结论（基于真实数据的规则诊断，对齐源码三行式） ----
const diagnosis = computed(() => {
  const items = [];
  const acc = overview.value?.accuracy || 0;
  const wrong = overview.value?.wrong_count || 0;
  const p = overview.value?.plan_progress;

  if (acc >= 70) {
    items.push({ kind: 'ok', title: '进步明显', text: `平均正确率 ${acc}%，整体状态良好，保持每日练习节奏即可。` });
  } else if (acc > 0) {
    items.push({ kind: 'warn', title: '状态一般', text: `平均正确率 ${acc}%，建议先夯实基础题，再逐步提高难题占比。` });
  } else {
    items.push({ kind: 'info', title: '数据不足', text: '完成一组练习后，这里会生成针对你的诊断结论。' });
  }

  const weakest = subjects.value
    .map((s) => ({ s, m: masteryOf(s.id), wrong: mastery[s.id]?.wrong || 0 }))
    .sort((a, b) => a.m - b.m)[0];
  if (weakest && weakest.wrong > 0) {
    items.push({
      kind: 'risk', title: '重点风险',
      text: `${weakest.s.name}掌握度仅 ${weakest.m}%，未掌握错题 ${weakest.wrong} 道，是拉开差距的关键科目。`
    });
  } else if (wrong > 0) {
    items.push({ kind: 'risk', title: '重点风险', text: `还有 ${wrong} 道错题未掌握，建议加入每日回炉计划。` });
  }

  if (p && p.exam_date) {
    const date = String(p.exam_date).slice(0, 10);
    const daysLeft = Math.max(0, Math.ceil((new Date(`${date}T00:00:00`) - new Date(new Date().toDateString())) / 86400000));
    items.push({
      kind: 'warn', title: '时间建议',
      text: `距离考试还有 ${daysLeft} 天，当前计划完成 ${p.percent}%，建议每天至少打卡 2 项任务稳步追赶进度。`
    });
  } else {
    items.push({ kind: 'warn', title: '时间建议', text: '还没有设置考试日期，生成复习计划后可按天安排任务。' });
  }
  return items;
});
function diagTagClass(kind) {
  return kind === 'ok' ? 'tag-ok' : kind === 'risk' ? 'tag-bad' : kind === 'info' ? 'tag-brand' : 'tag-warn';
}

async function load() {
  loading.value = true;
  error.value = false;
  try {
    const [ov, planRes, subs] = await Promise.allSettled([
      getOverview(), getCurrentPlan(), getSubjects()
    ]);
    overview.value = ov.status === 'fulfilled' ? ov.value : null;
    if (ov.status !== 'fulfilled') error.value = true;
    plan.value = planRes.status === 'fulfilled' ? planRes.value : null;
    subjects.value = subs.status === 'fulfilled' ? (subs.value || []) : [];
    await Promise.all(subjects.value.map(async (s) => {
      try {
        const [q, w] = await Promise.all([
          getQuestions({ subject_id: s.id, page: 1, size: 1 }),
          getWrongQuestions({ subject_id: s.id, mastered: 0, page: 1, size: 1 })
        ]);
        mastery[s.id] = { total: q.total || 0, wrong: w.total || 0 };
      } catch (e) { /* 单科失败不影响整体 */ }
    }));
  } catch (e) {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div v-loading="loading" class="page-pad">
    <div class="page-head">
      <div>
        <h1>学情报告</h1>
        <p class="sub">基于答题记录和学习时长，AI 每周生成一次诊断。</p>
      </div>
      <div class="seg">
        <button
          v-for="r in ['近 7 周', '近 30 天']"
          :key="r"
          class="seg-item"
          :class="{ active: range === r }"
          @click="range = r"
        >{{ r }}</button>
      </div>
    </div>

    <div v-if="error" class="alert">
      <span class="alert-main">学情数据加载失败</span>
      <button class="btn btn-ghost" @click="load()">重新加载</button>
    </div>

    <!-- 统计卡 -->
    <div class="stat-grid">
      <div v-for="c in statCards" :key="c.label" class="panel stat-card">
        <div class="label">{{ c.label }}</div>
        <div class="value-row">
          <span class="value">{{ c.value }}</span>
          <span class="unit">{{ c.unit }}</span>
        </div>
        <div class="note">{{ c.note }}</div>
      </div>
    </div>

    <!-- 趋势 + 雷达 -->
    <div class="grid-top">
      <section class="panel panel-pad">
        <div class="chart-head">
          <h2>预估分趋势</h2>
          <span class="text-xs" :class="trendRise >= 0 ? 'text-ok' : 'text-bad'">
            {{ trendRise >= 0 ? '↑' : '↓' }} {{ Math.abs(trendRise) }} 分，自第 1 周起
          </span>
        </div>
        <div>
          <svg :viewBox="`0 0 ${TW} ${TH}`" class="chart" @mouseleave="hoverIdx = null">
            <g v-for="t in trendGeo.ticks" :key="t.v">
              <line :x1="TPAD" :x2="TW - TPAD" :y1="t.y" :y2="t.y" stroke="var(--border)" />
              <text x="0" :y="t.y + 4" font-size="10" fill="var(--text-2)">{{ t.v }}</text>
            </g>
            <polygon
              :points="`${TPAD},${TH - TPAD} ${trendGeo.line} ${TW - TPAD},${TH - TPAD}`"
              fill="var(--primary)"
              opacity="0.07"
            />
            <polyline :points="trendGeo.line" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linejoin="round" />
            <g
              v-for="(p, i) in trendGeo.coords"
              :key="i"
              @mouseenter="hoverIdx = i"
            >
              <circle :cx="p[0]" :cy="p[1]" r="14" fill="transparent" />
              <circle
                :cx="p[0]" :cy="p[1]"
                :r="hoverIdx === i ? 5 : 3.5"
                fill="#fff"
                stroke="var(--primary)"
                stroke-width="2"
              />
              <text
                v-if="hoverIdx === i"
                :x="p[0]" :y="p[1] - 12"
                text-anchor="middle"
                font-size="12"
                font-weight="700"
                fill="var(--text)"
              >{{ trendPoints[i] }}</text>
            </g>
          </svg>
          <div class="trend-labels">
            <span v-for="l in trendLabels" :key="l">{{ l }}</span>
          </div>
        </div>
        <p class="chart-note">走势为按当前预估分回推的示例曲线，接入逐周作答统计后将展示真实趋势。</p>
      </section>

      <section class="panel panel-pad">
        <h2>能力雷达</h2>
        <svg v-if="dims.length" viewBox="0 0 240 240" class="radar">
          <polygon
            v-for="k in [0.25, 0.5, 0.75, 1]"
            :key="k"
            :points="dims.map((_, i) => radarPt(i, k, dims.length).join(',')).join(' ')"
            fill="none"
            stroke="var(--border)"
          />
          <line
            v-for="(_, i) in dims"
            :key="`spoke-${i}`"
            :x1="RC" :y1="RC"
            :x2="radarPt(i, 1, dims.length)[0]"
            :y2="radarPt(i, 1, dims.length)[1]"
            stroke="var(--border)"
          />
          <polygon :points="radarPoly(dims.map((d) => d.t))" fill="none" stroke="var(--text-2)" stroke-dasharray="4 3" />
          <polygon :points="radarPoly(dims.map((d) => d.v))" fill="var(--primary)" fill-opacity="0.15" stroke="var(--primary)" stroke-width="2" />
          <text
            v-for="(d, i) in dims"
            :key="d.n"
            :x="radarPt(i, 1.2, dims.length)[0]"
            :y="radarPt(i, 1.2, dims.length)[1] + 4"
            font-size="11"
            text-anchor="middle"
            fill="var(--text)"
          >{{ d.n }}</text>
        </svg>
        <div class="radar-legend">
          <span class="legend-item"><i class="bar-solid"></i>当前</span>
          <span class="legend-item"><i class="bar-dashed"></i>目标</span>
        </div>
      </section>
    </div>

    <!-- 热力图 + 诊断 -->
    <div class="grid-bottom">
      <section class="panel panel-pad">
        <h2>学习热力图</h2>
        <div class="heatmap" :style="{ gridTemplateColumns: `repeat(${heatWeeks}, minmax(0, 1fr))` }">
          <div
            v-for="c in heatmap"
            :key="c.key"
            class="heat-cell"
            :style="{ opacity: c.opacity }"
            :title="`${c.key}：完成 ${c.done} 项`"
          ></div>
        </div>
        <div class="text-xs muted mt-3">颜色越深，当日完成任务越多</div>
      </section>

      <section class="panel panel-pad">
        <h2>AI 诊断结论</h2>
        <ul class="diag-list">
          <li v-for="(d, i) in diagnosis" :key="i" class="diag-row">
            <span class="tag" :class="diagTagClass(d.kind)">{{ d.title }}</span>
            <span class="diag-text">{{ d.text }}</span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.grid-top {
  display: grid;
  gap: 24px;
  grid-template-columns: 1fr;
}
@media (min-width: 1280px) {
  .grid-top { grid-template-columns: 1.4fr 1fr; }
}
.grid-bottom {
  display: grid;
  gap: 24px;
  grid-template-columns: 1fr;
}
@media (min-width: 1280px) {
  .grid-bottom { grid-template-columns: 1fr 1.2fr; }
}
.chart-head {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.trend-labels {
  display: flex;
  justify-content: space-between;
  padding: 0 4px;
  font-size: 12px;
  color: var(--text-2);
}
.chart-note { margin-top: 12px; font-size: 12px; color: var(--text-3); }
.radar {
  margin: 8px auto 0;
  display: block;
  width: 100%;
  max-width: 280px;
}
.radar-legend {
  margin-top: 8px;
  display: flex;
  justify-content: center;
  gap: 20px;
  font-size: 12px;
  color: var(--text-2);
}
.legend-item { display: flex; align-items: center; gap: 6px; }
.bar-solid { width: 16px; height: 2px; background: var(--primary); }
.bar-dashed { width: 16px; height: 0; border-top: 1px dashed var(--text-2); }
.heatmap {
  margin-top: 16px;
  display: grid;
  grid-template-rows: repeat(7, 1fr);
  grid-auto-flow: column;
  gap: 6px;
}
.heat-cell {
  aspect-ratio: 1;
  border-radius: 3px;
  background: var(--primary);
}
.diag-list {
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.diag-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  font-size: 14px;
  line-height: 1.625;
}
.diag-row .tag { margin-top: 2px; flex-shrink: 0; height: fit-content; }
.diag-text { color: var(--text-2); }
</style>
