# PAGE-002 注册

## 页面身份

- **PAGE**：PAGE-002　**路由**：`/register`
- **入口条件**：未登录直达；已登录访问被重定向
- **变体**：默认；用户名重复；校验不通过
- **源码**：web/src/views/student/Register.vue
- **运行证据**：EV-202（详见 audit.json evidence）
- **基线**：本地 vite:5173 + express:3000（AI mock），2026-10-10

## 本页结论

注册校验三分支、撞名 40901 提示通过；原固定宽与无 catch 问题已修复（EV-229/236）。

## 全部组件（CMP）

| CMP | 父CMP | DEF | 定位 | 变体 | CHK(过/败/阻) | FND | 处置 | BP/TASK |
|---|---|---|---|---|---|---|---|---|
| CMP-008 注册页容器 | — | DEF-009 | Register.vue:48 .login-wrap | 默认 | 8/0/0 | — | retain | BP-009/— |
| CMP-009 注册卡片 | CMP-008 | DEF-009 | Register.vue:49 el-card | 默认 | 8/0/0 | — | configure | BP-009/TASK-002 |
| CMP-010 注册表单 | CMP-009 | DEF-009 | Register.vue:51 el-form(rules) | 默认 | 8/0/0 | — | retain | BP-009/— |
| CMP-011 用户名输入 | CMP-010 | DEF-009 | Register.vue:52-54 | pattern 校验 | 8/0/0 | — | retain | BP-009/— |
| CMP-012 昵称输入(可选) | CMP-010 | DEF-009 | Register.vue:55-57 | maxlength 32 | 8/0/0 | — | retain | BP-009/— |
| CMP-013 密码输入 | CMP-010 | DEF-009 | Register.vue:58-60 | min 6 | 8/0/0 | — | retain | BP-009/— |
| CMP-014 确认密码输入 | CMP-010 | DEF-009 | Register.vue:61-63 | 一致性校验 | 8/0/0 | — | retain | BP-009/— |
| CMP-015 注册提交按钮 | CMP-010 | DEF-009 | Register.vue:64 el-button[注 册] | loading 态 | 8/0/0 | — | configure | BP-009/TASK-009 |
| CMP-016 去登录链接 | CMP-009 | DEF-009 | Register.vue:66-68 router-link[/login] | 默认 | 8/0/0 | — | retain | BP-009/— |

> 八维检查明细（逐维度问题、状态、EV、关联）见 audit.json 的 checks；本表给出分布。

## 状态与交互（SCN）

| SCN | 前提 | 步骤 | 预期 | 状态 | EV | FND |
|---|---|---|---|---|---|---|
| SCN-004 注册成功后跳转登录并可登录 | 未登录；目标用户名未被占用 | 填写合法信息→提交→用新账号登录 | 注册成功提示；跳 /login；登录成功进首页 | passed | EV-202 | — |
| SCN-005 注册校验：用户名格式/密码长度/两次不一致 | 未登录 | 非法用户名提交→短密码提交→两次密码不一致提交 | 各自字段级错误提示；不发请求 | passed | EV-202 | — |
| SCN-006 注册撞名：用户名重复返回明确错误 | 未登录；已存在用户 u1 | 用 u1 的用户名注册 | 明确错误提示（用户名已存在）；表单保留输入 | passed | EV-219 | — |
| SCN-037 登录/注册页壳呈现与互跳 | 未登录 | 打开 /login 查看页面结构→点"立即注册"到 /register→填昵称字段→点"去登录"回 /login | 两页居中卡片完整渲染；互跳正确；昵称字段可输入且计数生效 | passed | EV-202 | — |

## 本页迁移与回归

- **TASK-002** 影响实例：CMP-009（回归：['SCN-037']）
- **TASK-009** 影响实例：CMP-015（回归：['SCN-004', 'SCN-006']）
