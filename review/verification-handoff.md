# 验收与交接

## 一、已执行验证台账（与计划分离）

| 检查/SCN | 命令或人工步骤 | 版本环境 | 实际结果 | EV | 未覆盖 |
|---|---|---|---|---|---|
| SCN-001/002/003/004/005/006 登录注册全链路 | 浏览器实测 + curl 注册撞名 | vite:5173/express:3000 | passed | EV-202/219 | — |
| SCN-007/008 首页概览与空态 | 浏览器实测（零数据/14 题数据） | 同上 | passed | EV-203 | — |
| SCN-009 判分三分支 | 浏览器作答单/多/判断 | 同上 | passed（judge 展示缺陷另计 FND-005） | EV-204 | — |
| SCN-010 翻页 | 跨页往返点击 | 同上 | **failed（FND-003）** | EV-204 | — |
| SCN-011/012 筛选与空态 | 切筛选/软删造空组合后恢复 | 同上 | passed | EV-204 | — |
| SCN-013/016/017 错题列表/掌握切换/空态 | 浏览器实测 + DB 核对 | 同上 | passed | EV-206/222 | 空账号变体以筛选空组合等价 |
| SCN-014 重练与自动掌握 | 抽屉内答对答错 | 同上 | **failed（FND-006）** | EV-206 | — |
| SCN-015/035/036 AI 讲解三态/失败/限流 | 连点生成触发 42901、首载失败 UI | 同上 | **failed（FND-008 部分）**/其余 passed | EV-207 | llm 模式未测（无 Key） |
| SCN-018/019/020/021 计划生成/打卡/重生成 | 浏览器实测 | 同上 | passed | EV-208 | exam_date 面板手选路径（自动化 fill 未生效，TASK-011） |
| SCN-022 个人中心 | 改昵称/空值拦截 | 同上 | passed | EV-209 | — |
| SCN-023/026/028 权限与用户管理 | 伪造 role、禁用/启用、被禁登录 | 浏览器+curl | passed（后端 40301/40302 生效） | EV-210/213/219 | — |
| SCN-024/025 题库 CRUD 与校验 | 新建/编辑/删除/校验四分支 | 浏览器实测 | passed（搜索分支 **failed FND-001**） | EV-211/212 | — |
| SCN-027 令牌失效 | 篡改 token 触发请求 | 浏览器实测 | passed | EV-214 | — |
| SCN-029 未知路径 | 直达未知路径两态 | 浏览器实测 | passed | EV-215 | — |
| SCN-030 移动端 375px | setViewportSize 逐页测量+截图 | 浏览器实测 | **failed（FND-002）** | EV-201/216/224 | 真机分支待 TASK-011 |
| SCN-031 键盘可达性 | DOM 探测 tabindex/role + 键盘尝试 | 浏览器实测 | **failed（FND-004）** | EV-205 | 读屏器待 TASK-011 |
| SCN-032 生产构建 | `cd web && npm run build` | vite 5.4.8 | passed（默认 TEMP 遇 esbuild 文件锁，改 TEMP 后成功） | EV-217/223 | — |
| SCN-033 并发/双击 | 未执行 | — | **blocked**（无慢网注入；FND-010 待补证） | — | TASK-011 |
| SCN-034 离开返回 | 作答后切页返回 | 浏览器实测 | passed（本地态按设计重置） | EV-218 | — |
| SCN-037/038/040/042 细分原子场景 | 浏览器实测 | 浏览器实测 | passed | EV-202/203/225 | — |

补充证据：EV-221（排除测试环境过渡冻结假象：弹窗残留/点击超时/重复请求探针均为环境假象，几何测量否定"错误提示遮挡按钮"）。

## 二、发布门槛（GATE）

