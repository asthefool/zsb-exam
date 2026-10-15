# PAGE-008 后台-题目管理

## 页面身份

- **PAGE**：PAGE-008　**路由**：`/admin/questions`
- **入口条件**：admin 登录进入；考生访问被路由守卫拦截
- **变体**：列表；新建对话框；编辑对话框；删除确认；搜索；空列表
- **源码**：web/src/views/admin/QuestionManage.vue
- **运行证据**：EV-211（详见 audit.json evidence）
- **基线**：本地 vite:5173 + express:3000（AI mock），2026-10-10

## 本页结论

CRUD/校验链/软删通过；关键词搜索（FND-001，SQL ESCAPE）与失败错误态、加载阻断（FND-009）已修复（EV-227/228）。

## 全部组件（CMP）

| CMP | 父CMP | DEF | 定位 | 变体 | CHK(过/败/阻) | FND | 处置 | BP/TASK |
|---|---|---|---|---|---|---|---|---|
| CMP-072 管理端页壳实例 | — | DEF-002 | AdminLayout.vue:21 el-container | active=/admin/questions | 8/0/0 | — | retain | BP-002/— |
| CMP-073 题目管理卡片头+新建按钮 | CMP-072 | DEF-015 | QuestionManage.vue:4-9 | 默认 | 8/0/0 | — | refactor | BP-015/TASK-008 |
| CMP-074 搜索工具条 | CMP-072 | DEF-015 | QuestionManage.vue:11-17 | 回车/清空触发 | 8/0/0 | — | refactor | BP-015/TASK-001 |
| CMP-075 题目表格 | CMP-072 | DEF-015 | QuestionManage.vue:19-45 el-table | 行数据等价类 | 8/0/0 | — | configure | BP-015/TASK-001 |
| CMP-076 行按钮-编辑 | CMP-075 | DEF-015 | QuestionManage.vue:41 | 默认 | 8/0/0 | — | retain | BP-015/— |
| CMP-077 行按钮-删除 | CMP-075 | DEF-015 | QuestionManage.vue:42 | 二次确认 | 8/0/0 | — | configure | BP-015/TASK-005,TASK-011 |
| CMP-078 分页器 | CMP-072 | DEF-015 | QuestionManage.vue:47-51 el-pagination | 默认 | 8/0/0 | — | retain | BP-015/— |
| CMP-079 题目编辑对话框 | CMP-072 | DEF-015 | QuestionManage.vue:54-111 el-dialog | 新建/编辑 两态 | 8/0/0 | — | retain | BP-015/— |
| CMP-080 对话框-科目选择 | CMP-079 | DEF-015 | QuestionManage.vue:57 el-select | 默认 | 8/0/0 | — | retain | BP-015/— |
| CMP-081 对话框-题型单选 | CMP-079 | DEF-015 | QuestionManage.vue:62 el-radio-group | 切换清空答案 | 8/0/0 | — | retain | BP-015/— |
| CMP-082 对话框-题干输入 | CMP-079 | DEF-015 | QuestionManage.vue:69 textarea | maxlength 500 | 8/0/0 | — | retain | BP-015/— |
| CMP-083 对话框-选项编辑器(条件) | CMP-079 | DEF-015 | QuestionManage.vue:71-83 | 非 judge 显示；增删选项 | 8/0/0 | — | retain | BP-015/— |
| CMP-084 对话框-正确答案输入 | CMP-079 | DEF-015 | QuestionManage.vue:84-95 | judge=radio；选择题=文本 | 8/0/0 | — | retain | BP-015/— |
| CMP-085 对话框-解析输入 | CMP-079 | DEF-015 | QuestionManage.vue:97 textarea | maxlength 500 | 8/0/0 | — | retain | BP-015/— |
| CMP-086 对话框-难度评分 | CMP-079 | DEF-015 | QuestionManage.vue:100 el-rate | 1-5 | 8/0/0 | — | retain | BP-015/— |
| CMP-087 对话框-状态开关 | CMP-079 | DEF-015 | QuestionManage.vue:104 el-switch | 启用/停用 | 8/0/0 | — | retain | BP-015/— |
| CMP-088 对话框-保存/取消按钮 | CMP-079 | DEF-015 | QuestionManage.vue:108-109 | 保存 loading 态 | 8/0/0 | — | configure | BP-015/TASK-005,TASK-011 |

> 八维检查明细（逐维度问题、状态、EV、关联）见 audit.json 的 checks；本表给出分布。

## 状态与交互（SCN）

| SCN | 前提 | 步骤 | 预期 | 状态 | EV | FND |
|---|---|---|---|---|---|---|
| SCN-023 管理端权限：考生访问 /admin 被拦截 | 考生登录；伪造 localStorage role=admin | 直接访问 /admin/questions→带伪造角色访问 | 路由守卫拦截回首页；绕过前端后 API 返回 40301 | passed | EV-210 | — |
| SCN-024 题目管理 CRUD 全流程 | admin 登录；题库有数据 | 新建题目（单选）→编辑该题改答案→删除该题→搜索关键词 | 创建/编辑/软删成功且列表刷新；删除有确认；考生端不再出现该题 | passed | EV-211 | — |
| SCN-025 题目对话框校验拦截非法输入 | admin 登录；打开新建对话框 | 空题干保存→单选设两个答案→答案字母不存在→judge 不选答案 | 各给明确校验提示；不发请求 | passed | EV-211 | — |

## 本页迁移与回归

- **TASK-001** 影响实例：CMP-074, CMP-075（回归：['SCN-024']）
- **TASK-005** 影响实例：CMP-077, CMP-088（回归：['SCN-024', 'SCN-025']）
- **TASK-008** 影响实例：CMP-073（回归：['SCN-024']）
- **TASK-011** 影响实例：CMP-077, CMP-088（回归：['SCN-024', 'SCN-025']）
