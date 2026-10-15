# PAGE-009 后台-用户管理

## 页面身份

- **PAGE**：PAGE-009　**路由**：`/admin/users`
- **入口条件**：admin 登录进入
- **变体**：列表；筛选；启用/禁用；自身行禁用按钮
- **源码**：web/src/views/admin/UserManage.vue
- **运行证据**：EV-213（详见 audit.json evidence）
- **基线**：本地 vite:5173 + express:3000（AI mock），2026-10-10

## 本页结论

启用禁用双向、自身保护、管理员保护全部通过；无遗留问题。

## 全部组件（CMP）

| CMP | 父CMP | DEF | 定位 | 变体 | CHK(过/败/阻) | FND | 处置 | BP/TASK |
|---|---|---|---|---|---|---|---|---|
| CMP-089 管理端页壳实例 | — | DEF-002 | AdminLayout.vue:21 | active=/admin/users | 8/0/0 | — | retain | BP-002/— |
| CMP-090 筛选工具条(角色/状态) | CMP-089 | DEF-016 | UserManage.vue:6-16 | 清空=全部 | 8/0/0 | — | retain | BP-016/— |
| CMP-091 用户表格 | CMP-089 | DEF-016 | UserManage.vue:18-51 el-table | 行数据等价类 | 8/0/0 | — | retain | BP-016/— |
| CMP-092 行按钮-启用/禁用 | CMP-091 | DEF-016 | UserManage.vue:43-48 | 自身行禁用；二次确认 | 8/0/0 | — | retain | BP-016/— |
| CMP-093 分页器 | CMP-089 | DEF-016 | UserManage.vue:53-57 el-pagination | 默认 | 8/0/0 | — | retain | BP-016/— |

> 八维检查明细（逐维度问题、状态、EV、关联）见 audit.json 的 checks；本表给出分布。

## 状态与交互（SCN）

| SCN | 前提 | 步骤 | 预期 | 状态 | EV | FND |
|---|---|---|---|---|---|---|
| SCN-023 管理端权限：考生访问 /admin 被拦截 | 考生登录；伪造 localStorage role=admin | 直接访问 /admin/questions→带伪造角色访问 | 路由守卫拦截回首页；绕过前端后 API 返回 40301 | passed | EV-210 | — |
| SCN-026 用户管理启用/禁用与自保护 | admin 登录；有其他考生账号 | 禁用某考生并确认→刷新看状态→尝试禁用自己→用被禁账号登录 | 禁用生效；自身行按钮禁用；被禁账号请求 40302 | passed | EV-213,EV-222 | — |

## 本页迁移与回归

- 本页无修改项；全部实例 retain，随核心旅程回归即可。
