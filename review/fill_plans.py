# -*- coding: utf-8 -*-
"""回填组件蓝图 BP、实例处置 PLAN、任务 TASK 与发布门槛 GATE。"""
import json
PATH = 'review/audit.json'
d = json.load(open(PATH, encoding='utf-8'))
inst = {i['id']: i for i in d['instances']}
scn_of_inst = {}
for s in d['scenarios']:
    for x in s['instance_ids']:
        scn_of_inst.setdefault(x, []).append(s['id'])

# ---------------- blueprints ----------------
BP = []
def bp(def_id, name, current, change_locs, target):
    BP.append({'id': f'BP-{len(BP)+1:03d}', 'definition_id': def_id, 'current_contract': current,
               'target_contract': target, 'change_locations': change_locs})

bp('DEF-001', 'StudentLayout', '考生端页壳：顶部品牌+el-menu(5 项,:ellipsis=false)+右侧昵称/条件管理入口/退出；昵称取 userStore.profile（他页未加载时为"同学"）。EV-105',
   ['web/src/layout/StudentLayout.vue'],
   {'responsibility': '考生端全局导航与账号区；不含业务数据获取', 'interface': '仅承载 router-view；导航项常量数组；退出调用 userStore.logout()',
    'states': '登录态静态；active 菜单随路由；移动端需新增折叠/抽屉态', 'data_effects': 'profile 由登录后统一注入 store（TASK-006），布局不再依赖页面拉取',
    'semantics_accessibility': 'el-menu 保持语义；折叠导航按钮有可访问名称与 aria-expanded', 'styling_layout': '响应式：<768px 导航折叠为抽屉/汉堡，内容区 padding 收缩（TASK-002）',
    'performance_lifecycle': '无定时器；logout 清理本地凭据', 'security_privacy': '昵称仅展示非敏感字段', 'observability': 'logout 失败静默可接受；无需新增埋点',
    'integration': '与 router meta.active 配合；被 PAGE-003..007 共享'})
bp('DEF-002', 'AdminLayout', '管理端页壳：侧栏 2 项菜单+头部返回/退出；桌面布局。EV-002',
   ['web/src/layout/AdminLayout.vue'],
   {'responsibility': '管理端导航与出口', 'interface': '保持现状', 'states': '静态', 'data_effects': '无直接请求',
    'semantics_accessibility': 'el-menu 语义可用', 'styling_layout': '桌面布局保持；窄屏不在支持范围（详见 BP-001 移动策略说明）',
    'performance_lifecycle': '无', 'security_privacy': '进入依赖路由 meta + 后端 40301', 'observability': '无', 'integration': '被 PAGE-008/009 共享'})
bp('DEF-003', 'QuestionCard', '题目卡片：meta 标签+题干+选项 div(@click)+提交按钮+el-result/解析；result 由父级持有锁定；judge 回退两项无 right 高亮；sub-title 直拼 correct_answer。EV-101',
   ['web/src/components/QuestionCard.vue'],
   {'responsibility': '题目展示与作答选择；判分结果展示；不含请求', 'interface': 'props: question{options 可为 JSON 字符串}, result|null；emit: submit{question_id,user_answer}（多选排序连写）保持兼容',
    'states': '未作答→已选→已判分锁定；切换 question.id 重置 picked（保留）；三题型分支统一结果反馈',
    'data_effects': '无请求；picked 本地', 'semantics_accessibility': '选项改 input[type=radio|checkbox]+label（判断题同）或 role+tabindex+Space/Enter+aria-checked；fieldset 分组；焦点可见（TASK-004）',
    'styling_layout': '保留现有视觉；right 高亮合并到两分支；judge 文案映射 true→正确（√）（TASK-004）',
    'performance_lifecycle': 'props.result 锁定渲染', 'security_privacy': '不展示未判分答案（保持）', 'observability': '无需埋点',
    'integration': 'Practice/WrongBook 复用；result 形状（is_correct/correct_answer/analysis）不变'})
bp('DEF-004', 'ExplainPanel', 'AI 讲解面板：init(getAiConfig→缓存→按需 generate)；loading 仅 generate 置位；failed 死状态；失败描述固定；旧内容保留无失败 UI。EV-103',
   ['web/src/components/ExplainPanel.vue'],
   {'responsibility': '讲解获取/生成/重试与来源标注', 'interface': 'props: wrongQuestionId；emit: explained（可保留）；GET/POST /ai/explanations 契约不变',
    'states': '显式 status: idle|loading|success|failed；init 窗口渲染 skeleton；generate 失败且有旧内容→保留内容+失败横幅；失败原因按 code 映射（42901/50201/50202）（TASK-007）',
    'data_effects': '缓存命中不发 POST；force=1 强制重生成；失败不写脏数据（保持后端行为）',
    'semantics_accessibility': 'skeleton 有 aria-busy；错误 alert role=alert', 'styling_layout': '沿用；失败横幅复用 el-alert',
    'performance_lifecycle': '组件卸载丢弃在途请求结果（用请求序号防乱序）', 'security_privacy': '不落盘缓存', 'observability': 'console.warn 带 code（脱敏）',
    'integration': 'WrongBook 抽屉内使用；:key 重置逻辑保持'})
bp('DEF-005', 'request', 'Axios 层：baseURL、Bearer 注入、code!==0 统一 toast、40101 清凭据跳登录带 redirect；AI 调用点各自 timeout。EV-108',
   ['web/src/api/request.js'],
   {'responsibility': '传输层统一鉴权与错误码处理', 'interface': '保持响应解包为 data；为业务层透传 code/message（供 ExplainPanel 错误映射）',
    'states': '40101 一次性跳转（并发请求防重复跳）', 'data_effects': '超时统一走 constants.TIMEOUT（TASK-009）',
    'semantics_accessibility': 'toast 文案保持', 'styling_layout': '无', 'performance_lifecycle': '无',
    'security_privacy': '不记录 token；错误信息不含敏感响应体', 'observability': 'console 保留脱敏错误码',
    'integration': '所有 api/index.js 调用者兼容不变'})
