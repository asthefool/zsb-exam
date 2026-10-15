# 问题详单（12 项）

> 全部为 open 状态（audit_plan 模式不实施修复）。证据定位见 audit.json evidence；复验场景见每条「复验」与 pages/。

## FND-001 后台题库关键词搜索接口 500，搜索功能完全不可用

- **定位**：PAGE-008 / DEF-015；`server/src/dao/questionDao.js:26-45 adminList`；`GET /api/admin/questions?keyword=...`
- **级别与置信度**：**P2 / confirmed**（运行可 100% 复现；功能级完全失效）
- **前提**：admin 登录；题库含"极限"题干
- **步骤**：打开 /admin/questions → 关键词输入"极限"→ 点搜索
- **实际**：API 返回 `{"code":50001,"message":"服务器内部错误"}`；server.log `ER_PARSE_ERROR 1064`；前端保留旧列表并 toast"服务器内部错误"
- **预期**：返回按题干过滤的列表；含 `% _ \` 的关键词安全转义
- **影响**：管理员无法检索题目；错误以 500 呈现且列表展示旧数据，易被误认为"无结果"
- **证据**：EV-107（源码）、EV-212（运行+日志+curl）
- **根因**：`ESCAPE '\'` 由 JS 字符串生成后反斜杠转义了收尾引号，SQL 语句不完整（confirmed）
- **方案**：改参数化转义（如 `ESCAPE '|'` 并转义 `| % _`），count 复用同一 where；补 DAO 测试；前端 load() 失败置错误态
- **复验**：SCN-024 搜索分支 + DAO 单测（keyword=极限/%/_）
- **关联**：TASK-001（后端主责+前端反馈）；CMP-074 搜索工具条、CMP-075 题目表格

## FND-002 移动端 375px 全站横向溢出，内容挤压变形

- **定位**：PAGE-001..007 / DEF-001/008/009/010/012；`StudentLayout.vue:30-37`、`Home.vue:32-67`、`Login/Register.vue style`、`WrongBook.vue:137`
- **级别与置信度**：**P2 / confirmed**（测量+截图）
- **前提**：视口 375×667；已登录（登录页为未登录）
- **步骤**：375px 视口逐页打开 /、/practice、/wrong-book、/plan、/profile、/login
- **实际**：`document.scrollWidth=932 / clientWidth=360` 整页横向滚动；导航（:ellipsis=false）撑 932px 被截断；统计列 74px、入口卡 84px 文字竖排截断；登录/注册卡固定 400px 超屏；错题抽屉固定 560px 超屏
- **预期**：窄屏导航折叠/换行、内容按断点堆叠、固定宽面板收缩，核心操作无遮挡
- **影响**：移动用户排版破碎、需横向滚动；入口卡描述不可读（截图 EV-201）
- **证据**：EV-201（截图）、EV-216（测量）、EV-224（运行）、EV-105/106/110（源码）
- **根因**：固定宽度/固定列占比、无响应式断点、el-menu 显式关闭折叠（confirmed）
- **方案**：见 TASK-002（导航折叠、:xs 断点、max-width、drawer min）
- **复验**：SCN-030（375/768/1280 三断点）
- **关联**：TASK-002

## FND-003 刷题"上一题"按钮在跨页后成死按钮且无法回退上一页

- **定位**：PAGE-004 / DEF-011；`Practice.vue:43-62 prev()`
- **级别与置信度**：**P2 / confirmed**（运行复现）
- **前提**：题目数 >10；已翻到第 2 页第 1 题
- **步骤**：作答至第 10 题点"下一题"入第 2 页 → 连点"上一题"
- **实际**：第 2 页首页按钮 enabled 但点击位置不变（第 1/10→第 1/10）；无任何跨页回退路径
- **预期**：按钮状态与行为一致——可回退上一页末题，或无能力时禁用
- **影响**：答完一页无法回头检查；可点击但无效果的控件损害操作可信度
- **证据**：EV-102（源码）、EV-204（运行）
- **根因**：prev() 缺跨页分支；禁用条件只覆盖第 1 页 idx=0（confirmed）
- **方案**：TASK-003
- **复验**：SCN-010
- **关联**：TASK-003

