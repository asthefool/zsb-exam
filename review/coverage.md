# 前端审查覆盖索引

项目：zsb-exam 专升本智能备考系统

目标：C:/Users/ASUS/Desktop/my-work/毕设/zsb-exam（web/ 前端 SPA + server/ Express API）

访问范围：source_runtime；发现状态：reconciled

> 本文件由台账生成。结构校验不验证证据真实性，也不等于产品认证。

## 覆盖结论

- schema_valid: True
- audit_coverage_closed: False
- plan_complete: True
- production_gates_satisfied: False

## 分母与状态

~~~json
{
  "pages_in_scope": 10,
  "pages_excluded": 0,
  "definitions": 17,
  "instances_in_scope": 94,
  "checks": {
    "not_applicable": 2,
    "passed": 796
  },
  "scenarios": {
    "blocked": 1,
    "passed": 39
  },
  "findings": {
    "P2": 4,
    "P3": 8
  },
  "component_plans": 94,
  "tasks": 11
}
~~~

## 页面与组件实例

| 页面 | 路由 | 组件实例 | 已通过 / 失败 / 阻塞 / 未检查 / 不适用 |
|---|---|---|---|
| PAGE-001 登录 | /login | 7 | 60 / 0 / 0 / 0 / 0 |
| PAGE-002 注册 | /register | 9 | 76 / 0 / 0 / 0 / 0 |
| PAGE-003 首页-学习概览 | / | 13 | 108 / 0 / 0 / 0 / 0 |
| PAGE-004 题库刷题 | /practice | 10 | 84 / 0 / 0 / 0 / 0 |
| PAGE-005 错题本 | /wrong-book | 13 | 108 / 0 / 0 / 0 / 0 |
| PAGE-006 智能复习计划 | /plan | 13 | 108 / 0 / 0 / 0 / 0 |
| PAGE-007 个人中心 | /profile | 6 | 52 / 0 / 0 / 0 / 0 |
| PAGE-008 后台-题目管理 | /admin/questions | 17 | 139 / 0 / 0 / 0 / 1 |
| PAGE-009 后台-用户管理 | /admin/users | 5 | 43 / 0 / 0 / 0 / 1 |
| PAGE-010 未知路径重定向 | /:pathMatch(.*)* | 1 | 12 / 0 / 0 / 0 / 0 |

## 组件处置

