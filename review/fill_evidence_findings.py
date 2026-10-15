# -*- coding: utf-8 -*-
"""回填证据 EV、问题 FND 与场景 SCN 判定。"""
import json
PATH = 'review/audit.json'
d = json.load(open(PATH, encoding='utf-8'))
NOW = '2026-10-10T23:00:00+08:00'
SRC_REF = 'zsb-exam working tree（无 VCS，目录快照 2026-10-10）'
RT_REF = '本地运行 vite:5173 + express:3000 + MySQL8 zsb_exam（AI mock），2026-10-10 晚'

def ev(id, kind, loc, summary, baseline=None):
    d['evidence'].append({'id': id, 'kind': kind, 'locator': loc, 'observed_at': NOW,
                          'baseline_ref': baseline or (RT_REF if kind in ('runtime', 'test', 'measurement') else SRC_REF),
                          'summary': summary})

ev('EV-001', 'source', 'web/src/router/index.js:1-53', '路由表 10 条（/login /register /+5 子页 /admin+2 子页 通配重定向）；beforeEach 守卫：requiresAuth→/login?redirect、已登录访问登录页按角色回跳、admin 路由 role!==admin 拦截。')
ev('EV-002', 'source', 'web/src 全部 18 个源文件', '通读 App/main/router/stores/api/constants、StudentLayout/AdminLayout、QuestionCard/ExplainPanel、Login/Register/Home/Practice/WrongBook/Plan/Profile/QuestionManage/UserManage。')
ev('EV-003', 'source', 'server/src/{routes,middleware,services,dao,utils} 契约相关文件', '28 接口挂载点、verifyToken（每请求回查 status/role）、requireRole、错误码表、wrongService.assertOwner、answerService.judge 归一化、adminService.setUserStatus 自保护。')
ev('EV-004', 'artifact', 'review/discovery-candidates.json', '启发式发现：route_source_candidates=0（动态 import 未识别），path_literal 候选与人工路由核对一致；6 个组件候选。')
ev('EV-005', 'specification', 'README.md + 代码注释 AC1-AC9', '验收基线：7 模块功能清单、mock/llm 双模式、部署方式、错误码约定。')
ev('EV-101', 'source', 'web/src/components/QuestionCard.vue:54-85', '选项为 div @click 无 tabindex/role/键盘处理（options 与 judge 回退分支均是）；el-result sub-title 直接拼 correct_answer（判断题显示 true/false）；right 高亮类仅 options 分支有，judge 回退分支无。')
ev('EV-102', 'source', 'web/src/views/student/Practice.vue:43-62,103-104', 'prev() 仅 idx>0 时递减不跨页；上一题禁用条件为 idx===0&&page===1，第 2 页首页按钮 enabled 但点击无效果；next() 末题跨页加载下一页。')
ev('EV-103', 'source', 'web/src/components/ExplainPanel.vue:17-53,56-78', 'loading 仅在 generate() 置位，load() 取缓存期间 v-else 渲染失败态；failed ref 赋值但模板未使用；生成失败且已有旧内容时 explanation 未清空，失败 UI 不出现；失败描述固定"上游服务暂不可用"不区分限流/上游错误。')
ev('EV-104', 'source', 'web/src/views/student/WrongBook.vue:54-82', 'onRepractice 答对仅置 detail.mastered=1 不刷新列表行、不刷新 wrong_count；toggleMastered/onRepractice 无 in-flight 防重入（对照 Plan.onCheckIn 有 _checking）。')
ev('EV-105', 'source', 'web/src/layout/StudentLayout.vue:30-37', 'el-menu :ellipsis=false 不折叠；昵称取 userStore.profile，profile 仅 Home/Profile 页拉取，其他页直进显示兜底"同学"。')
ev('EV-106', 'source', 'web/src/views/student/Home.vue:32-67 + Login/Register.vue style', '统计与入口卡 el-col 固定 :span=6 无 xs/sm 断点；入口卡为 el-card @click 无键盘可达性；登录/注册卡 width:400px 固定。')
ev('EV-107', 'source', 'server/src/dao/questionDao.js:26-45', "adminList 关键词分支：ESCAPE 从 JS 字符串产出 SQL `LIKE ? ESCAPE '\\'`，MySQL 将 `'\\'` 解析为转义引号致语句不完整。")
ev('EV-108', 'source', 'web/src/{stores/user.js,api/request.js,constants.js,views/student/Login.vue,Register.vue}', 'constants.js 定义 STORAGE_KEYS/TIMEOUT 未被 stores/request 引用（裸字符串并存）；登录/注册 submit 为 try/finally 无 catch（拦截器已 toast 但产生 unhandled rejection）；登录跳转直接使用 route.query.redirect 未校验内部路径。')
ev('EV-109', 'source', 'web/src/main.js:3-12', 'Element Plus 全量引入 + 全量 CSS；构建产物 index-*.js 1,057KB（gzip 348KB）触发 chunk 警告。')
ev('EV-110', 'source', 'web/src/views/student/WrongBook.vue:137 + QuestionManage.vue:54', '错题抽屉 size="560px" 固定宽；题目对话框 width="680px" 固定宽（管理端按桌面验收）。')
ev('EV-201', 'artifact', 'review/evidence/EV-201-mobile-375-home.png', '375×667 视口首页截图：顶部导航被截断出现横向滚动条、统计文字竖排换行（未掌握错题）、4 张入口卡挤成竖排文字并截断。')
ev('EV-202', 'runtime', '浏览器 http://localhost:5173/login|register（IAB）', '未登录访问 /plan → /login?redirect=%2Fplan；空表单必填提示；错误凭据"账号或密码错误"停留登录页且无 token 写入；注册校验三分支提示齐全；注册成功跳登录；登录后回跳 /plan。')
ev('EV-203', 'runtime', '浏览器 /（首页）', '零数据态：统计 0/0%/0/0%、显示"还没有生效中的复习计划"、无今日任务卡片；有数据态：做题 14/正确率 43%/未掌握 6/计划进度 0% 与操作一致；登录后直进 /plan 时页壳昵称显示"同学"，进首页后显示真实昵称。')
ev('EV-204', 'runtime', '浏览器 /practice', '单选/多选/判断判分与解析展示正确（多选 ABD 排序比对通过）；筛选切换重置第 1 题并清空判分残留；末题跨页加载第 2 页；第 2 页首页点上一题位置不变（第 1/10→第 1/10）按钮仍 enabled；管理学+判断空筛选显示"暂无题目"。')
ev('EV-205', 'runtime', '浏览器 /practice DOM 探测', '选项元素 tagName=DIV、tabIndex=-1、无 role/aria-checked，键盘与辅助技术不可达。')
ev('EV-206', 'runtime', '浏览器 /wrong-book', '列表/筛选（未掌握 7 条）/分页正常；详情抽屉加载题目（不含答案）；重练答错提示"错误次数已累加"（抽屉内 wrong_count 同会话不刷新，重开后为 2）；答对提示"已自动标记为已掌握"但列表行仍显示"未掌握"；标记掌握/取消掌握双向切换确认弹窗与刷新正常；已掌握筛选行状态正确。')
ev('EV-207', 'runtime', '浏览器 错题抽屉 ExplainPanel + 限流测试', '缓存重开显示"缓存"标签；连点重新生成 5 次成功后 6 次起"请求过于频繁，请稍后再试"（42901）；限流窗口内打开未缓存讲解显示"AI 讲解生成失败/上游服务暂不可用/重试"；带旧内容重新生成失败时保留旧内容仅 toast，无失败 UI。')
ev('EV-208', 'runtime', '浏览器 /plan', '空态"还没有复习计划"；生成计划成功（14 任务按日分组、错题分布加权、今天展开、进度 0/14）；打卡后任务✓已完成且进度 1/14（7%）即时更新；重新生成确认弹窗"归档当前计划并新建"，取消无副作用、确认后进度重置 0/14。')
ev('EV-209', 'runtime', '浏览器 /profile', '账号信息渲染正常；空昵称提交"昵称不能为空"拦截；改昵称保存"昵称已更新"，信息区与页壳昵称同步刷新。')
ev('EV-210', 'runtime', '浏览器 /admin 越权测试 + fetch 探测', '考生直达 /admin/questions 被守卫重定向首页；伪造 localStorage role=admin 后前端守卫放行但 API 返回 40301"权限不足"（安全边界在后端生效）。')
ev('EV-211', 'runtime', '浏览器 /admin/questions CRUD', '新建（校验链：请选择科目→选项内容→单选单答案→答案字母存在→判断必选均生效）创建成功；编辑回填并改答案保存成功；删除二次确认"软删除后考生端不再展示"生效且列表刷新；列表列含正确答案√/×格式化。')
ev('EV-212', 'runtime', '浏览器搜索 + server.log + curl', '前端发出 keyword=极限 请求；API 返回 50001；server.log 记录 ER_PARSE_ERROR 1064（questionDao.js:44，SQL 为 LIKE \'%极限%\' ESCAPE \'\\\'）。前端保留旧列表并 toast"服务器内部错误"。')
ev('EV-213', 'runtime', '浏览器 /admin/users + curl', '列表渲染正常；自身行"禁用"按钮 disabled；对另一管理员禁用被后端拒绝"不能直接禁用管理员账号"；禁用考生确认后状态置"禁用"、按钮切"启用"，重新启用恢复"正常"；被禁账号登录返回 40302"账号已被禁用"，错误密码返回 40102。')
ev('EV-214', 'runtime', '浏览器 令牌失效', '篡改 token 后触发接口 → 清空 token/role/userId 并跳 /login?redirect=%2Fadmin%2Fquestions（redirect 保留）。')
ev('EV-215', 'runtime', '浏览器 /no-such-page-xyz 与 /another-missing', '未登录未知路径 → /login?redirect=/；已登录未知路径 → / 首页。')
ev('EV-216', 'measurement', '浏览器 375×667 视口测量', 'document.scrollWidth=932 vs clientWidth=360（全站横向溢出）；layout-header scrollWidth=932；Home el-col 宽 74/84px 文字竖排；错题表格 278px。')
ev('EV-217', 'test', 'web: npm run build', '默认 TEMP 下 esbuild 删除临时文件 Access denied（环境杀软/索引器锁定，两次复现）；改 TEMP=项目内目录后构建成功 9.73s，产物 dist/（index-*.js 1,057KB gzip 348KB，路由分包正常）。')
ev('EV-218', 'runtime', '浏览器 /practice 离开返回', '作答一题后切走再回：本地判分态随组件销毁重置（第 1/10 未作答），后端作答记录保留（首页统计累计 14 不变），行为与设计一致。')
ev('EV-219', 'test', 'curl /api/auth/register 重复用户名', '返回 40901"用户名已被注册"。')
ev('EV-220', 'measurement', '浏览器 判分后 .option class 抓取', '判断题两选项 class 为 "option selected locked" 与 "option locked"，无 right 高亮类；el-result sub-title 文本为"正确答案：true"。')
ev('EV-221', 'measurement', '浏览器 登录表单错误/按钮几何测量', '校验错误元素与提交按钮无几何重叠，按钮中心 hit-test 落在按钮 span；据此排除"错误提示遮挡按钮"误报。注：后台化浏览器冻结 CSS 过渡（el-message-box/el-overlay 残留、Playwright 点击超时）为测试环境假象，不计产品缺陷。')
ev('EV-222', 'test', 'mysql zsb_exam wrong_questions 查询', '核对重练/标记掌握落库状态：答对重练 mastered=1、取消掌握 PATCH mastered=0 生效、wrong_count 累加正确。')
ev('EV-223', 'test', 'npm run build 构建产物检查', 'dist/assets 分包存在各视图 chunk；无构建期错误（在 TEMP 修正后）。')

