# PAGE-001 登录

## 页面身份

- **PAGE**：PAGE-001　**路由**：`/login`
- **入口条件**：未登录直达；带 redirect 参数进入；已登录访问被重定向
- **变体**：默认；登录失败；校验不通过；redirect 回跳
- **源码**：web/src/views/student/Login.vue
- **运行证据**：EV-202（详见 audit.json evidence）
- **基线**：本地 vite:5173 + express:3000（AI mock），2026-10-10

## 本页结论

登录页校验、错误凭据反馈、redirect 回跳均通过；原移动端固定宽（FND-002）与 submit 无 catch/redirect 未校验（FND-011）已修复并复验（EV-229/236）。

## 全部组件（CMP）

| CMP | 父CMP | DEF | 定位 | 变体 | CHK(过/败/阻) | FND | 处置 | BP/TASK |
|---|---|---|---|---|---|---|---|---|
| CMP-001 登录页容器 login-wrap | — | DEF-008 | Login.vue:37 .login-wrap | 默认 | 8/0/0 | — | retain | BP-008/— |
| CMP-002 登录卡片 | CMP-001 | DEF-008 | Login.vue:38 el-card.login-card | 默认 | 8/0/0 | — | configure | BP-008/TASK-002 |
| CMP-003 登录表单 | CMP-002 | DEF-008 | Login.vue:41 el-form(rules,@keyup.enter) | 默认 | 8/0/0 | — | retain | BP-008/— |
| CMP-004 用户名输入 | CMP-003 | DEF-008 | Login.vue:42-44 | 默认 | 8/0/0 | — | retain | BP-008/— |
| CMP-005 密码输入 | CMP-003 | DEF-008 | Login.vue:45-47 | show-password | 8/0/0 | — | retain | BP-008/— |
| CMP-006 登录提交按钮 | CMP-003 | DEF-008 | Login.vue:48 el-button[登 录] | loading 态 | 8/0/0 | — | configure | BP-008/TASK-009 |
| CMP-007 注册引导链接 | CMP-002 | DEF-008 | Login.vue:50-52 router-link[/register] | 默认 | 8/0/0 | — | retain | BP-008/— |

> 八维检查明细（逐维度问题、状态、EV、关联）见 audit.json 的 checks；本表给出分布。

## 状态与交互（SCN）

| SCN | 前提 | 步骤 | 预期 | 状态 | EV | FND |
|---|---|---|---|---|---|---|
| SCN-001 未登录访问受保护页被送往登录并可回跳 | 未登录；清空 localStorage | 直接访问 /plan→输入账号密码登录 | 跳 /login?redirect=/plan；登录后回到 /plan | passed | EV-202,EV-203 | — |
| SCN-002 登录失败：错误凭据有明确提示且不跳转 | 未登录 | 输入不存在用户/错误密码→点登录 | 错误提示可见；停留登录页；无 token 写入 | passed | EV-202 | — |
| SCN-003 登录表单校验：空字段阻止提交 | 未登录 | 直接点登录 | 字段级必填提示出现；不发请求 | passed | EV-202 | — |
| SCN-004 注册成功后跳转登录并可登录 | 未登录；目标用户名未被占用 | 填写合法信息→提交→用新账号登录 | 注册成功提示；跳 /login；登录成功进首页 | passed | EV-202 | — |
| SCN-027 令牌失效全局跳转登录 | 已登录但 token 失效 | 触发任意接口调用 | 40101 时清理本地凭据并跳 /login；redirect 参数保留 | passed | EV-214 | — |
| SCN-031 键盘可达性：Tab 遍历登录与答题控件 | 未登录（登录）/已登录（答题） | 仅键盘完成登录→仅键盘选择选项并提交 | 控件可聚焦可激活；焦点顺序合理；选项可键盘选择 | blocked | EV-231 | FND-004 |
| SCN-037 登录/注册页壳呈现与互跳 | 未登录 | 打开 /login 查看页面结构→点"立即注册"到 /register→填昵称字段→点"去登录"回 /login | 两页居中卡片完整渲染；互跳正确；昵称字段可输入且计数生效 | passed | EV-202 | — |

## 本页迁移与回归

- **TASK-002** 影响实例：CMP-002（回归：['SCN-037']）
- **TASK-009** 影响实例：CMP-006（回归：['SCN-001', 'SCN-002', 'SCN-003', 'SCN-004', 'SCN-031']）