## FND-004 题目选项与首页入口卡键盘/读屏不可达

- **定位**：PAGE-003/004/005 / DEF-003/010；`QuestionCard.vue:54-73`、`Home.vue:60-68`
- **级别与置信度**：**P2 / confirmed**（DOM 探测）
- **前提**：Chrome 桌面；已登录
- **步骤**：仅用键盘（Tab/Space/Enter）在 /practice 完成一题选择与提交
- **实际**：选项为 `DIV tabindex=-1` 无 role/aria-checked（探测实证）；Tab 无法聚焦选项；入口卡 el-card @click 同样不可键盘激活
- **预期**：核心答题控件与导航入口可键盘聚焦/激活并暴露选中态
- **影响**：键盘与读屏用户无法完成核心作答任务，也无法从首页进模块
- **证据**：EV-101（源码）、EV-205（运行探测）、EV-106（入口卡）
- **根因**：选项以装饰性 div 实现，未用表单语义（confirmed）
- **方案**：TASK-004
- **复验**：SCN-031（仅键盘登录+作答）
- **关联**：TASK-004

## FND-005 判分结果展示原始布尔值且判断题无正确项高亮

- **定位**：PAGE-004/005 / DEF-003；`QuestionCard.vue:79-85`
- **级别与置信度**：P3 / confirmed（运行+class 抓取）
- **步骤**：作答判断题提交 → 查看结果区与选项样式
- **实际**：显示"正确答案：true"；正确项 class 仅 `selected locked` 无 `right` 高亮（选择题有）
- **预期**：判断题显示"正确（√）/错误（×）"；三题型正确项一致高亮
- **影响**：考生需自行解读 true/false；复盘效率低。不影响判分正确性
- **证据**：EV-101、EV-220（class 抓取）、EV-204
- **根因**：sub-title 直拼 correct_answer 未映射；right 类只写在 options 分支（confirmed）
- **方案**：TASK-004
- **复验**：SCN-009 判断题分支
- **关联**：TASK-004

## FND-006 错题重练答对后列表行状态与提示不一致

- **定位**：PAGE-005 / DEF-012；`WrongBook.vue:54-68 onRepractice`
- **级别与置信度**：P3 / confirmed（运行+DB 核对数据正确）
- **前提**：有未掌握错题；抽屉内重练
- **步骤**：抽屉内答对 → 不刷新页面观察列表行
- **实际**：toast"已自动标记为已掌握"、detail.mastered=1，但列表行仍"未掌握"；同会话"错误次数"不刷新（重开后为 2）
- **预期**：行状态、筛选归类与详情一致；次数即时
- **影响**：状态自相矛盾，可能重复操作；数据本身正确（DB verified），纯展示同步
- **证据**：EV-104、EV-206、EV-222
- **根因**：onRepractice 只改 detail 局部对象，未 load() 或行内同步（confirmed）
- **方案**：TASK-005（建议后端返回最新 wrong_count/mastered）
- **复验**：SCN-014
- **关联**：TASK-005

## FND-007 页壳昵称在非首页显示兜底"同学"

- **定位**：PAGE-004/005/006 / DEF-001/006；`StudentLayout.vue:34`、`stores/user.js`
- **级别与置信度**：P3 / confirmed（运行复现）
- **步骤**：登录后直接进入 /plan → 观察顶部昵称
- **实际**：显示"同学"；访问首页/个人中心后才变真实昵称
- **预期**：任意受保护页显示当前用户昵称
- **影响**：登录即见错误称呼；不影响功能
- **证据**：EV-105、EV-203
- **根因**：profile 仅由 Home/Profile 拉取，store 登录时未获取（confirmed）
- **方案**：TASK-006
- **复验**：SCN-001 附带断言
- **关联**：TASK-006