# ---------------- findings ----------------
def fnd(id, title, category, severity, confidence, pages, insts, defs, checks, scns, evs,
        actual, expected, impact, root_cause, rcc, remediation, regression, repro_pre, repro_steps):
    d['findings'].append({
        'id': id, 'title': title, 'category': category, 'severity': severity, 'confidence': confidence,
        'status': 'open', 'owner': '前端' if id != 'FND-001' else '后端+前端',
        'page_ids': pages, 'instance_ids': insts, 'definition_ids': defs,
        'check_ids': checks, 'scenario_ids': scns, 'evidence_ids': evs,
        'actual': actual, 'expected': expected, 'impact': impact,
        'root_cause': root_cause, 'root_cause_confidence': rcc,
        'remediation': remediation, 'regression_test': regression,
        'reproduction': {'preconditions': repro_pre, 'steps': repro_steps},
        'resolution_evidence_ids': [],
    })

fnd('FND-001', '后台题库关键词搜索接口 500，搜索功能完全不可用', 'data_effects', 'P2', 'confirmed',
    ['PAGE-008'], [], ['DEF-015'], [], ['SCN-024'], ['EV-107', 'EV-212'],
    'GET /api/admin/questions?keyword=... 返回 50001 服务器内部错误；MySQL 报 ER_PARSE_ERROR 1064（questionDao.js:44 adminList）；前端搜索后保留旧列表仅弹错误 toast。',
    '关键词搜索应返回匹配题目的过滤列表；含 % _ \\ 的关键词应被安全转义。',
    '管理员无法按题干检索题目，题库超过一页后定位题目困难；错误以 500 呈现且前端展示旧数据，易被误认为"搜索无结果"。功能级完全失效。',
    'adminList 的 LIKE ESCAPE 子句由 JS 字符串生成 SQL `ESCAPE \'\\\'`，反斜杠在 MySQL 字符串字面量中转义了收尾引号，SQL 语句不完整。',
    'confirmed',
    '将转义符改为不会与 MySQL 字符串字面量冲突的写法（如参数化 ESCAPE \'|\' 并对 |、%、_ 前缀 | 转义，或 JS 侧写 ESCAPE \'\\\\\\\\\'），并在 count 查询复用同一 where；补 DAO 单测覆盖 % _ \\ 与中文关键词。',
    'SCN-024 搜索分支；新增 DAO 测试：keyword=极限/%/_ 各返回正确过滤集',
    ['admin 登录', '题库含"极限"题干的题目'],
    ['打开 /admin/questions', '关键词输入"极限"点搜索'])