| 实例 | 蓝图 | 处置 | 任务 | 理由 |
|---|---|---|---|---|
| CMP-001 | BP-008 | retain |  | 登录页容器 login-wrap：登录/注册互跳、校验三分支、错误凭据与 redirect 回跳已实测（EV-202），未发现缺陷证据，保留现实现 |
| CMP-002 | BP-008 | configure | TASK-002 | 移动端 400px 固定宽溢出（登录/注册互跳、校验三分支、错误凭据与 redirect 回跳已实测（EV-202）） |
| CMP-003 | BP-008 | retain |  | 登录表单：登录/注册互跳、校验三分支、错误凭据与 redirect 回跳已实测（EV-202），未发现缺陷证据，保留现实现 |
| CMP-004 | BP-008 | retain |  | 用户名输入：登录/注册互跳、校验三分支、错误凭据与 redirect 回跳已实测（EV-202），未发现缺陷证据，保留现实现 |
| CMP-005 | BP-008 | retain |  | 密码输入：登录/注册互跳、校验三分支、错误凭据与 redirect 回跳已实测（EV-202），未发现缺陷证据，保留现实现 |
| CMP-006 | BP-008 | configure | TASK-009 | redirect 未校验、submit 无 catch（登录/注册互跳、校验三分支、错误凭据与 redirect 回跳已实测（EV-202）） |
| CMP-007 | BP-008 | retain |  | 注册引导链接：登录/注册互跳、校验三分支、错误凭据与 redirect 回跳已实测（EV-202），未发现缺陷证据，保留现实现 |
| CMP-008 | BP-009 | retain |  | 注册页容器：注册校验与成功路径已实测（EV-202），未发现缺陷证据，保留现实现 |
| CMP-009 | BP-009 | configure | TASK-002 | 移动端 400px 固定宽溢出（注册校验与成功路径已实测（EV-202）） |
| CMP-010 | BP-009 | retain |  | 注册表单：注册校验与成功路径已实测（EV-202），未发现缺陷证据，保留现实现 |
| CMP-011 | BP-009 | retain |  | 用户名输入：注册校验与成功路径已实测（EV-202），未发现缺陷证据，保留现实现 |
| CMP-012 | BP-009 | retain |  | 昵称输入(可选)：注册校验与成功路径已实测（EV-202），未发现缺陷证据，保留现实现 |
| CMP-013 | BP-009 | retain |  | 密码输入：注册校验与成功路径已实测（EV-202），未发现缺陷证据，保留现实现 |
| CMP-014 | BP-009 | retain |  | 确认密码输入：注册校验与成功路径已实测（EV-202），未发现缺陷证据，保留现实现 |
| CMP-015 | BP-009 | configure | TASK-009 | submit 无 catch（unhandled rejection）（注册校验与成功路径已实测（EV-202）） |
| CMP-016 | BP-009 | retain |  | 去登录链接：注册校验与成功路径已实测（EV-202），未发现缺陷证据，保留现实现 |
| CMP-017 | BP-001 | configure | TASK-002, TASK-006 | 导航不折叠致全站移动端溢出；昵称依赖他页拉取（零数据/有数据概览、今日任务条件渲染已实测（EV-203）） |
| CMP-018 | BP-001 | configure | TASK-006 | 昵称来源依赖他页 fetchProfile（零数据/有数据概览、今日任务条件渲染已实测（EV-203）） |
| CMP-019 | BP-010 | refactor | TASK-008 | 请求失败落入空/旧数据无错误态（零数据/有数据概览、今日任务条件渲染已实测（EV-203）） |
| CMP-020 | BP-010 | configure | TASK-002 | 移动端列宽挤压文字竖排（零数据/有数据概览、今日任务条件渲染已实测（EV-203）） |
| CMP-021 | BP-010 | configure | TASK-002 | 同统计行移动端挤压（零数据/有数据概览、今日任务条件渲染已实测（EV-203）） |
| CMP-022 | BP-010 | retain |  | 条件提示逻辑与 plan_progress===null 口径正确（零数据/有数据概览、今日任务条件渲染已实测（EV-203）） |
| CMP-023 | BP-010 | retain |  | 条件渲染与任务数据正确（零数据/有数据概览、今日任务条件渲染已实测（EV-203）） |
| CMP-024 | BP-010 | retain |  | done 态删除线与标签正确（零数据/有数据概览、今日任务条件渲染已实测（EV-203）） |
| CMP-025 | BP-010 | refactor | TASK-002, TASK-004 | 入口卡键盘不可达且移动端竖排截断（零数据/有数据概览、今日任务条件渲染已实测（EV-203）） |
| CMP-026 | BP-010 | refactor | TASK-004 | el-card @click 无键盘可达（零数据/有数据概览、今日任务条件渲染已实测（EV-203）） |
| CMP-027 | BP-010 | refactor | TASK-004 | 同上（零数据/有数据概览、今日任务条件渲染已实测（EV-203）） |
| CMP-028 | BP-010 | refactor | TASK-004 | 同上（零数据/有数据概览、今日任务条件渲染已实测（EV-203）） |
| CMP-029 | BP-010 | refactor | TASK-004 | 同上（零数据/有数据概览、今日任务条件渲染已实测（EV-203）） |
| CMP-030 | BP-001 | configure | TASK-002, TASK-006 | 同页壳移动端溢出与昵称问题（判分三分支、筛选重置、跨页前进、空态已实测（EV-204）） |
| CMP-031 | BP-011 | retain |  | 筛选触发 load 与清空行为正确（判分三分支、筛选重置、跨页前进、空态已实测（EV-204）） |
| CMP-032 | BP-011 | configure | TASK-005 | load() 无请求时序守卫，快速切换有乱序风险（判分三分支、筛选重置、跨页前进、空态已实测（EV-204）） |
| CMP-033 | BP-011 | configure | TASK-005 | 同筛选时序守卫（判分三分支、筛选重置、跨页前进、空态已实测（EV-204）） |
| CMP-034 | BP-011 | retain |  | 计数与 total 同步（判分三分支、筛选重置、跨页前进、空态已实测（EV-204）） |
| CMP-035 | BP-003 | refactor | TASK-004 | 选项无语义不可键盘操作；judge 展示原始 true 且无高亮（判分三分支、筛选重置、跨页前进、空态已实测（EV-204）） |
| CMP-036 | BP-011 | refactor | TASK-003 | 位置文本与按钮状态组合在跨页回退后需同步（判分三分支、筛选重置、跨页前进、空态已实测（EV-204）） |
| CMP-037 | BP-011 | refactor | TASK-003 | 第 2 页首页死按钮、无跨页回退（判分三分支、筛选重置、跨页前进、空态已实测（EV-204）） |
| CMP-038 | BP-011 | retain |  | 未作答禁用与跨页加载行为正确（判分三分支、筛选重置、跨页前进、空态已实测（EV-204）） |
| CMP-039 | BP-011 | retain |  | 空态文案与条件正确（EV-204）（判分三分支、筛选重置、跨页前进、空态已实测（EV-204）） |
| CMP-040 | BP-001 | configure | TASK-002, TASK-006 | 同页壳移动端溢出与昵称问题（列表筛选、详情抽屉、重练、掌握切换、讲解三态已实测（EV-206/207）） |
| CMP-041 | BP-012 | retain |  | 筛选联动 onFilterChange 重置页码正确（列表筛选、详情抽屉、重练、掌握切换、讲解三态已实测（EV-206/207）） |
| CMP-042 | BP-012 | retain |  | 科目筛选下拉：列表筛选、详情抽屉、重练、掌握切换、讲解三态已实测（EV-206/207），未发现缺陷证据，保留现实现 |
| CMP-043 | BP-012 | retain |  | 掌握状态单选组：列表筛选、详情抽屉、重练、掌握切换、讲解三态已实测（EV-206/207），未发现缺陷证据，保留现实现 |
| CMP-044 | BP-012 | refactor | TASK-005 | 自动标记/重练后行状态与 wrong_count 不即时刷新（列表筛选、详情抽屉、重练、掌握切换、讲解三态已实测（EV-206/207）） |
| CMP-045 | BP-012 | retain |  | 打开抽屉与详情加载正确（列表筛选、详情抽屉、重练、掌握切换、讲解三态已实测（EV-206/207）） |
| CMP-046 | BP-012 | configure | TASK-005, TASK-011 | 无防重入（FND-010 待补证）（列表筛选、详情抽屉、重练、掌握切换、讲解三态已实测（EV-206/207）） |
| CMP-047 | BP-012 | retain |  | 分页与 total 同步（列表筛选、详情抽屉、重练、掌握切换、讲解三态已实测（EV-206/207）） |
| CMP-048 | BP-012 | configure | TASK-002 | 固定 560px 移动端超屏（列表筛选、详情抽屉、重练、掌握切换、讲解三态已实测（EV-206/207）） |
| CMP-049 | BP-012 | retain |  | 描述区字段正确（列表筛选、详情抽屉、重练、掌握切换、讲解三态已实测（EV-206/207）） |
| CMP-050 | BP-003 | refactor | TASK-004, TASK-005 | 答对后列表不同步；选项语义缺失；judge 展示问题（列表筛选、详情抽屉、重练、掌握切换、讲解三态已实测（EV-206/207）） |
| CMP-051 | BP-003 | refactor | TASK-004 | 结果实例同 DEF-003 展示与语义问题（列表筛选、详情抽屉、重练、掌握切换、讲解三态已实测（EV-206/207）） |
| CMP-052 | BP-004 | refactor | TASK-007 | 状态机缺 idle、失败原因不分、failed 死状态（列表筛选、详情抽屉、重练、掌握切换、讲解三态已实测（EV-206/207）） |
| CMP-053 | BP-001 | configure | TASK-002, TASK-006 | 同页壳移动端溢出与昵称问题（生成/打卡/重新生成确认与空态已实测（EV-208）） |
| CMP-054 | BP-013 | retain |  | 表单控件与生成入口行为正确（生成/打卡/重新生成确认与空态已实测（EV-208）） |
| CMP-055 | BP-013 | retain |  | mock/llm 标签展示正确（EV-208）（生成/打卡/重新生成确认与空态已实测（EV-208）） |
| CMP-056 | BP-013 | retain |  | 日期选择与天数提示逻辑正确（disabled-date 允许昨天为既定口径）（生成/打卡/重新生成确认与空态已实测（EV-208）） |
| CMP-057 | BP-013 | retain |  | 多选与空值=全部口径正确（生成/打卡/重新生成确认与空态已实测（EV-208）） |
| CMP-058 | BP-013 | retain |  | 15-600 范围约束正确（生成/打卡/重新生成确认与空态已实测（EV-208）） |
| CMP-059 | BP-013 | configure | TASK-005, TASK-011 | 生成无防重入（FND-010 待补证）；已有计划确认弹窗正确（生成/打卡/重新生成确认与空态已实测（EV-208）） |
| CMP-060 | BP-013 | retain |  | 计划卡渲染与数据分组正确（生成/打卡/重新生成确认与空态已实测（EV-208）） |
| CMP-061 | BP-013 | retain |  | 进度与打卡联动正确（生成/打卡/重新生成确认与空态已实测（EV-208）） |
| CMP-062 | BP-013 | retain |  | 折叠分组与展开逻辑正确（生成/打卡/重新生成确认与空态已实测（EV-208）） |
| CMP-063 | BP-013 | retain |  | 任务行两态展示正确（生成/打卡/重新生成确认与空态已实测（EV-208）） |
| CMP-064 | BP-013 | retain |  | 打卡 _checking 防重入已具备（生成/打卡/重新生成确认与空态已实测（EV-208）） |
| CMP-065 | BP-013 | refactor | TASK-008 | getCurrentPlan 失败与无计划空态混淆（生成/打卡/重新生成确认与空态已实测（EV-208）） |
| CMP-066 | BP-001 | configure | TASK-002 | 同页壳移动端溢出（查看与改昵称、空值拦截已实测（EV-209）） |
| CMP-067 | BP-014 | refactor | TASK-008 | 拉取失败以 — 呈现无错误态（查看与改昵称、空值拦截已实测（EV-209）） |
| CMP-068 | BP-014 | retain |  | 表单与空值拦截正确（查看与改昵称、空值拦截已实测（EV-209）） |
| CMP-069 | BP-014 | retain |  | maxlength/计数正确（查看与改昵称、空值拦截已实测（EV-209）） |
| CMP-070 | BP-014 | configure | TASK-005, TASK-011 | 无防重入（FND-010 待补证）（查看与改昵称、空值拦截已实测（EV-209）） |
| CMP-071 | BP-014 | retain |  | 提示信息准确（引导管理员处理）（查看与改昵称、空值拦截已实测（EV-209）） |
| CMP-072 | BP-002 | retain |  | 管理端页壳实例：CRUD 与校验链已实测（EV-211）；搜索失败见 FND-001，未发现缺陷证据，保留现实现 |
| CMP-073 | BP-015 | refactor | TASK-008 | getSubjects 失败阻断列表加载（CRUD 与校验链已实测（EV-211）；搜索失败见 FND-001） |
| CMP-074 | BP-015 | refactor | TASK-001 | 关键词搜索 100% 失败（后端 SQL）且失败展示旧数据（CRUD 与校验链已实测（EV-211）；搜索失败见 FND-001） |
| CMP-075 | BP-015 | configure | TASK-001 | 搜索失败时保留旧列表误导（CRUD 与校验链已实测（EV-211）；搜索失败见 FND-001） |
| CMP-076 | BP-015 | retain |  | 编辑按钮回填正确（CRUD 与校验链已实测（EV-211）；搜索失败见 FND-001） |
| CMP-077 | BP-015 | configure | TASK-005, TASK-011 | 无防重入（FND-010 待补证）；确认弹窗正确（CRUD 与校验链已实测（EV-211）；搜索失败见 FND-001） |
| CMP-078 | BP-015 | retain |  | 分页与删末页回退逻辑正确（CRUD 与校验链已实测（EV-211）；搜索失败见 FND-001） |
| CMP-079 | BP-015 | retain |  | 新建/编辑两态回填正确、校验链完整（EV-211）（CRUD 与校验链已实测（EV-211）；搜索失败见 FND-001） |
| CMP-080 | BP-015 | retain |  | 科目选择与 subjects 数据正确（CRUD 与校验链已实测（EV-211）；搜索失败见 FND-001） |
| CMP-081 | BP-015 | retain |  | 切换题型清空答案防误判（CRUD 与校验链已实测（EV-211）；搜索失败见 FND-001） |
| CMP-082 | BP-015 | retain |  | maxlength 与必填校验正确（CRUD 与校验链已实测（EV-211）；搜索失败见 FND-001） |
| CMP-083 | BP-015 | retain |  | 选项增删与答案字母清理逻辑正确（CRUD 与校验链已实测（EV-211）；搜索失败见 FND-001） |
| CMP-084 | BP-015 | retain |  | judge radio/文本双分支与校验正确（CRUD 与校验链已实测（EV-211）；搜索失败见 FND-001） |
| CMP-085 | BP-015 | retain |  | 解析输入与展示链路正确（CRUD 与校验链已实测（EV-211）；搜索失败见 FND-001） |
| CMP-086 | BP-015 | retain |  | 难度 1-5 与后端校验一致（CRUD 与校验链已实测（EV-211）；搜索失败见 FND-001） |
| CMP-087 | BP-015 | retain |  | 启用停用开关联动正确（CRUD 与校验链已实测（EV-211）；搜索失败见 FND-001） |
| CMP-088 | BP-015 | configure | TASK-005, TASK-011 | 保存无防重入（FND-010 待补证）（CRUD 与校验链已实测（EV-211）；搜索失败见 FND-001） |
| CMP-089 | BP-002 | retain |  | 管理端页壳实例：启用禁用双向与自保护已实测（EV-213），未发现缺陷证据，保留现实现 |
| CMP-090 | BP-016 | retain |  | 筛选与清空查询正确（启用禁用双向与自保护已实测（EV-213）） |
| CMP-091 | BP-016 | retain |  | 列表与角色/状态标签正确（启用禁用双向与自保护已实测（EV-213）） |
| CMP-092 | BP-016 | retain |  | 双向切换、自保护与后端管理员防护正确（EV-213）（启用禁用双向与自保护已实测（EV-213）） |
| CMP-093 | BP-016 | retain |  | 分页正确（启用禁用双向与自保护已实测（EV-213）） |
| CMP-094 | BP-007 | retain |  | 未知路径重定向两态正确（EV-215）（未登录/已登录重定向已实测（EV-215）） |