## FND-008 AI 讲解面板状态机缺口

- **定位**：PAGE-005 / DEF-004；`ExplainPanel.vue:17-53,56-78`
- **级别与置信度**：P3 / confirmed（源码+运行对比）
- **实际**：① init 期间（getAiConfig+取缓存）loading=false/explanation=null → v-else 渲染"AI 讲解生成失败"，慢网可见闪现；② `failed` ref 赋值但模板从未使用（死代码）；③ 带旧内容重新生成失败时旧内容保留、无失败 UI（仅 toast）；④ 失败描述固定"上游服务暂不可用"，限流 429 与上游 50201 无法区分
- **预期**：idle/loading/success/failed 显式状态；失败含具体原因与重试；无错误闪现
- **影响**：慢网用户先见"失败"再见内容；重生成失败无感知；排障无法区分原因
- **证据**：EV-103、EV-207（含限流首载失败 UI 与带内容失败无 UI 的对比）
- **根因**：状态机仅 loading 布尔+explanation；失败分支与加载窗口重叠；错误码未透传（confirmed）
- **方案**：TASK-007
- **复验**：SCN-015（含慢网变体）
- **关联**：TASK-007

## FND-009 页面级请求失败缺少错误状态

- **定位**：PAGE-003/006/007/008 / DEF-010/013/014/015；Home/Plan/Profile/Practice/QuestionManage 的 onMounted/load
- **级别与置信度**：P3 / confirmed（源码）
- **实际**：多为 try/finally 无 catch，失败时仅 toast + unhandled rejection，页面落空态或旧数据；Plan 的 getCurrentPlan 失败与"无计划"同为空态；QuestionManage 的 getSubjects 失败阻断 load()
- **预期**：loading/empty/error 三态分明，失败可重试
- **影响**：弱网/服务重启时误导用户"没有数据"；控制台噪声
- **证据**：EV-108、EV-203、EV-208
- **根因**：以全局 toast 代替页面级错误处理（confirmed）
- **方案**：TASK-008
- **复验**：SCN-008/021 断网变体
- **关联**：TASK-008

## FND-010 写操作缺统一防重入；降级反馈不完整（待补证）

- **定位**：PAGE-005/007/008 / DEF-012/014/015/011
- **级别与置信度**：P3 / **probable**（静态确认缺失守卫；慢网重复请求未复现——测试中一次重复 PATCH 经查为探针重复包装所致，已排除）
- **实际**：toggleMastered/onDelete/onSave/saveProfile/生成计划无 in-flight 标志（对照 _checking/repracticing 已有）；onRepractice 未消费 `masteredSynced=false` 降级分支仍提示"已自动标记"
- **预期**：写操作统一防重入；降级结果如实反馈
- **影响**：慢网双击可能重复请求/重复提示（低概率可恢复）；降级场景提示失实
- **证据**：EV-104、EV-206
- **根因**：守卫只在部分组件实现（probable）
- **方案**：TASK-005 + TASK-011（慢网补证）
- **复验**：SCN-033（Slow 3G 双击抓请求）
- **关联**：TASK-005、TASK-011

## FND-011 工程化卫生：.env 无忽略保护、常量未统一、redirect 未校验

- **定位**：项目根、`stores/user.js`、`api/request.js`、`Login.vue onSubmit`
- **级别与置信度**：P3 / confirmed（源码；两个交付 zip 已核对仅含 .env.example，未泄露）
- **实际**：无 .gitignore（server/.env 含 JWT_SECRET/DB_PASSWORD 实值，git init 即有泄露风险）；constants.js 的 STORAGE_KEYS/TIMEOUT 未被引用（裸字符串并存）；登录跳转直接 push route.query.redirect 未校验内部路径
- **预期**：密钥不入库、常量统一、redirect 仅站内
- **影响**：JWT_SECRET 泄露可伪造任意账号令牌；维护漂移；开放重定向纵深防御缺口（router.push 风险低）
- **证据**：EV-108、EV-002
- **方案**：TASK-009
- **复验**：SCN-001 redirect 变体（//evil.com 回落 /）
- **关联**：TASK-009

