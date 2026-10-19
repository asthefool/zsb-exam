<script setup>
// 管理端布局：左侧栏（220px）+ 顶栏（对齐 UI 库 App.tsx 管理端结构）
// 仅 admin 角色可进入（路由守卫 + 后端 40301 双重拦截）
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();

const menus = [
  { path: '/admin/questions', label: '题目管理' },
  { path: '/admin/users', label: '用户管理' },
  { path: '/admin/wrong-questions', label: '错题管理' },
  { path: '/admin/plans', label: '复习计划管理' },
  { path: '/admin/ai', label: 'AI 服务管理' },
  { path: '/admin/backup', label: '数据备份' }
];

function onLogout() {
  userStore.logout();
  router.push('/login');
}
</script>

<template>
  <div class="admin-shell">
    <aside class="aside">
      <div class="brand">后台管理</div>
      <nav class="nav">
        <button
          v-for="m in menus"
          :key="m.path"
          class="nav-item"
          :class="{ active: $route.path === m.path }"
          @click="router.push(m.path)"
        >{{ m.label }}</button>
      </nav>
    </aside>
    <div class="main-col">
      <header class="topbar">
        <div class="title">专升本智能备考系统（管理端）</div>
        <div class="acts">
          <button class="btn-text" @click="router.push('/')">返回考生端</button>
          <button class="exit" @click="onLogout">退出</button>
        </div>
      </header>
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr;
}
@media (min-width: 1024px) {
  .admin-shell { grid-template-columns: 220px 1fr; }
}
.aside {
  background: var(--card);
  border-bottom: 1px solid var(--border);
}
@media (min-width: 1024px) {
  .aside {
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
    border-bottom: none;
    border-right: 1px solid var(--border);
  }
}
.brand {
  padding: 20px 24px;
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 700;
  color: var(--primary);
}
.nav {
  display: flex;
  gap: 4px;
  padding: 0 12px 12px;
}
@media (min-width: 1024px) {
  .nav { flex-direction: column; }
}
.nav-item {
  border: none;
  background: transparent;
  border-radius: 8px;
  padding: 10px 12px;
  text-align: left;
  font-size: 14px;
  line-height: 20px;
  color: var(--text-2);
  transition: background-color 0.15s, color 0.15s;
}
.nav-item:hover { background: var(--bg); color: var(--text); }
.nav-item.active { background: var(--primary-soft); color: var(--primary); font-weight: 500; }
.main-col { min-width: 0; }
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
  background: var(--card);
  padding: 14px 24px;
}
@media (min-width: 640px) {
  .topbar { padding: 14px 40px; }
}
.title { font-size: 14px; color: var(--text-2); }
.acts { display: flex; align-items: center; gap: 16px; font-size: 14px; }
.exit {
  border: none;
  background: none;
  padding: 0;
  color: var(--text-2);
  font-size: 14px;
}
.exit:hover { color: var(--text); }
.content { padding: 32px 24px; }
@media (min-width: 640px) {
  .content { padding: 32px 40px; }
}
</style>
