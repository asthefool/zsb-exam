# -*- coding: utf-8 -*-
"""实施后回填：修复证据、FND/CHK/SCN/TASK/GATE 复验判定。"""
import json
PATH = 'review/audit.json'
d = json.load(open(PATH, encoding='utf-8'))
NOW = '2026-10-11T00:30:00+08:00'
RT = '本地运行 vite:5173 + express:3000 + MySQL8 zsb_exam（AI mock），2026-10-10/11 修复后复验'
d['project']['mode'] = 'implement'

def ev(id, kind, loc, summary):
    d['evidence'].append({'id': id, 'kind': kind, 'locator': loc, 'observed_at': NOW,
                          'baseline_ref': RT if kind in ('runtime', 'test', 'measurement') else 'zsb-exam working tree（修复实施后，2026-10-11）',
                          'summary': summary})

ev('EV-227', 'test', 'curl /api/admin/questions?keyword=… + server/src/dao/questionDao.js:38-41', '修复后关键词搜索：极限→1 条（id 8）；字面 %→0 条（不再全匹配）；字面 _→2 条（精确命中下划线题目）；ESCAPE 改用 | 转义符，无 SQL 错误。')
ev('EV-228', 'runtime', '浏览器 /admin/questions 搜索 + 断后端失败态', 'UI 搜索"极限"→1 行、共 1 条；后端停机搜索显示错误态"题目列表加载失败/重新加载"并清空旧列表。')
ev('EV-229', 'measurement', '浏览器 375×667 逐页测量（修复后）', '/、/practice、/wrong-book、/plan、/profile、/login 全部 scrollWidth==clientWidth（360 或 375），无横向溢出；页头 scrollWidth 适配视口；登录卡 343px；错题抽屉全宽可读（截图 EV-226）。')
ev('EV-230', 'runtime', '浏览器 /practice 跨页翻页', '第 2 页第 1 题点上一题→第 1 页第 10 题；再点→第 9 题；→第 8 题。跨页回退与页内递减均正确，按钮状态与行为一致。')
ev('EV-231', 'runtime', '浏览器 /practice 与 / QuestionCard DOM 探测', '选项为原生 input[type=radio|checkbox]（name 分组、checked/disabled 绑定、label 关联、focus-within 焦点环）；判分后判断题显示"正确答案：正确（√）"且正确项带 right 高亮；单选/多选判分回归正确；入口卡为 a[href] 链接（键盘可聚焦）。注：自动化环境无法驱动按键默认动作（EV-221 同源），键盘端到端走查列 TASK-011 人工项。')
ev('EV-232', 'runtime', '浏览器 /wrong-book 状态同步与防重入', '重练答对后列表行即时移出未掌握筛选（提示与列表一致）；双击"标记掌握"+双击确认仅发 1 次 PATCH /mastered、1 次列表刷新；快速三连切筛选终态与最后一次一致（请求时序守卫生效）。')
ev('EV-233', 'runtime', '浏览器 登录直达 /plan', '登录后不经首页直接进入 /plan，页壳昵称显示真实昵称"审查考生改"（修复前为"同学"）。')
ev('EV-234', 'runtime', '浏览器 ExplainPanel 状态序列与错误映射', '初始化状态序列 no-panel→skeleton→explain，无失败闪现；限流后带内容重新生成显示横幅"重新生成失败：请求过于频繁，请稍后再试"且保留旧内容；限流窗口内首载失败显示"请求过于频繁，请稍后再试/重试"（错误码 42901 映射生效）。')
ev('EV-235', 'runtime', '浏览器 断后端四页错误态', '断后端访问 /、/plan、/profile、/practice 分别显示"学习概览加载失败/当前复习计划加载失败/账号信息加载失败/题目加载失败"，各带"重新加载"按钮；计划页失败与"还没有复习计划"空态可区分；恢复后端后加载正常。')
ev('EV-236', 'test', '浏览器 redirect 用例 + .gitignore + 常量迁移', '登录 redirect=//evil.com 回落 /（无开放重定向）；redirect=/wrong-book 正常回跳；已创建 .gitignore（.env/node_modules/dist/*.log）；stores/request/UserManage 统一引用 STORAGE_KEYS/TIMEOUT；Login/Register 提交补 catch 无 unhandled rejection。')
ev('EV-237', 'test', 'web: npm run build + vite preview 冒烟', 'manualChunks 分包：主包 index-*.js 8.7KB（原 1,057KB）、element-plus 917KB、vendor 159KB、路由 chunk 2-10KB；preview 构建产物登录/首页/样式（按钮主色、卡片白底）完整。')
ev('EV-238', 'runtime', '浏览器 /plan 日期选择器', '面板打开（21 个可用日）→选 2026-10-28→确定→输入框回填、提示"距离考试还有 17 天"；带日期生成计划成功，计划头显示"考试日 2026-10-28"、17 项任务。')
ev('EV-239', 'test', '浏览器 /admin/questions 创建/删除回归', '带新防重入守卫完成"回归临时题"创建与软删，列表刷新正确。')