bp('DEF-006', 'user store', 'Pinia user store：token/role/profile；login 落 localStorage；reset 清理；fetchProfile/saveProfile。EV-108',
   ['web/src/stores/user.js'],
   {'responsibility': '会话与个人信息状态所有权', 'interface': 'actions 保持；login 成功后拉取 profile（TASK-006）',
    'states': '登录/登出/失效三态一致清理', 'data_effects': 'localStorage 键统一用 STORAGE_KEYS（TASK-009）',
    'semantics_accessibility': '无 UI', 'styling_layout': '无', 'performance_lifecycle': '无',
    'security_privacy': 'token 仅存 localStorage（现状，XSS 风险在 BP-005 备注）', 'observability': '无',
    'integration': '被 StudentLayout/Home/Profile/Login 消费'})
bp('DEF-007', 'router', '路由表+全局守卫：requiresAuth→/login?redirect、admin role 检查（localStorage）、通配重定向 /。EV-001',
   ['web/src/router/index.js'],
   {'responsibility': '路由与前端准入提示（信任边界在后端）', 'interface': '路由名/路径不变',
    'states': '守卫判定顺序保持', 'data_effects': '无', 'semantics_accessibility': 'redirect 回跳体验保持',
    'styling_layout': '无', 'performance_lifecycle': '懒加载分包（保持）', 'security_privacy': 'redirect 校验 /^\\//（TASK-009）',
    'observability': '无', 'integration': '与 store/后端 40301 双重拦截配合'})
bp('DEF-008', 'Login', '登录页：居中卡+表单校验+回车提交+redirect 回跳；submit try/finally 无 catch。EV-108',
   ['web/src/views/student/Login.vue'],
   {'responsibility': '登录入口', 'interface': '不变', 'states': '校验/提交 loading/失败提示',
    'data_effects': '成功后由 store 拉取 profile', 'semantics_accessibility': 'label 关联保持；按钮 loading aria',
    'styling_layout': 'card width:400px 改 max-width:calc(100vw - 32px)（TASK-002）',
    'performance_lifecycle': '无', 'security_privacy': 'redirect 白名单校验（TASK-009）', 'observability': '失败提示来自拦截器',
    'integration': 'store.login'})
bp('DEF-009', 'Register', '注册页：用户名正则/密码≥6/两次一致校验；submit try/finally 无 catch。EV-108',
   ['web/src/views/student/Register.vue'],
   {'responsibility': '注册入口', 'interface': '不变', 'states': '三分支校验保持；补 catch',
    'data_effects': '注册成功跳登录', 'semantics_accessibility': 'label 保持', 'styling_layout': '同 BP-008 移动端收缩',
    'performance_lifecycle': '无', 'security_privacy': '密码不回显（保持）', 'observability': '错误提示来自拦截器',
    'integration': 'api.registerUser'})
bp('DEF-010', 'Home', '首页：欢迎卡+4 统计+条件提示+今日任务+4 入口卡(el-card @click)；固定 :span=6。EV-106',
   ['web/src/views/student/Home.vue'],
   {'responsibility': '学习概览与模块入口', 'interface': '不变', 'states': '零数据/有数据保持；补 error 态与重试（TASK-008）',
    'data_effects': 'fetchProfile+getOverview 并行，失败进 error', 'semantics_accessibility': '入口卡改 router-link 或 role=link+键盘（TASK-004）',
    'styling_layout': '统计/入口卡加 :xs 断点（TASK-002）', 'performance_lifecycle': '无',
    'security_privacy': '无敏感展示', 'observability': '失败 console.warn', 'integration': 'store.profile'})
bp('DEF-011', 'Practice', '刷题页：筛选+单题作答(QuestionCard)+页内翻页；results 以题目 id 缓存；prev 不跨页。EV-102',
   ['web/src/views/student/Practice.vue'],
   {'responsibility': '筛选、逐题作答、页内/跨页导航', 'interface': '不变', 'states': '补跨页回退：idx=0 且 page>1 时加载上一页末题；按钮状态与能力一致（TASK-003）',
    'data_effects': 'load() 加请求序号防乱序（TASK-005 相关）', 'semantics_accessibility': '随 QuestionCard 修复',
    'styling_layout': '筛选条窄屏换行（TASK-002）', 'performance_lifecycle': '防重复提交守卫保持',
    'security_privacy': '无', 'observability': '无', 'integration': 'api getQuestions/submitAnswer'})
bp('DEF-012', 'WrongBook', '错题本：筛选+表格+分页+详情抽屉+重练+掌握切换+ExplainPanel；onRepractice 不刷新列表；抽屉 560px；写操作无守卫。EV-104/EV-110',
   ['web/src/views/student/WrongBook.vue'],
   {'responsibility': '错题列表/详情/重练/掌握管理/AI 讲解入口', 'interface': '不变；建议后端 repractice 返回最新 wrong_count/mastered',
    'states': '答对后 load() 或行内同步；wrong_count 即时更新（TASK-005）', 'data_effects': 'toggleMastered 加防重入；列表刷新口径统一',
    'semantics_accessibility': '随 QuestionCard 修复；抽屉关闭按钮语义保持', 'styling_layout': '抽屉 size=min(560px,100%)（TASK-002）',
    'performance_lifecycle': '写按钮 loading', 'security_privacy': '详情不含答案（保持）', 'observability': 'masteredSynced=false 时如实提示（TASK-005）',
    'integration': 'api wrong 域 + ExplainPanel'})
bp('DEF-013', 'Plan', '计划页：生成表单（日期/科目/时长）+AI 模式标签+计划卡（进度/折叠任务/打卡）+空态；getCurrentPlan 失败与空态混淆；生成无防重入。EV-002',
   ['web/src/views/student/Plan.vue'],
   {'responsibility': '计划生成、任务打卡、进度展示', 'interface': '不变', 'states': '空/error 区分（TASK-008）；生成按钮防重入（TASK-005）',
    'data_effects': 'Promise.allSettled 保持；错误分支标记 error', 'semantics_accessibility': 'el-form/el-collapse 语义保持',
    'styling_layout': '表单窄屏全宽（TASK-002）', 'performance_lifecycle': '打卡 _checking 保持',
    'security_privacy': '无', 'observability': '失败 toast+error 态', 'integration': 'api plan/AI 域'})
