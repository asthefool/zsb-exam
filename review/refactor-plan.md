# 系统重构计划（TASK-001..011）

> 模式 audit_plan：以下为可执行方案，未实施。任务详情（步骤/验收/回滚/风险）以 audit.json tasks 为准，本文给顺序、依赖与关键取舍。

## 目标结构（只动有问题的部分）

保持现有「routes → services → dao」分层与 Pinia/Axios 结构不变。改动集中在四个共享机制：

1. **数据检索正确性**（TASK-001）：DAO 层 LIKE 转义规范化；前端列表请求失败进入显式错误态，不再回落旧数据。
2. **展示层响应式与语义**（TASK-002/004）：布局断点体系（375/768/1280）；QuestionCard 改用表单控件语义，判分展示统一。
3. **状态所有权与同步**（TASK-005/006/007/008）：profile 归 store 统一持有；错题操作后以服务端返回为准同步列表；ExplainPanel 显式状态机；页面 error 态统一模式（error ref + 重试）。
4. **工程卫生与构建**（TASK-009/010）：.gitignore、常量统一、redirect 白名单；组件库按需引入/分包。

## 实施顺序

| TASK | 阶段 | 页/组件 | 文件/配置 | 实施步骤（摘要） | 依赖 | 负责人 | 验收SCN | 恢复 |
|---|---|---|---|---|---|---|---|---|
| TASK-001 | 1 重大 | PAGE-008 / DEF-015 | questionDao.js:26-45、QuestionManage.vue | 修 LIKE 转义→DAO 测试→前端搜索错误态 | — | 后端+前端 | SCN-024 | 还原 DAO 提交 |
| TASK-002 | 1 重大 | PAGE-001..007 / DEF-001/008/009/010/012 | StudentLayout、Home、Login/Register、WrongBook:137 | 导航折叠→断点→固定宽收缩→抽屉 min | — | 前端 | SCN-030 | 还原样式 |
| TASK-003 | 1 重大 | PAGE-004 / DEF-011 | Practice.vue:43-62 | prev() 跨页分支+禁用条件对齐 | — | 前端 | SCN-010 | 还原函数 |
| TASK-004 | 1 重大 | PAGE-003/004/005 / DEF-003/010 | QuestionCard.vue、Home.vue:60-68 | 选项语义化→judge 文案/高亮→入口卡键盘可达 | — | 前端 | SCN-031/009/038 | 还原组件 |
| TASK-005 | 2 共享 | PAGE-005/007/008 / DEF-011/012/014/015 | WrongBook、QuestionManage、Profile、Plan、Practice | 行内/load 同步→in-flight 守卫→请求时序号 | — | 前端 | SCN-014/033/016 | 还原处理函数 |
| TASK-006 | 2 共享 | DEF-001/006 | stores/user.js login()、StudentLayout | 登录后统一 fetchProfile | — | 前端 | SCN-001 | 还原 action |
| TASK-007 | 2 共享 | PAGE-005 / DEF-004 | ExplainPanel.vue | 显式状态机+错误码映射+失败横幅 | TASK-005(可并行) | 前端 | SCN-015/035/036 | 还原组件 |
| TASK-008 | 2 共享 | PAGE-003/006/007/008 / DEF-010/013/014/015 | 各页 onMounted/load | error ref+重试；subjects 失败不阻断 | — | 前端 | SCN-008/021 | 还原页面 |
| TASK-009 | 3 工程 | PRJ / DEF-005/006/008 | .gitignore、stores、request、Login | 忽略文件→常量统一→redirect 校验 | — | 前端 | SCN-001 | 还原提交 |
| TASK-010 | 3 工程 | PRJ / DEF-017 | main.js、vite.config.js | 按需引入或 manualChunks+产物对比 | TASK-002 后 | 前端 | SCN-032 | 还原引入 |
| TASK-011 | 3 补证 | PRJ | — | 慢网/真机/读屏/日期选择器补证 | TASK-002/004/005 | 测试+前端 | SCN-030/031/033 | 不适用 |

阶段说明：**阶段 1** 解决 P2 功能/体验缺陷（可独立交付）；**阶段 2** 修共享状态机制（TASK-005 是 TASK-007/011 的前置更好，但不强依赖）；**阶段 3** 工程与补证。旧调用点随各任务就地迁移，不引入双写。

## 关键取舍

- **不做**：不换框架、不引状态机库、不整站重写。QuestionCard 语义化用原生 radio/checkbox 即可，无需引入无障碍组件库。
- **后端只动必要处**：TASK-001 的 DAO 转义修复；TASK-005 顺带建议 repractice 返回最新 wrong_count/mastered（后端小改，非必须）。
- **移动端范围**：按 production_profile"移动可用为辅"，目标是无溢出、核心操作可用，不做像素级移动设计。
- **性能**：TASK-010 目标 gzip 显著下降即可，预算数值待产品确认（FND-012 以演示基线 <250KB gzip 为参考）。
- **估时**（假设单人前端+后端兼职，置信度低-中）：阶段 1 约 1.5-2.5 人日；阶段 2 约 1.5-2 人日；阶段 3 约 0.5-1 人日。仅供排期参考。
