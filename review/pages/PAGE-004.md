# PAGE-004 题库刷题

## 页面身份

- **PAGE**：PAGE-004　**路由**：`/practice`
- **入口条件**：登录后进入
- **变体**：单选/多选/判断；跨页翻页；筛选切换；空题库
- **源码**：web/src/views/student/Practice.vue
- **运行证据**：EV-204（详见 audit.json evidence）
- **基线**：本地 vite:5173 + express:3000（AI mock），2026-10-10

## 本页结论

判分三分支、筛选重置、跨页往返均通过；原"上一题"死按钮（FND-003）、选项语义（FND-004）、judge 展示（FND-005）已修复（EV-230/231）。

## 全部组件（CMP）

| CMP | 父CMP | DEF | 定位 | 变体 | CHK(过/败/阻) | FND | 处置 | BP/TASK |
|---|---|---|---|---|---|---|---|---|
| CMP-030 考生端页壳实例 | — | DEF-001 | StudentLayout.vue:27 | active=/practice | 8/0/0 | — | configure | BP-001/TASK-002,TASK-006 |
| CMP-031 筛选工具条 | CMP-030 | DEF-011 | Practice.vue:85-95 .filters | 默认 | 8/0/0 | — | retain | BP-011/— |
| CMP-032 科目筛选下拉 | CMP-031 | DEF-011 | Practice.vue:86 el-select @change=load() | clearable | 8/0/0 | — | configure | BP-011/TASK-005 |
| CMP-033 题型筛选下拉 | CMP-031 | DEF-011 | Practice.vue:89 el-select | single/multiple/judge | 8/0/0 | — | configure | BP-011/TASK-005 |
| CMP-034 题目计数文本 | CMP-031 | DEF-011 | Practice.vue:94 .count | 默认 | 8/0/0 | — | retain | BP-011/— |
| CMP-035 QuestionCard 答题实例 | CMP-030 | DEF-003 | Practice.vue:99 :key=practice-{id} | 单选/多选/判断 三分支 | 8/0/0 | — | refactor | BP-003/TASK-004 |
| CMP-036 翻页操作条 | CMP-030 | DEF-011 | Practice.vue:100-106 .actions | 首页/中间页/末页 | 8/0/0 | — | refactor | BP-011/TASK-003 |
| CMP-037 上一题按钮 | CMP-036 | DEF-011 | Practice.vue:103 el-button[上一题] | page=1&idx=0 禁用 | 8/0/0 | — | refactor | BP-011/TASK-003 |
| CMP-038 下一题按钮 | CMP-036 | DEF-011 | Practice.vue:104 el-button[下一题] | 未作答禁用 | 8/0/0 | — | retain | BP-011/— |
| CMP-039 空题库提示(条件) | CMP-030 | DEF-011 | Practice.vue:108 el-empty v-else-if | 筛选无结果 | 8/0/0 | — | retain | BP-011/— |

> 八维检查明细（逐维度问题、状态、EV、关联）见 audit.json 的 checks；本表给出分布。

## 状态与交互（SCN）

| SCN | 前提 | 步骤 | 预期 | 状态 | EV | FND |
|---|---|---|---|---|---|---|
| SCN-009 刷题作答判分：单选/多选/判断各答一题 | 已登录考生；题库含三种题型 | 选科目筛选→作答单选提交→作答多选提交→作答判断提交 | 判分结果与答案一致；正确答案与解析展示；下一题解锁 | passed | EV-204 | — |
| SCN-010 刷题翻页：末题跳下一页且上一题行为正确 | 已登录考生；题目数 >10 | 作答至本页末题→点下一题跨页→在新页 idx=0 点上一题 | 跨页后位置与计数正确；上一题按钮状态与行为一致（禁用或可回退） | passed | EV-230 | FND-003 |
| SCN-011 刷题筛选切换后判分状态不残留 | 已登录考生；两科目均有题 | 作答 A 科第一题（判分）→切到 B 科 | 切筛后回到第 1 题未作答态；旧判分不锁定新题 | passed | EV-204 | — |
| SCN-012 刷题空态：筛选无题显示空提示 | 已登录考生；某筛选组合无题 | 选择无题组合 | el-empty"暂无题目"显示；无报错 | passed | EV-204 | — |
| SCN-030 移动视口 375px 布局可用性 | 已登录考生 | 375×667 视口逐页查看→操作核心按钮 | 导航/筛选/核心操作无遮挡无横向溢出；表格与抽屉可用 | passed | EV-240,EV-229,EV-226,EV-224 | FND-002 |
| SCN-031 键盘可达性：Tab 遍历登录与答题控件 | 未登录（登录）/已登录（答题） | 仅键盘完成登录→仅键盘选择选项并提交 | 控件可聚焦可激活；焦点顺序合理；选项可键盘选择 | blocked | EV-231 | FND-004 |
| SCN-033 并发/乱序：快速切换筛选与连续提交 | 已登录考生 | 快速连续切筛选 3 次→快速双击提交按钮 | 最终展示与最后一次操作一致；不重复计分 | passed | EV-232 | — |
| SCN-034 离开返回：刷题中途切页再回来 | 已登录考生；已作答部分题 | 作答 2 题后切错题本→返回刷题页 | 列表重载；作答结果与后端一致（本地 results 重置符合预期） | passed | EV-218 | — |
| SCN-042 考生端页壳导航与刷题翻页控件状态（桌面） | 已登录考生；题目数 > 10 | 点击菜单在刷题/错题本间切换→观察翻页条在首页/中间页/末页三态 | 菜单 active 高亮与内容路由一致；翻页条按钮禁用态与位置一致（跨页回退缺陷单列 FND-003） | passed | EV-225 | — |

## 本页迁移与回归

- **TASK-002** 影响实例：CMP-030（回归：['SCN-030', 'SCN-042']）
- **TASK-003** 影响实例：CMP-036, CMP-037（回归：['SCN-009', 'SCN-010', 'SCN-042']）
- **TASK-004** 影响实例：CMP-035（回归：['SCN-009', 'SCN-010', 'SCN-011', 'SCN-031', 'SCN-033', 'SCN-034']）
- **TASK-005** 影响实例：CMP-032, CMP-033（回归：['SCN-011', 'SCN-033']）
- **TASK-006** 影响实例：CMP-030（回归：['SCN-030', 'SCN-042']）
