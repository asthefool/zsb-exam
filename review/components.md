# 组件蓝图与实例处置（17 BP / 94 CMP）

> 全部实例处置：retain 56 / configure 21 / refactor 17。每份蓝图的当前契约证据见 audit.json evidence；目标契约十项如下。

## BP-001（DEF-001）

**当前契约**：考生端页壳：顶部品牌+el-menu(5 项,:ellipsis=false)+右侧昵称/条件管理入口/退出；昵称取 userStore.profile（他页未加载时为"同学"）。EV-105

**变更位置**：web/src/layout/StudentLayout.vue

| 目标维度 | 具体内容 |
|---|---|
| 职责 | 考生端全局导航与账号区；不含业务数据获取 |
| 接口 | 仅承载 router-view；导航项常量数组；退出调用 userStore.logout() |
| 状态 | 登录态静态；active 菜单随路由；移动端需新增折叠/抽屉态 |
| 数据副作用 | profile 由登录后统一注入 store（TASK-006），布局不再依赖页面拉取 |
| 语义可访问性 | el-menu 保持语义；折叠导航按钮有可访问名称与 aria-expanded |
| 样式布局 | 响应式：<768px 导航折叠为抽屉/汉堡，内容区 padding 收缩（TASK-002） |
| 性能生命周期 | 无定时器；logout 清理本地凭据 |
| 安全隐私 | 昵称仅展示非敏感字段 |
| 可观测性 | logout 失败静默可接受；无需新增埋点 |
| 集成 | 与 router meta.active 配合；被 PAGE-003..007 共享 |

### 实例处置

| CMP / PAGE | 处置 | 实例专属修改 | FND/TASK | 验收/回归SCN |
|---|---|---|---|---|
| CMP-017 考生端页壳实例（PAGE-003） | configure | 本实例按 TASK-002/TASK-006 调整：导航不折叠致全站移动端溢出；昵称依赖他页拉取 | FND-002,FND-007/TASK-002,TASK-006 | 375px 导航折叠可用；任意页显示真实昵称… / SCN-027,SCN-028,SCN-030 |
| CMP-018 顶部用户区(昵称+条件管理入口+退出)（PAGE-003） | configure | 本实例按 TASK-006 调整：昵称来源依赖他页 fetchProfile | FND-007/TASK-006 | 登录后任意页昵称正确… / SCN-007 |
| CMP-030 考生端页壳实例（PAGE-004） | configure | 本实例按 TASK-002/TASK-006 调整：同页壳移动端溢出与昵称问题 | FND-002,FND-007/TASK-002,TASK-006 | 同上… / SCN-030,SCN-042 |
| CMP-040 考生端页壳实例（PAGE-005） | configure | 本实例按 TASK-002/TASK-006 调整：同页壳移动端溢出与昵称问题 | FND-002,FND-007/TASK-002,TASK-006 | 同上… / SCN-013,SCN-034 |
| CMP-053 考生端页壳实例（PAGE-006） | configure | 本实例按 TASK-002/TASK-006 调整：同页壳移动端溢出与昵称问题 | FND-002,FND-007/TASK-002,TASK-006 | 同上… / SCN-021 |
| CMP-066 考生端页壳实例（PAGE-007） | configure | 本实例按 TASK-002 调整：同页壳移动端溢出 | FND-002/TASK-002 | 同上（昵称页为来源页）… / SCN-022 |

## BP-002（DEF-002）

**当前契约**：管理端页壳：侧栏 2 项菜单+头部返回/退出；桌面布局。EV-002

**变更位置**：web/src/layout/AdminLayout.vue

| 目标维度 | 具体内容 |
|---|---|
| 职责 | 管理端导航与出口 |
| 接口 | 保持现状 |
| 状态 | 静态 |
| 数据副作用 | 无直接请求 |
| 语义可访问性 | el-menu 语义可用 |
| 样式布局 | 桌面布局保持；窄屏不在支持范围（详见 BP-001 移动策略说明） |
| 性能生命周期 | 无 |
| 安全隐私 | 进入依赖路由 meta + 后端 40301 |
| 可观测性 | 无 |
| 集成 | 被 PAGE-008/009 共享 |

### 实例处置

| CMP / PAGE | 处置 | 实例专属修改 | FND/TASK | 验收/回归SCN |
|---|---|---|---|---|
| CMP-072 管理端页壳实例（PAGE-008） | retain | 保持当前 管理端页壳实例 的行为、样式与数据契约；随所属页回归项验证 | —/— | 管理端页壳实例 在回归场景中行为与基线一致（CRUD 与校验链已实测（EV-211）；搜索失…）… / SCN-023 |
| CMP-089 管理端页壳实例（PAGE-009） | retain | 保持当前 管理端页壳实例 的行为、样式与数据契约；随所属页回归项验证 | —/— | 管理端页壳实例 在回归场景中行为与基线一致（启用禁用双向与自保护已实测（EV-213）…）… / SCN-023 |

## BP-003（DEF-003）

**当前契约**：题目卡片：meta 标签+题干+选项 div(@click)+提交按钮+el-result/解析；result 由父级持有锁定；judge 回退两项无 right 高亮；sub-title 直拼 correct_answer。EV-101

**变更位置**：web/src/components/QuestionCard.vue