bp('DEF-014', 'Profile', '个人中心：账号信息+昵称表单+提示；空昵称拦截；load 失败静默。EV-002',
   ['web/src/views/student/Profile.vue'],
   {'responsibility': '个人信息查看/昵称修改', 'interface': '不变', 'states': '补 error 态（TASK-008）；保存按钮防重入（TASK-005）',
    'data_effects': 'saveProfile 后刷新', 'semantics_accessibility': 'label 保持', 'styling_layout': ':xs=24 已响应（保持）',
    'performance_lifecycle': '无', 'security_privacy': '不展示密码域（保持）', 'observability': '无', 'integration': 'store.saveProfile'})
bp('DEF-015', 'QuestionManage', '题目管理：搜索+表格+分页+编辑对话框（自定义 validate 链）+软删；关键词搜索 500；getSubjects 失败阻断 load。EV-107',
   ['web/src/views/admin/QuestionManage.vue', 'server/src/dao/questionDao.js', 'server/src/services/adminService.js'],
   {'responsibility': '题库 CRUD 与检索', 'interface': '不变', 'states': '搜索失败展示错误态而非旧数据（TASK-001）',
    'data_effects': '后端修复 LIKE ESCAPE（TASK-001）；getSubjects 失败不阻断 load（TASK-008）',
    'semantics_accessibility': '对话框表单 label 保持', 'styling_layout': '桌面保持',
    'performance_lifecycle': '保存/删除防重入（TASK-005）', 'security_privacy': 'admin-only（后端强制，保持）',
    'observability': '500 具体化为可读提示', 'integration': 'api admin 域'})
bp('DEF-016', 'UserManage', '用户管理：筛选+表格+启用禁用（自保护 disabled、管理员禁用被后端拒绝）。EV-213',
   ['web/src/views/admin/UserManage.vue'],
   {'responsibility': '用户状态管理', 'interface': '不变', 'states': '保持',
    'data_effects': '防重入（TASK-005）；管理员行按钮建议禁用以匹配后端规则',
    'semantics_accessibility': '保持', 'styling_layout': '桌面保持', 'performance_lifecycle': 'row._checking 保持',
    'security_privacy': '自身禁用前端禁用+后端拒绝双保险（保持）', 'observability': '无', 'integration': 'api admin 域'})
bp('DEF-017', 'App', '应用根壳：router-view + 全局基础样式；组件库全量引入。EV-109',
   ['web/src/App.vue', 'web/src/main.js', 'web/vite.config.js'],
   {'responsibility': '应用装配与全局样式', 'interface': '不变', 'states': '无', 'data_effects': '无',
    'semantics_accessibility': '全局焦点样式可补', 'styling_layout': '保持', 'performance_lifecycle': 'Element Plus 按需引入/manualChunks（TASK-010）',
    'security_privacy': '无', 'observability': '无', 'integration': '全局入口'})
d['component_blueprints'] = BP