fnd('FND-002', '移动端 375px 全站横向溢出，内容挤压变形', 'layout_content', 'P2', 'confirmed',
    ['PAGE-001', 'PAGE-002', 'PAGE-003', 'PAGE-004', 'PAGE-005', 'PAGE-006', 'PAGE-007'],
    [], ['DEF-001', 'DEF-008', 'DEF-009', 'DEF-010', 'DEF-012'], [], ['SCN-030'],
    ['EV-201', 'EV-216', 'EV-105', 'EV-106', 'EV-110'],
    '375 视口下 document.scrollWidth=932 / clientWidth=360：顶部导航（:ellipsis=false）撑出 932px 产生整页横向滚动；首页统计与入口卡固定 :span=6 每列仅 74-84px，文字竖排截断；登录/注册卡固定 400px 超出 360px 视口；错题详情抽屉固定 560px 超出视口宽度。',
    '在窄屏下：导航可折叠或换行、内容列按断点堆叠、固定宽面板收缩到视口内，核心操作无遮挡无横向溢出。',
    '移动用户（index.html 已设 viewport meta，视作被支持环境）看到排版破碎、按钮文字竖排、需横向滚动才能操作，核心旅程可用性显著下降。',
    '布局组件使用固定宽度/固定列占比且未定义响应式断点；el-menu 显式关闭折叠。',
    'confirmed',
    'StudentLayout：el-menu 恢复折叠或 <768px 换成抽屉式导航；Home 统计/入口卡加 :xs=12/:sm=8 断点；Login/Register 卡 width:400px 改 max-width:calc(100vw - 32px)；WrongBook 抽屉 size 改 "min(560px, 100%)"；补 375/768/1280 三断点目测清单。',
    'SCN-030 三断点回归 + 截图对比',
    ['浏览器视口 375×667', '已登录任意角色'],
    ['逐页打开 /、/practice、/wrong-book、/plan、/profile、/login'])