| 目标维度 | 具体内容 |
|---|---|
| 职责 | 题目展示与作答选择；判分结果展示；不含请求 |
| 接口 | props: question{options 可为 JSON 字符串}, result|null；emit: submit{question_id,user_answer}（多选排序连写）保持兼容 |
| 状态 | 未作答→已选→已判分锁定；切换 question.id 重置 picked（保留）；三题型分支统一结果反馈 |
| 数据副作用 | 无请求；picked 本地 |
| 语义可访问性 | 选项改 input[type=radio|checkbox]+label（判断题同）或 role+tabindex+Space/Enter+aria-checked；fieldset 分组；焦点可见（TASK-004） |
| 样式布局 | 保留现有视觉；right 高亮合并到两分支；judge 文案映射 true→正确（√）（TASK-004） |
| 性能生命周期 | props.result 锁定渲染 |
| 安全隐私 | 不展示未判分答案（保持） |
| 可观测性 | 无需埋点 |
| 集成 | Practice/WrongBook 复用；result 形状（is_correct/correct_answer/analysis）不变 |

### 实例处置

| CMP / PAGE | 处置 | 实例专属修改 | FND/TASK | 验收/回归SCN |
|---|---|---|---|---|
| CMP-035 QuestionCard 答题实例（PAGE-004） | refactor | 本实例按 TASK-004 调整：选项无语义不可键盘操作；judge 展示原始 true 且无高亮 | FND-004,FND-005/TASK-004 | 仅键盘可完成选择提交；judge 文案为 正确（√）且正确项高亮… / SCN-009,SCN-010,SCN-011,SCN-031,SCN-033,SCN-034 |
| CMP-050 QuestionCard 重练实例（PAGE-005） | refactor | 本实例按 TASK-004/TASK-005 调整：答对后列表不同步；选项语义缺失；judge 展示问题 | FND-004,FND-005,FND-006/TASK-004,TASK-005 | 答对后行状态=已掌握；仅键盘可重练… / SCN-014,SCN-040 |
| CMP-051 QuestionCard 判分结果实例(条件)（PAGE-005） | refactor | 本实例按 TASK-004 调整：结果实例同 DEF-003 展示与语义问题 | FND-004,FND-005/TASK-004 | judge 文案/高亮正确、语义化… / SCN-014,SCN-040 |

## BP-004（DEF-004）

**当前契约**：AI 讲解面板：init(getAiConfig→缓存→按需 generate)；loading 仅 generate 置位；failed 死状态；失败描述固定；旧内容保留无失败 UI。EV-103

**变更位置**：web/src/components/ExplainPanel.vue

| 目标维度 | 具体内容 |
|---|---|
| 职责 | 讲解获取/生成/重试与来源标注 |
| 接口 | props: wrongQuestionId；emit: explained（可保留）；GET/POST /ai/explanations 契约不变 |
| 状态 | 显式 status: idle|loading|success|failed；init 窗口渲染 skeleton；generate 失败且有旧内容→保留内容+失败横幅；失败原因按 code 映射（42901/50201/50202）（TASK-007） |
| 数据副作用 | 缓存命中不发 POST；force=1 强制重生成；失败不写脏数据（保持后端行为） |
| 语义可访问性 | skeleton 有 aria-busy；错误 alert role=alert |
| 样式布局 | 沿用；失败横幅复用 el-alert |
| 性能生命周期 | 组件卸载丢弃在途请求结果（用请求序号防乱序） |
| 安全隐私 | 不落盘缓存 |
| 可观测性 | console.warn 带 code（脱敏） |
| 集成 | WrongBook 抽屉内使用；:key 重置逻辑保持 |

### 实例处置

| CMP / PAGE | 处置 | 实例专属修改 | FND/TASK | 验收/回归SCN |
|---|---|---|---|---|
| CMP-052 ExplainPanel AI 讲解实例（PAGE-005） | refactor | 本实例按 TASK-007 调整：状态机缺 idle、失败原因不分、failed 死状态 | FND-008/TASK-007 | 三态无闪现；失败显示具体原因与重试… / SCN-015,SCN-035,SCN-036 |

## BP-005（DEF-005）

**当前契约**：Axios 层：baseURL、Bearer 注入、code!==0 统一 toast、40101 清凭据跳登录带 redirect；AI 调用点各自 timeout。EV-108

**变更位置**：web/src/api/request.js

| 目标维度 | 具体内容 |
|---|---|
| 职责 | 传输层统一鉴权与错误码处理 |
| 接口 | 保持响应解包为 data；为业务层透传 code/message（供 ExplainPanel 错误映射） |
| 状态 | 40101 一次性跳转（并发请求防重复跳） |
| 数据副作用 | 超时统一走 constants.TIMEOUT（TASK-009） |
| 语义可访问性 | toast 文案保持 |
| 样式布局 | 无 |
| 性能生命周期 | 无 |
| 安全隐私 | 不记录 token；错误信息不含敏感响应体 |
| 可观测性 | console 保留脱敏错误码 |
| 集成 | 所有 api/index.js 调用者兼容不变 |

### 实例处置

| CMP / PAGE | 处置 | 实例专属修改 | FND/TASK | 验收/回归SCN |
|---|---|---|---|---|

## BP-006（DEF-006）