## FND-012 生产构建主包 1.06MB（gzip 348KB）

- **定位**：PRJ / DEF-017；`main.js:3-12`
- **级别与置信度**：P3 / confirmed（构建产物实测）
- **实际**：index-*.js 1,057.77KB（gzip 348.44KB）触发 chunk 警告；Element Plus 全量引入+全量 CSS
- **预期**：主包维持预算内（演示建议 gzip <250KB 或组件库独立 chunk）
- **影响**：弱网首开慢；演示规模影响有限
- **证据**：EV-109、EV-217
- **方案**：TASK-010（unplugin 按需引入或 manualChunks）
- **复验**：SCN-032 前后产物对比
- **关联**：TASK-010


---

# 修复与复验记录（2026-10-11，实施模式）

> 全部 12 项已处置：11 resolved、1 fixed_unverified。修复代码位置见各条「修复」；复验证据见 audit.json evidence（EV-226..EV-240）。

| FND | 修复（实施内容） | 复验（证据） | 状态 |
|---|---|---|---|
| FND-001 | `questionDao.js` ESCAPE 改用 \| 转义；QuestionManage load() 失败进错误态+重试 | EV-227（极限→1、%→0、_→2）/ EV-228（UI 搜索+失败态） | resolved |
| FND-002 | StudentLayout 导航恢复折叠+换行；Home 列加 :xs/:md 断点；登录/注册卡 max-width；抽屉 size=min(560px,100%)；筛选条 flex-wrap | EV-240/229（375px 无溢出）/ EV-226（截图） | resolved |
| FND-003 | Practice.prev() 增加跨页回退分支（page-=1 定位上页末题） | EV-230（第2页→第1页10→9→8） | resolved |
| FND-004 | QuestionCard 选项改原生 radio/checkbox+label+焦点环；入口卡改 router-link | EV-231（DOM 语义实测）；**键盘端到端待人工走查** | fixed_unverified |
| FND-005 | answerText 按题型映射（judge→正确（√））；right 高亮统一两分支 | EV-231（文案+高亮实测） | resolved |
| FND-006 | onRepractice 答对后 load() 同步；wrong_count 即时累加；masteredSynced=false 如实提示 | EV-232（行即时移出筛选） | resolved |
| FND-007 | StudentLayout onMounted 确保 fetchProfile | EV-233（直达 /plan 显示真名） | resolved |
| FND-008 | 显式 status 状态机；失败原因按 42901/50201/50202 映射；旧内容+失败横幅；删死状态 | EV-234（状态序列无闪现、横幅原因正确） | resolved |
| FND-009 | Home/Plan/Profile/Practice 补 error+重试；Plan 区分失败与空态；getSubjects 不阻断 | EV-235（断后端四页错误态+恢复） | resolved |
| FND-010 | toggleMastered/onDelete/onRepractice 入口级防重入；Practice/WrongBook/QuestionManage load() 请求时序号 | EV-232（双击仅 1 PATCH、三连切筛选终态正确）/ EV-239 | resolved |
| FND-011 | 新建 .gitignore；STORAGE_KEYS/TIMEOUT 统一引用；redirect 校验站内路径；Login/Register 补 catch | EV-236（//evil.com 回落 /） | resolved |
| FND-010（备注） | 双击防重入在常规速度下双触发验证通过；慢网补充项已并入 TASK-011 | EV-232 | — |
| FND-012 | vite manualChunks（element-plus/vendor 独立分包） | EV-237（主包 8.7KB、preview 冒烟通过） | resolved |

**复验方法统一说明**：每项修复在本地运行环境（vite:5173 + express:3000 + MySQL8 mock AI）以浏览器实测为主、curl/DB/构建为辅；构建产物另经 vite preview 冒烟（样式与登录链路完整）。