## 问题索引

| 问题 | 级别 | 置信度 | 状态 | 页面 / 实例 |
|---|---|---|---|---|
| FND-001 后台题库关键词搜索接口 500，搜索功能完全不可用 | P2 | confirmed | resolved | PAGE-008 |
| FND-002 移动端 375px 全站横向溢出，内容挤压变形 | P2 | confirmed | resolved | PAGE-001, PAGE-002, PAGE-003, PAGE-004, PAGE-005, PAGE-006, PAGE-007 |
| FND-003 刷题"上一题"按钮在跨页后成死按钮且无法回退上一页 | P2 | confirmed | resolved | PAGE-004 |
| FND-004 题目选项为无语义 div，键盘与读屏不可操作 | P2 | confirmed | fixed_unverified | PAGE-004, PAGE-005, PAGE-003 |
| FND-005 判分结果展示原始布尔值且判断题无正确项高亮 | P3 | confirmed | resolved | PAGE-004, PAGE-005 |
| FND-006 错题重练答对后列表行状态与提示不一致 | P3 | confirmed | resolved | PAGE-005 |
| FND-007 页壳昵称在非首页显示兜底"同学" | P3 | confirmed | resolved | PAGE-004, PAGE-005, PAGE-006 |
| FND-008 AI 讲解面板状态机缺口：失败态闪现、失败原因不分、failed 为死状态 | P3 | confirmed | resolved | PAGE-005 |
| FND-009 页面级请求失败缺少错误状态：网络故障与空数据不可区分 | P3 | confirmed | resolved | PAGE-003, PAGE-006, PAGE-007 |
| FND-010 写操作缺统一防重入；个别状态回填不完整 | P3 | confirmed | resolved | PAGE-005, PAGE-008, PAGE-007 |
| FND-011 工程化卫生：.env 无忽略保护、常量未统一、redirect 未校验 | P3 | confirmed | resolved | PAGE-001 |
| FND-012 生产构建主包 1.06MB（gzip 348KB），Element Plus 全量引入 | P3 | confirmed | resolved | PAGE-003 |