**当前契约**：Pinia user store：token/role/profile；login 落 localStorage；reset 清理；fetchProfile/saveProfile。EV-108

**变更位置**：web/src/stores/user.js

| 目标维度 | 具体内容 |
|---|---|
| 职责 | 会话与个人信息状态所有权 |
| 接口 | actions 保持；login 成功后拉取 profile（TASK-006） |
| 状态 | 登录/登出/失效三态一致清理 |
| 数据副作用 | localStorage 键统一用 STORAGE_KEYS（TASK-009） |
| 语义可访问性 | 无 UI |
| 样式布局 | 无 |
| 性能生命周期 | 无 |
| 安全隐私 | token 仅存 localStorage（现状，XSS 风险在 BP-005 备注） |
| 可观测性 | 无 |
| 集成 | 被 StudentLayout/Home/Profile/Login 消费 |

### 实例处置

| CMP / PAGE | 处置 | 实例专属修改 | FND/TASK | 验收/回归SCN |
|---|---|---|---|---|

## BP-007（DEF-007）

**当前契约**：路由表+全局守卫：requiresAuth→/login?redirect、admin role 检查（localStorage）、通配重定向 /。EV-001

**变更位置**：web/src/router/index.js

| 目标维度 | 具体内容 |
|---|---|
| 职责 | 路由与前端准入提示（信任边界在后端） |
| 接口 | 路由名/路径不变 |
| 状态 | 守卫判定顺序保持 |
| 数据副作用 | 无 |
| 语义可访问性 | redirect 回跳体验保持 |
| 样式布局 | 无 |
| 性能生命周期 | 懒加载分包（保持） |
| 安全隐私 | redirect 校验 /^\//（TASK-009） |
| 可观测性 | 无 |
| 集成 | 与 store/后端 40301 双重拦截配合 |

### 实例处置

| CMP / PAGE | 处置 | 实例专属修改 | FND/TASK | 验收/回归SCN |
|---|---|---|---|---|
| CMP-094 未知路径重定向（PAGE-010） | retain | 本实例按  调整：未知路径重定向两态正确（EV-215） | —/— | 未登录/已登录重定向正确… / SCN-029 |

## BP-008（DEF-008）

**当前契约**：登录页：居中卡+表单校验+回车提交+redirect 回跳；submit try/finally 无 catch。EV-108

**变更位置**：web/src/views/student/Login.vue

| 目标维度 | 具体内容 |
|---|---|
| 职责 | 登录入口 |
| 接口 | 不变 |
| 状态 | 校验/提交 loading/失败提示 |
| 数据副作用 | 成功后由 store 拉取 profile |
| 语义可访问性 | label 关联保持；按钮 loading aria |
| 样式布局 | card width:400px 改 max-width:calc(100vw - 32px)（TASK-002） |
| 性能生命周期 | 无 |
| 安全隐私 | redirect 白名单校验（TASK-009） |
| 可观测性 | 失败提示来自拦截器 |
| 集成 | store.login |

### 实例处置

| CMP / PAGE | 处置 | 实例专属修改 | FND/TASK | 验收/回归SCN |
|---|---|---|---|---|
| CMP-001 登录页容器 login-wrap（PAGE-001） | retain | 保持当前 登录页容器 login-wrap 的行为、样式与数据契约；随所属页回归项验证 | —/— | 登录页容器 login-wrap 在回归场景中行为与基线一致（登录/注册互跳、校验三分支、错误凭据与 redi…）… / SCN-037 |
| CMP-002 登录卡片（PAGE-001） | configure | 本实例按 TASK-002 调整：移动端 400px 固定宽溢出 | FND-002/TASK-002 | max-width:calc(100vw - 32px) 生效，375px 无横向滚动… / SCN-037 |
| CMP-003 登录表单（PAGE-001） | retain | 保持当前 登录表单 的行为、样式与数据契约；随所属页回归项验证 | —/— | 登录表单 在回归场景中行为与基线一致（登录/注册互跳、校验三分支、错误凭据与 redi…）… / SCN-001,SCN-002,SCN-003,SCN-004,SCN-031 |
| CMP-004 用户名输入（PAGE-001） | retain | 保持当前 用户名输入 的行为、样式与数据契约；随所属页回归项验证 | —/— | 用户名输入 在回归场景中行为与基线一致（登录/注册互跳、校验三分支、错误凭据与 redi…）… / SCN-003 |
| CMP-005 密码输入（PAGE-001） | retain | 保持当前 密码输入 的行为、样式与数据契约；随所属页回归项验证 | —/— | 密码输入 在回归场景中行为与基线一致（登录/注册互跳、校验三分支、错误凭据与 redi…）… / SCN-003 |
| CMP-006 登录提交按钮（PAGE-001） | configure | 本实例按 TASK-009 调整：redirect 未校验、submit 无 catch | FND-011/TASK-009 | 非法 redirect 回落 /；异常有提示无 unhandled rejection… / SCN-001,SCN-002,SCN-003,SCN-004,SCN-031 |
| CMP-007 注册引导链接（PAGE-001） | retain | 保持当前 注册引导链接 的行为、样式与数据契约；随所属页回归项验证 | —/— | 注册引导链接 在回归场景中行为与基线一致（登录/注册互跳、校验三分支、错误凭据与 redi…）… / SCN-037 |