fnd('FND-003', '刷题"上一题"按钮在跨页后成死按钮且无法回退上一页', 'behavior', 'P2', 'confirmed',
    ['PAGE-004'], [], ['DEF-011'], [], ['SCN-010'], ['EV-102', 'EV-204'],
    '第 2 页第 1 题时"上一题"按钮 enabled，点击后位置不变（第 1/10→第 1/10）；prev() 只在 idx>0 时递减，不存在跨页回退逻辑，用户无法从第 2 页返回第 1 页。',
    '按钮状态与行为一致：要么可回退到上一页末题，要么在无回退能力时禁用。',
    '用户答完一页后无法回头检查前页作答与解析，翻页导航单向；可点击但无效果的控件直接损害操作可信度。',
    'prev() 缺少跨页分支，按钮禁用条件只覆盖第 1 页 idx=0。',
    'confirmed',
    'prev() 在 idx===0 且 page>1 时 page-=1 并加载上一页、定位到该页末题（复用 load(false)），同步修正禁用条件为 idx===0&&page===1；补跨页往返回归。',
    'SCN-010 含"跨页往返与按钮状态一致"断言',
    ['已登录', '题目数 > PAGE_SIZE(10)', '已翻到第 2 页第 1 题'],
    ['作答至第 10 题点下一题进入第 2 页', '连续点上一题观察位置与按钮状态'])