# ---------------- component plans ----------------
PAGE_OK = {
    'PAGE-001': '登录/注册互跳、校验三分支、错误凭据与 redirect 回跳已实测（EV-202）',
    'PAGE-002': '注册校验与成功路径已实测（EV-202）',
    'PAGE-003': '零数据/有数据概览、今日任务条件渲染已实测（EV-203）',
    'PAGE-004': '判分三分支、筛选重置、跨页前进、空态已实测（EV-204）',
    'PAGE-005': '列表筛选、详情抽屉、重练、掌握切换、讲解三态已实测（EV-206/207）',
    'PAGE-006': '生成/打卡/重新生成确认与空态已实测（EV-208）',
    'PAGE-007': '查看与改昵称、空值拦截已实测（EV-209）',
    'PAGE-008': 'CRUD 与校验链已实测（EV-211）；搜索失败见 FND-001',
    'PAGE-009': '启用禁用双向与自保护已实测（EV-213）',
    'PAGE-010': '未登录/已登录重定向已实测（EV-215）',
}
OVERRIDE = {
    'p1_card': ('configure', '移动端 400px 固定宽溢出', ['FND-002'], ['TASK-002'], 'max-width:calc(100vw - 32px) 生效，375px 无横向滚动'),
    'p2_card': ('configure', '移动端 400px 固定宽溢出', ['FND-002'], ['TASK-002'], '同登录卡 375px 无横向滚动'),
    'p1_btn': ('configure', 'redirect 未校验、submit 无 catch', ['FND-011'], ['TASK-009'], '非法 redirect 回落 /；异常有提示无 unhandled rejection'),
    'p2_btn': ('configure', 'submit 无 catch（unhandled rejection）', ['FND-011'], ['TASK-009'], '注册失败有提示、控制台无 Uncaught'),
    'p3_shell': ('configure', '导航不折叠致全站移动端溢出；昵称依赖他页拉取', ['FND-002', 'FND-007'], ['TASK-002', 'TASK-006'], '375px 导航折叠可用；任意页显示真实昵称'),
    'p4_shell': ('configure', '同页壳移动端溢出与昵称问题', ['FND-002', 'FND-007'], ['TASK-002', 'TASK-006'], '同上'),
    'p5_shell': ('configure', '同页壳移动端溢出与昵称问题', ['FND-002', 'FND-007'], ['TASK-002', 'TASK-006'], '同上'),
    'p6_shell': ('configure', '同页壳移动端溢出与昵称问题', ['FND-002', 'FND-007'], ['TASK-002', 'TASK-006'], '同上'),
    'p7_shell': ('configure', '同页壳移动端溢出', ['FND-002'], ['TASK-002'], '同上（昵称页为来源页）'),
    'p3_stats': ('configure', '移动端列宽挤压文字竖排', ['FND-002'], ['TASK-002'], '375px 统计两列堆叠可读'),
    'p3_progress': ('configure', '同统计行移动端挤压', ['FND-002'], ['TASK-002'], '同上'),
    'p3_entries': ('refactor', '入口卡键盘不可达且移动端竖排截断', ['FND-002', 'FND-004'], ['TASK-002', 'TASK-004'], '入口卡可键盘进入模块；375px 布局可读'),
    'p3_e1': ('refactor', 'el-card @click 无键盘可达', ['FND-004'], ['TASK-004'], 'Tab 聚焦+Enter 进入 /practice'),
    'p3_e2': ('refactor', '同上', ['FND-004'], ['TASK-004'], 'Tab 聚焦+Enter 进入 /wrong-book'),
    'p3_e3': ('refactor', '同上', ['FND-004'], ['TASK-004'], 'Tab 聚焦+Enter 进入 /plan'),
    'p3_e4': ('refactor', '同上', ['FND-004'], ['TASK-004'], 'Tab 聚焦+Enter 进入 /profile'),
    'p3_right': ('configure', '昵称来源依赖他页 fetchProfile', ['FND-007'], ['TASK-006'], '登录后任意页昵称正确'),
    'p3_welcome': ('refactor', '请求失败落入空/旧数据无错误态', ['FND-009'], ['TASK-008'], '断网显示错误态与重试按钮'),
    'p3_noplan': ('retain', '条件提示逻辑与 plan_progress===null 口径正确', [], [], 'plan_progress 为 null 时提示出现、有计划时不出现'),
    'p3_today': ('retain', '条件渲染与任务数据正确', [], [], '有任务显示卡片、无任务不渲染'),
    'p3_taskrow': ('retain', 'done 态删除线与标签正确', [], [], '打卡后行样式切换'),
    'p4_card': ('refactor', '选项无语义不可键盘操作；judge 展示原始 true 且无高亮', ['FND-004', 'FND-005'], ['TASK-004'], '仅键盘可完成选择提交；judge 文案为 正确（√）且正确项高亮'),
    'p4_prev': ('refactor', '第 2 页首页死按钮、无跨页回退', ['FND-003'], ['TASK-003'], '跨页可回退上一页末题，按钮状态与行为一致'),
    'p4_next': ('retain', '未作答禁用与跨页加载行为正确', [], [], '末题点下一题进入第 2 页'),
    'p4_nav': ('refactor', '位置文本与按钮状态组合在跨页回退后需同步', ['FND-003'], ['TASK-003'], '往返翻页位置文本正确'),
    'p4_filters': ('retain', '筛选触发 load 与清空行为正确', [], [], '切筛选重置第 1 题'),
    'p4_subject': ('configure', 'load() 无请求时序守卫，快速切换有乱序风险', ['FND-010'], ['TASK-005'], '慢网快速切换 3 次最终展示与最后一次一致'),
    'p4_qtype': ('configure', '同筛选时序守卫', ['FND-010'], ['TASK-005'], '同上'),
    'p4_count': ('retain', '计数与 total 同步', [], [], '筛选后计数正确'),
    'p4_empty': ('retain', '空态文案与条件正确（EV-204）', [], [], '无题筛选显示空态'),
    'p5_redo': ('refactor', '答对后列表不同步；选项语义缺失；judge 展示问题', ['FND-004', 'FND-005', 'FND-006'], ['TASK-004', 'TASK-005'], '答对后行状态=已掌握；仅键盘可重练'),
    'p5_result': ('refactor', '结果实例同 DEF-003 展示与语义问题', ['FND-004', 'FND-005'], ['TASK-004'], 'judge 文案/高亮正确、语义化'),
    'p5_explain': ('refactor', '状态机缺 idle、失败原因不分、failed 死状态', ['FND-008'], ['TASK-007'], '三态无闪现；失败显示具体原因与重试'),
    'p5_drawer': ('configure', '固定 560px 移动端超屏', ['FND-002'], ['TASK-002'], '375px 抽屉不超出视口'),
    'p5_table': ('refactor', '自动标记/重练后行状态与 wrong_count 不即时刷新', ['FND-006'], ['TASK-005'], '操作后行状态即时一致'),
    'p5_mark': ('configure', '无防重入（FND-010 待补证）', ['FND-010'], ['TASK-005', 'TASK-011'], '慢网双击仅发一次请求'),
    'p5_view': ('retain', '打开抽屉与详情加载正确', [], [], '详情不含答案、加载态正常'),
    'p5_desc': ('retain', '描述区字段正确', [], [], '科目/次数展示正确'),
    'p5_filters': ('retain', '筛选联动 onFilterChange 重置页码正确', [], [], '切筛选回到第 1 页'),
    'p5_pager': ('retain', '分页与 total 同步', [], [], '翻页数据正确'),
    'p6_form': ('retain', '表单控件与生成入口行为正确', [], [], '默认值/取值范围正确'),
    'p6_aitag': ('retain', 'mock/llm 标签展示正确（EV-208）', [], [], '标签与 provider 一致'),
    'p6_date': ('retain', '日期选择与天数提示逻辑正确（disabled-date 允许昨天为既定口径）', [], [], '选择日期后提示天数'),
    'p6_subjects': ('retain', '多选与空值=全部口径正确', [], [], '生成 payload 正确'),
    'p6_minutes': ('retain', '15-600 范围约束正确', [], [], '边界值有效'),
    'p6_gen': ('configure', '生成无防重入（FND-010 待补证）；已有计划确认弹窗正确', ['FND-010'], ['TASK-005', 'TASK-011'], '慢网双击仅一次生成；确认/取消路径正确'),
    'p6_plan': ('retain', '计划卡渲染与数据分组正确', [], [], '任务按日分组、今天展开'),
    'p6_prog': ('retain', '进度与打卡联动正确', [], [], '打卡后进度即时更新'),
    'p6_collapse': ('retain', '折叠分组与展开逻辑正确', [], [], '今天默认展开'),
    'p6_taskrow': ('retain', '任务行两态展示正确', [], [], '完成态样式正确'),
    'p6_checkin': ('retain', '打卡 _checking 防重入已具备', [], [], '重复点击不重复计数'),
    'p6_empty': ('refactor', 'getCurrentPlan 失败与无计划空态混淆', ['FND-009'], ['TASK-008'], '断网显示错误态而非"还没有复习计划"'),
    'p7_save': ('configure', '无防重入（FND-010 待补证）', ['FND-010'], ['TASK-005', 'TASK-011'], '慢网双击仅一次 PUT'),
    'p7_info': ('refactor', '拉取失败以 — 呈现无错误态', ['FND-009'], ['TASK-008'], '断网显示错误态与重试'),
    'p7_form': ('retain', '表单与空值拦截正确', [], [], '空昵称警告不提交'),
    'p7_nick': ('retain', 'maxlength/计数正确', [], [], '超长输入被限制'),
    'p7_alert': ('retain', '提示信息准确（引导管理员处理）', [], [], '文案与实际流程一致'),
    'p8_search': ('refactor', '关键词搜索 100% 失败（后端 SQL）且失败展示旧数据', ['FND-001'], ['TASK-001'], '搜索返回过滤结果；失败显示错误态'),
    'p8_table': ('configure', '搜索失败时保留旧列表误导', ['FND-001'], ['TASK-001'], '请求失败列表区显示错误而非旧数据'),
    'p8_del': ('configure', '无防重入（FND-010 待补证）；确认弹窗正确', ['FND-010'], ['TASK-005', 'TASK-011'], '慢网双击仅一次 DELETE'),
    'p8_save': ('configure', '保存无防重入（FND-010 待补证）', ['FND-010'], ['TASK-005', 'TASK-011'], '慢网双击仅一次提交'),
    'p8_head': ('refactor', 'getSubjects 失败阻断列表加载', ['FND-009'], ['TASK-008'], 'subjects 失败仍可加载列表'),
    'p8_dialog': ('retain', '新建/编辑两态回填正确、校验链完整（EV-211）', [], [], '编辑回填准确、保存后列表刷新'),
    'p8_options': ('retain', '选项增删与答案字母清理逻辑正确', [], [], '删选项后答案残留字母被清理'),
    'p8_answer': ('retain', 'judge radio/文本双分支与校验正确', [], [], '非法答案被拦截'),
    'p8_type': ('retain', '切换题型清空答案防误判', [], [], 'single→judge 不残留答案'),
    'p8_content': ('retain', 'maxlength 与必填校验正确', [], [], '空题干被拦截'),
    'p8_analysis': ('retain', '解析输入与展示链路正确', [], [], '解析随判分展示'),
    'p8_diff': ('retain', '难度 1-5 与后端校验一致', [], [], '非法难度被后端拦截'),
    'p8_status': ('retain', '启用停用开关联动正确', [], [], '状态列随保存更新'),
    'p8_edit': ('retain', '编辑按钮回填正确', [], [], '编辑弹窗数据准确'),
    'p8_subject': ('retain', '科目选择与 subjects 数据正确', [], [], '创建后科目列正确'),
    'p8_pager': ('retain', '分页与删末页回退逻辑正确', [], [], '删末页唯一行回上一页'),
    'p9_table': ('retain', '列表与角色/状态标签正确', [], [], '列数据与格式化正确'),
    'p9_toggle': ('retain', '双向切换、自保护与后端管理员防护正确（EV-213）', [], [], '禁用/启用/自身禁用/管理员禁用四路径正确'),
    'p9_filters': ('retain', '筛选与清空查询正确', [], [], '筛选结果正确'),
    'p9_pager': ('retain', '分页正确', [], [], '翻页正确'),
    'p10_redirect': ('retain', '未知路径重定向两态正确（EV-215）', [], [], '未登录/已登录重定向正确'),
}
DEF2BP = {f'DEF-{i:03d}': f'BP-{i:03d}' for i in range(1, 18)}
PLANS = []
# 按 label+page 反查 override（OVERRIDE 的 key 是脚本内部键，经 KEYMAP 映射）
OV_BY_LABEL = {}
KEYMAP = {
    'p1_card': ('登录卡片', 'PAGE-001'), 'p2_card': ('注册卡片', 'PAGE-002'),
    'p1_btn': ('登录提交按钮', 'PAGE-001'), 'p2_btn': ('注册提交按钮', 'PAGE-002'),
    'p3_shell': ('考生端页壳实例', 'PAGE-003'), 'p4_shell': ('考生端页壳实例', 'PAGE-004'),
    'p5_shell': ('考生端页壳实例', 'PAGE-005'), 'p6_shell': ('考生端页壳实例', 'PAGE-006'),
    'p7_shell': ('考生端页壳实例', 'PAGE-007'),
    'p3_stats': ('概览指标组(做题/正确率/未掌握)', 'PAGE-003'), 'p3_progress': ('计划进度指标', 'PAGE-003'),
    'p3_entries': ('模块入口卡片区', 'PAGE-003'),
    'p3_e1': ('入口卡-题库刷题', 'PAGE-003'), 'p3_e2': ('入口卡-错题本', 'PAGE-003'),
    'p3_e3': ('入口卡-智能复习计划', 'PAGE-003'), 'p3_e4': ('入口卡-个人中心', 'PAGE-003'),
    'p3_right': ('顶部用户区(昵称+条件管理入口+退出)', 'PAGE-003'),
    'p3_welcome': ('欢迎卡片(问候+概览)', 'PAGE-003'), 'p3_noplan': ('无计划提示(条件)', 'PAGE-003'),
    'p3_today': ('今日任务卡片(条件)', 'PAGE-003'), 'p3_taskrow': ('任务行(数据等价类)', 'PAGE-003'),
    'p4_card': ('QuestionCard 答题实例', 'PAGE-004'), 'p4_prev': ('上一题按钮', 'PAGE-004'),
    'p4_next': ('下一题按钮', 'PAGE-004'), 'p4_nav': ('翻页操作条', 'PAGE-004'),
    'p4_filters': ('筛选工具条', 'PAGE-004'), 'p4_subject': ('科目筛选下拉', 'PAGE-004'),
    'p4_qtype': ('题型筛选下拉', 'PAGE-004'), 'p4_count': ('题目计数文本', 'PAGE-004'),
    'p4_empty': ('空题库提示(条件)', 'PAGE-004'),
    'p5_redo': ('QuestionCard 重练实例', 'PAGE-005'), 'p5_result': ('QuestionCard 判分结果实例(条件)', 'PAGE-005'),
    'p5_explain': ('ExplainPanel AI 讲解实例', 'PAGE-005'), 'p5_drawer': ('详情抽屉', 'PAGE-005'),
    'p5_table': ('错题表格', 'PAGE-005'), 'p5_mark': ('行按钮-标记掌握/取消', 'PAGE-005'),
    'p5_view': ('行按钮-查看/AI讲解', 'PAGE-005'), 'p5_desc': ('详情描述区', 'PAGE-005'),
    'p5_filters': ('筛选工具条', 'PAGE-005'), 'p5_pager': ('分页器', 'PAGE-005'),
    'p6_form': ('生成表单卡片', 'PAGE-006'), 'p6_aitag': ('AI 模式标签(条件)', 'PAGE-006'),
    'p6_date': ('考试日期选择器', 'PAGE-006'), 'p6_subjects': ('目标科目多选', 'PAGE-006'),
    'p6_minutes': ('每日时长输入', 'PAGE-006'), 'p6_gen': ('生成计划按钮', 'PAGE-006'),
    'p6_plan': ('当前计划卡片(条件)', 'PAGE-006'), 'p6_prog': ('进度摘要+进度条', 'PAGE-006'),
    'p6_collapse': ('任务日期折叠面板', 'PAGE-006'), 'p6_taskrow': ('任务行(数据等价类)', 'PAGE-006'),
    'p6_checkin': ('打卡按钮', 'PAGE-006'), 'p6_empty': ('无计划空态', 'PAGE-006'),
    'p7_save': ('保存昵称按钮', 'PAGE-007'), 'p7_info': ('账号信息卡片', 'PAGE-007'),
    'p7_form': ('昵称修改表单', 'PAGE-007'), 'p7_nick': ('昵称输入', 'PAGE-007'),
    'p7_alert': ('账号安全提示 alert', 'PAGE-007'),
    'p8_search': ('搜索工具条', 'PAGE-008'), 'p8_table': ('题目表格', 'PAGE-008'),
    'p8_del': ('行按钮-删除', 'PAGE-008'), 'p8_save': ('对话框-保存/取消按钮', 'PAGE-008'),
    'p8_head': ('题目管理卡片头+新建按钮', 'PAGE-008'), 'p8_dialog': ('题目编辑对话框', 'PAGE-008'),
    'p8_options': ('对话框-选项编辑器(条件)', 'PAGE-008'), 'p8_answer': ('对话框-正确答案输入', 'PAGE-008'),
    'p8_type': ('对话框-题型单选', 'PAGE-008'), 'p8_content': ('对话框-题干输入', 'PAGE-008'),
    'p8_analysis': ('对话框-解析输入', 'PAGE-008'), 'p8_diff': ('对话框-难度评分', 'PAGE-008'),
    'p8_status': ('对话框-状态开关', 'PAGE-008'), 'p8_edit': ('行按钮-编辑', 'PAGE-008'),
    'p8_subject': ('对话框-科目选择', 'PAGE-008'), 'p8_pager': ('分页器', 'PAGE-008'),
    'p9_table': ('用户表格', 'PAGE-009'), 'p9_toggle': ('行按钮-启用/禁用', 'PAGE-009'),
    'p9_filters': ('筛选工具条(角色/状态)', 'PAGE-009'), 'p9_pager': ('分页器', 'PAGE-009'),
    'p10_redirect': ('未知路径重定向', 'PAGE-010'),
}
for key, (lb, pg) in KEYMAP.items():
    ids = [i['id'] for i in d['instances'] if i['label'] == lb and i['page_id'] == pg]
    assert len(ids) == 1, (key, lb, pg, ids)
    OV_BY_LABEL[ids[0]] = (key, OVERRIDE[key])

