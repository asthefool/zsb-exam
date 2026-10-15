# zsb-exam 专升本智能备考系统 —— 前端全面审查总报告

> 审查模式：audit_plan → **implement（逐条修复已实施并复验）**　深度：full（逐页逐组件）　日期：2026-10-10 / 修复 2026-10-10-11
> 台账：[audit.json](./audit.json)　覆盖索引：[coverage.md](./coverage.md)　每页报告：[pages/](./pages/)　问题详单：[findings.md](./findings.md)　重构计划：[refactor-plan.md](./refactor-plan.md)　验收交接：[verification-handoff.md](./verification-handoff.md)

## 〇、修复实施结果（2026-10-11 更新）

**12 项问题全部处置：11 项 resolved（已复验），1 项 fixed_unverified（FND-004 结构修复已验证，键盘/读屏端到端待人工走查）。** TASK-001..010 全部实施并 verified；TASK-011 本环境可行项完成，真机/读屏/人工键盘走查 blocked。

| 原问题 | 修复 | 复验结果 |
|---|---|---|
| FND-001 搜索 500 | LIKE 转义符改 `\|` + 搜索失败错误态 | 极限→1 条、`%`→0 条、`_`→2 条精确；失败显示"题目列表加载失败/重新加载" |
| FND-002 移动端溢出 | 导航自动折叠+断点+固定宽收缩+抽屉 min | 375px 全站 scrollWidth==clientWidth，截图对比明显改善 |
| FND-003 上一题死按钮 | prev() 跨页回退 | 第 2 页可回第 1 页末题，逐题递减正常 |
| FND-004 选项不可键盘操作 | 原生 radio/checkbox + label + 焦点环；入口卡 router-link | DOM 语义实测通过；**键盘端到端待人工**（自动化无法驱动按键默认动作） |
| FND-005 judge 展示 true | 文案映射"正确（√）" + 正确项统一高亮 | 判分显示"正确答案：正确（√）"，正确项带 right 高亮 |
| FND-006 列表不同步 | 答对后 load() 同步 + masteredSynced 降级如实提示 | 行即时移出未掌握筛选，提示与列表一致 |
| FND-007 昵称"同学" | StudentLayout 挂载确保 profile | 登录直达 /plan 显示真实昵称 |
| FND-008 讲解状态机 | 显式 loading/success/failed + 错误码映射 + 失败横幅 | 状态序列无错误闪现；限流横幅显示"请求过于频繁"并保留旧内容 |
| FND-009 页面错误态 | 四页 error+重试；计划失败与空态区分 | 断后端四页各自错误态+重新加载，恢复后正常 |
| FND-010 防重入 | 入口级忙碌守卫 + 请求时序号 | 双击+双确认仅 1 次 PATCH；快速三连切筛选终态正确 |
| FND-011 工程卫生 | .gitignore + 常量统一 + redirect 白名单 + catch | `//evil.com` 回落 `/`，合法 redirect 保留 |
| FND-012 主包 1.06MB | manualChunks 分包 | 主包 **8.7KB**（原 1,057KB）；element-plus 917KB / vendor 159KB 独立缓存；构建产物冒烟通过 |

**仍未闭环（如实保留）**：① 键盘+读屏端到端人工走查（GATE-003、SCN-031、TASK-004→verified）；② 真机 375px 复核；③ 发布实操（Nginx/pm2，GATE-009）；④ llm 模式联调（无 Key）。详见 [verification-handoff.md](./verification-handoff.md)。

## 一、范围与基线

| 项 | 内容 |
|---|---|
| 项目 | zsb-exam（web/ Vue3 SPA + server/ Express + MySQL8），毕业设计「刷题→错题→计划」闭环系统 |
| 代码基线 | `C:/Users/ASUS/Desktop/my-work/毕设/zsb-exam` 工作树（无 VCS）；审查快照 2026-10-10，修复实施 2026-10-10/11 |
| 运行基线 | 本地 vite dev(:5173) + express(:3000) + MySQL 8.0.43(zsb_exam)，AI mock 模式；构建产物经 vite preview(:4173) 冒烟 |
| 访问能力 | source_runtime：源码通读（web 18 文件 + server 契约相关 12 文件）+ 浏览器逐页实测 + API/curl/DB 核验 + 生产构建 |
| 发现渠道 | 路由表、18 个源文件、README 功能清单/AC1-AC9、启发式脚本（reconciled） |
| 验收基线 | README 功能清单 + 代码注释 AC1-AC9（无独立需求文档，见假设） |
| 生产画像 | 专升本考生 + 管理员；单租户 JWT；演示规模；桌面为主、移动可用为辅；Nginx + pm2 发布 |
| 排除项 | 后端内部实现（仅契约相关）、llm 真实模式（无 Key）、真机/读屏器实测、Nginx/pm2 实操（逐项注明） |

