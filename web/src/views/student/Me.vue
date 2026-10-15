<script setup>
// 移动端「我的」：个人概况、三项统计、功能入口（学情报告 / 复习计划 / 个人资料 / 后台提示）
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../../stores/user';
import { getCurrentPlan, getOverview, getWrongQuestions } from '../../api';

const router = useRouter();
const userStore = useUserStore();

const overview = ref(null);
const stats = reactive({ streak: 0, answers: 0, masteryRate: 0 });

const nickname = computed(() => userStore.profile?.nickname || userStore.profile?.username || '同学');
const avatarChar = computed(() => nickname.value.slice(0, 1));

const examDaysLeft = computed(() => {
  const p = overview.value?.plan_progress;
  if (!p || !p.exam_date) return null;
  const date = String(p.exam_date).slice(0, 10);
  const diff = Math.ceil((new Date(`${date}T00:00:00`) - new Date(new Date().toDateString())) / 86400000);
  return diff >= 0 ? diff : 0;
});

const entries = computed(() => [
  {
    key: 'report',
    path: '/report',
    label: '学情报告',
    icon: 'M5 20V10M12 20V4M19 20v-7',
    hint: overview.value?.mastery?.estimate ? `预估 ${overview.value.mastery.estimate.score} 分` : ''
  },
  {
    key: 'plan',
    path: '/plan',
    label: '复习计划',
    icon: 'M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1zM9 14l2 2 4-4',
    hint: examDaysLeft.value === null ? '未生成' : `未来 ${examDaysLeft.value} 天`
  },
  {
    key: 'profile',
    path: '/profile',
    label: '个人资料',
    icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
    hint: ''
  }
]);

// 连续打卡：从今天往前数，连续有已完成任务的天数（与首页口径一致）
function calcStreak(tasks) {
  const done = new Set();
  for (const t of tasks || []) {
    if (t.status === 'done') done.add(String(t.task_date).slice(0, 10));
  }
  let n = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(Date.now() - i * 86400000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!done.has(key)) break;
    n++;
  }
  return n;
}

async function load() {
  await userStore.fetchProfile().catch(() => {});
  const [ov, plan, all, done] = await Promise.allSettled([
    getOverview(),
    getCurrentPlan(),
    getWrongQuestions({ page: 1, size: 1 }),
    getWrongQuestions({ mastered: 1, page: 1, size: 1 })
  ]);
  overview.value = ov.status === 'fulfilled' ? ov.value : null;
  stats.streak = plan.status === 'fulfilled' ? calcStreak(plan.value?.tasks) : 0;
  stats.answers = overview.value?.total_answers || 0;
  const total = all.status === 'fulfilled' ? all.value.total || 0 : 0;
  const mastered = done.status === 'fulfilled' ? done.value.total || 0 : 0;
  stats.masteryRate = total ? Math.round((mastered / total) * 100) : 0;
}

function go(path) {
  router.push(path);
}

function onLogout() {
  userStore.logout();
  router.push('/login');
}

onMounted(() => {
  load().catch(() => { /* 统计失败不影响入口使用 */ });
});
</script>

<template>
  <div class="me">
    <section class="me-head">
      <span class="me-avatar">{{ avatarChar }}</span>
      <div class="me-info">
        <div class="me-name">{{ nickname }}</div>
        <div class="me-goal">计算机科学与技术，2027 年统考</div>
      </div>
    </section>

    <section class="me-stats">
      <div class="stat">
        <div class="stat-value">{{ stats.streak }}</div>
        <div class="stat-label">连续打卡（天）</div>
      </div>
      <div class="stat">
        <div class="stat-value">{{ stats.answers }}</div>
        <div class="stat-label">累计刷题（题）</div>
      </div>
      <div class="stat">
        <div class="stat-value">{{ stats.masteryRate }}%</div>
        <div class="stat-label">错题掌握率</div>
      </div>
    </section>

    <section class="me-list">
      <button v-for="e in entries" :key="e.key" class="me-row" @click="go(e.path)">
        <span class="row-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path :d="e.icon" />
          </svg>
        </span>
        <span class="row-label">{{ e.label }}</span>
        <span v-if="e.hint" class="row-hint">{{ e.hint }}</span>
        <span class="chev" aria-hidden="true">›</span>
      </button>

      <div v-if="userStore.isAdmin" class="me-row is-disabled" aria-disabled="true">
        <span class="row-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
          </svg>
        </span>
        <span class="row-label">后台管理</span>
        <span class="row-hint">请在电脑端使用</span>
        <span class="chev" aria-hidden="true">›</span>
      </div>
    </section>

    <button class="me-logout" @click="onLogout">退出登录</button>
  </div>
</template>

<style scoped>
.me { display: flex; flex-direction: column; gap: 16px; }

.me-head { display: flex; align-items: center; gap: 16px; padding: 4px 4px 0; }
.me-avatar {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 999px;
  background: var(--primary);
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  flex-shrink: 0;
}
.me-name { font-size: 20px; font-weight: 700; color: var(--text); letter-spacing: -0.01em; }
.me-goal { margin-top: 4px; font-size: 13px; color: var(--text-2); line-height: 1.5; }

.me-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--card);
  padding: 18px 0;
}
.stat { text-align: center; }
.stat + .stat { border-left: 1px solid var(--border); }
.stat-value { font-size: 22px; font-weight: 700; color: var(--text); line-height: 1.2; }
.stat-label { margin-top: 6px; font-size: 12px; color: var(--text-2); }

.me-list {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--card);
}
.me-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 68px;
  border: none;
  border-top: 1px solid var(--border);
  background: transparent;
  padding: 12px 16px;
  text-align: left;
  color: var(--text);
}
.me-list > :first-child { border-top: none; }
.me-row:not(.is-disabled):hover { background: var(--bg); }
.me-row.is-disabled { cursor: default; }
.row-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--primary-soft);
  color: var(--primary);
  flex-shrink: 0;
}
.row-icon svg { width: 20px; height: 20px; }
.row-label { flex: 1; font-size: 16px; color: var(--text); }
.row-hint { font-size: 13px; color: var(--text-2); white-space: nowrap; }
.chev { font-size: 20px; color: var(--text-2); line-height: 1; }
.me-row.is-disabled .row-label { color: var(--text-2); }

.me-logout {
  width: 100%;
  min-height: 44px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--card);
  color: var(--red);
  font-size: 15px;
}
</style>
