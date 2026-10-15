#!/usr/bin/env node
// 接口冒烟测试：需先启动后端（默认 http://127.0.0.1:3000）
// 用法：node scripts/smoke-test.js [baseUrl]
// 断言覆盖：健康检查、注册登录、鉴权拒绝、个人信息、刷题、错题、计划、AI mock 讲解
const BASE = process.argv[2] || 'http://127.0.0.1:3000';
let token = '';
let userId = null;
let questionId = null;
let wrongId = null;
let planTaskId = null;
const results = [];

async function call(method, path, body, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function assert(name, cond, detail = '') {
  results.push({ name, ok: !!cond, detail });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

(async () => {
  const suffix = Date.now().toString(36);
  const username = `smoke_${suffix}`;
  const password = 'smoke123456';

  // 1 健康检查（无鉴权）
  {
    const r = await call('GET', '/health', null, false);
    assert('健康检查返回 up', r.data?.data?.status === 'up' || r.data?.code === 0, JSON.stringify(r.data).slice(0, 80));
  }

  // 2 无令牌访问受保护接口 → 40101
  {
    const headers = { 'Content-Type': 'application/json' };
    const res = await fetch(`${BASE}/api/user/profile`, { headers });
    const data = await res.json();
    assert('未登录访问 profile 返回 40101', data.code === 40101, `code=${data.code}`);
  }

  // 3 注册
  {
    const r = await call('POST', '/auth/register', { username, password, nickname: '冒烟用户' }, false);
    assert('注册成功', r.data?.code === 0, `code=${r.data?.code}`);
  }

  // 4 登录
  {
    const r = await call('POST', '/auth/login', { username, password }, false);
    token = r.data?.data?.token || '';
    userId = r.data?.data?.user?.id;
    assert('登录成功并取得 token', !!token, `uid=${userId}`);
  }

  // 5 查询科目
  {
    const r = await call('GET', '/subjects');
    assert('科目列表非空', Array.isArray(r.data?.data) && r.data.data.length > 0);
  }

  // 6 题目列表不含答案
  {
    const r = await call('GET', '/questions?page=1&size=5');
    const list = r.data?.data?.list || [];
    questionId = list[0]?.id;
    const leak = list.some((q) => q.answer != null || q.analysis != null);
    assert('题目列表不下发 answer/analysis', list.length > 0 && !leak, `n=${list.length}`);
  }

  // 7 提交作答（故意答错 → 进错题本）
  if (questionId) {
    const r = await call('POST', '/answers', { question_id: questionId, user_answer: 'Z' });
    assert('提交作答返回判分', r.data?.code === 0 && r.data?.data?.is_correct !== undefined,
      `correct=${r.data?.data?.is_correct}`);
  }

  // 8 错题列表
  {
    const r = await call('GET', '/wrong-questions?page=1&size=10&mastered=0');
    const list = r.data?.data?.list || [];
    wrongId = list[0]?.id;
    assert('错题已归集', list.length > 0, `wrongId=${wrongId}`);
  }

  // 9 错题详情不泄露答案
  if (wrongId) {
    const r = await call('GET', `/wrong-questions/${wrongId}`);
    const q = r.data?.data?.question || {};
    assert('错题详情不下发 answer/analysis', q.answer == null && q.analysis == null,
      `keys=${Object.keys(q).join(',')}`);
  }

  // 10 生成 AI 讲解（mock）三段式
  if (wrongId) {
    const r = await call('POST', '/ai/explanations', { wrong_question_id: wrongId });
    const content = r.data?.data?.content || '';
    const ok3 = content.includes('错因分析') && content.includes('解题思路') && content.includes('知识点提示');
    assert('AI 讲解含三段式结构', r.data?.code === 0 && ok3, `provider=${r.data?.data?.provider}`);
  }

  // 11 生成复习计划
  {
    const exam = new Date();
    exam.setDate(exam.getDate() + 30);
    const y = exam.getFullYear();
    const m = String(exam.getMonth() + 1).padStart(2, '0');
    const d = String(exam.getDate()).padStart(2, '0');
    const exam_date = `${y}-${m}-${d}`;
    const r = await call('POST', '/plans/generate', { exam_date, daily_minutes: 60 });
    const plan = r.data?.data;
    const tasks = plan?.tasks || [];
    planTaskId = tasks[0]?.id;
    // 日期不应比考试日少一天/多一天（东八区回归）
    const dateOk = !plan?.exam_date || String(plan.exam_date).slice(0, 10) === exam_date
      || String(plan.exam_date).includes(exam_date);
    assert('生成计划成功', r.data?.code === 0 && tasks.length > 0, `tasks=${tasks.length}`);
    assert('计划考试日与提交一致（无时区错位）', dateOk,
      `req=${exam_date} resp=${plan?.exam_date}`);
  }

  // 12 任务打卡 + 重复打卡 40901
  if (planTaskId) {
    const r1 = await call('PATCH', `/plan-tasks/${planTaskId}/check-in`);
    assert('任务打卡成功', r1.data?.code === 0);
    const r2 = await call('PATCH', `/plan-tasks/${planTaskId}/check-in`);
    assert('重复打卡返回 40901', r2.data?.code === 40901, `code=${r2.data?.code}`);
  }

  // 13 修改昵称
  {
    const r = await call('PUT', '/user/profile', { nickname: '冒烟昵称' });
    assert('修改昵称成功', r.data?.code === 0 && r.data?.data?.nickname === '冒烟昵称',
      JSON.stringify(r.data?.data));
  }

  // 14 考生访问管理端 → 40301
  {
    const r = await call('GET', '/admin/questions');
    assert('考生访问管理端返回 40301', r.data?.code === 40301, `code=${r.data?.code}`);
  }

  // 15 错误密码登录 → 40102
  {
    const r = await call('POST', '/auth/login', { username, password: 'wrong-pass' }, false);
    assert('密码错误返回 40102', r.data?.code === 40102, `code=${r.data?.code}`);
  }

  const passed = results.filter((x) => x.ok).length;
  const failed = results.length - passed;
  console.log(`\n===== 冒烟结果：${passed}/${results.length} 通过，失败 ${failed} =====`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error('冒烟脚本异常：', e);
  process.exit(1);
});
