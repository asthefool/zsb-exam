// 路由表与权限守卫：meta.requiresAuth 控制登录，meta.role=admin 控制管理端（AC1/AC9）
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/login', name: 'login', component: () => import('../views/student/Login.vue') },
  { path: '/register', name: 'register', component: () => import('../views/student/Register.vue') },
  {
    path: '/',
    component: () => import('../layout/StudentLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'home', component: () => import('../views/student/Home.vue'), meta: { title: '今日计划' } },
      { path: 'practice', name: 'practice', component: () => import('../views/student/Practice.vue'), meta: { title: '智能题库' } },
      { path: 'exam', name: 'mockExam', component: () => import('../views/student/MockExam.vue'), meta: { title: '模拟考场' } },
      { path: 'wrong-book', name: 'wrongBook', component: () => import('../views/student/WrongBook.vue'), meta: { title: '错题本' } },
      { path: 'report', name: 'report', component: () => import('../views/student/Report.vue'), meta: { title: '学情报告' } },
      { path: 'plan', name: 'plan', component: () => import('../views/student/Plan.vue'), meta: { title: '复习计划' } },
      { path: 'profile', name: 'profile', component: () => import('../views/student/Profile.vue'), meta: { title: '个人中心' } },
      { path: 'me', name: 'me', component: () => import('../views/student/Me.vue'), meta: { title: '我的' } }
    ]
  },
  {
    path: '/admin',
    component: () => import('../layout/AdminLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      { path: '', redirect: { name: 'adminQuestions' } },
      { path: 'questions', name: 'adminQuestions', component: () => import('../views/admin/QuestionManage.vue'), meta: { title: '题目管理' } },
      { path: 'users', name: 'adminUsers', component: () => import('../views/admin/UserManage.vue'), meta: { title: '用户管理' } }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
];

const router = createRouter({ history: createWebHistory(), routes });

// 全局前置守卫
router.beforeEach((to) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (to.meta.requiresAuth && !token) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
  // 已登录访问登录/注册页，直接回首页（避免重复登录）
  if (token && (to.name === 'login' || to.name === 'register')) {
    return role === 'admin' ? { path: '/admin/questions' } : { path: '/' };
  }
  // 管理端路由：考生访问时拦截并提示（AC9）；最终以后端 JWT 40301 为准
  if (to.meta.role === 'admin' && role !== 'admin') {
    return { name: 'home' };
  }
  return true;
});

export default router;