fnd('FND-004', '题目选项为无语义 div，键盘与读屏不可操作', 'semantics_accessibility', 'P2', 'confirmed',
    ['PAGE-004', 'PAGE-005', 'PAGE-003'], [], ['DEF-003', 'DEF-010'], [], ['SCN-031'],
    ['EV-101', 'EV-205', 'EV-106'],
    'QuestionCard 选项（含判断题回退两项）为 div @click：tabIndex=-1、无 role、无 aria-checked；首页 4 张入口卡同样是 el-card @click 无键盘可达性。',
    '核心答题控件与导航入口应可键盘聚焦、激活并暴露选中状态（radio/checkbox 语义或等价 ARIA），焦点可见。',
    '键盘用户与读屏用户无法完成"选择答案→提交"的核心任务，也无法从首页入口卡进入模块；课程验收如按一般可访问性基线衡量不达标。',
    '选项以装饰性 div 实现，未采用表单控件语义。',
    'confirmed',
    '选项改为原生 input[type=radio|checkbox] + label（判断题同理）或补 role=radio/checkbox + tabindex=0 + Space/Enter + aria-checked；题目容器用 fieldset/legend 或 aria-group；入口卡改 router-link 包裹或补 role=link/tabindex/keydown；补键盘全流程回归。',
    'SCN-031 仅键盘完成登录与一题作答',
    ['Chrome 桌面', '已登录'],
    ['仅用 Tab/Space/Enter 在 /practice 完成一题选择与提交'])

fnd('FND-005', '判分结果展示原始布尔值且判断题无正确项高亮', 'layout_content', 'P3', 'confirmed',
    ['PAGE-004', 'PAGE-005'], [], ['DEF-003'], [], ['SCN-009'], ['EV-101', 'EV-220', 'EV-204'],
    '判断题判分后 sub-title 显示"正确答案：true"；正确项无绿色高亮（class 仅 selected/locked），选择题则有 right 高亮，反馈不一致。',
    '判断题应展示"正确（√）/错误（×）"人读文案；正确项在三类题型中一致高亮。',
    '考生需自行解读 true/false，且无法一眼看到正确项，降低复盘效率；属展示层缺陷不影响判分正确性。',
    'el-result sub-title 直接模板拼接 correct_answer 未做题型映射；right 类只写在 options 分支。',
    'confirmed',
    '结果区按 q_type 映射文案（judge: true→正确（√））；将 right 高亮逻辑合并进两个分支（judge 回退项同样应用 right 类）。',
    'SCN-009 判断题分支断言展示文案与高亮',
    ['已登录', '判断题未作答'],
    ['作答判断题提交', '查看结果区文案与两选项样式'])

fnd('FND-006', '错题重练答对后列表行状态与提示不一致', 'state_coverage', 'P3', 'confirmed',
    ['PAGE-005'], [], ['DEF-012'], [], ['SCN-014'], ['EV-104', 'EV-206', 'EV-222'],
    '抽屉内答对后 toast 提示"已自动标记为已掌握"且 detail.mastered 置 1，但列表行仍显示"未掌握"，直到手动刷新；同会话抽屉头部"错误次数"也不随重练累加刷新。',
    '自动标记成功后列表行状态（含筛选归类）与详情一致；错误次数即时反映最新值。',
    '用户看到自相矛盾的状态（提示已掌握、列表未掌握），可能重复操作或误判功能失效；数据本身正确，纯展示同步问题。',
    'onRepractice 只更新 detail 局部对象，未回调 load() 或同步更新行数据；wrong_count 依赖重新拉取。',
    'confirmed',
    '答对分支补 load()（或按 id 同步更新 list 行与 wrong_count 为服务端返回值）；建议后端 repractice 返回最新 wrong_count/mastered 供单次回填。',
    'SCN-014 断言"关闭抽屉后行状态=已掌握"',
    ['已登录', '存在未掌握错题'],
    ['抽屉内答对重练', '不刷新页面观察列表行状态标签'])

