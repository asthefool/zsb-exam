# PAGE-007 个人中心

## 页面身份

- **PAGE**：PAGE-007　**路由**：`/profile`
- **入口条件**：登录后进入
- **变体**：默认；修改昵称
- **源码**：web/src/views/student/Profile.vue
- **运行证据**：EV-209（详见 audit.json evidence）
- **基线**：本地 vite:5173 + express:3000（AI mock），2026-10-10

## 本页结论

查看/改昵称/空值拦截通过；错误态（FND-009）与防重入（FND-010）已修复（EV-235/232）。

## 全部组件（CMP）

| CMP | 父CMP | DEF | 定位 | 变体 | CHK(过/败/阻) | FND | 处置 | BP/TASK |
|---|---|---|---|---|---|---|---|---|
| CMP-066 考生端页壳实例 | — | DEF-001 | StudentLayout.vue:27 | active=/profile | 8/0/0 | — | configure | BP-001/TASK-002 |
| CMP-067 账号信息卡片 | CMP-066 | DEF-014 | Profile.vue:5-17 el-card+el-descriptions | 默认 | 8/0/0 | — | refactor | BP-014/TASK-008 |
| CMP-068 昵称修改表单 | CMP-066 | DEF-014 | Profile.vue:21-29 el-form | 默认 | 8/0/0 | — | retain | BP-014/— |
| CMP-069 昵称输入 | CMP-068 | DEF-014 | Profile.vue:24 el-input maxlength=32 | show-word-limit | 8/0/0 | — | retain | BP-014/— |
| CMP-070 保存昵称按钮 | CMP-068 | DEF-014 | Profile.vue:27 el-button[保存] | loading 态 | 8/0/0 | — | configure | BP-014/TASK-005,TASK-011 |
| CMP-071 账号安全提示 alert | CMP-066 | DEF-014 | Profile.vue:30-33 el-alert | 静态 | 8/0/0 | — | retain | BP-014/— |

> 八维检查明细（逐维度问题、状态、EV、关联）见 audit.json 的 checks；本表给出分布。

## 状态与交互（SCN）

| SCN | 前提 | 步骤 | 预期 | 状态 | EV | FND |
|---|---|---|---|---|---|---|
| SCN-022 个人中心查看与修改昵称 | 已登录考生 | 查看账号信息→输入新昵称保存→空昵称提交 | 保存成功后信息刷新；空昵称警告不提交 | passed | EV-209 | — |

## 本页迁移与回归

- **TASK-002** 影响实例：CMP-066（回归：['SCN-022']）
- **TASK-005** 影响实例：CMP-070（回归：['SCN-022']）
- **TASK-008** 影响实例：CMP-067（回归：['SCN-022']）
- **TASK-011** 影响实例：CMP-070（回归：['SCN-022']）
