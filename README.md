# 专升本智能备考系统（zsb-exam）

覆盖「刷题练习 → 错题诊断 → 计划执行」闭环的专升本备考系统。

- 前端：Vue 3 + Vite + Vue Router + Pinia + Element Plus + Axios
  （架构决策 D2 说明：任务书中的 Element-ui 仅支持 Vue 2，本项目按架构方案采用其 Vue 3 后继版本 Element Plus，组件体系一致）
- 后端：Node.js + Express（分层：routes → services → dao）
- 数据库：MySQL 8（InnoDB / utf8mb4，10 张表，含外键约束）
- AI：可配置接口层，双模式 —— `mock`（规则引擎，零外部依赖） / `llm`（OpenAI 兼容接口）

## 功能清单

| 模块 | 页面/入口 | 说明 |
| --- | --- | --- |
| 首页 | `/` | 学习概览统计、今日任务、模块入口 |
| 题库刷题 | `/practice` | 按科目/题型筛选，逐题作答、即时判分 |
| 错题本 | `/wrong-book` | 错题列表、重练、标记掌握 |
| AI 错题讲解 | 错题本内 | 逐题生成「错因分析 / 解题思路 / 知识点提示」，带缓存与版本失效 |
| 智能复习计划 | `/plan` | 按考试日期/目标科目/每日时长生成计划，任务打卡 |
| 个人中心 | `/profile` | 账号信息、个人资料维护（昵称/性别/手机/邮箱/目标院校/签名）、修改密码 |
| 后台管理 | `/admin` | 题目管理、用户管理、错题管理、复习计划管理、AI 服务管理、数据备份（六个模块） |

## 目录结构

```
zsb-exam/
├── server/                  # 后端
│   ├── sql/
│   │   ├── init.sql                 # 数据库初始化脚本（建库建表 + 种子科目）
│   │   ├── upgrade-20261015-admin.sql  # 老库升级脚本（管理端补充模块用）
│   │   └── data-backup-20261015.sql    # 数据库备份文件（结构 + 数据，可直接导入）
│   ├── scripts/
│   │   ├── init-admin.js    # 创建管理员账号（交互式）
│   │   ├── import-questions.js
│   │   ├── seed-questions.json  # 24 道示例题（每科 6 道）
│   │   ├── smoke-test.js    # 考生端接口冒烟（npm run smoke）
│   │   ├── smoke-admin.js   # 管理端接口冒烟（npm run smoke:admin）
│   │   └── test-ai.js       # AI 连通性自检（npm run ai:test）
│   └── src/
│       ├── ai/              # AI 接口层：provider / mock / llm / 规则引擎 / prompt 模板
│       ├── dao/              # 数据访问（mysql2 连接池 + 参数化 SQL）
│       ├── middleware/       # JWT 鉴权 / 角色守卫 / 限流 / 错误处理
│       ├── routes/          # auth / exam / plan / admin 四组路由（50 个接口）
│       ├── services/         # 业务逻辑（判分、错题归集、计划生成、数据备份等）
│       └── utils/            # 统一响应、错误码、JWT
└── web/                     # 前端 SPA
    └── src/
        ├── api/              # axios 封装（统一鉴权与错误码处理）
        ├── stores/          # Pinia
        ├── views/student/   # Home / Practice / MockExam / WrongBook / Report / Plan / Profile / Me
        └── views/admin/     # QuestionManage / UserManage / WrongManage / PlanManage / AiManage / BackupManage
```

## 本地部署（5 步）

前置：Node.js ≥ 18、MySQL ≥ 8.0 已安装并运行。

1. **初始化数据库**

   ```bash
   mysql -u root -p --default-character-set=utf8mb4 < server/sql/init.sql
   # 或在 MySQL 客户端中直接执行 init.sql 全文
   ```

   该脚本会创建 `zsb_exam` 库、8 张表，并写入 4 个种子科目（大学英语/高等数学/计算机基础/管理学）。不内置任何账号与题目。脚本顶部含 `SET NAMES utf8mb4`，中文 Windows 控制台亦可直接导入。

2. **配置后端环境**

   ```bash
   cd server
   cp .env.example .env
   # 编辑 .env：DB_USER / DB_PASSWORD 按本机 MySQL 修改；JWT_SECRET 改为随机串
   npm install
   ```

3. **创建管理员并导入示例题**

   ```bash
   npm run init:admin          # 交互式输入管理员用户名和密码
   npm run import:questions    # 导入 scripts/seed-questions.json（24 道示例题）
   ```

   > 示例题仅为演示数据（含题目、选项、答案、解析），上线前可在后台管理中删除并导入真实题库。

4. **启动后端**

   ```bash
   npm run dev    # 开发模式（--watch），默认 3000 端口
   # 验证：curl http://localhost:3000/api/health
   ```