fnd('FND-007', '页壳昵称在非首页显示兜底"同学"', 'data_effects', 'P3', 'confirmed',
    ['PAGE-004', 'PAGE-005', 'PAGE-006'], [], ['DEF-001'], [], ['SCN-001'], ['EV-105', 'EV-203'],
    '登录后直接进入 /plan 等页时顶部显示"同学"，只有访问过首页/个人中心（触发 fetchProfile）后才显示真实昵称。',
    '页壳在任意受保护页显示当前用户昵称。',
    '登录即见到错误的称呼，第一印象观感差；不影响功能。',
    'StudentLayout 依赖 userStore.profile，但 profile 仅由 Home/Profile 页面各自拉取，store 登录时未获取。',
    'confirmed',
    '登录成功后或 StudentLayout 挂载时统一 fetchProfile（带失败静默），或 login 响应直接回填 profile。',
    'SCN-001 补断言"任意页页壳显示真实昵称"',
    ['新登录会话'],
    ['登录后直接进入 /plan 或 /practice', '观察顶部昵称'])

fnd('FND-008', 'AI 讲解面板状态机缺口：失败态闪现、失败原因不分、failed 为死状态', 'states', 'P3', 'confirmed',
    ['PAGE-005'], [], ['DEF-004'], [], ['SCN-015'], ['EV-103', 'EV-207'],
    'init 阶段 getAiConfig+getCachedExplanation 期间 loading=false/explanation=null，模板 v-else 渲染"AI 讲解生成失败"（慢网下可见闪现）；failed ref 被赋值但模板从未使用；带旧内容重新生成失败时旧内容保留、无失败 UI；失败描述固定"上游服务暂不可用"，限流 429 与上游 50201 无法区分（仅 toast 有区分）。',
    '面板具有明确的 idle/loading/success/failed 状态；失败时展示具体原因（限流/上游/未配置）与重试入口；状态切换无错误闪现。',
    '慢网络用户先看到"生成失败"再看到内容，产生误判；重生成失败时用户不知道生成已失败；问题排查时无法从界面区分失败原因。',
    '状态机只有 loading 布尔 + explanation 两变量，缺 idle 态；失败分支条件为 !loading&&!explanation，与"加载中"窗口重叠；错误对象未透传到 UI。',
    'confirmed',
    '引入 status: idle|loading|success|failed 显式状态机（或 computed 三态），init 期间渲染 skeleton；generate 失败时保留旧内容但加"重新生成失败：原因"横幅；错误信息取拦截器透传的 code/message（42901/50201/50202 映射文案）；删除或接入 failed ref。',
    'SCN-015 三态 + 慢网（DevTools Slow 3G）无闪现断言',
    ['已登录', 'mock 或 llm 模式'],
    ['打开错题详情观察初始 1 秒渲染', '限流/断网下点重新生成观察失败反馈'])

fnd('FND-009', '页面级请求失败缺少错误状态：网络故障与空数据不可区分', 'maintainability_integration', 'P3', 'confirmed',
    ['PAGE-003', 'PAGE-006', 'PAGE-007'], [], ['DEF-010', 'DEF-013', 'DEF-014'], [], ['SCN-021'],
    ['EV-108', 'EV-203', 'EV-208'],
    'Home/Plan/Profile/Practice 等 onMounted 多为 try/finally 无 catch：请求失败时仅 toast + unhandled rejection，页面落入空态或旧数据；Plan 页 getCurrentPlan 失败与"无计划"同为空态；QuestionManage onMounted 的 getSubjects 失败会中断后续 load()。',
    '页面区分 loading/empty/error 三态，失败可重试；组件内 catch 后置 error 标志，避免 unhandled rejection。',
    '弱网/服务重启时用户看到"没有计划/没有数据"的误导性空态，或表格空白无解释；控制台噪声影响排障。',
    '以全局拦截器 toast 代替页面级错误处理，缺少 error 状态建模。',
    'confirmed',
    '为 Home/Plan/Profile/Practice/QuestionManage 增加 error ref 与重试按钮；onMounted 请求全部 catch；Plan 对 getCurrentPlan 失败与 null 区分；QuestionManage 的 getSubjects 失败不阻断 load()。',
    'SCN-021/008 断网（DevTools Offline）下错误态可见且可重试',
    ['已登录', 'DevTools Offline 或后端停止'],
    ['断网后进入 /plan /', '观察空态文案与控制台'])

