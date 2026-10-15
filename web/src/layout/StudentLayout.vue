<script setup>
// 考生端布局：左侧栏（232px）+ 顶部日期/用户条（对齐 UI 库 App.tsx 学生端结构）
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '../stores/user';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// 图标路径与 UI 库 nav 定义一致
const navs = [
  { path: '/', label: '今日计划', icon: 'M4 5h16M4 12h16M4 19h10' },
  { path: '/practice', label: '智能题库', icon: 'M5 4h14v16H5zM9 9h6M9 13h6' },
  { path: '/exam', label: '模拟考场', icon: 'M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z' },
  { path: '/wrong-book', label: '错题本', icon: 'M6 4h12v16l-6-4-6 4z' },
  { path: '/report', label: '学情报告', icon: 'M5 20V10M12 20V4M19 20v-7' },
  { path: '/plan', label: '复习计划', icon: 'M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1zM9 14l2 2 4-4' }
];

// 移动端底部五个标签（<768px 显示），学情报告/复习计划/个人资料收进「我的」
const tabs = [
  { path: '/', label: '今日', icon: 'M4 5h16M4 12h16M4 19h10' },
  { path: '/practice', label: '题库', icon: 'M5 4h14v16H5zM9 9h6M9 13h6' },
  { path: '/exam', label: '考场', icon: 'M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z' },
  { path: '/wrong-book', label: '错题', icon: 'M6 4h12v16l-6-4-6 4z' },
  { path: '/me', label: '我的', icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0' }
];
const ME_CHILDREN = ['/me', '/report', '/plan', '/profile'];

const active = computed(() => {
  const seg = route.path.split('/')[1] || '';
  return seg ? `/${seg}` : '/';
});

const tabActive = computed(() => (ME_CHILDREN.includes(active.value) ? '/me' : active.value));

// 从「我的」进入的子页面：手机端显示带返回箭头的标题栏
const isMobileSub = computed(() => ['/report', '/plan', '/profile'].includes(active.value));

// 底部导航只在五个主页面显示，其余页面隐藏
const showTabbar = computed(() => tabs.some((t) => t.path === active.value));

// 任意考生页进入即确保 profile 可用（否则页壳昵称显示兜底"同学"）
onMounted(() => {
  if (userStore.isLoggedIn && !userStore.profile) {
    userStore.fetchProfile().catch(() => { /* 静默：不影响页面功能 */ });
  }
  window.addEventListener('click', closeMenu);
});
onUnmounted(() => window.removeEventListener('click', closeMenu));

const menuOpen = ref(false);
function closeMenu() { menuOpen.value = false; }
function toggleMenu(e) {
  e.stopPropagation();
  menuOpen.value = !menuOpen.value;
}

const today = (() => {
  const d = new Date();
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日 周${week}`;
})();

const nickname = computed(() => userStore.profile?.nickname || userStore.profile?.username || '同学');
const avatarChar = computed(() => nickname.value.slice(0, 1));

function go(path) {
  if (route.path !== path) {
    router.push(path);
    window.scrollTo({ top: 0 });
  }
}

function onLogout() {
  menuOpen.value = false;
  userStore.logout();
  router.push('/login');
}
</script>

<template>
  <div class="shell" :class="{ 'm-sub': isMobileSub, 'm-notab': !showTabbar }">
    <aside class="aside">
      <button class="brand" @click="go('/')">
        <span class="brand-name">专升本<span>智能备考</span></span>
      </button>
      <nav class="nav">
        <button
          v-for="n in navs"
          :key="n.path"
          class="nav-item"
          :class="{ active: active === n.path }"
          @click="go(n.path)"
        >
          <svg viewBox="0 0 24 24" class="nav-icon" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path :d="n.icon" />
          </svg>
          {{ n.label }}
        </button>
      </nav>
      <div class="goal-card">
        <div class="goal-label">当前目标</div>
        <div class="goal-title">计算机科学与技术</div>
        <div class="goal-sub">本省理工类，2027 年统考</div>
      </div>
    </aside>

    <header v-if="isMobileSub" class="m-subbar">
      <button class="m-back" aria-label="返回" @click="router.push('/me')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      <span class="m-title">{{ route.meta.title }}</span>
      <span class="m-spacer" aria-hidden="true"></span>
    </header>

    <div class="main-col">
      <header class="topbar">
        <div class="date">{{ today }}</div>
        <div class="user" @click.stop="toggleMenu">
          <button class="user-chip" aria-haspopup="menu" :aria-expanded="menuOpen">
            <span class="name">{{ nickname }}</span>
            <span class="avatar">{{ avatarChar }}</span>
          </button>
          <div v-if="menuOpen" role="menu" class="menu">
            <button role="menuitem" class="menu-item" @click="menuOpen = false; go('/profile')">个人中心</button>
            <button v-if="userStore.isAdmin" role="menuitem" class="menu-item" @click="menuOpen = false; router.push('/admin/questions')">后台管理</button>
            <div class="menu-divider"></div>
            <button role="menuitem" class="menu-item danger" @click="onLogout">退出登录</button>
          </div>
        </div>
      </header>

      <main class="content">
        <router-view />
      </main>
    </div>

    <nav v-if="showTabbar" class="tabbar" aria-label="主导航">
      <button
        v-for="t in tabs"
        :key="t.path"
        class="tab"
        :class="{ active: tabActive === t.path }"
        :aria-current="tabActive === t.path ? 'page' : undefined"
        @click="go(t.path)"
      >
        <svg viewBox="0 0 24 24" class="tab-icon" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path :d="t.icon" />
        </svg>
        {{ t.label }}
      </button>
    </nav>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr;
}
@media (min-width: 1024px) {
  .shell { grid-template-columns: 232px 1fr; }
}
.aside {
  background: var(--card);
  border-bottom: 1px solid var(--border);
  padding: 16px;
  display: flex;
  flex-direction: column;
}
@media (min-width: 1024px) {
  .aside {
    position: sticky;
    top: 0;
    height: 100vh;
    padding: 24px 16px;
    border-bottom: none;
    border-right: 1px solid var(--border);
  }
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px;
  background: none;
  border: none;
  text-align: left;
}
.brand-name {
  font: 600 17px/1.2 var(--font-serif);
  letter-spacing: 0.16em;
  color: var(--text);
}
.brand-name span { font-weight: 400; opacity: 0.72; }
.nav {
  margin-top: 16px;
  display: flex;
  gap: 4px;
  overflow-x: auto;
}
@media (min-width: 1024px) {
  .nav { margin-top: 32px; flex-direction: column; overflow: visible; }
}
.nav-item {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 20px;
  color: var(--text-2);
  white-space: nowrap;
  transition: background-color 0.15s, color 0.15s;
}
.nav-item:hover { background: var(--bg); color: var(--text); }
.nav-item.active { background: var(--primary-soft); color: var(--primary); font-weight: 500; }
.nav-icon { width: 18px; height: 18px; flex-shrink: 0; }
.goal-card {
  margin-top: auto;
  display: none;
  border-radius: 12px;
  background: var(--bg);
  padding: 16px;
}
@media (min-width: 1024px) {
  .goal-card { display: block; }
}
.goal-label { font-size: 12px; color: var(--text-2); }
.goal-title { margin-top: 4px; font-size: 14px; font-weight: 500; }
.goal-sub { margin-top: 2px; font-size: 12px; color: var(--text-2); }
.main-col { min-width: 0; }
.topbar {
  position: relative;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  padding: 14px 24px;
}
@media (min-width: 640px) {
  .topbar { padding: 14px 40px; }
}
.date { font-size: 14px; color: var(--text-2); }
.user { position: relative; }
.user-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  background: transparent;
  border-radius: 999px;
  padding: 4px 4px 4px 12px;
  transition: background-color 0.15s;
}
.user-chip:hover { background: var(--bg); }
.user-chip .name { font-size: 14px; color: var(--text); }
.user-chip .avatar {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 14px;
  font-weight: 500;
}
.menu {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 8px;
  width: 160px;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--card);
  padding: 4px 0;
  font-size: 14px;
  box-shadow: 0 12px 32px rgba(15, 26, 43, 0.14);
}
.menu-item {
  display: block;
  width: 100%;
  border: none;
  background: transparent;
  padding: 10px 16px;
  text-align: left;
  color: var(--text);
}
.menu-item:hover { background: var(--bg); }
.menu-item.danger { color: var(--red); }
.menu-divider { margin: 4px 0; border-top: 1px solid var(--border); }
.content { padding: 32px 24px; }
@media (min-width: 640px) {
  .content { padding: 32px 40px; }
}

.tabbar { display: none; }
.m-subbar { display: none; }
@media (max-width: 767px) {
  .aside { display: none; }
  .topbar { display: none; }
  .m-subbar {
    position: sticky;
    top: 0;
    z-index: 30;
    display: grid;
    grid-template-columns: 44px 1fr 44px;
    align-items: center;
    height: 52px;
    margin-top: env(safe-area-inset-top);
    border-bottom: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
  }
  .m-back {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: none;
    background: transparent;
    color: var(--text);
  }
  .m-back svg { width: 22px; height: 22px; }
  .m-title { text-align: center; font-size: 17px; font-weight: 600; color: var(--text); }
  .m-spacer { display: block; }
  .shell.m-sub :deep(.page-head h1),
  .shell.m-sub :deep(.page-head .sub) { display: none; }
  .shell.m-sub :deep(.page-head:not(:has(.seg))) { display: none; }
  .shell.m-notab .content { padding-bottom: 24px; }
  .content {
    padding: 16px 14px calc(84px + env(safe-area-inset-bottom));
  }
  .tabbar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 40;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    border-top: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    padding-bottom: env(safe-area-inset-bottom);
  }
  .tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-height: 56px;
    padding: 8px 0 6px;
    border: none;
    background: transparent;
    font-size: 11px;
    color: var(--text-2);
  }
  .tab.active { color: var(--primary); font-weight: 500; }
  .tab-icon { width: 22px; height: 22px; }
}
</style>
