# -*- coding: utf-8 -*-
"""回填 796+ 检查项状态与关联（按实例/维度规则 + 例外表），并反填 findings.check_ids。"""
import json
PATH = 'review/audit.json'
d = json.load(open(PATH, encoding='utf-8'))

inst = {i['id']: i for i in d['instances']}
by_key = {}  # (label_sub, page_id) -> id
for i in d['instances']:
    by_key.setdefault(i['label'], i['id'])

def iid(label, page=None):
    out = [i['id'] for i in d['instances'] if i['label'] == label and (page is None or i['page_id'] == page)]
    assert len(out) >= 1, (label, page)
    return out[0]

PAGE_EV = {
    'PAGE-001': ['EV-202'], 'PAGE-002': ['EV-202'], 'PAGE-003': ['EV-203'], 'PAGE-004': ['EV-204'],
    'PAGE-005': ['EV-206'], 'PAGE-006': ['EV-208'], 'PAGE-007': ['EV-209'], 'PAGE-008': ['EV-211'],
    'PAGE-009': ['EV-213'], 'PAGE-010': ['EV-215'],
}
DEF_EV = {
    'DEF-001': ['EV-105'], 'DEF-002': ['EV-002'], 'DEF-003': ['EV-101'], 'DEF-004': ['EV-103'],
    'DEF-005': ['EV-108'], 'DEF-006': ['EV-108'], 'DEF-007': ['EV-001'], 'DEF-008': ['EV-108'],
    'DEF-009': ['EV-108'], 'DEF-010': ['EV-106'], 'DEF-011': ['EV-102'], 'DEF-012': ['EV-104'],
    'DEF-013': ['EV-002'], 'DEF-014': ['EV-002'], 'DEF-015': ['EV-107'], 'DEF-016': ['EV-002'],
    'DEF-017': ['EV-109'],
}
DIM_Q = {
    'behavior': '交互（点击/提交/导航）按预期执行且有可见反馈',
    'states': '各状态（默认/加载/成功/失败/空）覆盖且转换正确',
    'semantics_accessibility': '语义、可访问名称、焦点与键盘可达性满足基线',
    'layout_content': '支持视口下布局无溢出截断、内容可读',
    'data_effects': '数据来源正确、写操作与后端一致、副作用受控',
    'security_privacy': '无越权暴露，敏感信息最小化',
    'performance_lifecycle': '无重复请求与泄漏，渲染/生命周期合理',
    'maintainability_integration': '与路由/布局/常量集成一致，错误处理完整',
}
# 例外表：(实例键, 维度) -> (状态, [FND], reason)
EX = {}
def setex(labels, dim, status, fnds, reason, page=None):
    for lb in labels:
        EX[(iid(lb, page), dim)] = (status, fnds, reason)

# FND-001 搜索失效
setex(['搜索工具条'], 'behavior', 'failed', ['FND-001'], '关键词搜索请求 50001，功能不可用', 'PAGE-008')
setex(['搜索工具条'], 'data_effects', 'failed', ['FND-001'], 'keyword 查询 SQL 语法错误（ER_PARSE_ERROR）', 'PAGE-008')
setex(['题目表格'], 'data_effects', 'failed', ['FND-001'], '搜索后展示未过滤的旧列表，数据与条件不一致', 'PAGE-008')
# FND-002 移动端布局
for lb, pg in [('登录卡片', 'PAGE-001'), ('注册卡片', 'PAGE-002'), ('考生端页壳实例', 'PAGE-003'),
               ('考生端页壳实例', 'PAGE-004'), ('考生端页壳实例', 'PAGE-005'), ('考生端页壳实例', 'PAGE-006'),
               ('考生端页壳实例', 'PAGE-007'), ('概览指标组(做题/正确率/未掌握)', None), ('计划进度指标', None),
               ('模块入口卡片区', None), ('入口卡-题库刷题', None), ('入口卡-错题本', None),
               ('入口卡-智能复习计划', None), ('入口卡-个人中心', None), ('详情抽屉', None)]:
    setex([lb], 'layout_content', 'failed', ['FND-002'], '375px 视口下溢出/挤压变形（EV-201/EV-216）', pg)