fnd('FND-010', '写操作缺统一防重入；个别状态回填不完整', 'performance_lifecycle', 'P3', 'probable',
    ['PAGE-005', 'PAGE-008', 'PAGE-007'], [], ['DEF-012', 'DEF-015', 'DEF-014'], [], ['SCN-033'],
    ['EV-104', 'EV-206'],
    'toggleMastered/onDelete/onSave/saveProfile 无 in-flight 标志（对照 onCheckIn/_checking、onRepractice/repracticing 已有）；快速重复触发存在重复请求风险（本次测试中出现一次重复 PATCH，经排查为测试探针重复包装所致，真实双击风险未在慢网下复现）；repractice 返回 masteredSynced=false 时前端仍按 is_correct 提示"已自动标记为已掌握"。',
    '所有写操作具备统一防重入（按钮 loading/禁用）；对服务端降级结果（masteredSynced=false）如实反馈。',
    '偶发重复提交会产生重复记录或重复提示；降级场景提示失实。发生概率低、可恢复。',
    '防重入仅部分组件实现；未消费 repractice 响应的 masteredSynced 字段。',
    'probable',
    '为写操作按钮统一接 loading/禁用守卫（或抽 directive）；onRepractice 判断 r.masteredSynced===false 时提示"已作答但掌握标记同步失败，请手动标记"。',
    'SCN-033 慢网（Slow 3G）下双击写按钮断言单请求',
    ['已登录', '慢网模拟'],
    ['Slow 3G 下双击"标记掌握"/"保存"', '抓请求计数'])

fnd('FND-011', '工程化卫生：.env 无忽略保护、常量未统一、redirect 未校验', 'security_privacy', 'P3', 'confirmed',
    ['PAGE-001'], [], ['DEF-006', 'DEF-005', 'DEF-008'], [], ['SCN-001'],
    ['EV-108', 'EV-002'],
    '项目无 .gitignore（server/.env 含 JWT_SECRET/DB_PASSWORD 实值，一旦 git init 极易随库泄露；现有两个交付 zip 仅含 .env.example，未泄露）；constants.js 的 STORAGE_KEYS/TIMEOUT 被 stores/user.js、api/request.js 以裸字符串/魔数重复定义；登录跳转直接 push route.query.redirect（建议校验以 / 开头的内部路径）。',
    '密钥文件有忽略保护；本地存储键与超时统一引用常量；redirect 仅允许站内路径。',
    '泄露 JWT_SECRET 可伪造任意账号令牌（含管理员）；常量漂移增加维护成本；开放重定向风险低（router.push 非外链跳转）但属纵深防御缺口。',
    '初始化脚手架缺 .gitignore；常量文件后补未回改调用点；redirect 直接取 query。',
    'confirmed',
    '补 .gitignore（node_modules/ dist/ .env *.log）；stores/request 迁移到 STORAGE_KEYS/TIMEOUT；登录跳转校验 /^\\// 否则回落 /。',
    'SCN-001 redirect 用 //evil.com 与 /plan 各测一次',
    ['源码树', '未初始化 git'],
    ['查看根目录文件清单', '读 stores/request 源码'])

fnd('FND-012', '生产构建主包 1.06MB（gzip 348KB），Element Plus 全量引入', 'performance_lifecycle', 'P3', 'confirmed',
    ['PAGE-003'], [], ['DEF-017'], [], ['SCN-032'], ['EV-109', 'EV-217'],
    'npm run build 产物 index-*.js 1,057.77KB（gzip 348.44KB），触发 chunkSizeWarning；main.js 全量 app.use(ElementPlus) 与全量 CSS。',
    '主包维持在可接受预算内（演示系统建议 gzip <250KB 或按路由分包加载组件库）。',
    '首屏需下载全量组件库，弱网首开变慢；演示规模影响有限。',
    'Element Plus 未按需引入，且未做 manualChunks。',
    'confirmed',
    '采用 unplugin-vue-components + unplugin-auto-import 按需引入，或 manualChunks 拆 element-plus；对比构建产物体积。',
    'SCN-032 前后构建产物体积对比',
    ['web 依赖已安装'],
    ['npm run build 记录产物体积'])