## 二、核心判断

**1）已知范围是否发现并核对？** 是。10 路由页面 / 17 组件定义 / 94 组件实例全部登记核对（reconciled），无隐藏入口。

**2）页面、实例和场景是否已验证？** 40 场景：**39 通过、1 阻塞**（SCN-031 键盘端到端待人工）。798 项检查：**796 通过、2 不适用**（管理端窄屏不在支持范围）。

**3）方案是否覆盖全部实例和问题？** 是。17/17 蓝图、94/94 实例处置、12/12 问题有任务；plan_complete=true。修复后处置分布：56 retain / 21 configure / 17 refactor 已全部实施（retain 无需改动）。

**4）发布条件哪些满足、哪些不满足？** 门槛 9 项：**7 项满足**；GATE-003（可访问性人工走查）与 GATE-009（发布实操）blocked。产品本体已达到良好交付状态；完成两项人工补证后可声明验收通过。

### 分母与状态（修复后）

| 实体 | 分母 | 状态 |
|---|---|---|
| PAGE | 10 | 全部 in_scope 且验证 |
| DEF / CMP | 17 / 94 | 蓝图与处置全覆盖，修复已实施 |
| SCN | 40 | 39 passed / 1 blocked（SCN-031 人工项） |
| CHK | 798 | 796 passed / 2 n/a |
| FND | 12 | **11 resolved / 1 fixed_unverified（FND-004）** |
| TASK | 11 | 9 verified / 1 implemented（TASK-004）/ 1 blocked（TASK-011 人工项） |
| GATE | 9 | 7 passed / 2 blocked |

### 问题总表（修复后状态）

| 根因/问题 | 影响 | 优先级/置信度 | 状态 |
|---|---|---|---|
| FND-001 搜索 SQL ESCAPE 错误 | 管理员无法检索题库 | P2 / confirmed | ✅ resolved |
| FND-002 移动端全站溢出 | 375px 排版破碎 | P2 / confirmed | ✅ resolved |
| FND-003 上一题跨页死按钮 | 翻页单向 | P2 / confirmed | ✅ resolved |
| FND-004 选项/入口卡键盘不可达 | 键盘读屏用户无法作答 | P2 / confirmed | 🔶 fixed_unverified（人工键盘走查待补） |
| FND-005 judge 显示 true/无高亮 | 复盘费解 | P3 | ✅ resolved |
| FND-006 重练后列表不同步 | 状态矛盾 | P3 | ✅ resolved |
| FND-007 昵称兜底"同学" | 称呼错误 | P3 | ✅ resolved |
| FND-008 讲解状态机缺口 | 失败闪现/原因不分 | P3 | ✅ resolved |
| FND-009 页面级错误态缺失 | 断网误显空态 | P3 | ✅ resolved |
| FND-010 防重入缺失 | 双击重复请求风险 | P3 / confirmed | ✅ resolved |
| FND-011 工程卫生 | 密钥泄露隐患等 | P3 | ✅ resolved |
| FND-012 主包 1.06MB | 弱网首开慢 | P3 | ✅ resolved（主包 8.7KB） |

**保持不变的可靠实现**（修复中未触碰）：后端鉴权回查、属主 404 防探测、错误码体系、AI 分桶限流、错题详情不泄答案、判分归一化、软删保链路、管理端双重防护。

## 三、重大事项单列

- **人工补证清单（TASK-011 剩余）**：真机 375px 复核、读屏器走查、键盘端到端（完成后 SCN-031/TASK-004/GATE-003 可转绿）。
- **环境限制**：llm 模式（无 Key）、Nginx/pm2 实操（GATE-009）；本机 esbuild 需可写 TEMP（环境文件锁）。
- **产品决定待定**：总下载量优化（当前全量引入分包，可选按需引入）；管理端窄屏承诺；AI 讲解自动配额成本。
- **测试数据**：`audit_admin` / `audit_stu_ympl2r` 及其作答记录、软删的"审查测试题/回归临时题"记录留在本机 zsb_exam 库，可清理。

## 四、文件索引

| 文件 | 内容 |
|---|---|
| [audit.json](./audit.json) | 机器可查事实台账（审查+修复全记录） |
| [coverage.md](./coverage.md) | 覆盖索引（脚本生成） |
| [pages/](./pages/) | 每页组件树、八维分布、场景与迁移 |
| [findings.md](./findings.md) | 12 项问题详单（含修复与复验） |
| [components.md](./components.md) | 17 蓝图与 94 实例处置 |
| [refactor-plan.md](./refactor-plan.md) | TASK-001..011 计划与实施状态 |
| [verification-handoff.md](./verification-handoff.md) | 实测台账、门槛、交接与恢复 |
| [evidence/](./evidence/) | 移动端修复前后截图 |