5. **启动前端**

   ```bash
   cd ../web
   npm install
   npm run dev    # 默认 5173 端口，已配置 /api 代理到 3000
   ```

   浏览器打开 http://localhost:5173 → 注册考生账号（或用第 3 步的管理员登录，登录后进入 /admin）。

## 生产部署（Nginx + pm2）

1. 构建前端静态资源：`cd web && npm install && npm run build`，产物在 `web/dist/`。
2. 后端安装并守护：`cd server && npm install --production && pm2 start ecosystem.config.js`。
3. Nginx 配置（80 端口，静态托管 + `/api` 反代）：

   ```nginx
   server {
     listen 80;
     server_name your-domain.com;

     root /opt/zsb-exam/web/dist;
     index index.html;

     location / {
       try_files $uri $uri/ /index.html;   # SPA 路由回退
     }

     location /api/ {
       proxy_pass http://127.0.0.1:3000;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_read_timeout 35s;              # AI 接口需要较长超时
     }
   }
   ```

4. `nginx -t && nginx -s reload`，访问 http://your-domain.com。
5. 建议首次部署后立即 `npm run init:admin` 创建管理员并修改默认配置。

## AI 双模式配置与降级策略

后端通过环境变量 `AI_PROVIDER` 切换（见 `server/.env.example`）：

- **`AI_PROVIDER=mock`（默认，零依赖）**：使用内置规则引擎。
  - 错题讲解：基于题目元数据（题型、科目、正确答案、解析）套模板生成「错因分析 / 解题思路 / 知识点提示」，内容前带「【模拟讲解】」标注。
  - 复习计划：按错题分布加权分配科目、按每日时长排任务（错题重练/知识学习/阶段复盘三类）。
  - 适用：演示、答辩、无外网/API Key 环境，**全链路可跑**。
- **`AI_PROVIDER=llm`**：调用 OpenAI 兼容的 `/chat/completions` 接口。需配置 `AI_BASE_URL`（如 `https://api.openai.com/v1` 或兼容网关）、`AI_API_KEY`、`AI_MODEL`。30s 超时 + 失败重试 1 次；连续失败返回 50201（讲解）/50202（计划），前端展示明确错误提示与「重试」按钮。配置后可运行 `npm run ai:test` 一键验证连通性。
- 讲解缓存绑定题目版本：题目被编辑后 `updated_at` 变化，旧缓存自动失效并重新生成。
- 当前模式可通过登录后 `GET /api/ai/config` 查询，前端计划页头部也会显示当前模式标签。
- **后台「AI 服务管理」支持运行时切换**：管理员可在 `/admin/ai` 修改模式/模型/接口地址/API Key/超时/限流，保存即生效（覆盖 `.env` 默认值，无需重启），并提供连通性测试、调用记录审计（含耗时、提示词、失败原因）与调用统计。

降级策略：真实大模型不可用时不阻塞业务——保持 `AI_PROVIDER=mock` 即可完整演示讲解与计划功能；切到 `llm` 失败时接口显式报错并允许前端重试，不落脏数据（**讲解与计划**的失败生成记录均以 `status='failed'` 留痕于 `ai_generations` 表）。

## 数据备份与恢复

- 后台「数据备份」页一键备份：导出全部业务表的「结构 + 数据」为 SQL 脚本（落 `server/backups/`），支持下载、SHA-256 完整性校验与删除。
- 恢复方式：`mysql -u root -p --default-character-set=utf8mb4 zsb_exam < 备份文件.sql`（导入前确认目标库可被覆盖）。
- 工程包内已附一份备份文件 `server/sql/data-backup-20261015.sql`（演示数据快照），保证系统可复现部署。
- **老库升级**：已按旧版 `init.sql` 建库的，执行 `server/sql/upgrade-20261015-admin.sql` 一次即可补上管理端新表与个人资料字段；全新安装直接执行 `init.sql`。

## 数据与账号说明（如实声明）

- 本仓库源码 **不包含真实数据库部署**；一切数据需按上述步骤自行初始化。
- `seed-questions.json` 中的 24 道题目为**编写好的演示示例数据**（题目内容为常见考点，用于跑通流程，非真题库），已在导入处标注。
- 管理员账号不预置，由 `npm run init:admin` 交互创建（bcrypt 哈希存储）。

## 常见问题

- **前端请求 40101 跳回登录页**：令牌过期或被禁用，重新登录即可；被禁用请联系管理员。
- **AI 讲解/计划接口很慢或报错**：检查 `.env` 的 `AI_*` 配置；无 Key 场景请使用 mock 模式。
- **服务启动即退出并提示缺少 JWT_SECRET**：属预期行为。请在 `server/.env` 配置 `JWT_SECRET`（参考 `.env.example`）。
- **忘记管理员密码**：重跑 `npm run init:admin` 重置密码并恢复启用，用该账号在用户管理中处理旧账号。
- **接口冒烟**：启动后端后执行 `cd server && npm run smoke`（考生端）与 `npm run smoke:admin`（管理端，需已创建管理员）。