## 任务顺序

| 任务 | 阶段 | 负责人 | 依赖 | 状态 |
|---|---|---|---|---|
| TASK-001 修复题库关键词搜索 SQL 并完善搜索失败反馈 | 1 | 后端（主）+前端 |  | verified |
| TASK-002 移动端响应式布局修复 | 1 | 前端 |  | verified |
| TASK-003 刷题跨页回退与翻页状态一致 | 1 | 前端 |  | verified |
| TASK-004 QuestionCard 语义化与判分结果展示修复 | 1 | 前端 |  | implemented |
| TASK-005 错题状态同步与写操作防重入 | 2 | 前端 |  | verified |
| TASK-006 登录后统一加载用户 profile | 2 | 前端 |  | verified |
| TASK-007 ExplainPanel 状态机重构与错误原因透出 | 2 | 前端 |  | verified |
| TASK-008 页面级错误态与重试 | 2 | 前端 |  | verified |
| TASK-009 工程卫生：.gitignore、常量统一、redirect 校验 | 3 | 前端 |  | verified |
| TASK-010 构建分包与组件库按需引入 | 3 | 前端 |  | verified |
| TASK-011 补证：慢网防重入、真机移动、读屏、日期选择器交互 | 3 | 测试/前端 |  | blocked |

## 发布门槛

