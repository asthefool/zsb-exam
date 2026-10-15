# -*- coding: utf-8 -*-
"""登记 zsb-exam 全量审查台账：project/pages/definitions/instances/scenarios + progress。
所有引用经变量传递，避免 ID 错位。运行后调用 audit_ledger.py sync。"""
import json

PATH = 'review/audit.json'
d = json.load(open(PATH, encoding='utf-8'))
NOW = '2026-10-10T21:10:00+08:00'
SRC = 'zsb-exam working tree（无 VCS，目录快照 2026-10-10）'

# ---------------- project ----------------
d['project'].update({
    'target': 'C:/Users/ASUS/Desktop/my-work/毕设/zsb-exam（web/ 前端 SPA + server/ Express API）',
    'mode': 'audit_plan',
    'review_depth': 'full',
    'access_mode': 'source_runtime',
    'baseline': {
        'source_ref': SRC,
        'runtime_ref': '本地运行：vite 5.4.8 dev (web :5173) + node 22.19.0/express 4.19.2 (server :3000) + MySQL 8.0.43 (:3306, zsb_exam, AI mock 模式)',
        'observed_at': NOW,
    },
    'inventory_status': 'reconciled',
    'inventory_sources': [
        {'kind': 'source', 'locator': 'web/src/router/index.js（10 条路由：/login /register /+5 子页 /admin+2 子页 通配重定向）', 'evidence_ids': ['EV-001']},
        {'kind': 'source', 'locator': 'web/src 全部 18 个源文件逐一通读', 'evidence_ids': ['EV-002']},
        {'kind': 'source', 'locator': 'server/src 契约相关文件（routes/middleware/auth 相关 service）', 'evidence_ids': ['EV-003']},
        {'kind': 'artifact', 'locator': 'review/discovery-candidates.json（启发式候选 route_source_candidates=0，已人工补全核对）', 'evidence_ids': ['EV-004']},
        {'kind': 'specification', 'locator': 'README.md 功能清单 7 模块 + 代码注释 AC1-AC9 验收点', 'evidence_ids': ['EV-005']},
    ],
    'scope': 'zsb-exam 前端 SPA 全部 10 条路由页面的逐页逐组件审查（行为/状态/语义可访问性/布局内容/数据副作用/安全隐私/性能生命周期/结构集成八维），核对前端依赖的后端鉴权、属主校验与错误码契约；含本地运行实测与生产构建验证。后端仅审到与前端契约相关处。',
    'out_of_scope': [
        {'surface': 'server/ 后端内部实现（判分/计划算法正确性、SQL 性能、AI prompt 质量）', 'reason': '本次为前端审查，后端仅核对与前端交互的契约与安全边界', 'authority': '用户请求「前端全面审查」与技能范围'},
        {'surface': '真实 LLM 模式（AI_PROVIDER=llm）联调', 'reason': '无外部 API Key，运行验证在 mock 模式下进行', 'authority': '环境限制'},
        {'surface': '真机 iOS/Android 与屏幕阅读器实测', 'reason': '无真机与读屏器环境，移动端仅用浏览器视口模拟，可访问性以静态+键盘实测为准', 'authority': '环境限制'},
        {'surface': 'Nginx/pm2 生产部署实操', 'reason': 'Windows 开发机无 Nginx/pm2，构建产物与部署配置按文档审查', 'authority': '环境限制'},
    ],
    'production_profile': {
        'users': '专升本考生（主要）与系统管理员（题库/用户管理）',
        'key_tasks': '刷题判分、错题归集与 AI 讲解、复习计划生成与打卡、题库 CRUD、用户启用禁用',
        'identity': '单租户；JWT Bearer 鉴权；角色 student/admin；前端 localStorage 存 token/role/userId',
        'data_risk': '账号凭据（bcrypt）、学习行为记录；无支付无敏感 PII；数据损毁风险低-中（题库删除为软删）',
        'scale': '课程/毕业设计演示规模（预计 <100 用户，题库 <1 万题）',
        'support_env': '现代桌面浏览器为主（Chrome/Edge），移动端浏览器可用为辅（README 未承诺移动体验）；index.html 已设 viewport meta',
        'performance_targets': 'unknown（用户未给指标；以「交互无明显卡顿、AI 等待有反馈」为基线）',
        'release_mechanism': 'web: vite build 静态产物 + Nginx try_files SPA 回退 + /api 反代；server: pm2 守护 node src/app.js',
        'standards': '无强制合规标准；按课程验收（README 功能清单 + AC1-AC9）与一般 Web 可用性/可访问性基线',
    },
    'assumptions': [
        '验收基线以 README 功能清单与代码注释 AC1-AC9 为准（无独立需求文档）',
        '管理员账号由 init-admin.js 交互创建，审查使用临时创建的测试账号',
        'AI 功能以 mock 规则引擎模式验证全链路（README 声明该模式可完整演示）',
    ],
})