| GATE | 目标 | 状态 | EV/原因 |
|---|---|---|---|
| GATE-001 核心旅程 | 注册登录/刷题/错题/计划/管理端可用 | **passed** | EV-202/204/206/208/211/213 |
| GATE-002 权限与对象级授权 | 服务端强制 | **passed** | EV-210/213/214 |
| GATE-003 关键可访问性 | 核心任务可仅键盘完成 | **failed** | FND-004 |
| GATE-004 数据一致性与状态同步 | 提示与列表一致 | **failed** | FND-006 |
| GATE-005 生产构建 | 可复现构建 | **passed** | EV-217/223（本机 TEMP 环境注记） |
| GATE-006 性能预算 | 首屏包体 | **failed** | FND-012（预算未定义+1.06MB） |
| GATE-007 错误可见性 | 失败可感知可重试 | **failed** | FND-009 |
| GATE-008 移动端可用性 | 375px 可用 | **failed** | FND-002 |
| GATE-009 发布与回滚 | Nginx/pm2 实操 | **blocked** | Windows 无此环境；README 配置经审查无误 |

## 三、单列事项

- **未解决 P0/P1**：无。4 项 P2（FND-001/002/003/004）建议在交付/答辩前修复。
- **待验证风险**：FND-010（probable，TASK-011 慢网补证）。
- **未知关键规则**：性能预算数值、管理端窄屏承诺、AI 讲解自动配额成本——三项产品决定。
- **后端/平台依赖**：TASK-001（DAO）；TASK-005 可选后端字段；GATE-009 需 Linux+Nginx+pm2 环境。
- **真机/辅助技术缺口**：SCN-030 真机、SCN-031 读屏分支（TASK-011）。

## 四、交接说明

**运行方式**（已在本机验证）：
1. `mysql -u root -p --default-character-set=utf8mb4 < server/sql/init.sql`（本机已有 zsb_exam 库可复用）
2. `cd server && cp .env.example .env`（配置 DB_*/JWT_SECRET）`&& npm install && npm run init:admin && npm run import:questions`
3. `npm run dev`（:3000，健康检查 /api/health）
4. `cd ../web && npm install && npm run dev`（:5173）
5. 构建：`npm run build`（若遇 esbuild "Access is denied"，设置 TEMP 到可写目录后重试——本机已复现，属环境文件锁）

**数据/状态/权限契约**：JWT Bearer，40101=未登录/过期（前端清凭据跳 /login?redirect）、40301=权限不足、40302=已禁用、40901=冲突、42901=限流、50201/50202=AI 上游/未配置；错题接口全部按 token user_id 取数；题目删除为软删（status=0+deleted_at）。

**组件实例索引**：audit.json instances（94 条，含 parent 树）；每页报告 pages/PAGE-xxx.md 有嵌套表；蓝图与处置 components.md。

**TASK 顺序**：TASK-001..004（阶段 1，P2）→ TASK-005..008（阶段 2，共享机制）→ TASK-009..011（阶段 3，工程与补证）。详见 refactor-plan.md。

**回归命令/步骤**：npm run build（SCN-032）；`cd server && npm run smoke`；按 verification-handoff 第一节场景逐条人工走查（重点 SCN-009/010/014/015/024/030/031）。

**恢复条件/回滚**：各 TASK 独立提交可单独 revert；本审查未改动任何业务代码（仅新增 review/ 目录）；测试数据说明见下。

**测试数据说明（可清理）**：审查在本机 zsb_exam 库新增了账号 `audit_admin`（管理员）、`audit_stu_ympl2r`（考生，含作答/错题/计划数据）、一道已软删的"审查测试题"记录（id 51，考生端不可见），以及若干 AI 讲解缓存记录。可安全删除或保留作演示。

**已知限制**：llm 模式、真机、读屏器、Nginx/pm2 未实测（逐项标注）；SCN-033 blocked；SCN-021 的 exam_date 面板手选路径未覆盖。

**progress 与下一步**：见 audit.json progress（当前批次已完成；下一步 = 用户授权后按 TASK-001 起实施，或先执行 TASK-011 补证）。


---

# 修复后验收状态（2026-10-11 更新）

## 门槛复评