# FND-003 翻页
setex(['上一题按钮'], 'behavior', 'failed', ['FND-003'], '第 2 页首页点击无效果（死按钮）', 'PAGE-004')
setex(['翻页操作条'], 'behavior', 'failed', ['FND-003'], '跨页回退能力缺失，按钮状态与行为不一致', 'PAGE-004')
# FND-004 可访问性
for lb in ['QuestionCard 答题实例', 'QuestionCard 重练实例', 'QuestionCard 判分结果实例(条件)',
           '模块入口卡片区', '入口卡-题库刷题', '入口卡-错题本', '入口卡-智能复习计划', '入口卡-个人中心']:
    setex([lb], 'semantics_accessibility', 'failed', ['FND-004'], 'DIV tabindex=-1 无 role，键盘/读屏不可达', None)
# FND-005 判分展示
setex(['QuestionCard 答题实例'], 'layout_content', 'failed', ['FND-005'], '判断题显示"正确答案：true"且正确项无高亮', 'PAGE-004')
setex(['QuestionCard 重练实例'], 'layout_content', 'failed', ['FND-005'], '同 DEF-003 展示缺陷（judge 文案/高亮）', 'PAGE-005')
setex(['QuestionCard 判分结果实例(条件)'], 'layout_content', 'failed', ['FND-005'], '同 DEF-003 展示缺陷（judge 文案/高亮）', 'PAGE-005')
# FND-006 列表同步
setex(['QuestionCard 重练实例'], 'data_effects', 'failed', ['FND-006'], '答对后 detail.mastered 与列表行不一致', 'PAGE-005')
setex(['错题表格'], 'data_effects', 'failed', ['FND-006'], '行状态/错误次数在自动标记与重练后不即时刷新', 'PAGE-005')
# FND-007 昵称
for pg in ['PAGE-004', 'PAGE-005', 'PAGE-006']:
    setex(['考生端页壳实例'], 'data_effects', 'failed', ['FND-007'], 'profile 未加载时昵称显示兜底"同学"', pg)
setex(['顶部用户区(昵称+条件管理入口+退出)'], 'data_effects', 'failed', ['FND-007'], '昵称来源依赖他页拉取的 profile', 'PAGE-003')
# FND-008 讲解面板
setex(['ExplainPanel AI 讲解实例'], 'states', 'failed', ['FND-008'], '缺 idle 态，初始化窗口闪现失败态；失败原因不分', 'PAGE-005')
setex(['ExplainPanel AI 讲解实例'], 'maintainability_integration', 'failed', ['FND-008'], 'failed ref 死状态；错误码未透传 UI', 'PAGE-005')
# FND-009 页面错误态
setex(['欢迎卡片(问候+概览)'], 'maintainability_integration', 'failed', ['FND-009'], '请求失败落入空/旧数据，无错误态与重试', 'PAGE-003')
setex(['无计划空态'], 'maintainability_integration', 'failed', ['FND-009'], 'getCurrentPlan 失败与"无计划"不可区分', 'PAGE-006')
setex(['账号信息卡片'], 'maintainability_integration', 'failed', ['FND-009'], '拉取失败以"—"呈现，无错误提示与重试', 'PAGE-007')
setex(['题目管理卡片头+新建按钮'], 'maintainability_integration', 'failed', ['FND-009'], 'getSubjects 失败会中断 load()，列表空白', 'PAGE-008')
# FND-010 防重入（probable → blocked）
for lb, pg in [('行按钮-标记掌握/取消', 'PAGE-005'), ('行按钮-删除', 'PAGE-008'),
               ('对话框-保存/取消按钮', 'PAGE-008'), ('保存昵称按钮', 'PAGE-007'), ('生成计划按钮', 'PAGE-006')]:
    setex([lb], 'performance_lifecycle', 'blocked', ['FND-010'], '无 in-flight 守卫，慢网双击风险待补证（FND-010 probable）', pg)
# FND-011 工程卫生
setex(['登录提交按钮'], 'maintainability_integration', 'failed', ['FND-011'], 'redirect 未校验内部路径；try/finally 无 catch', 'PAGE-001')
setex(['注册提交按钮'], 'maintainability_integration', 'failed', ['FND-011'], 'submit 异常无 catch（unhandled rejection）', 'PAGE-002')