# ---------------- pages ----------------
PAGES = [
    ('PAGE-001', '/login', '登录', 'web/src/views/student/Login.vue', ['未登录直达', '带 redirect 参数进入', '已登录访问被重定向'], ['默认', '登录失败', '校验不通过', 'redirect 回跳']),
    ('PAGE-002', '/register', '注册', 'web/src/views/student/Register.vue', ['未登录直达', '已登录访问被重定向'], ['默认', '用户名重复', '校验不通过']),
    ('PAGE-003', '/', '首页-学习概览', 'web/src/views/student/Home.vue + layout/StudentLayout.vue', ['登录后默认落地页'], ['有计划', '无计划', '有今日任务', '无今日任务']),
    ('PAGE-004', '/practice', '题库刷题', 'web/src/views/student/Practice.vue', ['登录后进入'], ['单选/多选/判断', '跨页翻页', '筛选切换', '空题库']),
    ('PAGE-005', '/wrong-book', '错题本', 'web/src/views/student/WrongBook.vue', ['登录后进入'], ['未掌握筛选', '已掌握筛选', '全部', '详情抽屉', '重练判分', '空列表']),
    ('PAGE-006', '/plan', '智能复习计划', 'web/src/views/student/Plan.vue', ['登录后进入'], ['无计划', '有计划', '生成中', '打卡']),
    ('PAGE-007', '/profile', '个人中心', 'web/src/views/student/Profile.vue', ['登录后进入'], ['默认', '修改昵称']),
    ('PAGE-008', '/admin/questions', '后台-题目管理', 'web/src/views/admin/QuestionManage.vue', ['admin 登录进入', '考生访问被路由守卫拦截'], ['列表', '新建对话框', '编辑对话框', '删除确认', '搜索', '空列表']),
    ('PAGE-009', '/admin/users', '后台-用户管理', 'web/src/views/admin/UserManage.vue', ['admin 登录进入'], ['列表', '筛选', '启用/禁用', '自身行禁用按钮']),
    ('PAGE-010', '/:pathMatch(.*)*', '未知路径重定向', 'web/src/router/index.js:29', ['任意未匹配路径'], ['未登录未知路径', '已登录未知路径']),
]
d['pages'] = [{'id': pid, 'route': r, 'title': t, 'source_locator': s, 'entry_conditions': e, 'variants': v,
               'evidence_ids': ['EV-001', 'EV-002'], 'scope_status': 'in_scope'} for pid, r, t, s, e, v in PAGES]

# ---------------- definitions ----------------
DEFS = [
    ('DEF-001', 'StudentLayout 考生端页壳', 'layout component', 'web/src/layout/StudentLayout.vue'),
    ('DEF-002', 'AdminLayout 管理端页壳', 'layout component', 'web/src/layout/AdminLayout.vue'),
    ('DEF-003', 'QuestionCard 题目卡片', 'shared component', 'web/src/components/QuestionCard.vue'),
    ('DEF-004', 'ExplainPanel AI 讲解面板', 'shared component', 'web/src/components/ExplainPanel.vue'),
    ('DEF-005', 'request Axios 请求层', 'infrastructure', 'web/src/api/request.js'),
    ('DEF-006', 'user store 用户状态', 'infrastructure', 'web/src/stores/user.js'),
    ('DEF-007', 'router 路由表与守卫', 'infrastructure', 'web/src/router/index.js'),
    ('DEF-008', 'Login 登录页', 'page view', 'web/src/views/student/Login.vue'),
    ('DEF-009', 'Register 注册页', 'page view', 'web/src/views/student/Register.vue'),
    ('DEF-010', 'Home 首页', 'page view', 'web/src/views/student/Home.vue'),
    ('DEF-011', 'Practice 刷题页', 'page view', 'web/src/views/student/Practice.vue'),
    ('DEF-012', 'WrongBook 错题本页', 'page view', 'web/src/views/student/WrongBook.vue'),
    ('DEF-013', 'Plan 计划页', 'page view', 'web/src/views/student/Plan.vue'),
    ('DEF-014', 'Profile 个人中心页', 'page view', 'web/src/views/student/Profile.vue'),
    ('DEF-015', 'QuestionManage 题目管理页', 'page view', 'web/src/views/admin/QuestionManage.vue'),
    ('DEF-016', 'UserManage 用户管理页', 'page view', 'web/src/views/admin/UserManage.vue'),
    ('DEF-017', 'App 应用根壳', 'infrastructure', 'web/src/App.vue'),
]
d['definitions'] = [{'id': i, 'name': n, 'kind': k, 'source_locator': s, 'source_status': 'located'} for i, n, k, s in DEFS]

# ---------------- instances ----------------
I = []
N = {}
def add(key, pid, df, label, loc, variant, crit='normal', parent=None, dsrc='', eq='', notes=''):
    cid = f'CMP-{len(I)+1:03d}'
    N[key] = cid
    e = {'id': cid, 'page_id': pid, 'definition_id': df, 'label': label, 'locator': loc, 'variant': variant, 'criticality': crit}
    if parent: e['parent_instance_id'] = N[parent]
    if dsrc: e['data_source'] = dsrc
    if eq: e['equivalence_group'] = eq
    if notes: e['notes'] = notes
    I.append(e)
    return cid

