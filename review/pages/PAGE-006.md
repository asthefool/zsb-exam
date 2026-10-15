# PAGE-006 智能复习计划

## 页面身份

- **PAGE**：PAGE-006　**路由**：`/plan`
- **入口条件**：登录后进入
- **变体**：无计划；有计划；生成中；打卡
- **源码**：web/src/views/student/Plan.vue
- **运行证据**：EV-208（详见 audit.json evidence）
- **基线**：本地 vite:5173 + express:3000（AI mock），2026-10-10

## 本页结论

生成/打卡/重生成确认链路通过；错误态与空态区分（FND-009）、防重入（FND-010）已修复；日期选择器面板交互已补证（EV-238）。

## 全部组件（CMP）

| CMP | 父CMP | DEF | 定位 | 变体 | CHK(过/败/阻) | FND | 处置 | BP/TASK |
|---|---|---|---|---|---|---|---|---|
| CMP-053 考生端页壳实例 | — | DEF-001 | StudentLayout.vue:27 | active=/plan | 8/0/0 | — | configure | BP-001/TASK-002,TASK-006 |
| CMP-054 生成表单卡片 | CMP-053 | DEF-013 | Plan.vue:3-37 el-card | 默认/已有计划 | 8/0/0 | — | retain | BP-013/— |
| CMP-055 AI 模式标签(条件) | CMP-054 | DEF-013 | Plan.vue:7-10 el-tag v-if=aiMode | llm/mock 两态 | 8/0/0 | — | retain | BP-013/— |
| CMP-056 考试日期选择器 | CMP-054 | DEF-013 | Plan.vue:14-21 el-date-picker | 含距离天数提示 | 8/0/0 | — | retain | BP-013/— |
| CMP-057 目标科目多选 | CMP-054 | DEF-013 | Plan.vue:25-27 el-select multiple | 空=全部科目 | 8/0/0 | — | retain | BP-013/— |
| CMP-058 每日时长输入 | CMP-054 | DEF-013 | Plan.vue:30 el-input-number 15-600 | 默认 60 | 8/0/0 | — | retain | BP-013/— |
| CMP-059 生成计划按钮 | CMP-054 | DEF-013 | Plan.vue:33 el-button[生成计划] | 已有计划时二次确认 | 8/0/0 | — | configure | BP-013/TASK-005,TASK-011 |
| CMP-060 当前计划卡片(条件) | CMP-053 | DEF-013 | Plan.vue:39-69 el-card v-if=hasPlan | 默认 | 8/0/0 | — | retain | BP-013/— |
| CMP-061 进度摘要+进度条 | CMP-060 | DEF-013 | Plan.vue:44-52 | 0/100 边界 | 8/0/0 | — | retain | BP-013/— |
| CMP-062 任务日期折叠面板 | CMP-060 | DEF-013 | Plan.vue:53-68 el-collapse | 今天自动展开 | 8/0/0 | — | retain | BP-013/— |
| CMP-063 任务行(数据等价类) | CMP-062 | DEF-013 | Plan.vue:61-66 .task-row | done/待打卡 两态 | 8/0/0 | — | retain | BP-013/— |
| CMP-064 打卡按钮 | CMP-063 | DEF-013 | Plan.vue:65 el-button[打卡完成] | loading 态 | 8/0/0 | — | retain | BP-013/— |
| CMP-065 无计划空态 | CMP-053 | DEF-013 | Plan.vue:71 el-empty v-else-if | 默认 | 8/0/0 | — | refactor | BP-013/TASK-008 |

> 八维检查明细（逐维度问题、状态、EV、关联）见 audit.json 的 checks；本表给出分布。

## 状态与交互（SCN）

| SCN | 前提 | 步骤 | 预期 | 状态 | EV | FND |
|---|---|---|---|---|---|---|
| SCN-018 生成复习计划（首次） | 已登录考生；无生效计划；mock AI | 选考试日期/科目/时长→点生成计划 | 生成成功；任务按日分组；今天展开；进度 0% | passed | EV-208 | — |
| SCN-019 任务打卡与进度更新 | 已登录考生；有生效计划 | 点某任务打卡完成→观察进度 | 任务置完成态；进度即时更新；重复打卡不重复计数 | passed | EV-208 | — |
| SCN-020 重新生成计划需确认并归档旧计划 | 已登录考生；已有计划与打卡记录 | 点生成计划→确认弹窗确定→取消路径各试一次 | 确认后新计划生效旧计划归档；取消无副作用 | passed | EV-208 | — |
| SCN-021 计划页空态 | 已登录新考生；无计划 | 进入计划页 | el-empty"还没有复习计划"显示 | passed | EV-208 | — |
| SCN-030 移动视口 375px 布局可用性 | 已登录考生 | 375×667 视口逐页查看→操作核心按钮 | 导航/筛选/核心操作无遮挡无横向溢出；表格与抽屉可用 | passed | EV-240,EV-229,EV-226,EV-224 | FND-002 |
| SCN-035 AI 生成失败重试（模拟上游不可用） | 已登录考生；AI 上游失败或限流 | 打开讲解观察失败态→点重试→计划页生成遇 50201/50202 | 失败提示明确含原因；重试可恢复；不落脏数据 | passed | EV-207 | — |

## 本页迁移与回归

- **TASK-002** 影响实例：CMP-053（回归：['SCN-021']）
- **TASK-005** 影响实例：CMP-059（回归：['SCN-018', 'SCN-020', 'SCN-035']）
- **TASK-006** 影响实例：CMP-053（回归：['SCN-021']）
- **TASK-008** 影响实例：CMP-065（回归：['SCN-021']）
- **TASK-011** 影响实例：CMP-059（回归：['SCN-018', 'SCN-020', 'SCN-035']）