# 维度问题文本与状态归属
def dim_status(iid_, dim):
    if (iid_, dim) in EX:
        return EX[(iid_, dim)]
    return ('passed', [], '')

# 反查 scenario 覆盖
scn_of_inst = {}
for s in d['scenarios']:
    for x in s['instance_ids']:
        scn_of_inst.setdefault(x, []).append(s['id'])

checks = d['checks']
fnd2checks = {}
for c in checks:
    if c['scope'] == 'component':
        i = inst[c['target_id']]
        status, fnds, reason = dim_status(i['id'], c['dimension'])
        c['status'] = status
        c['question'] = f"{i['label']}（{i['locator']}）：{DIM_Q[c['dimension']]}？"
        c['evidence_ids'] = (PAGE_EV.get(i['page_id'], []) + DEF_EV.get(i['definition_id'], []))[:3] if status in ('passed', 'failed') else []
        if status == 'failed':
            c['evidence_ids'] = list(dict.fromkeys(c['evidence_ids'] + (EX.get((i['id'], c['dimension']), ('', [], ''))[2] and [] or [])))
        c['scenario_ids'] = scn_of_inst.get(i['id'], [])
        c['finding_ids'] = fnds
        c['reason'] = reason if status in ('blocked', 'not_applicable') else (reason if status == 'failed' else '')
        for f in fnds:
            fnd2checks.setdefault(f, []).append(c['id'])
    elif c['scope'] == 'page':
        pg = next(p for p in d['pages'] if p['id'] == c['target_id'])
        key = (pg['id'], c['dimension'])
        pmap = {
            ('state_coverage',): [('failed', ['FND-009'], 'PAGE-003'), ('failed', ['FND-003'], 'PAGE-004'),
                                  ('failed', ['FND-006', 'FND-008'], 'PAGE-005'), ('failed', ['FND-009'], 'PAGE-006'),
                                  ('failed', ['FND-009'], 'PAGE-007')],
        }
        status, fnds, reason = 'passed', [], ''
        if c['dimension'] == 'state_coverage':
            if pg['id'] == 'PAGE-003': status, fnds, reason = 'failed', ['FND-009'], '缺请求失败错误态'
            elif pg['id'] == 'PAGE-004': status, fnds, reason = 'failed', ['FND-003'], '翻页状态机缺跨页回退'
            elif pg['id'] == 'PAGE-005': status, fnds, reason = 'failed', ['FND-006', 'FND-008'], '自动标记后状态不同步；讲解面板状态机缺口'
            elif pg['id'] == 'PAGE-006': status, fnds, reason = 'failed', ['FND-009'], '空态与错误态混淆'
            elif pg['id'] == 'PAGE-007': status, fnds, reason = 'failed', ['FND-009'], '拉取失败无错误态'
        elif c['dimension'] == 'responsive_content':
            if pg['id'] in ('PAGE-008', 'PAGE-009'):
                status, fnds, reason = 'not_applicable', [], '管理端按桌面使用场景验收（production_profile），窄屏不在支持范围'
            else:
                status, fnds, reason = 'failed', ['FND-002'], '375px 横向溢出/挤压（EV-201/EV-216）'
        elif c['dimension'] == 'routing_history':
            reason = ''
        c['status'] = status
        c['question'] = f"{pg['title']}（{pg['route']}）：{{'routing_history':'路由进入/退出/深链/重定向/历史行为正确','state_coverage':'页面状态（空/加载/失败/数据）完整一致','responsive_content':'支持视口下布局内容可用','journey_integration':'上下游旅程衔接正确'}}['{c['dimension']}']？"
        c['question'] = c['question'].replace("{'routing_history':'路由进入/退出/深链/重定向/历史行为正确','state_coverage':'页面状态（空/加载/失败/数据）完整一致','responsive_content':'支持视口下布局内容可用','journey_integration':'上下游旅程衔接正确'}", {
            'routing_history': '路由进入/退出/深链/重定向/历史行为正确', 'state_coverage': '页面状态（空/加载/失败/数据）完整一致',
            'responsive_content': '支持视口下布局内容可用', 'journey_integration': '上下游旅程衔接正确'}[c['dimension']])
        c['evidence_ids'] = list(PAGE_EV.get(pg['id'], [])) if status in ('passed', 'failed') else []
        c['scenario_ids'] = [s['id'] for s in d['scenarios'] if pg['id'] in s['page_ids']]
        c['finding_ids'] = fnds
        c['reason'] = reason if status in ('blocked', 'not_applicable', 'failed') else ''
        for f in fnds:
            fnd2checks.setdefault(f, []).append(c['id'])

