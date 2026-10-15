# zsb-exam · Claude 风 UI 设计方案

> 状态：**静态设计稿，待你确认后落地到 Vue 项目**
> 位置：`zsb-exam/design/`
> 日期：2026-10-13

---

## 一、设计目标

把现在的「蓝白教育平台风」换成 Claude（Anthropic）的设计语言。四个关键词：

| 关键词 | 落地手段 |
| --- | --- |
| **暖纸感** | 象牙白画布 `#FAF9F5` + 暖米侧栏 `#F0EEE6`，弃用冷灰蓝底 |
| **珊瑚陶土** | 品牌色 `#D97757`，只用于主行动、选中、AI 相关；不再有大面积纯色块 |
| **衬线书卷气** | 标题与大数字走 Noto Serif SC，正文与控件走 Noto Sans SC |
| **克制层级** | 1px 暖描边 + 三级极轻阴影分层，靠底色深浅而非投影堆叠 |

语义色统一降饱和（鼠尾草绿 / 砖红 / 赭黄），**刻意与珊瑚色拉开距离**，避免「品牌色」和「答对了」撞色。

---

## 二、怎么看设计稿

```bash
cd zsb-exam/design
npx http-server -p 5599 -c-1
# 浏览器打开 http://127.0.0.1:5599/login.html
```

侧边栏可在四个页面间真实跳转。设计稿包含可交互部分：选项可选中、任务可打卡、错题抽屉可开关。

| 文件 | 内容 |
| --- | --- |
| `login.html` | 登录页（左品牌区 + 右表单） |
| `index.html` | 今日计划首页（最密信息页，检验层级体系） |
| `practice.html` | 智能题库，含**状态 A 未开始**与**状态 B 答题中**两种形态 |
| `wrong-book.html` | 错题本 + AI 讲解抽屉（招牌组件） |
| `tokens.css` | 设计变量，**整块可直接替换 `web/src/style.css` 的 `:root`** |
| `base.css` | 布局与组件样式 |
| `mock.js` | 图标精灵注入 + 演示交互 —— 评审辅助，**不进生产** |
| `force-desktop.css` | 无头浏览器整页截图用的桌面强制层 —— **不进生产** |
| `_shot-*.png` | 四页桌面整页截图，方便直接看效果 |

---

## 三、色板

### 画布层级（由深到浅）

| Token | 值 | 用途 |
| --- | --- | --- |
| `--canvas-sunken` | `#F0EEE6` | 侧边栏、凹陷区 |
| `--canvas` | `#FAF9F5` | 页面主底 |
| `--fill` | `#F4F2EA` | hover 填充、输入底、解析块 |
| `--fill-strong` | `#EAE7DC` | 按压态、进度槽 |
| `--surface` | `#FFFEFC` | 卡片 |
| `--surface-raise` | `#FFFFFF` | 抽屉、弹层、侧栏选中项 |

### 描边与文字

| Token | 值 | 用途 |
| --- | --- | --- |
| `--line` / `--line-soft` / `--line-strong` | `#E2DFD4` / `#EDEAE1` / `#D3CFC1` | 卡片描边用 soft，控件描边用 line |
| `--ink` | `#1F1E1B` | 标题、大数字、深色主按钮 |
| `--text` | `#3D3929` | 正文（**不用纯黑，也不用冷灰**） |
| `--text-2` / `--text-3` | `#6E6A5E` / `#9C9889` | 次要 / 辅助与占位 |

### 品牌珊瑚

| Token | 值 | 用途 |
| --- | --- | --- |
| `--coral` | `#D97757` | 主按钮、选中、AI 标记、进度条 |
| `--coral-hover` / `--coral-active` | `#C4613F` / `#A94E30` | hover / active |
| `--coral-soft` | `#F6E9E2` | 标签底、图表浅段 |
| `--coral-softer` | `#FBF3EE` | AI 面板大面积底 |
| `--coral-line` | `#E8CDBE` | AI 面板与浅标签的描边 |
| `--coral-ring` | `rgba(217,119,87,.14)` | focus 光环 |

### 语义色

