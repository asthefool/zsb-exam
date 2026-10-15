# PAGE-003 首页-学习概览

## 页面身份

- **PAGE**：PAGE-003　**路由**：`/`
- **入口条件**：登录后默认落地页
- **变体**：有计划；无计划；有今日任务；无今日任务
- **源码**：web/src/views/student/Home.vue + layout/StudentLayout.vue
- **运行证据**：EV-203（详见 audit.json evidence）
- **基线**：本地 vite:5173 + express:3000（AI mock），2026-10-10

## 本页结论

概览/空态/入口卡跳转通过；入口卡键盘语义、移动端挤压、错误态、昵称来源四项（FND-002/004/007/009）已修复，入口卡键盘端到端随 TASK-011 人工走查。

## 全部组件（CMP）

| CMP | 父CMP | DEF | 定位 | 变体 | CHK(过/败/阻) | FND | 处置 | BP/TASK |
|---|---|---|---|---|---|---|---|---|
| CMP-017 考生端页壳实例 | — | DEF-001 | StudentLayout.vue:27 el-container | active=/ | 8/0/0 | — | configure | BP-001/TASK-002,TASK-006 |
| CMP-018 顶部用户区(昵称+条件管理入口+退出) | CMP-017 | DEF-001 | StudentLayout.vue:33-37 .right | admin 显示后台管理 | 8/0/0 | — | configure | BP-001/TASK-006 |
| CMP-019 欢迎卡片(问候+概览) | CMP-017 | DEF-010 | Home.vue:30-47 el-card | 默认 | 8/0/0 | — | refactor | BP-010/TASK-008 |
| CMP-020 概览指标组(做题/正确率/未掌握) | CMP-019 | DEF-010 | Home.vue:33-35 el-statistic ×3 | 空数据回 0 | 8/0/0 | — | configure | BP-010/TASK-002 |
| CMP-021 计划进度指标 | CMP-019 | DEF-010 | Home.vue:36-38 el-statistic | plan_progress null→0 | 8/0/0 | — | configure | BP-010/TASK-002 |
| CMP-022 无计划提示(条件) | CMP-019 | DEF-010 | Home.vue:40-46 el-alert v-if | plan_progress===null 显示 | 8/0/0 | — | retain | BP-010/— |
| CMP-023 今日任务卡片(条件) | CMP-017 | DEF-010 | Home.vue:49-58 el-card v-if | 有任务才显示 | 8/0/0 | — | retain | BP-010/— |
| CMP-024 任务行(数据等价类) | CMP-023 | DEF-010 | Home.vue:51-57 .task-row | done/未完成 两态 | 8/0/0 | — | retain | BP-010/— |
| CMP-025 模块入口卡片区 | CMP-017 | DEF-010 | Home.vue:60-68 el-row ×4 | 4 卡等价不同跳转 | 8/0/0 | — | refactor | BP-010/TASK-002,TASK-004 |
| CMP-026 入口卡-题库刷题 | CMP-025 | DEF-010 | Home.vue:62 @click→/practice | 默认 | 8/0/0 | — | refactor | BP-010/TASK-004 |
| CMP-027 入口卡-错题本 | CMP-025 | DEF-010 | Home.vue:62 @click→/wrong-book | 默认 | 8/0/0 | — | refactor | BP-010/TASK-004 |
| CMP-028 入口卡-智能复习计划 | CMP-025 | DEF-010 | Home.vue:62 @click→/plan | 默认 | 8/0/0 | — | refactor | BP-010/TASK-004 |
| CMP-029 入口卡-个人中心 | CMP-025 | DEF-010 | Home.vue:62 @click→/profile | 默认 | 8/0/0 | — | refactor | BP-010/TASK-004 |

> 八维检查明细（逐维度问题、状态、EV、关联）见 audit.json 的 checks；本表给出分布。

## 状态与交互（SCN）

| SCN | 前提 | 步骤 | 预期 | 状态 | EV | FND |
|---|---|---|---|---|---|---|
| SCN-001 未登录访问受保护页被送往登录并可回跳 | 未登录；清空 localStorage | 直接访问 /plan→输入账号密码登录 | 跳 /login?redirect=/plan；登录后回到 /plan | passed | EV-202,EV-203 | — |
| SCN-007 首页概览与今日任务展示 | 已登录考生；已有作答记录与计划 | 进入首页 | 统计数值与后端一致；今日任务按状态展示；无 JS 报错 | passed | EV-203 | — |
| SCN-008 首页无计划/无任务的空态 | 已登录新考生；零作答零计划 | 进入首页 | 显示"还没有生效中的复习计划"提示；统计为 0；今日任务卡片不出现 | passed | EV-203 | — |
| SCN-027 令牌失效全局跳转登录 | 已登录但 token 失效 | 触发任意接口调用 | 40101 时清理本地凭据并跳 /login；redirect 参数保留 | passed | EV-214 | — |
| SCN-028 账号被禁用后的请求反馈 | 已登录考生被禁用；浏览器不刷新 | 在页面触发接口 | 40302 提示"账号已被禁用"；会话终止跳登录 | passed | EV-213,EV-219 | — |
| SCN-030 移动视口 375px 布局可用性 | 已登录考生 | 375×667 视口逐页查看→操作核心按钮 | 导航/筛选/核心操作无遮挡无横向溢出；表格与抽屉可用 | passed | EV-240,EV-229,EV-226,EV-224 | FND-002 |
| SCN-032 生产构建可复现 | web 依赖已安装 | npm run build→检查 dist 产物→preview 服务打开 | 构建成功无报错；产物可被静态服务打开 | passed | EV-217,EV-223 | — |
| SCN-038 首页模块入口卡点击跳转 | 已登录考生 | 逐张点击 4 张入口卡（返回首页后点下一张） | 分别进入 /practice /wrong-book /plan /profile | passed | EV-203 | — |

## 本页迁移与回归

- **TASK-002** 影响实例：CMP-017, CMP-020, CMP-021, CMP-025（回归：['SCN-007', 'SCN-027', 'SCN-028', 'SCN-030', 'SCN-038']）
- **TASK-004** 影响实例：CMP-025, CMP-026, CMP-027, CMP-028, CMP-029（回归：['SCN-038']）
- **TASK-006** 影响实例：CMP-017, CMP-018（回归：['SCN-007', 'SCN-027', 'SCN-028', 'SCN-030']）
- **TASK-008** 影响实例：CMP-019（回归：['SCN-007']）