for i in d['instances']:
    ov = OV_BY_LABEL.get(i['id'])
    if ov:
        key, (disp, why, fnds, tasks, acc) = ov
        PLANS.append({'instance_id': i['id'], 'blueprint_id': DEF2BP[i['definition_id']], 'disposition': disp,
                      'rationale': why + f"（{PAGE_OK[i['page_id']]}）",
                      'instance_changes': [f"本实例按 {'/'.join(tasks)} 调整：{why}"],
                      'finding_ids': fnds, 'task_ids': tasks,
                      'acceptance_criteria': [acc],
                      'regression_scenario_ids': scn_of_inst.get(i['id'], ['SCN-007'])})
    else:
        PLANS.append({'instance_id': i['id'], 'blueprint_id': DEF2BP[i['definition_id']], 'disposition': 'retain',
                      'rationale': f"{i['label']}：{PAGE_OK[i['page_id']]}，未发现缺陷证据，保留现实现",
                      'instance_changes': [f"保持当前 {i['label']} 的行为、样式与数据契约；随所属页回归项验证"],
                      'finding_ids': [], 'task_ids': [],
                      'acceptance_criteria': [f"{i['label']} 在回归场景中行为与基线一致（{PAGE_OK[i['page_id']][:24]}…）"],
                      'regression_scenario_ids': scn_of_inst.get(i['id'], []) or ['SCN-007']})