| 语义 | 主色 | 浅底 | 描边 | 用在哪 |
| --- | --- | --- | --- | --- |
| 正确 / 成功 / 已掌握 | `--sage` `#4F7A52` | `#EBF0E9` | `#C9D7C5` | 答对选项、判分条、掌握标签 |
| 错误 / 危险 / 高频错题 | `--brick` `#9E3F34` | `#F6E7E3` | `#E2C2BA` | 答错选项、错 N 次、危险操作 |
| 待办 / 提醒 / 中等难度 | `--amber` `#8C6A1F` | `#F5EEDC` | `#E0D0AA` | 未掌握、打卡前状态 |
| 信息 / 图表辅助 | `--slate` `#4E6A82` | `#E9EEF2` | `#C9D6E0` | 统计卡强调条 |

**难度色阶约定**：简单 `tag-sage` → 中等 `tag-amber` → 困难 `tag-brick`，形成可读的三档梯度。

---

## 四、字体

```css
--serif: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'STSong', Georgia, serif;
--sans:  'Noto Sans SC', 'Source Han Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
```

**分工规则（这是 Claude 气质的一半）**：

- 衬线：`h1–h4`、统计大数字、选项字母键、倒计时数字、品牌名、登录页标语
- 黑体：正文、按钮、标签、表单、表格、导航

| 层级 | Token | 字号 | 字体 | 字重 |
| --- | --- | --- | --- | --- |
| 页面主标题 | `--fs-display` | 30px | 衬线 | 600，letter-spacing -.6px |
| 卡片标题 | `--fs-title` | 18px | 衬线 | 600 |
| 小节 / 题干 | `--fs-sub` | 15px | 衬线（题干用黑体，见下） | 600 |
| 正文 | `--fs-body` | 14px | 黑体 | 400，line-height 1.7 |
| 次要 | `--fs-small` | 13px | 黑体 | 400 |
| 标签 / 脚注 | `--fs-cap` | 12px | 黑体 | 500 |
| 统计数字 | `--fs-stat` | 34px | 衬线 | 600，`font-variant-numeric: tabular-nums` |

**题干保持黑体**：题干是长句混排（英文、数学符号、下划线），宋体在小字号下发虚且 `−1`、`∞`、`x²` 等符号对齐差。只有标题和数字吃衬线红利。

所有数字（题量、百分比、日期、题号）统一 `tabular-nums`，避免跳动。

---

## 五、圆角 / 阴影 / 间距

| 类别 | Token | 值 | 用在哪 |
| --- | --- | --- | --- |
| 圆角 | `--r-xs` | 6px | 小按钮、选项字母键、骨架条 |
| | `--r-sm` | 8px | 按钮、输入框、导航项 |
| | `--r-md` | 12px | 内嵌面板、判分条 |
| | `--r-lg` | 16px | 卡片、AI 面板、统计卡 |
| | `--r-pill` | 999px | 标签、筛选胶囊、题号外的胶囊 |
| 阴影 | `--sh-1` | `0 1px 2px rgba(31,30,27,.04)` | 卡片默认 |
| | `--sh-2` | 双层 12px | 登录卡、浮层 |
| | `--sh-3` | 40px | 抽屉、移动端侧栏 |
| 间距 | `--sp-1…--sp-10` | 4 的倍数 | 卡片内边距 24，栅格间隙 16 |

---

## 六、布局

```
.app (grid: 248px | 1fr)
├── .sidebar  暖米列（sticky，整列底色由 .app 渐变铺满）
│   ├── .brand        星芒记号 + 衬线品牌名 + ZSB EXAM SYSTEM
│   ├── .side-action  深色主按钮「开始刷题」
│   ├── .nav          三组：学习闭环 / 复盘提升 / 账号
│   └── .side-foot    考试倒计时卡 + 用户 chip
└── .main > .content (max-width 1080px, padding 32px 40px)
```

**侧栏导航分组直接对应 README 的业务闭环**：`学习闭环`（今日计划 / 智能题库 / 模拟考场）→ `复盘提升`（错题本 / 学情报告）→ `账号`。答辩讲架构时可以指着侧栏说事。

