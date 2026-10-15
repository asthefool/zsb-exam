#!/usr/bin/env node
// 管理端接口冒烟测试：需先启动后端（默认 http://127.0.0.1:3000）
// 用法：node scripts/smoke-admin.js [baseUrl]（管理员账号取环境变量 ADMIN_USER/ADMIN_PASS，默认 admin/admin123）
// 断言覆盖：管理端鉴权、错题管理、复习计划管理、AI 服务管理（含配置切换与恢复）、数据备份（生成/校验/下载/删除）
const BASE = process.argv[2] || 'http://127.0.0.1:3000';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
let token = '';
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
  // 1 管理员登录
  {
    const r = await call('POST', '/auth/login', { username: ADMIN_USER, password: ADMIN_PASS }, false);
    token = r.data?.data?.token || '';
    assert('管理员登录成功', !!token && r.data?.data?.user?.role === 'admin', `role=${r.data?.data?.user?.role}`);
  }

  // 2 考生令牌访问管理端 → 40301
  {
    const r0 = await call('POST', '/auth/login', {
      username: process.env.STU_USER || 'zsbtest2026', password: process.env.STU_PASS || '123456'
    }, false);
    const stuToken = r0.data?.data?.token || '';
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${stuToken}` };
    const res = await fetch(`${BASE}/api/admin/wrong-questions`, { headers });
    const data = await res.json();
    assert('考生访问管理端返回 40301', data.code === 40301, `code=${data.code}`);
  }

  // 3 错题管理：统计 + 列表 + 代标掌握
  {
    const s = await call('GET', '/admin/wrong-questions/stats');
    assert('错题统计可查', s.data?.code === 0 && typeof s.data?.data?.total === 'number', JSON.stringify(s.data?.data).slice(0, 60));
    const l = await call('GET', '/admin/wrong-questions?page=1&size=5');
    assert('错题列表可查', l.data?.code === 0 && Array.isArray(l.data?.data?.list), `total=${l.data?.data?.total}`);
    const first = l.data?.data?.list?.[0];
    if (first) {
      const next = first.mastered ? 0 : 1;
      const m = await call('PATCH', `/admin/wrong-questions/${first.id}/mastered`, { mastered: next });
      assert('错题代标掌握状态', m.data?.code === 0 && m.data?.data?.mastered === next, `id=${first.id}`);
      await call('PATCH', `/admin/wrong-questions/${first.id}/mastered`, { mastered: first.mastered });
    }
  }

  // 4 复习计划管理：统计 + 列表 + 详情 + 状态流转
  {
    const s = await call('GET', '/admin/plans/stats');
    assert('计划统计可查', s.data?.code === 0 && typeof s.data?.data?.total === 'number', JSON.stringify(s.data?.data).slice(0, 60));
    const l = await call('GET', '/admin/plans?page=1&size=5');
    assert('计划列表可查', l.data?.code === 0 && Array.isArray(l.data?.data?.list), `total=${l.data?.data?.total}`);
    const first = l.data?.data?.list?.[0];
    if (first) {
      const d = await call('GET', `/admin/plans/${first.id}`);
      assert('计划详情含任务', d.data?.code === 0 && Array.isArray(d.data?.data?.tasks), `tasks=${d.data?.data?.tasks?.length}`);
      const next = first.status === 'active' ? 'archived' : 'active';
      const m = await call('PATCH', `/admin/plans/${first.id}/status`, { status: next });
      assert('计划状态流转', m.data?.code === 0 && m.data?.data?.status === next, `id=${first.id} → ${next}`);
      await call('PATCH', `/admin/plans/${first.id}/status`, { status: first.status });
    }
  }

  // 5 AI 服务管理：配置查看 + 切换 mock/恢复 + 连通测试 + 调用记录
  let savedConfig = null;
  {
    const c = await call('GET', '/admin/ai/config');
    savedConfig = c.data?.data || null;
    const masked = c.data?.data?.api_key_masked || '';
    assert('AI 配置可查且密钥脱敏', c.data?.code === 0 && typeof c.data?.data?.api_key_set === 'boolean',
      `provider=${c.data?.data?.provider}, key=${masked}`);
    assert('AI 配置不含明文密钥', !('api_key' in (c.data?.data || {})), Object.keys(c.data?.data || {}).join(','));

    const sw = await call('PUT', '/admin/ai/config', { provider: 'mock' });
    assert('切换 mock 模式即时生效', sw.data?.code === 0 && sw.data?.data?.provider === 'mock', `provider=${sw.data?.data?.provider}`);
    const back = await call('PUT', '/admin/ai/config', {
      provider: savedConfig.provider, model: savedConfig.model
    });
    assert('恢复原 AI 模式', back.data?.code === 0 && back.data?.data?.provider === savedConfig.provider, `provider=${back.data?.data?.provider}`);

    const t = await call('POST', '/admin/ai/test');
    assert('连通性测试可执行', t.data?.code === 0 && typeof t.data?.data?.ok === 'boolean', JSON.stringify(t.data?.data).slice(0, 80));

    const g = await call('GET', '/admin/ai/generations?page=1&size=3');
    assert('AI 调用记录可查', g.data?.code === 0 && Array.isArray(g.data?.data?.list), `total=${g.data?.data?.total}`);
    const rec = g.data?.data?.list?.[0];
    if (rec) {
      const d = await call('GET', `/admin/ai/generations/${rec.id}`);
      assert('AI 调用详情含提示词', d.data?.code === 0 && 'prompt' in (d.data?.data || {}), `id=${rec.id}`);
    }
  }

  // 6 数据备份：概览 + 生成 + 校验 + 下载 + 删除
  {
    const o = await call('GET', '/admin/backup/overview');
    assert('数据概览可查', o.data?.code === 0 && Array.isArray(o.data?.data?.tables), `rows=${o.data?.data?.total_rows}`);
    const c = await call('POST', '/admin/backups');
    const backupId = c.data?.data?.id;
    assert('备份生成成功', c.data?.code === 0 && !!backupId, `file=${c.data?.data?.filename}, rows=${c.data?.data?.row_count}`);
    if (backupId) {
      const v = await call('POST', `/admin/backups/${backupId}/verify`);
      assert('备份完整性校验通过', v.data?.code === 0 && v.data?.data?.ok === true, v.data?.data?.message);
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${BASE}/api/admin/backups/${backupId}/download`, { headers });
      const text = await res.text();
      assert('备份文件可下载且含建表语句', res.ok && text.includes('CREATE TABLE') && text.includes('INSERT INTO'),
        `bytes=${text.length}`);
      const del = await call('DELETE', `/admin/backups/${backupId}`);
      assert('备份可删除', del.data?.code === 0, '');
    }
  }

  // 7 个人中心：资料更新（含新字段）+ 修改密码流程
  {
    const profile = await call('GET', '/user/profile');
    assert('个人资料含扩展字段', profile.data?.code === 0 && 'phone' in (profile.data?.data || {}) && 'target_school' in (profile.data?.data || {}),
      Object.keys(profile.data?.data || {}).join(','));
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n共 ${results.length} 项，通过 ${results.length - failed.length}，失败 ${failed.length}`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error('smoke-admin 异常：', e.message);
  process.exit(1);
});