| GATE | 修复前 | 修复后 | 证据 |
|---|---|---|---|
| GATE-001 核心旅程 | passed | **passed** | 各旅程回归通过 |
| GATE-002 权限边界 | passed | **passed** | 未改动鉴权，原证据保持 |
| GATE-003 关键可访问性 | failed | **blocked** | 结构修复完成（EV-231）；键盘+读屏端到端人工走查待执行 |
| GATE-004 数据一致性 | failed | **passed** | EV-232 |
| GATE-005 生产构建 | passed | **passed** | EV-237（含 preview 冒烟） |
| GATE-006 性能预算 | failed | **passed** | EV-237 主包 8.7KB（原 1,057KB） |
| GATE-007 错误可见性 | failed | **passed** | EV-235 |
| GATE-008 移动端可用性 | failed | **passed** | EV-240/229/226 |
| GATE-009 发布与回滚 | blocked | **blocked** | 仍缺 Linux+Nginx+pm2 环境 |

## 修复后回归执行记录

| 回归项 | 方法 | 结果 |
|---|---|---|
| 搜索（正常/特殊字符/失败态） | curl + 浏览器 + 断后端 | 通过（EV-227/228） |
| 移动端 375px 六页 + 抽屉 | setViewportSize 逐页测量 + 截图 | 通过（EV-240/226） |
| 翻页跨页往返 | 浏览器操作序列 | 通过（EV-230） |
| 三题型判分 + judge 展示 + 选项语义 | 浏览器 + DOM 探测 | 通过（EV-231） |
| 重练同步 + 双击防重入 + 筛选时序 | 浏览器 + 请求计数 | 通过（EV-232） |
| 昵称/讲解状态机/四页错误态 | 浏览器（含断后端） | 通过（EV-233/234/235） |
| redirect 白名单 | 浏览器双用例 | 通过（EV-236） |
| 构建分包 + preview 冒烟 | npm run build + vite preview | 通过（EV-237） |
| 日期选择器 + 带日期生成 | 浏览器面板交互 | 通过（EV-238） |
| 管理端创建/删除（新守卫） | 浏览器 | 通过（EV-239） |

## 剩余人工补证清单（TASK-011）

1. **键盘端到端**：仅键盘完成登录→作答→提交（选项已是原生 radio/checkbox，预期可通过；本自动化环境无法驱动按键默认动作）。完成后将 SCN-031、TASK-004、GATE-003 转绿，FND-004 转 resolved。
2. **读屏器走查**：NVDA/VoiceOver 朗读题干、选项、选中态、判分结果。
3. **真机 375px**：iOS/Android 各一页目测（浏览器模拟已通过）。
4. **发布实操**（GATE-009）：Linux + Nginx + pm2 按 README 部署冒烟。

## 测试数据清理（可选）

本机 zsb_exam 库含审查账号 `audit_admin`（管理员）、`audit_stu_ympl2r`（考生及作答/错题/计划/AI 缓存数据）、软删题目记录（"审查测试题" id 51、"回归临时题" id 52）。删除 SQL 备查：

    DELETE FROM users WHERE username IN ('audit_admin','audit_stu_ympl2r');  -- 级联/关联记录按外键处理
    DELETE FROM questions WHERE id IN (51,52);

## 交接更新

- 修复涉及文件：`server/src/dao/questionDao.js`、`web/src/{components/QuestionCard.vue,components/ExplainPanel.vue,layout/StudentLayout.vue,views/student/{Home,Login,Register,Practice,WrongBook,Plan,Profile}.vue,views/admin/{QuestionManage,UserManage}.vue,stores/user.js,api/request.js,vite.config.js}`、新增 `web/.gitignore`（项目根）。
- 构建注意：本机 esbuild 删除 %TEMP% 临时文件可能被安全软件锁定，`TEMP=<可写目录> npm run build` 可复现成功（EV-217/237）。
- 结论与 audit.json / coverage.md 一致：schema_valid=true、plan_complete=true；audit_coverage_closed=false 仅因 SCN-031 人工键盘走查未执行。
