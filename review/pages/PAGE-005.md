# PAGE-005 错题本

## 页面身份

- **PAGE**：PAGE-005　**路由**：`/wrong-book`
- **入口条件**：登录后进入
- **变体**：未掌握筛选；已掌握筛选；全部；详情抽屉；重练判分；空列表
- **源码**：web/src/views/student/WrongBook.vue
- **运行证据**：EV-206（详见 audit.json evidence）
- **基线**：本地 vite:5173 + express:3000（AI mock），2026-10-10

## 本页结论

列表/筛选/详情/重练/掌握/讲解全链路通过；列表同步（FND-006）、讲解状态机（FND-008）、抽屉宽度（FND-002）、防重入（FND-010）已修复（EV-232/234）。

## 全部组件（CMP）

| CMP | 父CMP | DEF | 定位 | 变体 | CHK(过/败/阻) | FND | 处置 | BP/TASK |
|---|---|---|---|---|---|---|---|---|
| CMP-040 考生端页壳实例 | — | DEF-001 | StudentLayout.vue:27 | active=/wrong-book | 8/0/0 | — | configure | BP-001/TASK-002,TASK-006 |
| CMP-041 筛选工具条 | CMP-040 | DEF-012 | WrongBook.vue:94-104 .filters | 默认 | 8/0/0 | — | retain | BP-012/— |
| CMP-042 科目筛选下拉 | CMP-041 | DEF-012 | WrongBook.vue:95 el-select @change=onFilterChange | clearable | 8/0/0 | — | retain | BP-012/— |
| CMP-043 掌握状态单选组 | CMP-041 | DEF-012 | WrongBook.vue:98-102 el-radio-group | 未掌握(默认)/已掌握/全部 | 8/0/0 | — | retain | BP-012/— |
| CMP-044 错题表格 | CMP-040 | DEF-012 | WrongBook.vue:106-125 el-table | 行数据等价类 | 8/0/0 | — | refactor | BP-012/TASK-005 |
| CMP-045 行按钮-查看/AI讲解 | CMP-044 | DEF-012 | WrongBook.vue:121 | 默认 | 8/0/0 | — | retain | BP-012/— |
| CMP-046 行按钮-标记掌握/取消 | CMP-044 | DEF-012 | WrongBook.vue:122 | 按 row.mastered 切换文案 | 8/0/0 | — | configure | BP-012/TASK-005,TASK-011 |
| CMP-047 分页器 | CMP-040 | DEF-012 | WrongBook.vue:127-134 el-pagination | 默认 | 8/0/0 | — | retain | BP-012/— |
| CMP-048 详情抽屉 | CMP-040 | DEF-012 | WrongBook.vue:137-157 el-drawer size=560px | 打开/加载中/已加载 | 8/0/0 | — | configure | BP-012/TASK-002 |
| CMP-049 详情描述区 | CMP-048 | DEF-012 | WrongBook.vue:140-143 el-descriptions | 默认 | 8/0/0 | — | retain | BP-012/— |
| CMP-050 QuestionCard 重练实例 | CMP-048 | DEF-003 | WrongBook.vue:147 :key=q-{id} | 未判分 | 8/0/0 | — | refactor | BP-003/TASK-004,TASK-005 |
| CMP-051 QuestionCard 判分结果实例(条件) | CMP-048 | DEF-003 | WrongBook.vue:150 :key=r-{id} | 判分后替换显示 | 8/0/0 | — | refactor | BP-003/TASK-004 |
| CMP-052 ExplainPanel AI 讲解实例 | CMP-048 | DEF-004 | WrongBook.vue:154 :key=exp-{id} | 缓存命中/生成中/失败 | 8/0/0 | — | refactor | BP-004/TASK-007 |

> 八维检查明细（逐维度问题、状态、EV、关联）见 audit.json 的 checks；本表给出分布。

## 状态与交互（SCN）