# PAGE-001 登录
add('p1_wrap', 'PAGE-001', 'DEF-008', '登录页容器 login-wrap', 'Login.vue:37 .login-wrap', '默认', notes='全屏渐变居中容器')
add('p1_card', 'PAGE-001', 'DEF-008', '登录卡片', 'Login.vue:38 el-card.login-card', '默认', parent='p1_wrap', notes='含标题/副标题/表单/页脚链接')
add('p1_form', 'PAGE-001', 'DEF-008', '登录表单', 'Login.vue:41 el-form(rules,@keyup.enter)', '默认', 'high', parent='p1_card', notes='required 校验；回车提交')
add('p1_user', 'PAGE-001', 'DEF-008', '用户名输入', 'Login.vue:42-44', '默认', parent='p1_form')
add('p1_pwd', 'PAGE-001', 'DEF-008', '密码输入', 'Login.vue:45-47', 'show-password', parent='p1_form')
add('p1_btn', 'PAGE-001', 'DEF-008', '登录提交按钮', 'Login.vue:48 el-button[登 录]', 'loading 态', 'high', parent='p1_form', notes='userStore.login→localStorage→跳转；异常无 catch')
add('p1_reg', 'PAGE-001', 'DEF-008', '注册引导链接', 'Login.vue:50-52 router-link[/register]', '默认', parent='p1_card')
# PAGE-002 注册
add('p2_wrap', 'PAGE-002', 'DEF-009', '注册页容器', 'Register.vue:48 .login-wrap', '默认')
add('p2_card', 'PAGE-002', 'DEF-009', '注册卡片', 'Register.vue:49 el-card', '默认', parent='p2_wrap')
add('p2_form', 'PAGE-002', 'DEF-009', '注册表单', 'Register.vue:51 el-form(rules)', '默认', 'high', parent='p2_card', notes='用户名正则/密码≥6/两次一致校验')
add('p2_user', 'PAGE-002', 'DEF-009', '用户名输入', 'Register.vue:52-54', 'pattern 校验', parent='p2_form')
add('p2_nick', 'PAGE-002', 'DEF-009', '昵称输入(可选)', 'Register.vue:55-57', 'maxlength 32', parent='p2_form')
add('p2_pwd', 'PAGE-002', 'DEF-009', '密码输入', 'Register.vue:58-60', 'min 6', parent='p2_form')
add('p2_confirm', 'PAGE-002', 'DEF-009', '确认密码输入', 'Register.vue:61-63', '一致性校验', parent='p2_form')
add('p2_btn', 'PAGE-002', 'DEF-009', '注册提交按钮', 'Register.vue:64 el-button[注 册]', 'loading 态', 'high', parent='p2_form')
add('p2_login', 'PAGE-002', 'DEF-009', '去登录链接', 'Register.vue:66-68 router-link[/login]', '默认', parent='p2_card')
# PAGE-003 首页
add('p3_shell', 'PAGE-003', 'DEF-001', '考生端页壳实例', 'StudentLayout.vue:27 el-container', 'active=/', notes='导航 5 项等价类；active 高亮')
add('p3_right', 'PAGE-003', 'DEF-001', '顶部用户区(昵称+条件管理入口+退出)', 'StudentLayout.vue:33-37 .right', 'admin 显示后台管理', 'high', parent='p3_shell', dsrc='userStore.profile/isAdmin', notes='含退出按钮 logout→/login')
add('p3_welcome', 'PAGE-003', 'DEF-010', '欢迎卡片(问候+概览)', 'Home.vue:30-47 el-card', '默认', parent='p3_shell', dsrc='GET /user/profile + /home/overview')
add('p3_stats', 'PAGE-003', 'DEF-010', '概览指标组(做题/正确率/未掌握)', 'Home.vue:33-35 el-statistic ×3', '空数据回 0', parent='p3_welcome', dsrc='overview.{total_answers,accuracy,wrong_count}')
add('p3_progress', 'PAGE-003', 'DEF-010', '计划进度指标', 'Home.vue:36-38 el-statistic', 'plan_progress null→0', parent='p3_welcome', dsrc='overview.plan_progress.percent')
add('p3_noplan', 'PAGE-003', 'DEF-010', '无计划提示(条件)', 'Home.vue:40-46 el-alert v-if', 'plan_progress===null 显示', parent='p3_welcome')
add('p3_today', 'PAGE-003', 'DEF-010', '今日任务卡片(条件)', 'Home.vue:49-58 el-card v-if', '有任务才显示', parent='p3_shell', dsrc='overview.today_tasks')
add('p3_taskrow', 'PAGE-003', 'DEF-010', '任务行(数据等价类)', 'Home.vue:51-57 .task-row', 'done/未完成 两态', parent='p3_today', dsrc='today_tasks[*]', eq='today_tasks 行', notes='完成态删除线+success 标签')
add('p3_entries', 'PAGE-003', 'DEF-010', '模块入口卡片区', 'Home.vue:60-68 el-row ×4', '4 卡等价不同跳转', parent='p3_shell')
add('p3_e1', 'PAGE-003', 'DEF-010', '入口卡-题库刷题', 'Home.vue:62 @click→/practice', '默认', parent='p3_entries', eq='入口卡')
add('p3_e2', 'PAGE-003', 'DEF-010', '入口卡-错题本', 'Home.vue:62 @click→/wrong-book', '默认', parent='p3_entries', eq='入口卡')
add('p3_e3', 'PAGE-003', 'DEF-010', '入口卡-智能复习计划', 'Home.vue:62 @click→/plan', '默认', parent='p3_entries', eq='入口卡')
add('p3_e4', 'PAGE-003', 'DEF-010', '入口卡-个人中心', 'Home.vue:62 @click→/profile', '默认', parent='p3_entries', eq='入口卡')
# PAGE-004 刷题
add('p4_shell', 'PAGE-004', 'DEF-001', '考生端页壳实例', 'StudentLayout.vue:27', 'active=/practice', notes='同 DEF-001 深查；实例差异=active 项')
add('p4_filters', 'PAGE-004', 'DEF-011', '筛选工具条', 'Practice.vue:85-95 .filters', '默认', parent='p4_shell', dsrc='GET /subjects')
add('p4_subject', 'PAGE-004', 'DEF-011', '科目筛选下拉', 'Practice.vue:86 el-select @change=load()', 'clearable', parent='p4_filters')
add('p4_qtype', 'PAGE-004', 'DEF-011', '题型筛选下拉', 'Practice.vue:89 el-select', 'single/multiple/judge', parent='p4_filters')
add('p4_count', 'PAGE-004', 'DEF-011', '题目计数文本', 'Practice.vue:94 .count', '默认', parent='p4_filters', dsrc='total')
add('p4_card', 'PAGE-004', 'DEF-003', 'QuestionCard 答题实例', 'Practice.vue:99 :key=practice-{id}', '单选/多选/判断 三分支', 'high', parent='p4_shell', dsrc='GET /questions 行', eq='题目数据行', notes='result 存父级 results 对象')
add('p4_nav', 'PAGE-004', 'DEF-011', '翻页操作条', 'Practice.vue:100-106 .actions', '首页/中间页/末页', parent='p4_shell')
add('p4_prev', 'PAGE-004', 'DEF-011', '上一题按钮', 'Practice.vue:103 el-button[上一题]', 'page=1&idx=0 禁用', 'high', parent='p4_nav')
add('p4_next', 'PAGE-004', 'DEF-011', '下一题按钮', 'Practice.vue:104 el-button[下一题]', '未作答禁用', 'high', parent='p4_nav', notes='末题时跨页加载下一页')
add('p4_empty', 'PAGE-004', 'DEF-011', '空题库提示(条件)', 'Practice.vue:108 el-empty v-else-if', '筛选无结果', parent='p4_shell')
# PAGE-005 错题本
add('p5_shell', 'PAGE-005', 'DEF-001', '考生端页壳实例', 'StudentLayout.vue:27', 'active=/wrong-book')
add('p5_filters', 'PAGE-005', 'DEF-012', '筛选工具条', 'WrongBook.vue:94-104 .filters', '默认', parent='p5_shell', dsrc='GET /subjects')
add('p5_subject', 'PAGE-005', 'DEF-012', '科目筛选下拉', 'WrongBook.vue:95 el-select @change=onFilterChange', 'clearable', parent='p5_filters')
add('p5_mastered', 'PAGE-005', 'DEF-012', '掌握状态单选组', 'WrongBook.vue:98-102 el-radio-group', '未掌握(默认)/已掌握/全部', parent='p5_filters')
add('p5_table', 'PAGE-005', 'DEF-012', '错题表格', 'WrongBook.vue:106-125 el-table', '行数据等价类', parent='p5_shell', dsrc='GET /wrong-questions', eq='错题行', notes='6 列；content 列溢出提示；默认空态暂无数据')
add('p5_view', 'PAGE-005', 'DEF-012', '行按钮-查看/AI讲解', 'WrongBook.vue:121', '默认', 'high', parent='p5_table', notes='打开详情抽屉')
add('p5_mark', 'PAGE-005', 'DEF-012', '行按钮-标记掌握/取消', 'WrongBook.vue:122', '按 row.mastered 切换文案', 'high', parent='p5_table')
add('p5_pager', 'PAGE-005', 'DEF-012', '分页器', 'WrongBook.vue:127-134 el-pagination', '默认', parent='p5_shell')
add('p5_drawer', 'PAGE-005', 'DEF-012', '详情抽屉', 'WrongBook.vue:137-157 el-drawer size=560px', '打开/加载中/已加载', 'high', parent='p5_shell', dsrc='GET /wrong-questions/:id')
add('p5_desc', 'PAGE-005', 'DEF-012', '详情描述区', 'WrongBook.vue:140-143 el-descriptions', '默认', parent='p5_drawer')
add('p5_redo', 'PAGE-005', 'DEF-003', 'QuestionCard 重练实例', 'WrongBook.vue:147 :key=q-{id}', '未判分', 'high', parent='p5_drawer', dsrc='detail.question(不含答案)', eq='重练题')
add('p5_result', 'PAGE-005', 'DEF-003', 'QuestionCard 判分结果实例(条件)', 'WrongBook.vue:150 :key=r-{id}', '判分后替换显示', parent='p5_drawer', dsrc='repracticeWrong 返回')
add('p5_explain', 'PAGE-005', 'DEF-004', 'ExplainPanel AI 讲解实例', 'WrongBook.vue:154 :key=exp-{id}', '缓存命中/生成中/失败', 'high', parent='p5_drawer', dsrc='GET+POST /ai/explanations')
# PAGE-006 计划
add('p6_shell', 'PAGE-006', 'DEF-001', '考生端页壳实例', 'StudentLayout.vue:27', 'active=/plan')
add('p6_form', 'PAGE-006', 'DEF-013', '生成表单卡片', 'Plan.vue:3-37 el-card', '默认/已有计划', parent='p6_shell', dsrc='GET /subjects + /ai/config')
add('p6_aitag', 'PAGE-006', 'DEF-013', 'AI 模式标签(条件)', 'Plan.vue:7-10 el-tag v-if=aiMode', 'llm/mock 两态', parent='p6_form', dsrc='GET /ai/config.provider')
add('p6_date', 'PAGE-006', 'DEF-013', '考试日期选择器', 'Plan.vue:14-21 el-date-picker', '含距离天数提示', parent='p6_form', notes='disabled-date 允许昨天')
add('p6_subjects', 'PAGE-006', 'DEF-013', '目标科目多选', 'Plan.vue:25-27 el-select multiple', '空=全部科目', parent='p6_form')
add('p6_minutes', 'PAGE-006', 'DEF-013', '每日时长输入', 'Plan.vue:30 el-input-number 15-600', '默认 60', parent='p6_form')
add('p6_gen', 'PAGE-006', 'DEF-013', '生成计划按钮', 'Plan.vue:33 el-button[生成计划]', '已有计划时二次确认', 'high', parent='p6_form', notes='POST /plans/generate timeout 35s')
add('p6_plan', 'PAGE-006', 'DEF-013', '当前计划卡片(条件)', 'Plan.vue:39-69 el-card v-if=hasPlan', '默认', parent='p6_shell', dsrc='GET /plans/current')
add('p6_prog', 'PAGE-006', 'DEF-013', '进度摘要+进度条', 'Plan.vue:44-52', '0/100 边界', parent='p6_plan', dsrc='plan.progress')
add('p6_collapse', 'PAGE-006', 'DEF-013', '任务日期折叠面板', 'Plan.vue:53-68 el-collapse', '今天自动展开', parent='p6_plan', dsrc='plan.tasks 按日分组')
add('p6_taskrow', 'PAGE-006', 'DEF-013', '任务行(数据等价类)', 'Plan.vue:61-66 .task-row', 'done/待打卡 两态', parent='p6_collapse', dsrc='plan.tasks[*]', eq='计划任务行')
add('p6_checkin', 'PAGE-006', 'DEF-013', '打卡按钮', 'Plan.vue:65 el-button[打卡完成]', 'loading 态', 'high', parent='p6_taskrow', notes='PATCH /plan-tasks/:id/check-in')
add('p6_empty', 'PAGE-006', 'DEF-013', '无计划空态', 'Plan.vue:71 el-empty v-else-if', '默认', parent='p6_shell')
# PAGE-007 个人中心
add('p7_shell', 'PAGE-007', 'DEF-001', '考生端页壳实例', 'StudentLayout.vue:27', 'active=/profile')
add('p7_info', 'PAGE-007', 'DEF-014', '账号信息卡片', 'Profile.vue:5-17 el-card+el-descriptions', '默认', parent='p7_shell', dsrc='GET /user/profile')
add('p7_form', 'PAGE-007', 'DEF-014', '昵称修改表单', 'Profile.vue:21-29 el-form', '默认', parent='p7_shell')
add('p7_nick', 'PAGE-007', 'DEF-014', '昵称输入', 'Profile.vue:24 el-input maxlength=32', 'show-word-limit', parent='p7_form')
add('p7_save', 'PAGE-007', 'DEF-014', '保存昵称按钮', 'Profile.vue:27 el-button[保存]', 'loading 态', 'high', parent='p7_form', notes='PUT /user/profile')
add('p7_alert', 'PAGE-007', 'DEF-014', '账号安全提示 alert', 'Profile.vue:30-33 el-alert', '静态', parent='p7_shell')
# PAGE-008 题目管理
add('p8_shell', 'PAGE-008', 'DEF-002', '管理端页壳实例', 'AdminLayout.vue:21 el-container', 'active=/admin/questions', notes='侧栏 2 项菜单+头部返回/退出')
add('p8_head', 'PAGE-008', 'DEF-015', '题目管理卡片头+新建按钮', 'QuestionManage.vue:4-9', '默认', 'high', parent='p8_shell', notes='打开空表单对话框')
add('p8_search', 'PAGE-008', 'DEF-015', '搜索工具条', 'QuestionManage.vue:11-17', '回车/清空触发', parent='p8_shell')
add('p8_table', 'PAGE-008', 'DEF-015', '题目表格', 'QuestionManage.vue:19-45 el-table', '行数据等价类', parent='p8_shell', dsrc='GET /admin/questions', eq='题目行')
add('p8_edit', 'PAGE-008', 'DEF-015', '行按钮-编辑', 'QuestionManage.vue:41', '默认', parent='p8_table', notes='回填对话框')
add('p8_del', 'PAGE-008', 'DEF-015', '行按钮-删除', 'QuestionManage.vue:42', '二次确认', 'high', parent='p8_table', notes='软删 DELETE /admin/questions/:id')
add('p8_pager', 'PAGE-008', 'DEF-015', '分页器', 'QuestionManage.vue:47-51 el-pagination', '默认', parent='p8_shell')
add('p8_dialog', 'PAGE-008', 'DEF-015', '题目编辑对话框', 'QuestionManage.vue:54-111 el-dialog', '新建/编辑 两态', 'high', parent='p8_shell', notes='destroy-on-close；自定义 validate()')
add('p8_subject', 'PAGE-008', 'DEF-015', '对话框-科目选择', 'QuestionManage.vue:57 el-select', '默认', parent='p8_dialog')
add('p8_type', 'PAGE-008', 'DEF-015', '对话框-题型单选', 'QuestionManage.vue:62 el-radio-group', '切换清空答案', parent='p8_dialog')
add('p8_content', 'PAGE-008', 'DEF-015', '对话框-题干输入', 'QuestionManage.vue:69 textarea', 'maxlength 500', parent='p8_dialog')
add('p8_options', 'PAGE-008', 'DEF-015', '对话框-选项编辑器(条件)', 'QuestionManage.vue:71-83', '非 judge 显示；增删选项', parent='p8_dialog')
add('p8_answer', 'PAGE-008', 'DEF-015', '对话框-正确答案输入', 'QuestionManage.vue:84-95', 'judge=radio；选择题=文本', 'high', parent='p8_dialog')
add('p8_analysis', 'PAGE-008', 'DEF-015', '对话框-解析输入', 'QuestionManage.vue:97 textarea', 'maxlength 500', parent='p8_dialog')
add('p8_diff', 'PAGE-008', 'DEF-015', '对话框-难度评分', 'QuestionManage.vue:100 el-rate', '1-5', parent='p8_dialog')
add('p8_status', 'PAGE-008', 'DEF-015', '对话框-状态开关', 'QuestionManage.vue:104 el-switch', '启用/停用', parent='p8_dialog')
add('p8_save', 'PAGE-008', 'DEF-015', '对话框-保存/取消按钮', 'QuestionManage.vue:108-109', '保存 loading 态', 'high', parent='p8_dialog', notes='POST/PUT /admin/questions')
# PAGE-009 用户管理
add('p9_shell', 'PAGE-009', 'DEF-002', '管理端页壳实例', 'AdminLayout.vue:21', 'active=/admin/users')
add('p9_filters', 'PAGE-009', 'DEF-016', '筛选工具条(角色/状态)', 'UserManage.vue:6-16', '清空=全部', parent='p9_shell')
add('p9_table', 'PAGE-009', 'DEF-016', '用户表格', 'UserManage.vue:18-51 el-table', '行数据等价类', parent='p9_shell', dsrc='GET /admin/users', eq='用户行')
add('p9_toggle', 'PAGE-009', 'DEF-016', '行按钮-启用/禁用', 'UserManage.vue:43-48', '自身行禁用；二次确认', 'high', parent='p9_table', notes='PATCH /admin/users/:id/status')
add('p9_pager', 'PAGE-009', 'DEF-016', '分页器', 'UserManage.vue:53-57 el-pagination', '默认', parent='p9_shell')
# PAGE-010
add('p10_redirect', 'PAGE-010', 'DEF-007', '未知路径重定向', 'web/src/router/index.js:29', '未登录/已登录', notes='redirect: /')