## BP-009（DEF-009）

**当前契约**：注册页：用户名正则/密码≥6/两次一致校验；submit try/finally 无 catch。EV-108

**变更位置**：web/src/views/student/Register.vue

| 目标维度 | 具体内容 |
|---|---|
| 职责 | 注册入口 |
| 接口 | 不变 |
| 状态 | 三分支校验保持；补 catch |
| 数据副作用 | 注册成功跳登录 |
| 语义可访问性 | label 保持 |
| 样式布局 | 同 BP-008 移动端收缩 |
| 性能生命周期 | 无 |
| 安全隐私 | 密码不回显（保持） |
| 可观测性 | 错误提示来自拦截器 |
| 集成 | api.registerUser |

### 实例处置

| CMP / PAGE | 处置 | 实例专属修改 | FND/TASK | 验收/回归SCN |
|---|---|---|---|---|
| CMP-008 注册页容器（PAGE-002） | retain | 保持当前 注册页容器 的行为、样式与数据契约；随所属页回归项验证 | —/— | 注册页容器 在回归场景中行为与基线一致（注册校验与成功路径已实测（EV-202）…）… / SCN-037 |
| CMP-009 注册卡片（PAGE-002） | configure | 本实例按 TASK-002 调整：移动端 400px 固定宽溢出 | FND-002/TASK-002 | 同登录卡 375px 无横向滚动… / SCN-037 |
| CMP-010 注册表单（PAGE-002） | retain | 保持当前 注册表单 的行为、样式与数据契约；随所属页回归项验证 | —/— | 注册表单 在回归场景中行为与基线一致（注册校验与成功路径已实测（EV-202）…）… / SCN-004,SCN-005 |
| CMP-011 用户名输入（PAGE-002） | retain | 保持当前 用户名输入 的行为、样式与数据契约；随所属页回归项验证 | —/— | 用户名输入 在回归场景中行为与基线一致（注册校验与成功路径已实测（EV-202）…）… / SCN-005 |
| CMP-012 昵称输入(可选)（PAGE-002） | retain | 保持当前 昵称输入(可选) 的行为、样式与数据契约；随所属页回归项验证 | —/— | 昵称输入(可选) 在回归场景中行为与基线一致（注册校验与成功路径已实测（EV-202）…）… / SCN-037 |
| CMP-013 密码输入（PAGE-002） | retain | 保持当前 密码输入 的行为、样式与数据契约；随所属页回归项验证 | —/— | 密码输入 在回归场景中行为与基线一致（注册校验与成功路径已实测（EV-202）…）… / SCN-005 |
| CMP-014 确认密码输入（PAGE-002） | retain | 保持当前 确认密码输入 的行为、样式与数据契约；随所属页回归项验证 | —/— | 确认密码输入 在回归场景中行为与基线一致（注册校验与成功路径已实测（EV-202）…）… / SCN-005 |
| CMP-015 注册提交按钮（PAGE-002） | configure | 本实例按 TASK-009 调整：submit 无 catch（unhandled rejection） | FND-011/TASK-009 | 注册失败有提示、控制台无 Uncaught… / SCN-004,SCN-006 |
| CMP-016 去登录链接（PAGE-002） | retain | 保持当前 去登录链接 的行为、样式与数据契约；随所属页回归项验证 | —/— | 去登录链接 在回归场景中行为与基线一致（注册校验与成功路径已实测（EV-202）…）… / SCN-037 |

## BP-010（DEF-010）

**当前契约**：首页：欢迎卡+4 统计+条件提示+今日任务+4 入口卡(el-card @click)；固定 :span=6。EV-106

**变更位置**：web/src/views/student/Home.vue

| 目标维度 | 具体内容 |
|---|---|
| 职责 | 学习概览与模块入口 |
| 接口 | 不变 |
| 状态 | 零数据/有数据保持；补 error 态与重试（TASK-008） |
| 数据副作用 | fetchProfile+getOverview 并行，失败进 error |
| 语义可访问性 | 入口卡改 router-link 或 role=link+键盘（TASK-004） |
| 样式布局 | 统计/入口卡加 :xs 断点（TASK-002） |
| 性能生命周期 | 无 |
| 安全隐私 | 无敏感展示 |
| 可观测性 | 失败 console.warn |
| 集成 | store.profile |

### 实例处置