d['component_plans'] = PLANS

# ---------------- tasks ----------------
T = []
def task(id, title, phase, owner, scope, fnds, deps, locs, steps, acc, verif, rollback, risk, status='planned'):
    T.append({'id': id, 'title': title, 'phase': phase, 'owner': owner, 'scope_ids': scope,
              'finding_ids': fnds, 'depends_on': deps, 'change_locations': locs,
              'implementation_steps': steps, 'acceptance_criteria': acc,
              'verification_scenario_ids': verif, 'rollback': rollback, 'risk': risk,
              'status': status, 'evidence_ids': []})

task('TASK-001', '修复题库关键词搜索 SQL 并完善搜索失败反馈', 1, '后端（主）+前端',
     ['PAGE-008', 'DEF-015'], ['FND-001'], [],
     ['server/src/dao/questionDao.js:26-45 adminList', 'web/src/views/admin/QuestionManage.vue load()'],
     ['将 LIKE 转义改为参数化 ESCAPE（如 \'|\'）并对 |、%、_ 转义，count 复用同一 where', '新增 DAO 测试覆盖 % _ \\ 与中文关键词', '前端 load() 失败时置 error 态、清空或标注列表不可用'],
     ['keyword=极限 返回正确过滤集；keyword=% 不匹配全部；搜索失败界面显示错误态', 'SCN-024 搜索分支通过'],
     ['SCN-024'], '回滚该 DAO 提交即恢复原行为（原行为为 500）', '低：单点 SQL 修复，不影响其他查询')