| 门槛 | 必需 | 状态 | 证据 / 理由 |
|---|---|---|---|
| 核心旅程（注册登录/刷题判分/错题/计划打卡/管理端）验证通过 | True | passed | EV-202, EV-204, EV-206, EV-208, EV-211, EV-213 38 场景中核心旅程 32 项通过 |
| 身份、角色与对象级权限由服务端强制 | True | passed | EV-210, EV-213, EV-214 40301/40302/属主 404 均实测 |
| 关键可访问性：核心任务可仅键盘完成 | True | blocked | EV-231 选项/入口卡已改原生可聚焦语义（结构复验通过）；键盘+读屏端到端人工走查未执行（TASK-011） |
| 数据一致性与状态同步 | True | passed | EV-232 状态同步修复复验通过 |
| 生产构建可复现 | True | passed | EV-217, EV-223 构建通过；本机 TEMP 锁定为环境问题 |
| 性能预算（首屏包体） | True | passed | EV-237 主包 8.7KB（gzip 约 4KB），组件库独立分包可长期缓存；总下载量未变属全量引入取舍，已列可选优化 |
| 错误可见性与可观测性 | True | passed | EV-235 页面级错误态与重试齐备 |
| 移动端可用性（375px） | True | passed | EV-240, EV-229, EV-226 375px 无溢出；真机为 TASK-011 补充项 |
| 发布与回滚（Nginx/pm2）实操验证 | True | blocked |  Windows 开发机无 Nginx/pm2，按 README 配置审查通过但未实操 |

## 缺口


## 下一步

- TASK-011 人工补证：真机 375px、读屏器、键盘端到端（完成后 TASK-004 转 verified、SCN-031 转 passed、GATE-003 转 passed）
- GATE-009 发布实操需 Linux+Nginx+pm2 环境