| SCN | 前提 | 步骤 | 预期 | 状态 | EV | FND |
|---|---|---|---|---|---|---|
| SCN-013 错题列表与筛选（未掌握/已掌握/全部） | 已登录考生；已有错题记录 | 进入错题本→切三种掌握状态筛选→翻页 | 列表与 total 与后端一致；筛选重置到第 1 页 | passed | EV-206 | — |
| SCN-014 错题详情+重练判分+答对自动标记掌握 | 已登录考生；存在未掌握错题 | 点查看/AI讲解打开抽屉→作答提交（先错后对）→答对后关闭抽屉看列表 | 判分正确；答对提示自动掌握；列表状态与详情一致 | passed | EV-232 | FND-006 |
| SCN-015 AI 讲解：缓存命中/生成/失败重试三态 | 已登录考生；mock AI 模式；错题详情打开 | 首次打开观察生成→关闭重开观察缓存→注入失败后点重试 | 生成有 loading 反馈；缓存命中标注"缓存"；失败有明确错误与重试入口 | passed | EV-234 | FND-008 |
| SCN-016 标记掌握/取消掌握双向切换 | 已登录考生；未掌握错题一行 | 点标记掌握并确认→切到已掌握筛选→点取消掌握并确认 | 两次状态切换成功且列表刷新一致 | passed | EV-206,EV-222 | — |
| SCN-017 错题本空态 | 已登录新考生；零错题 | 进入错题本 | 表格空态（暂无数据）；无 JS 报错 | passed | EV-206 | — |
| SCN-030 移动视口 375px 布局可用性 | 已登录考生 | 375×667 视口逐页查看→操作核心按钮 | 导航/筛选/核心操作无遮挡无横向溢出；表格与抽屉可用 | passed | EV-240,EV-229,EV-226,EV-224 | FND-002 |
| SCN-033 并发/乱序：快速切换筛选与连续提交 | 已登录考生 | 快速连续切筛选 3 次→快速双击提交按钮 | 最终展示与最后一次操作一致；不重复计分 | passed | EV-232 | — |
| SCN-034 离开返回：刷题中途切页再回来 | 已登录考生；已作答部分题 | 作答 2 题后切错题本→返回刷题页 | 列表重载；作答结果与后端一致（本地 results 重置符合预期） | passed | EV-218 | — |
| SCN-035 AI 生成失败重试（模拟上游不可用） | 已登录考生；AI 上游失败或限流 | 打开讲解观察失败态→点重试→计划页生成遇 50201/50202 | 失败提示明确含原因；重试可恢复；不落脏数据 | passed | EV-207 | — |
| SCN-036 限流：AI 接口超频返回 42901 | 已登录考生；AI_RATE_LIMIT_PER_MIN=5 | 连续快速点重新生成 6+ 次 | 超频收到"请求过于频繁"提示；界面可恢复 | passed | EV-207 | — |
| SCN-040 错题详情加载与筛选行为（不校验列表同步） | 已登录考生；有 6 条未掌握错题 | 按科目筛选高等数学→点查看/AI讲解打开抽屉→作答查看判分结果区 | 筛选结果全为该科目且计数正确；抽屉加载题目与描述；判分结果与解析展示正确 | passed | EV-225 | — |

## 本页迁移与回归

- **TASK-002** 影响实例：CMP-040, CMP-048（回归：['SCN-013', 'SCN-014', 'SCN-030', 'SCN-034', 'SCN-040']）
- **TASK-004** 影响实例：CMP-050, CMP-051（回归：['SCN-014', 'SCN-040']）
- **TASK-005** 影响实例：CMP-044, CMP-046, CMP-050（回归：['SCN-013', 'SCN-014', 'SCN-016', 'SCN-017', 'SCN-030', 'SCN-040']）
- **TASK-006** 影响实例：CMP-040（回归：['SCN-013', 'SCN-034']）
- **TASK-007** 影响实例：CMP-052（回归：['SCN-015', 'SCN-035', 'SCN-036']）
- **TASK-011** 影响实例：CMP-046（回归：['SCN-014', 'SCN-016']）