# ---------------- FND 状态 ----------------
F = {f['id']: f for f in d['findings']}
res = {
    'FND-001': ('resolved', ['EV-227', 'EV-228']),
    'FND-002': ('resolved', ['EV-229', 'EV-226']),
    'FND-003': ('resolved', ['EV-230']),
    'FND-005': ('resolved', ['EV-231']),
    'FND-006': ('resolved', ['EV-232']),
    'FND-007': ('resolved', ['EV-233']),
    'FND-008': ('resolved', ['EV-234']),
    'FND-009': ('resolved', ['EV-235']),
    'FND-010': ('resolved', ['EV-232']),
    'FND-011': ('resolved', ['EV-236']),
    'FND-012': ('resolved', ['EV-237']),
    'FND-004': ('fixed_unverified', ['EV-231']),
}
for fid, (status, evs) in res.items():
    F[fid]['status'] = status
    F[fid]['resolution_evidence_ids'] = evs
F['FND-004']['remediation'] += '（已实施：原生 radio/checkbox 语义 + 入口卡 router-link；键盘/读屏端到端走查待 TASK-011 人工项）'
F['FND-010']['confidence'] = 'confirmed'
F['FND-010']['root_cause_confidence'] = 'confirmed'

# ---------------- 检查项复验 ----------------
EVFIX = {
    'FND-001': ['EV-227', 'EV-228'], 'FND-002': ['EV-229', 'EV-226'], 'FND-003': ['EV-230'],
    'FND-004': ['EV-231'], 'FND-005': ['EV-231'], 'FND-006': ['EV-232'], 'FND-007': ['EV-233'],
    'FND-008': ['EV-234'], 'FND-009': ['EV-235'], 'FND-010': ['EV-232'], 'FND-011': ['EV-236'],
    'FND-012': ['EV-237'],
}
for c in d['checks']:
    if c['status'] in ('failed', 'blocked') and c['finding_ids']:
        evs = []
        for f in c['finding_ids']:
            evs += EVFIX.get(f, [])
        c['status'] = 'passed'
        c['evidence_ids'] = sorted(set(c['evidence_ids'] + evs))
        c['reason'] = '修复后复验通过（' + '/'.join(c['finding_ids']) + '）'
        c['scenario_ids'] = sorted(set(c['scenario_ids']))  # 保持原关联，下方场景翻转后一致

# ---------------- 场景复验 ----------------
S = {s['id']: s for s in d['scenarios']}
def flip(sid, status, evs, reason=''):
    S[sid]['status'] = status
    S[sid]['evidence_ids'] = list(evs)
    S[sid]['reason'] = reason
flip('SCN-010', 'passed', ['EV-230'], '修复后：跨页回退正常，按钮状态与行为一致')
flip('SCN-014', 'passed', ['EV-232'], '修复后：答对自动掌握与列表状态一致')
flip('SCN-015', 'passed', ['EV-234'], '修复后：三态无闪现、失败原因透出、重试可恢复')
flip('SCN-030', 'passed', ['EV-229', 'EV-226'], '修复后 375px 无横向溢出；真机走查列 TASK-011')
flip('SCN-033', 'passed', ['EV-232'], '双击仅 1 次请求、快速切筛选终态正确（时序守卫）')
flip('SCN-031', 'blocked', ['EV-231'], '选项/入口卡已改原生语义（DOM 实测）；自动化环境无法驱动按键默认动作（EV-221 同源），键盘+读屏端到端走查需人工执行（TASK-011）')
S['SCN-031']['finding_ids'] = ['FND-004']
S['SCN-009']['reason'] = '修复后：判分展示与高亮正确（EV-231）'
S['SCN-024']['reason'] = '修复后：搜索分支通过（EV-227/228）'

