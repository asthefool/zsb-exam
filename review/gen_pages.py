# -*- coding: utf-8 -*-
"""从 audit.json 生成每页报告 pages/PAGE-xxx.md（组件表/场景表自动，结论手写）。"""
import json, os
d = json.load(open('review/audit.json', encoding='utf-8'))
os.makedirs('review/pages', exist_ok=True)
inst = {i['id']: i for i in d['instances']}
defs = {x['id']: x for x in d['definitions']}
plans = {p['instance_id']: p for p in d['component_plans']}
bypid = {b['definition_id']: b['id'] for b in d['component_blueprints']}
fnds = d['findings']
scns = d['scenarios']
checks = d['checks']

def checks_of(iid):
    return [c for c in checks if c['target_id'] == iid]

def fnds_of(iid):
    return [f['id'] for f in fnds if iid in f['instance_ids']]

NOTES = {
'PAGE-001': '登录页校验、错误凭据反馈、redirect 回跳均通过；原移动端固定宽（FND-002）与 submit 无 catch/redirect 未校验（FND-011）已修复并复验（EV-229/236）。',
'PAGE-002': '注册校验三分支、撞名 40901 提示通过；原固定宽与无 catch 问题已修复（EV-229/236）。',
'PAGE-003': '概览/空态/入口卡跳转通过；入口卡键盘语义、移动端挤压、错误态、昵称来源四项（FND-002/004/007/009）已修复，入口卡键盘端到端随 TASK-011 人工走查。',
'PAGE-004': '判分三分支、筛选重置、跨页往返均通过；原"上一题"死按钮（FND-003）、选项语义（FND-004）、judge 展示（FND-005）已修复（EV-230/231）。',
'PAGE-005': '列表/筛选/详情/重练/掌握/讲解全链路通过；列表同步（FND-006）、讲解状态机（FND-008）、抽屉宽度（FND-002）、防重入（FND-010）已修复（EV-232/234）。',
'PAGE-006': '生成/打卡/重生成确认链路通过；错误态与空态区分（FND-009）、防重入（FND-010）已修复；日期选择器面板交互已补证（EV-238）。',
'PAGE-007': '查看/改昵称/空值拦截通过；错误态（FND-009）与防重入（FND-010）已修复（EV-235/232）。',
'PAGE-008': 'CRUD/校验链/软删通过；关键词搜索（FND-001，SQL ESCAPE）与失败错误态、加载阻断（FND-009）已修复（EV-227/228）。',
'PAGE-009': '启用禁用双向、自身保护、管理员保护全部通过；无遗留问题。',
'PAGE-010': '未知路径重定向两态正确；redirect 白名单加固已验证（EV-236）。',
}
EV = {'PAGE-001': 'EV-202', 'PAGE-002': 'EV-202', 'PAGE-003': 'EV-203', 'PAGE-004': 'EV-204', 'PAGE-005': 'EV-206',
      'PAGE-006': 'EV-208', 'PAGE-007': 'EV-209', 'PAGE-008': 'EV-211', 'PAGE-009': 'EV-213', 'PAGE-010': 'EV-215'}

for p in d['pages']:
    pid = p['id']
    rows = [i for i in d['instances'] if i['page_id'] == pid]
    lines = [f"# {pid} {p['title']}", '', '## 页面身份', '',
             f"- **PAGE**：{pid}　**路由**：`{p['route']}`",
             f"- **入口条件**：{'；'.join(p['entry_conditions'])}",
             f"- **变体**：{'；'.join(p['variants'])}",
             f"- **源码**：{p['source_locator']}",
             f"- **运行证据**：{EV[pid]}（详见 audit.json evidence）",
             f"- **基线**：本地 vite:5173 + express:3000（AI mock），2026-10-10",
             '', '## 本页结论', '', NOTES[pid], '', '## 全部组件（CMP）', '',
             '| CMP | 父CMP | DEF | 定位 | 变体 | CHK(过/败/阻) | FND | 处置 | BP/TASK |', '|---|---|---|---|---|---|---|---|---|']
    for i in rows:
        cs = checks_of(i['id'])
        stat = f"{sum(1 for c in cs if c['status']=='passed')}/{sum(1 for c in cs if c['status']=='failed')}/{sum(1 for c in cs if c['status']=='blocked')}"
        f = ','.join(fnds_of(i['id'])) or '—'
        pl = plans[i['id']]
        task = ','.join(pl['task_ids']) or '—'
        lines.append(f"| {i['id']} {i['label']} | {i.get('parent_instance_id','—')} | {i['definition_id']} | {i['locator']} | {i['variant']} | {stat} | {f} | {pl['disposition']} | {bypid[i['definition_id']]}/{task} |")
    lines += ['', '> 八维检查明细（逐维度问题、状态、EV、关联）见 audit.json 的 checks；本表给出分布。', '', '## 状态与交互（SCN）', '',
              '| SCN | 前提 | 步骤 | 预期 | 状态 | EV | FND |', '|---|---|---|---|---|---|---|']
    for s in scns:
        if pid not in s['page_ids']:
            continue
        pre = '；'.join(s['preconditions'])[:40]
        steps = '→'.join(s['steps'])[:56]
        exp = '；'.join(s['expected'])[:56]
        lines.append(f"| {s['id']} {s['title']} | {pre} | {steps} | {exp} | {s['status']} | {','.join(s['evidence_ids']) or '—'} | {','.join(s['finding_ids']) or '—'} |")
    lines += ['', '## 本页迁移与回归', '']
    tset = {}
    for i in rows:
        for t in plans[i['id']]['task_ids']:
            tset.setdefault(t, []).append(i['id'])
    if tset:
        for t, ii in sorted(tset.items()):
            lines.append(f"- **{t}** 影响实例：{', '.join(ii)}（回归：{sorted(set(x for i in ii for x in plans[i]['regression_scenario_ids']))}）")
    else:
        lines.append('- 本页无修改项；全部实例 retain，随核心旅程回归即可。')
    open(f'review/pages/{pid}.md', 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
print('pages written:', len(d['pages']))