| CMP / PAGE | 处置 | 实例专属修改 | FND/TASK | 验收/回归SCN |
|---|---|---|---|---|
| CMP-019 欢迎卡片(问候+概览)（PAGE-003） | refactor | 本实例按 TASK-008 调整：请求失败落入空/旧数据无错误态 | FND-009/TASK-008 | 断网显示错误态与重试按钮… / SCN-007 |
| CMP-020 概览指标组(做题/正确率/未掌握)（PAGE-003） | configure | 本实例按 TASK-002 调整：移动端列宽挤压文字竖排 | FND-002/TASK-002 | 375px 统计两列堆叠可读… / SCN-007 |
| CMP-021 计划进度指标（PAGE-003） | configure | 本实例按 TASK-002 调整：同统计行移动端挤压 | FND-002/TASK-002 | 同上… / SCN-007 |
| CMP-022 无计划提示(条件)（PAGE-003） | retain | 本实例按  调整：条件提示逻辑与 plan_progress===null 口径正确 | —/— | plan_progress 为 null 时提示出现、有计划时不出现… / SCN-008 |
| CMP-023 今日任务卡片(条件)（PAGE-003） | retain | 本实例按  调整：条件渲染与任务数据正确 | —/— | 有任务显示卡片、无任务不渲染… / SCN-007,SCN-008 |
| CMP-024 任务行(数据等价类)（PAGE-003） | retain | 本实例按  调整：done 态删除线与标签正确 | —/— | 打卡后行样式切换… / SCN-007 |
| CMP-025 模块入口卡片区（PAGE-003） | refactor | 本实例按 TASK-002/TASK-004 调整：入口卡键盘不可达且移动端竖排截断 | FND-002,FND-004/TASK-002,TASK-004 | 入口卡可键盘进入模块；375px 布局可读… / SCN-038 |
| CMP-026 入口卡-题库刷题（PAGE-003） | refactor | 本实例按 TASK-004 调整：el-card @click 无键盘可达 | FND-004/TASK-004 | Tab 聚焦+Enter 进入 /practice… / SCN-038 |
| CMP-027 入口卡-错题本（PAGE-003） | refactor | 本实例按 TASK-004 调整：同上 | FND-004/TASK-004 | Tab 聚焦+Enter 进入 /wrong-book… / SCN-038 |
| CMP-028 入口卡-智能复习计划（PAGE-003） | refactor | 本实例按 TASK-004 调整：同上 | FND-004/TASK-004 | Tab 聚焦+Enter 进入 /plan… / SCN-038 |
| CMP-029 入口卡-个人中心（PAGE-003） | refactor | 本实例按 TASK-004 调整：同上 | FND-004/TASK-004 | Tab 聚焦+Enter 进入 /profile… / SCN-038 |

## BP-011（DEF-011）

**当前契约**：刷题页：筛选+单题作答(QuestionCard)+页内翻页；results 以题目 id 缓存；prev 不跨页。EV-102

**变更位置**：web/src/views/student/Practice.vue

| 目标维度 | 具体内容 |
|---|---|
| 职责 | 筛选、逐题作答、页内/跨页导航 |
| 接口 | 不变 |
| 状态 | 补跨页回退：idx=0 且 page>1 时加载上一页末题；按钮状态与能力一致（TASK-003） |
| 数据副作用 | load() 加请求序号防乱序（TASK-005 相关） |
| 语义可访问性 | 随 QuestionCard 修复 |
| 样式布局 | 筛选条窄屏换行（TASK-002） |
| 性能生命周期 | 防重复提交守卫保持 |
| 安全隐私 | 无 |
| 可观测性 | 无 |
| 集成 | api getQuestions/submitAnswer |

### 实例处置

| CMP / PAGE | 处置 | 实例专属修改 | FND/TASK | 验收/回归SCN |
|---|---|---|---|---|
| CMP-031 筛选工具条（PAGE-004） | retain | 本实例按  调整：筛选触发 load 与清空行为正确 | —/— | 切筛选重置第 1 题… / SCN-011 |
| CMP-032 科目筛选下拉（PAGE-004） | configure | 本实例按 TASK-005 调整：load() 无请求时序守卫，快速切换有乱序风险 | FND-010/TASK-005 | 慢网快速切换 3 次最终展示与最后一次一致… / SCN-011,SCN-033 |
| CMP-033 题型筛选下拉（PAGE-004） | configure | 本实例按 TASK-005 调整：同筛选时序守卫 | FND-010/TASK-005 | 同上… / SCN-011 |
| CMP-034 题目计数文本（PAGE-004） | retain | 本实例按  调整：计数与 total 同步 | —/— | 筛选后计数正确… / SCN-009 |
| CMP-036 翻页操作条（PAGE-004） | refactor | 本实例按 TASK-003 调整：位置文本与按钮状态组合在跨页回退后需同步 | FND-003/TASK-003 | 往返翻页位置文本正确… / SCN-010,SCN-042 |
| CMP-037 上一题按钮（PAGE-004） | refactor | 本实例按 TASK-003 调整：第 2 页首页死按钮、无跨页回退 | FND-003/TASK-003 | 跨页可回退上一页末题，按钮状态与行为一致… / SCN-009,SCN-010 |
| CMP-038 下一题按钮（PAGE-004） | retain | 本实例按  调整：未作答禁用与跨页加载行为正确 | —/— | 末题点下一题进入第 2 页… / SCN-009,SCN-010 |
| CMP-039 空题库提示(条件)（PAGE-004） | retain | 本实例按  调整：空态文案与条件正确（EV-204） | —/— | 无题筛选显示空态… / SCN-012 |

## BP-012（DEF-012）

**当前契约**：错题本：筛选+表格+分页+详情抽屉+重练+掌握切换+ExplainPanel；onRepractice 不刷新列表；抽屉 560px；写操作无守卫。EV-104/EV-110

**变更位置**：web/src/views/student/WrongBook.vue