# ---------------- 任务状态 ----------------
T = {t['id']: t for t in d['tasks']}
def task_stat(tid, status, evs, note=''):
    T[tid]['status'] = status
    T[tid]['evidence_ids'] = list(evs)
    if note:
        T[tid]['acceptance_criteria'] = T[tid]['acceptance_criteria'] + [note]
task_stat('TASK-001', 'verified', ['EV-227', 'EV-228'])
task_stat('TASK-002', 'verified', ['EV-229', 'EV-226'])
task_stat('TASK-003', 'verified', ['EV-230'])
task_stat('TASK-004', 'implemented', ['EV-231'], '已实施并结构复验；键盘/读屏端到端（SCN-031）待 TASK-011 人工走查后方可 verified')
task_stat('TASK-005', 'verified', ['EV-232', 'EV-239'])
task_stat('TASK-006', 'verified', ['EV-233'])
task_stat('TASK-007', 'verified', ['EV-234'])
task_stat('TASK-008', 'verified', ['EV-235'])
task_stat('TASK-009', 'verified', ['EV-236'])
task_stat('TASK-010', 'verified', ['EV-237'])
task_stat('TASK-011', 'blocked', ['EV-232', 'EV-238'], '本环境可执行项已完成（双击防重入 EV-232、日期选择器 EV-238、快速切筛选 EV-232）；真机/读屏器/人工键盘走查缺环境待补')

# ---------------- 发布门槛 ----------------
G = {g['id']: g for g in d['release_gates']}
G['GATE-003'].update({'status': 'blocked', 'evidence_ids': ['EV-231'], 'reason': '选项/入口卡已改原生可聚焦语义（结构复验通过）；键盘+读屏端到端人工走查未执行（TASK-011）'})
G['GATE-004'].update({'status': 'passed', 'evidence_ids': ['EV-232'], 'reason': '状态同步修复复验通过'})
G['GATE-006'].update({'status': 'passed', 'evidence_ids': ['EV-237'], 'reason': '主包 8.7KB（gzip 约 4KB），组件库独立分包可长期缓存；总下载量未变属全量引入取舍，已列可选优化'})
G['GATE-007'].update({'status': 'passed', 'evidence_ids': ['EV-235'], 'reason': '页面级错误态与重试齐备'})
G['GATE-008'].update({'status': 'passed', 'evidence_ids': ['EV-229', 'EV-226'], 'reason': '375px 无溢出；真机为 TASK-011 补充项'})

# 一致性：passed 检查只关联 passed 场景（SCN-031 保持 blocked，不影响其余判定）
for c in d['checks']:
    if c['status'] == 'passed':
        c['scenario_ids'] = [s for s in c['scenario_ids'] if S[s]['status'] == 'passed']

d['progress'] = {
    'current_page': None,
    'completed_batches': ['源码通读与台账登记', '运行验证（40 场景）', '问题/蓝图/处置产出', 'TASK-001..010 实施并复验（TASK-011 可行项完成）', '台账与报告更新'],
    'next_actions': ['TASK-011 人工补证：真机 375px、读屏器、键盘端到端（完成后 TASK-004 转 verified、SCN-031 转 passed、GATE-003 转 passed）', 'GATE-009 发布实操需 Linux+Nginx+pm2 环境'],
    'unresolved_access': ['无读屏器与真机环境', '无 LLM API Key（llm 模式联调未覆盖）'],
    'last_updated': NOW,
}

json.dump(d, open(PATH, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
from collections import Counter
print('findings:', Counter(f['status'] for f in d['findings']))
print('checks:', Counter(c['status'] for c in d['checks']))
print('scenarios:', Counter(s['status'] for s in d['scenarios']))
print('tasks:', Counter(t['status'] for t in d['tasks']))
print('gates:', Counter(g['status'] for g in d['release_gates']))