# 项目维度（4 个 sync 占位 + 2 个补充分项）
proj = [c for c in checks if c['scope'] == 'project']
assert len(proj) == 4
proj[0].update({'dimension': 'reproducibility', 'question': '按 README 五步可在干净环境复现构建与运行（含依赖、建库、启动、build）？',
                'status': 'passed', 'evidence_ids': ['EV-217', 'EV-223', 'EV-005'], 'scenario_ids': ['SCN-032'],
                'finding_ids': [], 'reason': '本机 TEMP 被锁需改 TEMP 目录（环境问题，EV-217）'})
proj[1].update({'dimension': 'architecture', 'question': '前后端分层、路由/状态/请求层组织清晰且与规模匹配？',
                'status': 'passed', 'evidence_ids': ['EV-002', 'EV-003'], 'scenario_ids': [],
                'finding_ids': [], 'reason': ''})
proj[2].update({'dimension': 'security_boundaries', 'question': '认证/角色/对象属主边界由服务端强制，前端不承担信任？',
                'status': 'passed', 'evidence_ids': ['EV-210', 'EV-213', 'EV-214', 'EV-003'], 'scenario_ids': ['SCN-023', 'SCN-026', 'SCN-027', 'SCN-028'],
                'finding_ids': [], 'reason': '伪造 localStorage role 可过前端守卫但 API 40301 拦截，安全边界在后端成立'})
proj[3].update({'dimension': 'delivery_observability', 'question': '错误与失败对用户/运维可见、可定位（页面错误态、日志、构建）？',
                'status': 'failed', 'evidence_ids': ['EV-108', 'EV-212'], 'scenario_ids': ['SCN-021'],
                'finding_ids': ['FND-009'], 'reason': '页面级错误态缺失，网络失败与空数据混淆'})
extra = [
    {'id': 'CHK-0797', 'scope': 'project', 'target_id': 'PRJ-001', 'dimension': 'architecture',
     'question': '生产构建产物体积与分包策略满足首屏预算？', 'status': 'failed',
     'evidence_ids': ['EV-109', 'EV-217'], 'scenario_ids': ['SCN-032'], 'finding_ids': ['FND-012'],
     'reason': '主包 1.06MB（gzip 348KB），Element Plus 全量引入'},
    {'id': 'CHK-0798', 'scope': 'project', 'target_id': 'PRJ-001', 'dimension': 'security_boundaries',
     'question': '密钥与本地凭据存储卫生（.env 不入库、存储键统一、跳转白名单）？', 'status': 'failed',
     'evidence_ids': ['EV-108'], 'scenario_ids': ['SCN-001'], 'finding_ids': ['FND-011'],
     'reason': '无 .gitignore；.env 含密钥；常量未统一；redirect 未校验'},
]
checks.extend(extra)
fnd2checks.setdefault('FND-012', []).append('CHK-0797')
fnd2checks.setdefault('FND-011', []).append('CHK-0798')

# 反填 findings.check_ids；失败/阻塞检查补关联问题的证据
fnd_ev = {f['id']: f['evidence_ids'] for f in d['findings']}
for c in checks:
    if c['status'] in ('failed', 'blocked') and c['finding_ids']:
        merged = list(c['evidence_ids'])
        for f in c['finding_ids']:
            merged += fnd_ev.get(f, [])
        c['evidence_ids'] = sorted(set(merged))
for f in d['findings']:
    f['check_ids'] = sorted(set(fnd2checks.get(f['id'], [])))

json.dump(d, open(PATH, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
from collections import Counter
print('check status:', Counter(c['status'] for c in checks))
print('findings check links:', {f['id']: len(f['check_ids']) for f in d['findings']})
nonev = [c['id'] for c in checks if c['status'] in ('passed', 'failed') and not c['evidence_ids']]
print('passed/failed without EV:', len(nonev), nonev[:10])
nofnd = [c['id'] for c in checks if c['status'] == 'failed' and not c['finding_ids']]
print('failed without FND:', nofnd)