侧栏底部把「距考试 152 天」做成常驻卡片 —— 这是备考产品最高频的心理锚点，现在它只出现在首页统计卡里，滚一下就没了。

**断点**：`1080px` 收内容内边距、双栏转单栏；`900px` 侧栏转固定抽屉（汉堡 + 遮罩）；`640px` 统计卡单列、卡片降为 12px 圆角与 16px 内边距。已带 `prefers-reduced-motion` 降级。

**整列底色**：`.sidebar` 自身透明，由 `.app` 的五段硬渐变画出「暖米列 + 1px 分隔线」，这样侧栏比页面短时左侧也不会露出白底。

---

## 七、组件规范

### 按钮（6 型）

| 类 | 外观 | 用途 |
| --- | --- | --- |
| `.btn-primary` | 珊瑚底白字 | 页面主行动：提交答案、登录、查看错题 |
| `.btn-ink` | 墨黑底象牙字 | 侧栏常驻入口，避免全屏都在喊「点我」 |
| `.btn-outline` | 白底暖描边 | 次要：上一题、导出错题 |
| `.btn-soft` | 珊瑚浅底珊瑚深字 | 卡片内行级动作：查看 / AI 讲解、专项练习 |
| `.btn-ghost` | 透明 | 工具位：换一题、复制 |
| `.btn-link` | 纯文字珊瑚 | 卡片标题右侧的轻量跳转 |

尺寸：默认 38px、`.btn-sm` 32px、`.btn-lg` 44px。focus 统一 `0 0 0 3px var(--coral-ring)`。

### 筛选胶囊 `.pill`

**选中态用墨黑胶囊，不用珊瑚色。** 珊瑚留给「行动」，墨黑表示「当前口径」，两者同时出现时不会互相抢。胶囊内计数用 `.pill-num` 小圆片，选中时自动反白。

### 卡片

`.card` 卡片（页面级）→ `.panel` 抽屉内嵌卡（16px 内边距）→ `.note` 提示条（灰底 + 图标）。三级都不带重投影，靠描边和底色差分层。

卡片头统一 `.card-head`：左侧衬线标题 + 珊瑚图标，右侧 `.card-sub` 次要信息（可内嵌 `.btn-link`）。

### 答题选项 `.opt`（核心组件）

四态，语义严格不混用：

| 态 | 描边/底 | 字母键 | 右侧图标 |
| --- | --- | --- | --- |
| 默认 | `--line` / `--surface` | `--fill` 灰底 | — |
| `.selected` | `--coral` / `--coral-softer` | 珊瑚底白字 | — |
| `.right` | `--sage` / `--sage-soft` | 绿底白字 | ✓ |
| `.wrong` | `--brick` / `--brick-soft` | 红底白字 | ✕ |

`.locked` 态（已判分）关掉 hover 变化，但**保留各自判分配色**，让学生事后还能看出自己选了啥。判分后正确项一律标绿，包括「正确但没选」的项 —— 多选题里这个信息很关键。

保留原生 `radio` / `checkbox` + `:focus-within` 焦点环，键盘可达性不因换肤退化。

### 判分与解析

`.verdict.ok/.bad` 圆角条（图标圆点 + 结论 + 右对「你的答案 / 正确答案」对照）；`.analysis` 左侧 3px 灰竖线 + 灰底，视觉上明确从属于题目而非独立模块。

### AI 面板（招牌组件）

两处形态，同一套色：

1. **`.ai-bar` 建议条**（首页）：珊瑚浅渐变底 + 星芒方块 + 衬线小标题 + 行内 `.tag` 标注引擎模式。
2. **`.ai-panel` 讲解面板**（错题抽屉）：`--coral-softer` 底 + `--coral-line` 描边，内部按 **错因分析 / 解题思路 / 知识点提示** 三段，段头是珊瑚色 12px 字距加宽标签 + 图标。底部虚线分隔，左「AI 生成，仅供参考」，右「复制 / 重新生成」。

