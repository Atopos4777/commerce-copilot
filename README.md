# 星岑远航 · StarCenVoyage

> 面向跨境电商卖家的对话式 AI 运营工作台 —— 把「选品 → Listing → 广告 → 店铺诊断 → 商品视觉」串成一条可对话的任务流。

一个可运行的全栈 MVP：不依赖数据库和登录，开箱即用；默认使用演示数据，配置模型后自动切换为真实 AI。

---

## 目录

- [项目简介](#项目简介)
- [功能一览](#功能一览)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [环境变量](#环境变量)
- [接口说明](#接口说明)
- [目录结构](#目录结构)
- [核心机制](#核心机制)
- [知识点总结](#知识点总结)
- [评测体系](#评测体系)
- [已知限制](#已知限制)
- [Roadmap](#roadmap)
- [安全说明](#安全说明)

---

## 项目简介

跨境卖家的日常运营是碎片化的：选品看数据、写 Listing 靠经验、看广告报表靠 Excel、做主图找外包。**星岑远航** 把这些动作收敛到一个对话框里：

- 用自然语言发起任务，Agent 自动识别意图、调用对应「工具」，并流式返回分析结论与结构化产物（表格、报告、图片）。
- 每个工具调用都会在界面上展示输入参数与执行结果，过程可追溯，而不是只给一个黑盒答案。
- 所有产物可直接落到对应模块继续操作，形成闭环。

产品形态参考 LinkFox OS 的 Web 工作台路线，但不做指纹浏览器，专注「对话 + 技能 + 内容生成」。

## 功能一览

| 模块 | 路径 | 说明 | 数据来源 |
| --- | --- | --- | --- |
| 对话工作台 | `/` `/chat/[id]` | 意图识别 → 工具编排 → 流式输出 → 产物卡片 | 演示数据 / 真实模型 |
| 技能广场 | `/skills` | 技能卡片、分类筛选、安装/卸载（本地持久化） | 内置数据 |
| 跨境专家 | `/experts` | 专家人设与擅长领域，可直接发起对话 | 内置数据 |
| 选品工作台 | `/selection` | 候选产品清单、BSR/月销/评分、利润测算 | 演示数据 |
| Listing 生成 | `/listing` | 标题 / 五点 / A+ 文案，支持多站点 | 模板 / 真实模型 |
| 店铺经营助手 | `/dashboard` | 经营总览、商品、广告、订单、库存、授权 | 演示数据 |
| AI 作图 | `/studio/image` | 文生图 + **图生图**，多比例、批量、下载 | 真实模型 / 免费通道 |
| 视频生成 | `/studio/video` | 界面与参数已完成（生成能力待接入） | 占位 |
| 定时任务 | `/automation` | 周期任务编排界面 | 演示 |
| 资产库 | `/assets` | 图片、报告等产物归档 | 本地状态 |
| 套餐与算力 | `/pricing` | 算力消耗规则与套餐展示 | 内置数据 |

## 技术栈

| 层 | 选型 | 版本 |
| --- | --- | --- |
| 框架 | Next.js（App Router） | 15.5 |
| UI | React | 19.0 |
| 语言 | TypeScript | 5.7 |
| 样式 | Tailwind CSS | 3.4 |
| 图标 | lucide-react | 0.469 |
| 评测 | tsx 运行的 Node 脚本 | 4.x |
| 状态 | React Context + localStorage | 自实现 |

**刻意不引入的东西**：数据库、登录、ORM、状态库、UI 组件库、图表库。MVP 阶段用最少依赖跑通闭环，后续替换成本可控。

## 快速开始

```bash
cd crosspilot

# 国内网络建议加镜像
npm install --registry=https://registry.npmmirror.com

npm run dev
# 打开 http://localhost:3000
```

生产构建：

```bash
npm run build
npm run start
```

> ⚠️ **不要同时运行 `next dev` 和 `next build`**。两者共用 `.next` 目录，并发会互相覆盖构建产物，典型症状是全站 500 并报 `Could not find the module ... React Client Manifest`。遇到时：停掉所有 dev 进程 → 删除 `.next` → 重新构建。

## 环境变量

复制 `.env.example` 为 `.env.local` 后按需填写。全部可选，不填就是演示模式。

| 变量 | 默认 | 作用 |
| --- | --- | --- |
| `AI_MODE` | `auto` | `mock` 纯演示 / `live` 强制真实 / `auto` 有配置才走真实 |
| `OPENAI_BASE_URL` | - | OpenAI 兼容端点；**auto 模式下必须同时配置它才会走真实模型** |
| `OPENAI_API_KEY` | - | 对应密钥 |
| `OPENAI_MODEL` | `gpt-4o-mini` | 对话模型 |
| `IMAGE_MODEL` | `gpt-image-1` | 生图/图生图模型（同端点的 `/images/generations`） |
| `IMAGE_FREE_FALLBACK` | `on` | 真实生图失败时是否退回免费通道 |
| `IMAGE_FREE_MODEL` | `turbo` | 免费通道模型：`turbo` 快，`flux` 质量更好 |
| `MODELSCOPE_TOKEN` | - | 魔搭 API-Inference 访问令牌（每日免费额度，支持图生图） |
| `MODELSCOPE_IMAGE_MODEL` | `Qwen/Qwen-Image-Edit-2509` | 魔搭图像模型 |

三种典型配置：

```env
# 1. 纯演示，不调任何外部接口
AI_MODE=mock

# 2. 真实模型（以阿里云百炼兼容端点为例）
AI_MODE=auto
OPENAI_BASE_URL=https://xxx.cn-beijing.maas.aliyuncs.com/compatible-mode/v1
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL=qwen-plus
IMAGE_MODEL=qwen-image-2.1-pro

# 3. 免费额度（魔搭，支持图生图）
MODELSCOPE_TOKEN=ms-xxx
```

## 接口说明

| 接口 | 方法 | 说明 |
| --- | --- | --- |
| `/api/chat` | POST | 对话主接口，返回 **NDJSON 流** |
| `/api/listing` | POST | 生成 Listing 文案，真实模型失败时回退模板 |
| `/api/generate` | POST | 生图 / 图生图，返回图片 URL 列表 |

`/api/chat` 的流式事件：

| 事件 | 载荷 | 含义 |
| --- | --- | --- |
| `meta` | `intent` `mode` | 意图与当前运行模式 |
| `tool_start` | `tool` | 工具开始执行（名称、引擎、入参） |
| `tool_end` | `tool` | 工具执行结果 |
| `artifact` | `artifact` | 结构化产物（表格 / 报告 / 图片） |
| `token` | `text` | 正文增量 |
| `notice` | `text` | 降级等提示 |
| `done` | `credits` `mode` | 结束并结算算力 |
| `error` | `message` | 异常 |

## 目录结构

```
crosspilot/
├─ scripts/
│  ├─ eval.ts              # 评测入口（离线 + HTTP 两层）
│  └─ eval-cases.json      # 20 条用例与断言
├─ src/
│  ├─ app/
│  │  ├─ api/
│  │  │  ├─ chat/route.ts      # 流式对话 + 混合模式 + 熔断
│  │  │  ├─ listing/route.ts   # Listing 生成
│  │  │  └─ generate/route.ts  # 生图 / 图生图（三通道）
│  │  ├─ chat/[id]/page.tsx    # 会话页
│  │  ├─ studio/image|video    # 作图 / 视频
│  │  ├─ selection|listing|dashboard|skills|experts|pricing|automation|assets
│  │  ├─ layout.tsx  globals.css  page.tsx
│  ├─ components/
│  │  ├─ app-shell.tsx         # 侧边栏框架
│  │  ├─ chat/                 # 工具卡片、产物渲染、富文本
│  │  ├─ home-composer.tsx     # 首页输入框
│  │  ├─ studio-page.tsx       # 作图/视频共用页
│  │  └─ ui.tsx                # 基础组件（Badge/Button…）
│  └─ lib/
│     ├─ agent.ts              # 意图路由 + 演示计划生成 + 模型配置
│     ├─ store.tsx             # 全局状态 + localStorage + 算力
│     ├─ mock-data.ts          # 演示数据
│     ├─ types.ts              # 领域类型
│     └─ utils.ts              # cn / uid 等
```

## 核心机制

### 1. 对话流水线

```
用户输入
  └─ detectIntent()          关键词路由 → 8 类意图
      └─ 真实模型? ──是──> /chat/completions (stream:true) → 逐 token 转发
            │否
            └─ buildMockPlan() → 模拟工具调用节奏 + 生成产物
  └─ NDJSON 事件流 → 前端逐行解析 → 工具卡 / 正文 / 产物
```

意图共 8 类：`selection` `market` `listing` `ads` `store` `image` `video` `general`，每类有独立算力定价（如作图 30、视频 120）。

### 2. 混合模式与熔断

- `AI_MODE=auto` 且配置了 `OPENAI_BASE_URL` 才尝试真实模型，避免系统里残留的其他 `OPENAI_API_KEY` 导致误连 `api.openai.com` 超时。
- 真实调用失败后，60 秒内直接走演示数据（`liveDownUntil`），避免每个请求都等超时。
- 失败会通过 `notice` 事件告知前端，不静默。

### 3. 算力模型

- 发起前按「单价 × 数量」预估并扣减，界面按钮文案与实际扣费一致。
- 请求失败自动 `refundCredits()` 退款，并用 `creditsRef` 读取最新余额，避免闭包拿到旧值。
- 余额不足在前端拦截，不发请求。

### 4. 图像三通道

| 优先级 | 通道 | 触发条件 | 能力 |
| --- | --- | --- | --- |
| 1 | 魔搭 API-Inference | 配置 `MODELSCOPE_TOKEN` | 文生图 + **图生图**，每日免费额度 |
| 2 | OpenAI 兼容端点 | 配置 `IMAGE_MODEL` + Key | 文生图 + 图生图 |
| 3 | Pollinations | 前两者不可用时 | 仅文生图，免费无水印 |

图生图的关键：**不能降级成文生图**。若模型不可用，接口直接返回 502 并退算力，避免生成一张与商品无关的图。

### 5. 图生图链路

```
选择本地图片
  └─ FileReader → Image → canvas 等比缩放到最长边 1024
      └─ toDataURL('image/jpeg', 0.9)   // 控制请求体积
          └─ POST /api/generate { image: "data:image/jpeg;base64,..." }
              └─ 模型 image 字段 → 保留商品本体，替换场景
```

## 知识点总结

### Next.js / React

1. **App Router 与客户端组件边界**：页面默认是服务端组件；用到状态、事件、`localStorage` 的文件必须加 `"use client"`。边界尽量下沉，减少客户端包体积。
2. **Hydration Mismatch**：服务端渲染时读不到 `localStorage`，直接渲染本地会话会导致首屏 HTML 与客户端不一致。本项目用 `ready` 标志，挂载后再渲染本地数据。
3. **Route Handler 流式响应**：`new Response(stream, { headers })` + `ReadableStream` 可以逐块推送；服务端无需 WebSocket。
4. **NDJSON 优于 SSE 的场景**：一行一个 JSON，前端按 `\n` 切分即可；不需要处理 `data:` 前缀、心跳与重连。事件类型用 `type` 字段区分，拓展新事件不影响旧客户端。
5. **请求体兜底**：Route Handler 里 `await req.json()` 对空 body 会抛错，统一捕获后返回 400 或用默认值，避免 500 带堆栈。
6. **AbortController 的坑**：在 `useEffect` 清理函数里 abort 流式请求，会在组件重渲染/路由切换时误杀请求，表现为「一直正在思考」。

### AI 工程

7. **意图路由的优先级即产品语义**：「类目值不值得做」应判为 `market` 而不是 `selection`。关键词顺序就是业务优先级，必须有测试锁死，否则后续改动会悄悄翻转路由。
8. **Mock 也要有结构**：演示数据按真实工具链组织（工具名、引擎、入参、结果、产物），这样接真实模型时前端零改动。
9. **降级要可见**：所有 fallback 通过 `notice` 告诉用户当前是演示数据，避免误导决策。
10. **熔断窗口**：失败后短时间内不再尝试，是提升体验最低成本的手段。
11. **图生图的语义一致性**：有输入图时，提示词必须强调「保留参考图中的商品本体，只替换场景」，否则模型容易重绘商品。
12. **异步任务制 API**：魔搭这类接口是「提交 → 拿 `task_id` → 轮询」，需要超时上限与状态机（SUCCEED / FAILED），并兼容同步返回的实现。

### 前端工程

13. **图片压缩前置**：上传图在浏览器侧缩放再转 data URL，能显著降低请求体积与模型耗时；服务端仍要校验格式与大小上限。
14. **中文输入法**：`Enter` 发送必须判断 `e.nativeEvent.isComposing`，否则拼音选词会误触发。
15. **金额/算力一致性**：按钮展示、扣费、退款三处必须同一套公式，且失败路径也要覆盖。
16. **Tailwind 设计令牌**：把品牌色、圆角、阴影收进 `tailwind.config.ts`，组件里只引用语义类名，换肤成本低。

### 评测方法

17. **断言契约，不断言字符串**：校验意图、工具集合、产物类型、事件完整性，而不是比对固定文案，否则测试只是复述实现。
18. **两层评测**：离线层直接调用生产代码里的纯函数（快、稳定）；HTTP 层验证流式协议与端到端行为（真实网络路径）。
19. **评测发现的是「期望写错」还是「代码写错」**：本项目首次运行 18/19 失败，根因是用例期望与产品语义冲突，修正的是用例并补充优先级用例，而不是改代码迁就测试。

## 评测体系

```bash
npm run eval                                   # 离线：意图路由 + 计划结构
npm run eval -- --http http://localhost:3000   # 离线 + 端到端流式
```

- 用例：`scripts/eval-cases.json`，20 条，覆盖 8 类意图 + 3 条优先级用例。
- 断言字段：`intent` `minTools` `toolNames` `artifactTypes` `noArtifacts` `contentContains` `creditCostMin`。
- HTTP 层额外校验：`meta.intent` 正确、收到 `done` 且带算力、45 秒超时、无 `error` 事件。
- 任一失败退出码为 1，可直接接入 CI。

## 已知限制

- 无数据库与登录，会话与安装状态存在浏览器 `localStorage`，换设备不同步。
- 选品、店铺、广告数据为演示数据，未接真实平台 API。
- 视频生成仅有界面与参数，尚未接入模型。
- 定时任务为界面演示，没有真正的调度器。
- 真实生图依赖第三方额度，欠费/额度耗尽时会降级或报错。

## Roadmap

- [ ] 接入真实选品 / 广告 / 店铺数据源（卖家精灵、广告 API）
- [ ] 视频生成接入（图生视频）
- [ ] 会话与产物落库，支持多设备同步
- [ ] 技能编排可视化（多步工作流编排）
- [ ] 评测接入 CI，补充生图与 Listing 的端到端用例
- [ ] 真实账号体系与算力计费

## 安全说明

- `.env.local` 已在 `.gitignore` 中，密钥不会进仓库；**不要**把密钥写进 `.env.example` 或任何提交文件。
- 密钥一旦在聊天、日志、截图中出现，建议立即到控制台重置。
- 生产部署时，模型调用应放到服务端并加频率限制，避免前端直接持有密钥。

---

如果这个项目对你有帮助，欢迎点个 Star。