| 目标维度 | 具体内容 |
|---|---|
| 职责 | 错题列表/详情/重练/掌握管理/AI 讲解入口 |
| 接口 | 不变；建议后端 repractice 返回最新 wrong_count/mastered |
| 状态 | 答对后 load() 或行内同步；wrong_count 即时更新（TASK-005） |
| 数据副作用 | toggleMastered 加防重入；列表刷新口径统一 |
| 语义可访问性 | 随 QuestionCard 修复；抽屉关闭按钮语义保持 |
| 样式布局 | 抽屉 size=min(560px,100%)（TASK-002） |
| 性能生命周期 | 写按钮 loading |
| 安全隐私 | 详情不含答案（保持） |
| 可观测性 | masteredSynced=false 时如实提示（TASK-005） |
| 集成 | api wrong 域 + ExplainPanel |

### 实例处置

| CMP / PAGE | 处置 | 实例专属修改 | FND/TASK | 验收/回归SCN |
|---|---|---|---|---|
| CMP-041 筛选工具条（PAGE-005） | retain | 本实例按  调整：筛选联动 onFilterChange 重置页码正确 | —/— | 切筛选回到第 1 页… / SCN-013 |
| CMP-042 科目筛选下拉（PAGE-005） | retain | 保持当前 科目筛选下拉 的行为、样式与数据契约；随所属页回归项验证 | —/— | 科目筛选下拉 在回归场景中行为与基线一致（列表筛选、详情抽屉、重练、掌握切换、讲解三态已实…）… / SCN-033,SCN-040 |
| CMP-043 掌握状态单选组（PAGE-005） | retain | 保持当前 掌握状态单选组 的行为、样式与数据契约；随所属页回归项验证 | —/— | 掌握状态单选组 在回归场景中行为与基线一致（列表筛选、详情抽屉、重练、掌握切换、讲解三态已实…）… / SCN-013 |
| CMP-044 错题表格（PAGE-005） | refactor | 本实例按 TASK-005 调整：自动标记/重练后行状态与 wrong_count 不即时刷新 | FND-006/TASK-005 | 操作后行状态即时一致… / SCN-013,SCN-017,SCN-030 |
| CMP-045 行按钮-查看/AI讲解（PAGE-005） | retain | 本实例按  调整：打开抽屉与详情加载正确 | —/— | 详情不含答案、加载态正常… / SCN-014,SCN-040 |
| CMP-046 行按钮-标记掌握/取消（PAGE-005） | configure | 本实例按 TASK-005/TASK-011 调整：无防重入（FND-010 待补证） | FND-010/TASK-005,TASK-011 | 慢网双击仅发一次请求… / SCN-014,SCN-016 |
| CMP-047 分页器（PAGE-005） | retain | 本实例按  调整：分页与 total 同步 | —/— | 翻页数据正确… / SCN-013 |
| CMP-048 详情抽屉（PAGE-005） | configure | 本实例按 TASK-002 调整：固定 560px 移动端超屏 | FND-002/TASK-002 | 375px 抽屉不超出视口… / SCN-014,SCN-030,SCN-040 |
| CMP-049 详情描述区（PAGE-005） | retain | 本实例按  调整：描述区字段正确 | —/— | 科目/次数展示正确… / SCN-014,SCN-040 |

## BP-013（DEF-013）

**当前契约**：计划页：生成表单（日期/科目/时长）+AI 模式标签+计划卡（进度/折叠任务/打卡）+空态；getCurrentPlan 失败与空态混淆；生成无防重入。EV-002

**变更位置**：web/src/views/student/Plan.vue

| 目标维度 | 具体内容 |
|---|---|
| 职责 | 计划生成、任务打卡、进度展示 |
| 接口 | 不变 |
| 状态 | 空/error 区分（TASK-008）；生成按钮防重入（TASK-005） |
| 数据副作用 | Promise.allSettled 保持；错误分支标记 error |
| 语义可访问性 | el-form/el-collapse 语义保持 |
| 样式布局 | 表单窄屏全宽（TASK-002） |
| 性能生命周期 | 打卡 _checking 保持 |
| 安全隐私 | 无 |
| 可观测性 | 失败 toast+error 态 |
| 集成 | api plan/AI 域 |

### 实例处置