**这个组件可以直接落地，不用改后端**：`server/src/ai/prompts/explain.md:13-19` 与 `server/src/ai/mockProvider.js:22,38,41` 都强制输出 `## 一、错因分析` / `## 二、解题思路与步骤` / `## 三、知识点提示` 三个标题。前端只要按 `## ` 切分 `explanation.content` 即可，mock 与 llm 两条路径同时生效。现在 `ExplainPanel.vue` 用一个 `<pre>` 把整段糊出来，白白浪费了已有的结构。

### 图表

柱状图改为**堆叠语义**：实心珊瑚 = 已完成，浅珊瑚 = 待完成，柱高 = 任务量。今天靠标签加粗区分，不再额外发明一种颜色。

进度条 6px（原 8px），目标线用 `--text-3` 细竖标；掌握度按档位换色：≥85 绿、70–84 珊瑚、<70 赭。

### 表单

输入底 `--surface-raise`（比卡片更白一点），描边 `--line`，focus 珊瑚描边 + 光环。标签在框上方，必填用珊瑚星号，提示文案 12px 灰。

---

## 八、类名迁移映射

全局类改名集中在 `style.css` + 各页 `template`，机械替换即可。**保留所有旧语义**，不合并、不删功能。

| 现在 | 设计稿 | 说明 |
| --- | --- | --- |
| `.page-wrap` | `.content` | 只在 `StudentLayout.vue` 出现一处 |
| `.card-title` | `.card-head` | |
| `.stat-card` + `.label/.value/.foot` | `.stat` + `.stat-label/.stat-value/.stat-foot` | 新增 `--accent` 变量控制左侧强调条 |
| `.stat-grid.three` | `.stat-grid.cols-3` | |
| `.btn-plain` | `.btn-outline` | |
| `.btn-text` | `.btn-link` | |
| `.tag-blue/.tag-green/.tag-red` | `.tag-coral/.tag-sage/.tag-brick` | `.tag-amber` 不变 |
| `.pill-tabs` / `.pill-tab` | `.pills` / `.pill` | |
| `.ai-icon` | `.ai-mark` | |
| `.section-head` | `.divider-label` | |
| `.task-item/.task-time/.task-content/.task-meta` | `.row/.row-time/.row-ttl/.row-aside` | 与 `.rec-item`、`.type-row` 合并成一套 `.row` 体系 |
| `.bar-chart/.bar-fill/.bar-label` | `.bars/.bar-stack/.bar-lbl` | |
| `.opt-list/.opt-item/.key/.opt-input` | `.opts/.opt/.opt-key`（input 直接隐藏） | |
| `.empty-tip` | `.empty` | 可加图标位 |
| `.flex-between` | `.between` | `.flex-between` 建议保留为别名，减少改动面 |
| `.result.ok/.bad`、`.result-title` | `.verdict.ok/.bad`、`.verdict b` | |
| `.mine-row` | `.answer-diff` + `.answer-cell` | 你的答案 / 正确答案并排对照，比原来一行文字更醒目 |
| `.wrong-head` | `.tag-row` | |
| `.hint/.muted/.mb16/.mt16` | 同名保留 | |

页面私有类（`.weak-item`、`.rec-item`、`.mastery-row`、`.greet` 等）**名字不动，只改值**，把颜色/圆角/字号换成 token。

---

## 九、逐文件落地清单