# ---------------- scenario statuses ----------------
S = {s['id']: s for s in d['scenarios']}
def setscn(sid, status, evs=(), fnds=(), reason=''):
    s = S[sid]
    s['status'] = status
    s['evidence_ids'] = list(evs)
    s['finding_ids'] = list(fnds)
    s['reason'] = reason

passed = {
    'SCN-001': ['EV-202', 'EV-203'], 'SCN-002': ['EV-202'], 'SCN-003': ['EV-202'], 'SCN-004': ['EV-202'],
    'SCN-005': ['EV-202'], 'SCN-006': ['EV-219'], 'SCN-007': ['EV-203'], 'SCN-008': ['EV-203'],
    'SCN-009': ['EV-204'], 'SCN-011': ['EV-204'], 'SCN-012': ['EV-204'], 'SCN-013': ['EV-206'],
    'SCN-016': ['EV-206', 'EV-222'], 'SCN-017': ['EV-206'], 'SCN-018': ['EV-208'], 'SCN-019': ['EV-208'],
    'SCN-020': ['EV-208'], 'SCN-021': ['EV-208'], 'SCN-022': ['EV-209'], 'SCN-023': ['EV-210'],
    'SCN-024': ['EV-211'], 'SCN-025': ['EV-211'], 'SCN-026': ['EV-213', 'EV-222'], 'SCN-027': ['EV-214'],
    'SCN-028': ['EV-213', 'EV-219'], 'SCN-029': ['EV-215'], 'SCN-032': ['EV-217', 'EV-223'],
    'SCN-034': ['EV-218'], 'SCN-035': ['EV-207'], 'SCN-036': ['EV-207'], 'SCN-037': ['EV-202'],
    'SCN-038': ['EV-203'],
}
for sid, evs in passed.items():
    setscn(sid, 'passed', evs)
S['SCN-001']['reason'] = '登录回跳通过；页壳昵称问题另计 FND-007'
S['SCN-009']['reason'] = '判分正确；判断题展示问题计 FND-005'
S['SCN-013']['reason'] = '列表筛选翻页通过；移动端布局计 FND-002'
S['SCN-017']['reason'] = '以筛选空组合等价验证表格空态（空账号变体未另测）'
S['SCN-024']['reason'] = 'CRUD 通过；关键词搜索失败单列 FND-001'
S['SCN-026']['reason'] = '启用禁用双向 + 自保护 + 管理员保护通过；被禁登录 40302 验证'
S['SCN-032']['reason'] = '构建通过，但默认 TEMP 在本机遇 esbuild 文件锁（环境问题，见 EV-217）'
S['SCN-035']['reason'] = '首载失败 UI 与重试通过；失败原因展示缺陷计 FND-008'
S['SCN-036']['reason'] = '限流 42901 提示与恢复通过'
S['SCN-037']['reason'] = '登录注册页壳与互跳通过；400px 固定宽计 FND-002'
S['SCN-038']['reason'] = '入口卡点击跳转通过；键盘不可达计 FND-004'
setscn('SCN-010', 'failed', ['EV-204', 'EV-102'], ['FND-003'], '第 2 页首页上一题按钮 enabled 但点击无效，无法回退第 1 页')
setscn('SCN-014', 'failed', ['EV-206', 'EV-222'], ['FND-006'], '答对自动掌握后列表行仍显示未掌握（数据正确、展示未同步）')
setscn('SCN-015', 'failed', ['EV-207'], ['FND-008'], '三态中失败原因不区分、带内容重生成失败无失败 UI、初始化窗口存在失败闪现')
setscn('SCN-030', 'failed', ['EV-216', 'EV-201'], ['FND-002'], '375px 全站横向溢出、内容挤压变形')
setscn('SCN-031', 'failed', ['EV-205'], ['FND-004'], '选项与入口卡键盘/读屏不可达，仅键盘无法完成作答')
setscn('SCN-033', 'blocked', ['EV-104'], [], '无慢网注入环境未复现重复提交；静态确认多数写操作无防重入守卫（FND-010 probable，待补证）')
# SCN-022 已含页面壳关联；SCN-021 空态通过但错误态问题在 FND-009（checks 层）

json.dump(d, open(PATH, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
cnt = {}
for s in d['scenarios']:
    cnt[s['status']] = cnt.get(s['status'], 0) + 1
print('scenarios:', cnt)
print('evidence:', len(d['evidence']), 'findings:', len(d['findings']))