task('TASK-002', '移动端响应式布局修复', 1, '前端',
     ['PAGE-001', 'PAGE-002', 'PAGE-003', 'PAGE-004', 'PAGE-005', 'PAGE-006', 'PAGE-007', 'DEF-001', 'DEF-008', 'DEF-009', 'DEF-010', 'DEF-012'],
     ['FND-002'], [],
     ['web/src/layout/StudentLayout.vue', 'web/src/views/student/Home.vue', 'web/src/views/student/Login.vue', 'web/src/views/student/Register.vue', 'web/src/views/student/WrongBook.vue:137'],
     ['el-menu 窄屏折叠或换抽屉导航；Home 统计/入口卡加 :xs 断点', '登录/注册卡 max-width:calc(100vw - 32px)', '错题抽屉 size=min(560px,100%)', '375/768/1280 三断点逐页目测+截图'],
     ['375px 下无横向滚动、无文字竖排截断、核心操作可完成', 'SCN-030 通过'],
     ['SCN-030', 'SCN-037', 'SCN-038'], '还原样式提交', '低：纯样式/布局调整')
task('TASK-003', '刷题跨页回退与翻页状态一致', 1, '前端',
     ['PAGE-004', 'DEF-011'], ['FND-003'], [],
     ['web/src/views/student/Practice.vue:43-62 prev()/next()'],
     ['prev() 增加跨页分支：idx=0 且 page>1 时 page-=1、load 上一页并定位末题', '禁用条件与能力对齐；位置文本同步', '补跨页往返回归用例'],
     ['第 2 页首页可回退第 1 页末题；按钮状态与行为一致', 'SCN-010 通过'],
     ['SCN-010'], '还原该函数', '低')
task('TASK-004', 'QuestionCard 语义化与判分结果展示修复', 1, '前端',
     ['PAGE-003', 'PAGE-004', 'PAGE-005', 'DEF-003', 'DEF-010'], ['FND-004', 'FND-005'], [],
     ['web/src/components/QuestionCard.vue:54-85', 'web/src/views/student/Home.vue:60-68'],
     ['选项改原生 radio/checkbox+label 或补 role/tabindex/aria-checked/键盘处理', 'judge 回退选项并入 right 高亮；sub-title 按题型映射文案', '入口卡改 router-link 或补键盘可达', '键盘全流程回归'],
     ['仅键盘完成一题作答；judge 显示 正确（√）且正确项高亮；入口卡可键盘进入', 'SCN-031 通过'],
     ['SCN-031', 'SCN-009', 'SCN-038'], '还原组件', '低-中：交互重构需回归三题型')
task('TASK-005', '错题状态同步与写操作防重入', 2, '前端',
     ['PAGE-004', 'PAGE-005', 'PAGE-007', 'PAGE-008', 'DEF-011', 'DEF-012', 'DEF-014', 'DEF-015'],
     ['FND-006', 'FND-010'], [],
     ['web/src/views/student/WrongBook.vue:54-82', 'web/src/views/admin/QuestionManage.vue:238-277', 'web/src/views/student/Profile.vue:62-75', 'web/src/views/student/Plan.vue:138-163', 'web/src/views/student/Practice.vue:19-41'],
     ['onRepractice 答对后 load() 或按响应行内同步；消费 masteredSynced=false 分支', '为 toggleMastered/onDelete/onSave/saveProfile/生成计划补 in-flight 守卫（参照 _checking）', 'load() 加请求序号防乱序', '慢网双击回归'],
     ['答对后行状态即时为已掌握；慢网双击写操作仅一次请求；快速切筛选最终态正确', 'SCN-014 通过；SCN-033 可复验'],
     ['SCN-014', 'SCN-033', 'SCN-016'], '还原对应处理函数', '低')
task('TASK-006', '登录后统一加载用户 profile', 2, '前端',
     ['PAGE-003', 'PAGE-004', 'PAGE-005', 'PAGE-006', 'DEF-001', 'DEF-006'], ['FND-007'], [],
     ['web/src/stores/user.js login()', 'web/src/layout/StudentLayout.vue:33-37'],
     ['login 成功后 fetchProfile（失败静默），或 StudentLayout 挂载时确保 profile 可用', '回归各页页壳昵称'],
     ['登录后任意受保护页显示真实昵称', 'SCN-001/007 附带断言通过'],
     ['SCN-001', 'SCN-007'], '还原 store action', '低')
task('TASK-007', 'ExplainPanel 状态机重构与错误原因透出', 2, '前端',
     ['PAGE-005', 'DEF-004'], ['FND-008'], [],
     ['web/src/components/ExplainPanel.vue'],
     ['显式 status 状态机（idle/loading/success/failed），init 渲染 skeleton', '失败原因按 code 映射文案（42901/50201/50202）', '旧内容+失败横幅并存；删除或接入 failed ref', '慢网/断网回归无闪现'],
     ['初始化窗口无失败闪现；失败提示含具体原因与重试；重生成失败可见', 'SCN-015 通过'],
     ['SCN-015', 'SCN-035', 'SCN-036'], '还原组件', '低-中：LLM 模式需另测')