d['instances'] = I

# ---------------- scenarios ----------------
S = []
def scn(sid, title, pages, keys, pre, steps, expected, ctx, risk='normal', status='planned', reason=''):
    S.append({'id': sid, 'title': title, 'page_ids': pages, 'instance_ids': [N[k] for k in keys],
              'preconditions': pre, 'steps': steps, 'expected': expected,
              'context': {'role': ctx[0], 'data': ctx[1], 'network': ctx[2], 'viewport': ctx[3], 'input': ctx[4], 'lifecycle': ctx[5]},
              'risk': risk, 'status': status, 'evidence_ids': [], 'finding_ids': [], 'reason': reason})

D = '桌面 1280×800'
M = '移动视口 375×667'
scn('SCN-001', '未登录访问受保护页被送往登录并可回跳', ['PAGE-001','PAGE-003'], ['p1_form','p1_btn'], ['未登录','清空 localStorage'], ['直接访问 /plan','输入账号密码登录'], ['跳 /login?redirect=/plan；登录后回到 /plan'], ('未登录考生','空数据','正常',D,'键鼠','首次访问'), 'high')
scn('SCN-002', '登录失败：错误凭据有明确提示且不跳转', ['PAGE-001'], ['p1_form','p1_btn'], ['未登录'], ['输入不存在用户/错误密码','点登录'], ['错误提示可见；停留登录页；无 token 写入'], ('未登录考生','不存在账号','正常',D,'键鼠','首次提交'), 'high')
scn('SCN-003', '登录表单校验：空字段阻止提交', ['PAGE-001'], ['p1_form','p1_user','p1_pwd','p1_btn'], ['未登录'], ['直接点登录'], ['字段级必填提示出现；不发请求'], ('未登录考生','空数据','正常',D,'键鼠','首次提交'))
scn('SCN-004', '注册成功后跳转登录并可登录', ['PAGE-002','PAGE-001'], ['p2_form','p2_btn','p1_form','p1_btn'], ['未登录','目标用户名未被占用'], ['填写合法信息','提交','用新账号登录'], ['注册成功提示；跳 /login；登录成功进首页'], ('未登录考生','新用户数据','正常',D,'键鼠','首次注册'), 'high')
scn('SCN-005', '注册校验：用户名格式/密码长度/两次不一致', ['PAGE-002'], ['p2_form','p2_user','p2_pwd','p2_confirm'], ['未登录'], ['非法用户名提交','短密码提交','两次密码不一致提交'], ['各自字段级错误提示；不发请求'], ('未登录考生','空数据','正常',D,'键鼠','首次提交'))
scn('SCN-006', '注册撞名：用户名重复返回明确错误', ['PAGE-002'], ['p2_btn'], ['未登录','已存在用户 u1'], ['用 u1 的用户名注册'], ['明确错误提示（用户名已存在）；表单保留输入'], ('未登录考生','已存在用户名','正常',D,'键鼠','首次提交'))
scn('SCN-007', '首页概览与今日任务展示', ['PAGE-003'], ['p3_welcome','p3_stats','p3_progress','p3_today','p3_taskrow'], ['已登录考生','已有作答记录与计划'], ['进入首页'], ['统计数值与后端一致；今日任务按状态展示；无 JS 报错'], ('考生','有作答/有计划','正常',D,'键鼠','登录后首次进入'), 'high')
scn('SCN-008', '首页无计划/无任务的空态', ['PAGE-003'], ['p3_noplan','p3_today'], ['已登录新考生','零作答零计划'], ['进入首页'], ['显示"还没有生效中的复习计划"提示；统计为 0；今日任务卡片不出现'], ('新考生','零数据','正常',D,'键鼠','登录后首次进入'))
scn('SCN-009', '刷题作答判分：单选/多选/判断各答一题', ['PAGE-004'], ['p4_card','p4_next','p4_prev','p4_count'], ['已登录考生','题库含三种题型'], ['选科目筛选','作答单选提交','作答多选提交','作答判断提交'], ['判分结果与答案一致；正确答案与解析展示；下一题解锁'], ('考生','三种题型各一题','正常',D,'键鼠','刷题会话'), 'high')
scn('SCN-010', '刷题翻页：末题跳下一页且上一题行为正确', ['PAGE-004'], ['p4_prev','p4_next','p4_nav','p4_card'], ['已登录考生','题目数 >10'], ['作答至本页末题','点下一题跨页','在新页 idx=0 点上一题'], ['跨页后位置与计数正确；上一题按钮状态与行为一致（禁用或可回退）'], ('考生','>10 题','正常',D,'键鼠','刷题会话'), 'high')
scn('SCN-011', '刷题筛选切换后判分状态不残留', ['PAGE-004'], ['p4_subject','p4_qtype','p4_card'], ['已登录考生','两科目均有题'], ['作答 A 科第一题（判分）','切到 B 科'], ['切筛后回到第 1 题未作答态；旧判分不锁定新题'], ('考生','跨科目题','正常',D,'键鼠','刷题会话'))
scn('SCN-012', '刷题空态：筛选无题显示空提示', ['PAGE-004'], ['p4_empty'], ['已登录考生','某筛选组合无题'], ['选择无题组合'], ['el-empty"暂无题目"显示；无报错'], ('考生','空筛选结果','正常',D,'键鼠','刷题会话'))
scn('SCN-013', '错题列表与筛选（未掌握/已掌握/全部）', ['PAGE-005'], ['p5_filters','p5_mastered','p5_table','p5_pager'], ['已登录考生','已有错题记录'], ['进入错题本','切三种掌握状态筛选','翻页'], ['列表与 total 与后端一致；筛选重置到第 1 页'], ('考生','有错题','正常',D,'键鼠','错题复习'), 'high')
scn('SCN-014', '错题详情+重练判分+答对自动标记掌握', ['PAGE-005'], ['p5_view','p5_drawer','p5_redo','p5_result','p5_mark'], ['已登录考生','存在未掌握错题'], ['点查看/AI讲解打开抽屉','作答提交（先错后对）','答对后关闭抽屉看列表'], ['判分正确；答对提示自动掌握；列表状态与详情一致'], ('考生','未掌握错题','正常',D,'键鼠','错题复习'), 'high')
scn('SCN-015', 'AI 讲解：缓存命中/生成/失败重试三态', ['PAGE-005'], ['p5_explain'], ['已登录考生','mock AI 模式','错题详情打开'], ['首次打开观察生成','关闭重开观察缓存','注入失败后点重试'], ['生成有 loading 反馈；缓存命中标注"缓存"；失败有明确错误与重试入口'], ('考生','错题详情','正常',D,'键鼠','错题复习'), 'high')
scn('SCN-016', '标记掌握/取消掌握双向切换', ['PAGE-005'], ['p5_mark'], ['已登录考生','未掌握错题一行'], ['点标记掌握并确认','切到已掌握筛选','点取消掌握并确认'], ['两次状态切换成功且列表刷新一致'], ('考生','错题状态','正常',D,'键鼠','错题复习'))
scn('SCN-017', '错题本空态', ['PAGE-005'], ['p5_table'], ['已登录新考生','零错题'], ['进入错题本'], ['表格空态（暂无数据）；无 JS 报错'], ('新考生','零数据','正常',D,'键鼠','首次进入'))
scn('SCN-018', '生成复习计划（首次）', ['PAGE-006'], ['p6_form','p6_date','p6_subjects','p6_minutes','p6_gen','p6_plan','p6_collapse'], ['已登录考生','无生效计划','mock AI'], ['选考试日期/科目/时长','点生成计划'], ['生成成功；任务按日分组；今天展开；进度 0%'], ('考生','无计划','正常',D,'键鼠','计划制定'), 'high')
scn('SCN-019', '任务打卡与进度更新', ['PAGE-006'], ['p6_checkin','p6_taskrow','p6_prog'], ['已登录考生','有生效计划'], ['点某任务打卡完成','观察进度'], ['任务置完成态；进度即时更新；重复打卡不重复计数'], ('考生','有计划','正常',D,'键鼠','计划执行'), 'high')
scn('SCN-020', '重新生成计划需确认并归档旧计划', ['PAGE-006'], ['p6_gen','p6_plan'], ['已登录考生','已有计划与打卡记录'], ['点生成计划','确认弹窗确定','取消路径各试一次'], ['确认后新计划生效旧计划归档；取消无副作用'], ('考生','有计划有打卡','正常',D,'键鼠','计划制定'), 'high')
scn('SCN-021', '计划页空态', ['PAGE-006'], ['p6_empty'], ['已登录新考生','无计划'], ['进入计划页'], ['el-empty"还没有复习计划"显示'], ('新考生','零数据','正常',D,'键鼠','首次进入'))
scn('SCN-022', '个人中心查看与修改昵称', ['PAGE-007'], ['p7_info','p7_form','p7_nick','p7_save'], ['已登录考生'], ['查看账号信息','输入新昵称保存','空昵称提交'], ['保存成功后信息刷新；空昵称警告不提交'], ('考生','正常账号','正常',D,'键鼠','资料维护'), 'high')
scn('SCN-023', '管理端权限：考生访问 /admin 被拦截', ['PAGE-008','PAGE-009'], ['p8_shell','p9_shell'], ['考生登录','伪造 localStorage role=admin'], ['直接访问 /admin/questions','带伪造角色访问'], ['路由守卫拦截回首页；绕过前端后 API 返回 40301'], ('考生','正常账号','正常',D,'键鼠','越权尝试'), 'high')
scn('SCN-024', '题目管理 CRUD 全流程', ['PAGE-008'], ['p8_head','p8_dialog','p8_save','p8_table','p8_edit','p8_del','p8_search'], ['admin 登录','题库有数据'], ['新建题目（单选）','编辑该题改答案','删除该题','搜索关键词'], ['创建/编辑/软删成功且列表刷新；删除有确认；考生端不再出现该题'], ('管理员','题库数据','正常',D,'键鼠','题库维护'), 'high')
scn('SCN-025', '题目对话框校验拦截非法输入', ['PAGE-008'], ['p8_dialog','p8_content','p8_options','p8_answer','p8_save'], ['admin 登录','打开新建对话框'], ['空题干保存','单选设两个答案','答案字母不存在','judge 不选答案'], ['各给明确校验提示；不发请求'], ('管理员','空表单','正常',D,'键鼠','题库维护'))
scn('SCN-026', '用户管理启用/禁用与自保护', ['PAGE-009'], ['p9_table','p9_toggle'], ['admin 登录','有其他考生账号'], ['禁用某考生并确认','刷新看状态','尝试禁用自己','用被禁账号登录'], ['禁用生效；自身行按钮禁用；被禁账号请求 40302'], ('管理员','多账号','正常',D,'键鼠','用户管理'), 'high')
scn('SCN-027', '令牌失效全局跳转登录', ['PAGE-003','PAGE-001'], ['p3_shell'], ['已登录但 token 失效'], ['触发任意接口调用'], ['40101 时清理本地凭据并跳 /login；redirect 参数保留'], ('考生','失效令牌','正常',D,'键鼠','会话中'), 'high')
scn('SCN-028', '账号被禁用后的请求反馈', ['PAGE-003'], ['p3_shell'], ['已登录考生被禁用','浏览器不刷新'], ['在页面触发接口'], ['40302 提示"账号已被禁用"；会话终止跳登录'], ('考生','被禁账号','正常',D,'键鼠','会话中'))
scn('SCN-029', '未知路径重定向到首页', ['PAGE-010'], ['p10_redirect'], ['已登录考生'], ['访问 /no-such-page'], ['重定向到 /（登录态进首页）'], ('考生','正常账号','正常',D,'键鼠','任意时刻'))
scn('SCN-030', '移动视口 375px 布局可用性', ['PAGE-003','PAGE-004','PAGE-005','PAGE-006'], ['p3_shell','p4_shell','p5_table','p5_drawer','p6_form'], ['已登录考生'], ['375×667 视口逐页查看','操作核心按钮'], ['导航/筛选/核心操作无遮挡无横向溢出；表格与抽屉可用'], ('考生','正常数据','正常',M,'触摸/键鼠','逐页'), 'high')
scn('SCN-031', '键盘可达性：Tab 遍历登录与答题控件', ['PAGE-001','PAGE-004'], ['p1_form','p1_btn','p4_card'], ['未登录（登录）/已登录（答题）'], ['仅键盘完成登录','仅键盘选择选项并提交'], ['控件可聚焦可激活；焦点顺序合理；选项可键盘选择'], ('考生','正常数据','正常',D,'仅键盘','逐页'), 'high')
scn('SCN-032', '生产构建可复现', ['PAGE-003'], [], ['web 依赖已安装'], ['npm run build','检查 dist 产物','preview 服务打开'], ['构建成功无报错；产物可被静态服务打开'], ('审查者','源码快照','离线构建',D,'命令行','一次性'), 'high')
scn('SCN-033', '并发/乱序：快速切换筛选与连续提交', ['PAGE-004','PAGE-005'], ['p4_subject','p5_subject','p4_card'], ['已登录考生'], ['快速连续切筛选 3 次','快速双击提交按钮'], ['最终展示与最后一次操作一致；不重复计分'], ('考生','正常数据','高延迟',D,'快速键鼠','会话中'))
scn('SCN-034', '离开返回：刷题中途切页再回来', ['PAGE-004','PAGE-005'], ['p4_card','p5_shell'], ['已登录考生','已作答部分题'], ['作答 2 题后切错题本','返回刷题页'], ['列表重载；作答结果与后端一致（本地 results 重置符合预期）'], ('考生','部分作答','正常',D,'键鼠','会话中'))
scn('SCN-035', 'AI 生成失败重试（模拟上游不可用）', ['PAGE-005','PAGE-006'], ['p5_explain','p6_gen'], ['已登录考生','AI 上游失败或限流'], ['打开讲解观察失败态','点重试','计划页生成遇 50201/50202'], ['失败提示明确含原因；重试可恢复；不落脏数据'], ('考生','AI 失败注入','正常',D,'键鼠','错题复习/计划'), 'high')
scn('SCN-036', '限流：AI 接口超频返回 42901', ['PAGE-005'], ['p5_explain'], ['已登录考生','AI_RATE_LIMIT_PER_MIN=5'], ['连续快速点重新生成 6+ 次'], ['超频收到"请求过于频繁"提示；界面可恢复'], ('考生','连续请求','正常',D,'快速键鼠','会话中'))
d['scenarios'] = S

d['progress'] = {
    'current_page': None,
    'completed_batches': ['全量源码通读（web 18 文件 + server 契约相关 12 文件）', '台账初始化与 PAGE/DEF/CMP/SCN 全量登记'],
    'next_actions': ['搭建 DB+server+web 运行环境', '逐页运行验证并登记证据', '形成 FND/BP/PLAN/TASK 与报告'],
    'unresolved_access': [],
    'last_updated': NOW,
}

json.dump(d, open(PATH, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('pages', len(d['pages']), 'defs', len(d['definitions']), 'instances', len(d['instances']), 'scenarios', len(d['scenarios']))
ids = {i['id'] for i in d['instances']}
for i in d['instances']:
    p = i.get('parent_instance_id')
    assert not p or p in ids, (i['id'], p)
scn_insts = {x for s in d['scenarios'] for x in s['instance_ids']}
missing = scn_insts - ids
assert not missing, missing
print('refs OK; instances with scenario:', len(scn_insts), '/', len(ids))