| CMP / PAGE | 处置 | 实例专属修改 | FND/TASK | 验收/回归SCN |
|---|---|---|---|---|
| CMP-054 生成表单卡片（PAGE-006） | retain | 本实例按  调整：表单控件与生成入口行为正确 | —/— | 默认值/取值范围正确… / SCN-018,SCN-030 |
| CMP-055 AI 模式标签(条件)（PAGE-006） | retain | 本实例按  调整：mock/llm 标签展示正确（EV-208） | —/— | 标签与 provider 一致… / SCN-018 |
| CMP-056 考试日期选择器（PAGE-006） | retain | 本实例按  调整：日期选择与天数提示逻辑正确（disabled-date 允许昨天为既定口径） | —/— | 选择日期后提示天数… / SCN-018 |
| CMP-057 目标科目多选（PAGE-006） | retain | 本实例按  调整：多选与空值=全部口径正确 | —/— | 生成 payload 正确… / SCN-018 |
| CMP-058 每日时长输入（PAGE-006） | retain | 本实例按  调整：15-600 范围约束正确 | —/— | 边界值有效… / SCN-018 |
| CMP-059 生成计划按钮（PAGE-006） | configure | 本实例按 TASK-005/TASK-011 调整：生成无防重入（FND-010 待补证）；已有计划确认弹窗正确 | FND-010/TASK-005,TASK-011 | 慢网双击仅一次生成；确认/取消路径正确… / SCN-018,SCN-020,SCN-035 |
| CMP-060 当前计划卡片(条件)（PAGE-006） | retain | 本实例按  调整：计划卡渲染与数据分组正确 | —/— | 任务按日分组、今天展开… / SCN-018,SCN-020 |
| CMP-061 进度摘要+进度条（PAGE-006） | retain | 本实例按  调整：进度与打卡联动正确 | —/— | 打卡后进度即时更新… / SCN-019 |
| CMP-062 任务日期折叠面板（PAGE-006） | retain | 本实例按  调整：折叠分组与展开逻辑正确 | —/— | 今天默认展开… / SCN-018 |
| CMP-063 任务行(数据等价类)（PAGE-006） | retain | 本实例按  调整：任务行两态展示正确 | —/— | 完成态样式正确… / SCN-019 |
| CMP-064 打卡按钮（PAGE-006） | retain | 本实例按  调整：打卡 _checking 防重入已具备 | —/— | 重复点击不重复计数… / SCN-019 |
| CMP-065 无计划空态（PAGE-006） | refactor | 本实例按 TASK-008 调整：getCurrentPlan 失败与无计划空态混淆 | FND-009/TASK-008 | 断网显示错误态而非"还没有复习计划"… / SCN-021 |

## BP-014（DEF-014）

**当前契约**：个人中心：账号信息+昵称表单+提示；空昵称拦截；load 失败静默。EV-002

**变更位置**：web/src/views/student/Profile.vue

| 目标维度 | 具体内容 |
|---|---|
| 职责 | 个人信息查看/昵称修改 |
| 接口 | 不变 |
| 状态 | 补 error 态（TASK-008）；保存按钮防重入（TASK-005） |
| 数据副作用 | saveProfile 后刷新 |
| 语义可访问性 | label 保持 |
| 样式布局 | :xs=24 已响应（保持） |
| 性能生命周期 | 无 |
| 安全隐私 | 不展示密码域（保持） |
| 可观测性 | 无 |
| 集成 | store.saveProfile |

### 实例处置

| CMP / PAGE | 处置 | 实例专属修改 | FND/TASK | 验收/回归SCN |
|---|---|---|---|---|
| CMP-067 账号信息卡片（PAGE-007） | refactor | 本实例按 TASK-008 调整：拉取失败以 — 呈现无错误态 | FND-009/TASK-008 | 断网显示错误态与重试… / SCN-022 |
| CMP-068 昵称修改表单（PAGE-007） | retain | 本实例按  调整：表单与空值拦截正确 | —/— | 空昵称警告不提交… / SCN-022 |
| CMP-069 昵称输入（PAGE-007） | retain | 本实例按  调整：maxlength/计数正确 | —/— | 超长输入被限制… / SCN-022 |
| CMP-070 保存昵称按钮（PAGE-007） | configure | 本实例按 TASK-005/TASK-011 调整：无防重入（FND-010 待补证） | FND-010/TASK-005,TASK-011 | 慢网双击仅一次 PUT… / SCN-022 |
| CMP-071 账号安全提示 alert（PAGE-007） | retain | 本实例按  调整：提示信息准确（引导管理员处理） | —/— | 文案与实际流程一致… / SCN-022 |

## BP-015（DEF-015）

**当前契约**：题目管理：搜索+表格+分页+编辑对话框（自定义 validate 链）+软删；关键词搜索 500；getSubjects 失败阻断 load。EV-107

**变更位置**：web/src/views/admin/QuestionManage.vue；server/src/dao/questionDao.js；server/src/services/adminService.js

| 目标维度 | 具体内容 |
|---|---|
| 职责 | 题库 CRUD 与检索 |
| 接口 | 不变 |
| 状态 | 搜索失败展示错误态而非旧数据（TASK-001） |
| 数据副作用 | 后端修复 LIKE ESCAPE（TASK-001）；getSubjects 失败不阻断 load（TASK-008） |
| 语义可访问性 | 对话框表单 label 保持 |
| 样式布局 | 桌面保持 |
| 性能生命周期 | 保存/删除防重入（TASK-005） |
| 安全隐私 | admin-only（后端强制，保持） |
| 可观测性 | 500 具体化为可读提示 |
| 集成 | api admin 域 |

### 实例处置