task('TASK-008', '页面级错误态与重试', 2, '前端',
     ['PAGE-003', 'PAGE-006', 'PAGE-007', 'PAGE-008', 'DEF-010', 'DEF-013', 'DEF-014', 'DEF-015'], ['FND-009'], [],
     ['web/src/views/student/Home.vue onMounted', 'web/src/views/student/Plan.vue load()', 'web/src/views/student/Profile.vue load()', 'web/src/views/admin/QuestionManage.vue onMounted'],
     ['各页补 error ref 与重试按钮；请求全部 catch', 'Plan 区分 getCurrentPlan 失败与 null', 'QuestionManage getSubjects 失败不阻断 load'],
     ['断网/后端停机下各页显示错误态可重试，不再误显空态', 'SCN-008/021 断网变体通过'],
     ['SCN-008', 'SCN-021', 'SCN-035'], '还原对应页面', '低')
task('TASK-009', '工程卫生：.gitignore、常量统一、redirect 校验', 3, '前端',
     ['PRJ-001', 'PAGE-001', 'DEF-005', 'DEF-006', 'DEF-008'], ['FND-011'], [],
     ['项目根 .gitignore（新建）', 'web/src/stores/user.js', 'web/src/api/request.js', 'web/src/views/student/Login.vue onSubmit'],
     ['补 .gitignore（node_modules/ dist/ .env *.log .build-tmp/）', 'stores/request 改用 STORAGE_KEYS/TIMEOUT', '登录跳转校验 redirect 以 / 开头否则回落 /', '提交路径补 catch'],
     ['git init 后 .env 不被跟踪；常量无重复定义；//evil.com redirect 回落 /', 'SCN-001 redirect 变体通过'],
     ['SCN-001'], '还原提交', '低')
task('TASK-010', '构建分包与组件库按需引入', 3, '前端',
     ['PRJ-001', 'DEF-017'], ['FND-012'], [],
     ['web/src/main.js', 'web/vite.config.js'],
     ['unplugin-vue-components + unplugin-auto-import 按需引入，或 manualChunks 拆 element-plus', '构建产物体积对比记录'],
     ['主包 gzip 显著下降（目标 <250KB）或组件库独立 chunk；功能回归无缺失样式', 'SCN-032 前后对比'],
     ['SCN-032'], '还原 main.js 引入方式', '低-中：按需引入需检查样式完整性')
task('TASK-011', '补证：慢网防重入、真机移动、读屏、日期选择器交互', 3, '测试/前端',
     ['PRJ-001'], [], [],
     ['待执行：Chrome DevTools Slow 3G', '待执行：真机 iOS/Android', '待执行：NVDA/VoiceOver', 'web/src/views/student/Plan.vue el-date-picker'],
     ['Slow 3G 双击写操作抓请求计数', '真机验证 TASK-002 效果', '读屏器走查登录/作答/打卡', 'el-date-picker 手动选择考试日期路径验证（本次自动化 fill 未生效）'],
     ['SCN-030/031/033 全部转 passed 或给出明确缺口', 'FND-010 转 confirmed 或 dismissed'],
     ['SCN-030', 'SCN-031', 'SCN-033'], '不适用（纯验证）', '低')
d['tasks'] = T

# ---------------- release gates ----------------
G = [
    ('GATE-001', '核心旅程（注册登录/刷题判分/错题/计划打卡/管理端）验证通过', True, 'passed', ['EV-202', 'EV-204', 'EV-206', 'EV-208', 'EV-211', 'EV-213'], '38 场景中核心旅程 32 项通过'),
    ('GATE-002', '身份、角色与对象级权限由服务端强制', True, 'passed', ['EV-210', 'EV-213', 'EV-214'], '40301/40302/属主 404 均实测'),
    ('GATE-003', '关键可访问性：核心任务可仅键盘完成', True, 'failed', ['EV-205'], 'FND-004 选项与入口卡键盘不可达'),
    ('GATE-004', '数据一致性与状态同步', True, 'failed', ['EV-206'], 'FND-006 重练后列表状态不同步'),
    ('GATE-005', '生产构建可复现', True, 'passed', ['EV-217', 'EV-223'], '构建通过；本机 TEMP 锁定为环境问题'),
    ('GATE-006', '性能预算（首屏包体）', True, 'failed', ['EV-217'], 'FND-012 主包 1.06MB；预算未定义且包体偏大'),
    ('GATE-007', '错误可见性与可观测性', True, 'failed', ['EV-108'], 'FND-009 页面级错误态缺失'),
    ('GATE-008', '移动端可用性（375px）', True, 'failed', ['EV-216'], 'FND-002 全站横向溢出'),
    ('GATE-009', '发布与回滚（Nginx/pm2）实操验证', True, 'blocked', [], 'Windows 开发机无 Nginx/pm2，按 README 配置审查通过但未实操'),
]
d['release_gates'] = [{'id': a, 'name': b, 'required': c, 'status': e, 'evidence_ids': f, 'reason': g}
                      for a, b, c, e, f, g in G]

d['progress'] = {
    'current_page': None,
    'completed_batches': ['源码通读（web 18 + server 契约 12）', '台账登记（10 页/17 DEF/94 CMP/38 SCN/798 CHK）',
                          '运行验证（登录注册/首页/刷题/错题/计划/个人/管理端/权限/令牌/移动端/构建）',
                          'FND/BP/PLAN/TASK/GATE 全量产出'],
    'next_actions': ['按 TASK-001..011 实施修复（待用户授权 implement）', 'TASK-011 补证项执行（慢网/真机/读屏/日期选择器）'],
    'unresolved_access': ['无读屏器与真机环境（SCN-031 读屏分支、SCN-030 真机分支）', '无 LLM API Key（llm 模式联调未覆盖）'],
    'last_updated': '2026-10-10T23:30:00+08:00',
}

json.dump(d, open(PATH, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
from collections import Counter
print('blueprints:', len(d['component_blueprints']), 'plans:', len(d['component_plans']),
      'tasks:', len(d['tasks']), 'gates:', len(d['release_gates']))
print('plan dispositions:', Counter(p['disposition'] for p in d['component_plans']))
missing_bp = [p['instance_id'] for p in d['component_plans'] if not p.get('blueprint_id')]
print('plans missing bp:', missing_bp)