| 文件 | 改动 |
| --- | --- |
| `web/index.html` | 引入 Noto Serif SC + Noto Sans SC；`<meta name="theme-color" content="#FAF9F5">` |
| `web/src/style.css` | `:root` 整块换成 `tokens.css` 内容；`base.css` 组件层追加在后；删掉旧的蓝白注释头 |
| `web/src/layout/StudentLayout.vue` | 结构重写：顶栏 + `navrow` → `.app / .sidebar / .main > .content`。`menus` 数组加分组字段；侧栏底部加倒计时卡（复用 `Home.vue` 里已有的 `exam_date` 计算逻辑，抽成 composable） |
| `web/src/layout/AdminLayout.vue` | 换同一套 `.app/.sidebar` 外壳，导航组改「管理：题目管理 / 用户管理」+「返回考生端」，与考生端视觉统一 |
| `web/src/views/student/Login.vue` | `.login-side` 纯色蓝块 → `.auth-aside` 暖米 + 衬线标语 + 特性列表；`.login-card` → `.auth-form` |
| `web/src/views/student/Register.vue` | 同 Login 外壳 |
| `web/src/views/student/Home.vue` | 类名替换；统计卡加 `--accent`；柱状图改堆叠结构；AI 条换 `.ai-bar` |
| `web/src/views/student/Practice.vue` | 类名替换；筛选卡拆「科目 / 题型」两行带计数；答题区加 `.q-nav` 题号导航与 `.session-bar` 进度 |
| `web/src/views/student/MockExam.vue` | 类名替换；考试模式加倒计时顶条 + 题号导航（复用 `.q-nav`） |
| `web/src/views/student/WrongBook.vue` | 类名替换；`el-drawer` 加 `:deep` 换肤（见下）；错题卡底部动作区改 `.wrong-foot` + `.spacer` |
| `web/src/views/student/Report.vue` | 类名替换；图表配色改用珊瑚 / 鼠尾草 / 赭黄 / 灰蓝四色序列 |
| `web/src/views/student/Plan.vue`、`Profile.vue` | 类名替换 |
| `web/src/views/admin/*.vue` | `el-table` / `el-dialog` 靠 `--el-*` token 自动换肤，只需检查表头与操作列间距 |
| `web/src/components/QuestionCard.vue` | 选项类名替换；判分条 → `.verdict`；解析块左边线样式 |
| `web/src/components/ExplainPanel.vue` | `<pre class="explain">` → `.ai-panel` 三段结构，按 `## ` 切分 `content`；加载态换 `.skel` 骨架；失败态换 `.note.bad` |

**Element Plus 换肤边界**：`--el-*` token 能覆盖按钮、输入、表格、菜单、分页、标签。`el-drawer` 与 `el-dialog` 的背景/标题需在组件里补 `:deep(.el-drawer__header){font-family:var(--serif)}` 之类的少量覆写；`el-message` 建议保持默认尺寸只换色。

---

## 十、需要你拍板的三件事

1. **掌握度口径要改吗。** 设计稿里首页 82% / 64% / 91% / 78% 用的是**该科目答题正确率**。而现有代码 `Home.vue:92-96` 与 `Practice.vue:98-103` 算的是 `(题库该维度题量 − 未掌握错题数) ÷ 题量` —— 用 24 道种子题演示时这个值恒在 90% 以上，进度条几乎全满，「高等数学偏低」根本表达不出来。建议改成正确率口径（或二者取小），否则视觉再准也是假数据。

2. **字体要不要自托管。** 设计稿走 Google Fonts CDN。国内答辩现场网络不可控，且 Noto Serif SC 全量中文字形体积很大。落地时建议自托管**按用到的字符子集化**的 woff2（或直接用 `@fontsource` 分包），并保留 `Songti SC / STSong / Georgia` 兜底。

3. **侧栏导航分组是否合口味。** 我把 5 个入口按「学习闭环 / 复盘提升 / 账号」分了组。如果你更想要贴近 Claude.ai 那种一列到底、无分组标签的极简侧栏，去掉三个 `.nav-label` 即可，其余不用动。

---

## 十一、已知取舍

- **管理端沿用同一外壳**，不做独立后台视觉。省工作量，且毕设演示时前后端风格统一更好看。
- **深色模式不做**（已确认）。`tokens.css` 已把所有颜色收敛到变量，后续要加只需再挂一份 `[data-theme=dark]` 变量块，不用重做组件。
- **`--fs-body` 维持 14px**，没有跟 Claude 官网的 16px。备考系统信息密度高（表格、题号、统计），14px 更合适；标题吃衬线红利，气质不会掉。
- 设计稿里的数字是**内部自洽的假数据**：累计做题 486 = 156+128+74+128，加权正确率 = 78%，未掌握 23 = 7+12+4（按题型）= 4+11+3+5（按科目），错题 41 = 23 未掌握 + 18 已掌握。移植时可直接拿这套数字对齐后端联调结果。
- `mock.js` 与 `force-desktop.css` 只为设计稿能点、能截图而存在，落地时**不要带进 `web/`**。
