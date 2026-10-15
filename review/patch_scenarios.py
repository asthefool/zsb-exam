# -*- coding: utf-8 -*-
"""补齐实例→场景覆盖：扩展既有场景实例列表 + 新增补充场景。"""
import json
PATH = 'review/audit.json'
d = json.load(open(PATH, encoding='utf-8'))
N = {i['label'] + '|' + i['id']: i['id'] for i in d['instances']}
byid = {i['id']: i for i in d['instances']}

def find(label_sub, page=None):
    out = [i['id'] for i in d['instances'] if label_sub in i['label'] and (page is None or i['page_id'] == page)]
    assert out, (label_sub, page)
    return out[0]

S = {s['id']: s for s in d['scenarios']}

# 扩展既有场景
extend = {
    'SCN-007': [find('顶部用户区')],
    'SCN-011': [find('筛选工具条', 'PAGE-004')],
    'SCN-013': [find('考生端页壳实例', 'PAGE-005')],
    'SCN-014': [find('详情描述区')],
    'SCN-018': [find('AI 模式标签')],
    'SCN-021': [find('考生端页壳实例', 'PAGE-006')],
    'SCN-022': [find('账号安全提示')],
    'SCN-024': [find('分页器', 'PAGE-008')],
    'SCN-025': [find('科目选择'), find('题型单选'), find('解析输入'), find('难度评分'), find('状态开关')],
    'SCN-026': [find('筛选工具条(角色/状态)'), find('分页器', 'PAGE-009')],
}
for sid, ids in extend.items():
    cur = set(S[sid]['instance_ids'])
    cur.update(ids)
    S[sid]['instance_ids'] = sorted(cur)

def add_scn(sid, title, pages, inst_ids, pre, steps, expected, ctx, risk='normal'):
    d['scenarios'].append({'id': sid, 'title': title, 'page_ids': pages, 'instance_ids': inst_ids,
        'preconditions': pre, 'steps': steps, 'expected': expected,
        'context': {'role': ctx[0], 'data': ctx[1], 'network': ctx[2], 'viewport': ctx[3], 'input': ctx[4], 'lifecycle': ctx[5]},
        'risk': risk, 'status': 'planned', 'evidence_ids': [], 'finding_ids': [], 'reason': ''})

D = '桌面 1280×800'
add_scn('SCN-037', '登录/注册页壳呈现与互跳', ['PAGE-001', 'PAGE-002'],
    [find('登录页容器'), find('登录卡片'), find('注册引导链接'), find('注册页容器'), find('注册卡片'), find('去登录链接'), find('昵称输入')],
    ['未登录'], ['打开 /login 查看页面结构', '点"立即注册"到 /register', '填昵称字段', '点"去登录"回 /login'],
    ['两页居中卡片完整渲染；互跳正确；昵称字段可输入且计数生效'], ('未登录考生', '空数据', '正常', D, '键鼠', '首次访问'))
add_scn('SCN-038', '首页模块入口卡点击跳转', ['PAGE-003'],
    [find('模块入口卡片区'), find('入口卡-题库刷题'), find('入口卡-错题本'), find('入口卡-智能复习计划'), find('入口卡-个人中心')],
    ['已登录考生'], ['逐张点击 4 张入口卡（返回首页后点下一张）'],
    ['分别进入 /practice /wrong-book /plan /profile'], ('考生', '正常账号', '正常', D, '键鼠', '登录后'))

covered = {x for s in d['scenarios'] for x in s['instance_ids']}
unc = [(i['id'], i['label']) for i in d['instances'] if i['id'] not in covered]
print('uncovered after patch:', unc)
json.dump(d, open(PATH, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('scenarios:', len(d['scenarios']))