| CMP / PAGE | 处置 | 实例专属修改 | FND/TASK | 验收/回归SCN |
|---|---|---|---|---|
| CMP-073 题目管理卡片头+新建按钮（PAGE-008） | refactor | 本实例按 TASK-008 调整：getSubjects 失败阻断列表加载 | FND-009/TASK-008 | subjects 失败仍可加载列表… / SCN-024 |
| CMP-074 搜索工具条（PAGE-008） | refactor | 本实例按 TASK-001 调整：关键词搜索 100% 失败（后端 SQL）且失败展示旧数据 | FND-001/TASK-001 | 搜索返回过滤结果；失败显示错误态… / SCN-024 |
| CMP-075 题目表格（PAGE-008） | configure | 本实例按 TASK-001 调整：搜索失败时保留旧列表误导 | FND-001/TASK-001 | 请求失败列表区显示错误而非旧数据… / SCN-024 |
| CMP-076 行按钮-编辑（PAGE-008） | retain | 本实例按  调整：编辑按钮回填正确 | —/— | 编辑弹窗数据准确… / SCN-024 |
| CMP-077 行按钮-删除（PAGE-008） | configure | 本实例按 TASK-005/TASK-011 调整：无防重入（FND-010 待补证）；确认弹窗正确 | FND-010/TASK-005,TASK-011 | 慢网双击仅一次 DELETE… / SCN-024 |
| CMP-078 分页器（PAGE-008） | retain | 本实例按  调整：分页与删末页回退逻辑正确 | —/— | 删末页唯一行回上一页… / SCN-024 |
| CMP-079 题目编辑对话框（PAGE-008） | retain | 本实例按  调整：新建/编辑两态回填正确、校验链完整（EV-211） | —/— | 编辑回填准确、保存后列表刷新… / SCN-024,SCN-025 |
| CMP-080 对话框-科目选择（PAGE-008） | retain | 本实例按  调整：科目选择与 subjects 数据正确 | —/— | 创建后科目列正确… / SCN-025 |
| CMP-081 对话框-题型单选（PAGE-008） | retain | 本实例按  调整：切换题型清空答案防误判 | —/— | single→judge 不残留答案… / SCN-025 |
| CMP-082 对话框-题干输入（PAGE-008） | retain | 本实例按  调整：maxlength 与必填校验正确 | —/— | 空题干被拦截… / SCN-025 |
| CMP-083 对话框-选项编辑器(条件)（PAGE-008） | retain | 本实例按  调整：选项增删与答案字母清理逻辑正确 | —/— | 删选项后答案残留字母被清理… / SCN-025 |
| CMP-084 对话框-正确答案输入（PAGE-008） | retain | 本实例按  调整：judge radio/文本双分支与校验正确 | —/— | 非法答案被拦截… / SCN-025 |
| CMP-085 对话框-解析输入（PAGE-008） | retain | 本实例按  调整：解析输入与展示链路正确 | —/— | 解析随判分展示… / SCN-025 |
| CMP-086 对话框-难度评分（PAGE-008） | retain | 本实例按  调整：难度 1-5 与后端校验一致 | —/— | 非法难度被后端拦截… / SCN-025 |
| CMP-087 对话框-状态开关（PAGE-008） | retain | 本实例按  调整：启用停用开关联动正确 | —/— | 状态列随保存更新… / SCN-025 |
| CMP-088 对话框-保存/取消按钮（PAGE-008） | configure | 本实例按 TASK-005/TASK-011 调整：保存无防重入（FND-010 待补证） | FND-010/TASK-005,TASK-011 | 慢网双击仅一次提交… / SCN-024,SCN-025 |

## BP-016（DEF-016）

**当前契约**：用户管理：筛选+表格+启用禁用（自保护 disabled、管理员禁用被后端拒绝）。EV-213

**变更位置**：web/src/views/admin/UserManage.vue

| 目标维度 | 具体内容 |
|---|---|
| 职责 | 用户状态管理 |
| 接口 | 不变 |
| 状态 | 保持 |
| 数据副作用 | 防重入（TASK-005）；管理员行按钮建议禁用以匹配后端规则 |
| 语义可访问性 | 保持 |
| 样式布局 | 桌面保持 |
| 性能生命周期 | row._checking 保持 |
| 安全隐私 | 自身禁用前端禁用+后端拒绝双保险（保持） |
| 可观测性 | 无 |
| 集成 | api admin 域 |

### 实例处置

| CMP / PAGE | 处置 | 实例专属修改 | FND/TASK | 验收/回归SCN |
|---|---|---|---|---|
| CMP-090 筛选工具条(角色/状态)（PAGE-009） | retain | 本实例按  调整：筛选与清空查询正确 | —/— | 筛选结果正确… / SCN-026 |
| CMP-091 用户表格（PAGE-009） | retain | 本实例按  调整：列表与角色/状态标签正确 | —/— | 列数据与格式化正确… / SCN-026 |
| CMP-092 行按钮-启用/禁用（PAGE-009） | retain | 本实例按  调整：双向切换、自保护与后端管理员防护正确（EV-213） | —/— | 禁用/启用/自身禁用/管理员禁用四路径正确… / SCN-026 |
| CMP-093 分页器（PAGE-009） | retain | 本实例按  调整：分页正确 | —/— | 翻页正确… / SCN-026 |

## BP-017（DEF-017）

**当前契约**：应用根壳：router-view + 全局基础样式；组件库全量引入。EV-109

**变更位置**：web/src/App.vue；web/src/main.js；web/vite.config.js

| 目标维度 | 具体内容 |
|---|---|
| 职责 | 应用装配与全局样式 |
| 接口 | 不变 |
| 状态 | 无 |
| 数据副作用 | 无 |
| 语义可访问性 | 全局焦点样式可补 |
| 样式布局 | 保持 |
| 性能生命周期 | Element Plus 按需引入/manualChunks（TASK-010） |
| 安全隐私 | 无 |
| 可观测性 | 无 |
| 集成 | 全局入口 |

### 实例处置

| CMP / PAGE | 处置 | 实例专属修改 | FND/TASK | 验收/回归SCN |
|---|---|---|---|---|
