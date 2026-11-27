import type { Artifact, Candidate, ToolCall } from "./types";
import { candidates as pool } from "./mock-data";

export type Intent = "selection" | "market" | "listing" | "ads" | "store" | "image" | "video" | "general";

export interface MockPlan {
  intent: Intent;
  creditCost: number;
  tools: Omit<ToolCall, "id" | "status" | "duration">[];
  artifacts: Artifact[];
  content: string;
}

const pick = (n: number) => pool.slice(0, n);

function tableArtifact(items: Candidate[]): Artifact {
  return {
    id: "art_candidates",
    type: "table",
    title: "候选产品清单",
    subtitle: `美国站 · 宠物/家居 · 共 ${items.length} 个`,
    columns: ["主图", "标题", "ASIN", "价格", "BSR", "月销", "评分"],
    rows: items.map((c) => [
      "",
      c.title,
      c.asin,
      `$${c.price.toFixed(2)}`,
      String(c.bsr),
      String(c.monthlySales),
      String(c.rating),
    ]),
    items,
  };
}

export function detectIntent(prompt: string): Intent {
  const p = prompt.toLowerCase();
  if (/视频|口播|短片|剪辑|video/.test(p)) return "video";
  if (/主图|场景图|白底|模特|换装|修图|作图|图片|image/.test(p)) return "image";
  if (/listing|标题|五点|文案|描述|卖点|a\+/.test(p)) return "listing";
  if (/广告|acos|否词|竞价|投放|搜索词/.test(p)) return "ads";
  if (/市场|类目|趋势|容量|值不值得|机会|进入/.test(p)) return "market";
  if (/店铺|库存|订单|销量下滑|诊断|日报|复盘/.test(p)) return "store";
  if (/选品|产品|长尾|竞品|价格|asin|货源|利润|对标/.test(p)) return "selection";
  return "general";
}

export function buildMockPlan(prompt: string, expertName: string): MockPlan {
  const intent = detectIntent(prompt);
  const topic = prompt.replace(/\s+/g, " ").slice(0, 46);

  if (intent === "selection") {
    const items = pick(4);
    return {
      intent,
      creditCost: 12,
      tools: [
        {
          name: "关键词搜索",
          engine: "卖家精灵",
          input: { market: "US", priceMin: 15, priceMax: 35, monthlySalesMin: 1000, reviewsMax: 3000 },
          output: "matched: 486 → filtered: 37",
        },
        {
          name: "价格历史",
          engine: "Keepa",
          input: { asins: items.slice(0, 2).map((i) => i.asin).join(","), range: "90d" },
          output: "均价波动 ±6%，未出现持续价格战",
        },
        {
          name: "评论痛点聚类",
          engine: "卖家精灵",
          input: { stars: "1-3", range: "12m" },
          output: "吸附力衰减 / 清理麻烦 / 手柄松动",
        },
      ],
      artifacts: [tableArtifact(items)],
      content: `已按你的需求「${topic}」完成一轮筛选，共命中 **37 个候选**，结合竞争度、利润率与评论壁垒排序后，建议优先跟进以下 4 个：\n\n- **宠物去毛滚筒 · $18.99**：BSR 1,240 / 月销约 4,200 / 评论 682，头部壁垒最低，是最优切入位。\n- **可折叠收纳箱 · $24.99**：搜索结果 6,200 件/月，价格带尚未被品牌锁定，适合做尺寸差异。\n- **汽车座椅缝隙收纳 · $19.99**：搜索量 90 天 +31%，评论门槛仅 640，机会窗口明确。\n- **猫咪饮水机 · $32.99**：需求稳定但评论壁垒 2,105，建议以「静音 + 易拆洗」做差异化。\n\n**关键判断**\n\n- 近 90 天类目搜索量 +18%，需求仍在上升，不是衰退类目。\n- 头部 Listing 评论中位数 1,240，低于 2,000 的类目通常仍有新品空间。\n- 价格带集中在 $16–22，建议首发定价 $19.99，并把两件套作为第二 SKU 拉客单价。\n\n下一步我可以：① 按利润率重排 ② 为前 3 个生成 Listing ③ 拉取 30 天价格走势。`,
    };
  }

  if (intent === "listing") {
    return {
      intent,
      creditCost: 8,
      tools: [
        {
          name: "商品信息读取",
          engine: "商品库",
          input: { source: "candidate-product" },
          output: "已读取主图、材质、尺寸与 3 条竞品评论",
        },
        {
          name: "关键词匹配",
          engine: "词库",
          input: { library: "宠物-核心词", match: "exact+phrase" },
          output: "核心词 3 个，长尾词 12 个，已控密度",
        },
        {
          name: "合规扫描",
          engine: "合规检测",
          input: { fields: ["title", "bullets", "description"] },
          output: "未发现违禁词，2 处绝对化表达已改写",
        },
      ],
      artifacts: [
        {
          id: "art_listing",
          type: "report",
          title: "Listing 草稿 · 美国站",
          subtitle: "标题 + 五点 + A+ 文案",
          content: `【标题】\nReusable Pet Hair Remover Roller for Couch, Carpet & Car Seats — No Adhesive, Eco-Friendly Lint Brush for Dog & Cat Hair\n\n【五点描述】\n1. ONE-SWIPE CLEAN — 双向滚轮结构一次带走沙发、床品与车座上的宠物毛发，无需撕纸、无需电源。\n2. REUSABLE & MESS-FREE — 集毛仓一键开盖倾倒，可反复使用 5 年以上，长期成本低于一次性粘毛器。\n3. WORKS ON EVERY SURFACE — 短毛、长毛、绒面与织物均适用，附赠缝隙刷处理沙发边角。\n4. PET & FAMILY SAFE — 无胶、无化学涂层，通过母婴接触安全测试，适合有孩子与宠物的家庭。\n5. ERGONOMIC GRIP — 防滑手柄贴合掌心，单手即可完成大面积清理，收纳挂钩不占空间。\n\n【搜索词】pet hair remover, lint roller for couch, dog hair remover, reusable lint brush, cat hair cleaner\n\n【A+ 模块建议】\n- 模块 1：使用前后对比图（沙发场景）\n- 模块 2：三步使用说明（滚 → 开盖 → 倒）\n- 模块 3：与一次性粘毛器的成本对比表`,
        },
      ],
      content: `已基于商品信息与词库生成一版美国站 Listing 草稿，核心词 **pet hair remover** 已自然埋入标题与五点，字符数控制在亚马逊限制内。\n\n**这一版的处理重点**\n\n- 标题采用「核心词 + 使用场景 + 差异化卖点」结构，前 80 字符覆盖主搜索词。\n- 五点每条以大写短语开头，覆盖一个具体场景，避免形容词堆砌。\n- 原文 2 处绝对化表达（best / 100%）已改写，降低下架风险。\n\n右侧是可直接复制的草稿，你可以继续让我：① 换一版更口语化的 ② 生成德语/日语版 ③ 把五点压缩到 500 字符内。`,
    };
  }

  if (intent === "market") {
    return {
      intent,
      creditCost: 14,
      tools: [
        {
          name: "谷歌趋势检索",
          engine: "谷歌趋势",
          input: { keywords: ["pet hair remover", "cat water fountain"], region: "US", range: "5y" },
          output: "5 年趋势平稳上行，Q4 为旺季，峰值为均值 1.4 倍",
        },
        {
          name: "类目容量统计",
          engine: "卖家精灵",
          input: { category: "Pet Supplies", market: "US" },
          output: "月 GMV 约 $8.6M，CR10 品牌集中度 34%",
        },
        {
          name: "评论壁垒分析",
          engine: "Jungle Scout",
          input: { topN: 30 },
          output: "Top30 评论中位数 1,240，6 个 Listing 评论 < 500",
        },
      ],
      artifacts: [
        {
          id: "art_market",
          type: "report",
          title: "市场机会分析报告",
          subtitle: "美国站 · 宠物清洁类目",
          content: `【结论】建议进入，以低价长尾 + 场景差异化切入。\n\n【类目容量】月 GMV 约 $8.6M，同比 +12%，需求稳定且季节性温和。\n\n【竞争格局】CR10 品牌集中度 34%，远低于 3C 类目的 70%+，仍有白牌空间；Top30 评论中位数 1,240，6 个 Listing 评论数低于 500。\n\n【价格带】$15–22 贡献 48% 销量，$25 以上以套装与品牌款为主。\n\n【风险】① 头部卖家开始布局视频广告，CPC 预计上涨 15%；② 部分款式存在外观专利，上架前需做侵权初筛。\n\n【建议动作】首发 2 个 SKU（单品 $19.99 / 两件套 $34.99），先跑 30 天广告验证转化，再决定是否备货。`,
        },
      ],
      content: `我把这个类目拆成了「容量 / 竞争 / 价格带 / 风险」四层来看，结论是 **建议进入，但要选对价位**。\n\n**核心发现**\n\n- 类目月 GMV 约 **$8.6M**，同比 +12%，Q4 是旺季但全年波动不大，适合稳定备货。\n- CR10 品牌集中度只有 34%，说明还没有被少数品牌锁死；Top30 里有 6 个 Listing 评论数低于 500，新品有可见的上升通道。\n- $15–22 价格带贡献近一半销量，$25 以上主要靠套装与品牌溢价。\n\n**主要风险**\n\n- 头部已开始加大视频广告，预计 CPC 环比上涨 15%，冷启动预算要留足。\n- 部分款式有外观专利，上架前建议跑一遍侵权初筛。\n\n右侧报告里有完整的定价与备货建议。需要我继续拆某个竞品的流量结构吗？`,
    };
  }

  if (intent === "ads") {
    return {
      intent,
      creditCost: 8,
      tools: [
        {
          name: "广告报表拉取",
          engine: "亚马逊广告",
          input: { range: "30d", level: "search-term" },
          output: "1,284 个搜索词，花费 $12,420",
        },
        {
          name: "低效词聚类",
          engine: "LinkFoxAI",
          input: { minClicks: 15, maxCvr: 0.01 },
          output: "识别 26 个高耗低效词，占花费 18.4%",
        },
      ],
      artifacts: [
        {
          id: "art_ads",
          type: "table",
          title: "否词候选清单",
          subtitle: "近 30 天 · 点击 ≥ 15 且零转化",
          columns: ["搜索词", "点击", "花费", "订单", "建议"],
          rows: [
            ["pet hair remover brush for clothes", "86", "$128.40", "0", "精准否定"],
            ["dog hair vacuum attachment", "64", "$96.20", "0", "精准否定"],
            ["lint roller refill", "58", "$74.10", "0", "词组否定"],
            ["cat hair remover glove", "41", "$52.80", "0", "精准否定"],
            ["car upholstery cleaner machine", "37", "$61.30", "0", "精准否定"],
          ],
        },
      ],
      content: `看完近 30 天的搜索词报告，问题主要不在出价，而在 **流量结构**：有 26 个高耗低效词吃掉了 18.4% 的预算。\n\n**优先处理**\n\n- 先把右侧 5 个「点击 ≥ 15 且零转化」的词做精准否定，预计每周省下约 **$210**。\n- 「lint roller refill」属于配件词，建议做词组否定，避免误伤主词流量。\n- 把省下的预算迁移到转化率 > 8% 的 3 个长尾词，竞价上浮 15%。\n\n**结构建议**\n\n- 手动精准与自动各保留一组，自动组只跑发现，不承担出单。\n- SB 视频广告预算受限，建议单独提额，它的 ACOS 比 SP 低 1.2 个百分点。\n\n需要我直接生成可导入广告后台的否词 CSV 吗？`,
    };
  }

  if (intent === "store") {
    return {
      intent,
      creditCost: 12,
      tools: [
        {
          name: "销售数据拉取",
          engine: "店铺经营",
          input: { range: "30d", site: "US" },
          output: "GMV $128,430，环比 +6.4%",
        },
        {
          name: "流量与转化拆解",
          engine: "店铺经营",
          input: { compare: "wow" },
          output: "会话数 +9.1%，转化率 -0.8pt",
        },
        {
          name: "库存与评价扫描",
          engine: "店铺经营",
          input: { threshold: 30 },
          output: "3 个 ASIN 库存低于 30 天，新增 7 条差评",
        },
      ],
      artifacts: [
        {
          id: "art_store",
          type: "report",
          title: "店铺经营诊断",
          subtitle: "近 30 天 · 美国站",
          content: `【经营概览】GMV $128,430（+6.4%），订单 3,842（+4.1%），ACOS 21.4%（-2.1pt）。\n\n【主要问题】\n1. 转化率 9.8%，环比 -0.8pt，主要集中在 B0D1M8T4P2（烘焙垫），详情页停留时长下降 14%。\n2. 3 个 ASIN 库存可售天数低于 30 天，其中 B0D1M8T4P2 仅 18 天，存在断货风险。\n3. 新增 7 条差评，5 条提到「包装破损」，集中在同一批物流。\n\n【行动清单】\n- P0：为烘焙垫补货 600 件，预计 12 天到仓。\n- P0：更换包装耗材，增加气泡袋，联系货代核查该批次。\n- P1：烘焙垫主图第 2 张改为使用场景图，测试 7 天。\n- P2：把 ACOS 低于 18% 的 3 个活动预算上浮 20%。`,
        },
      ],
      content: `这个月整体在涨，但有两个问题会吃掉下个月的利润，先说结论：**不是流量问题，是转化和库存**。\n\n- GMV **$128,430**（+6.4%），会话数 +9.1%，但转化率从 10.6% 掉到 **9.8%**，跌得最多的是烘焙垫，详情页停留时长 -14%。\n- **B0D1M8T4P2 库存只剩 18 天**，按当前销量会在下月初断货，建议立刻补 600 件。\n- 新增 7 条差评里 5 条是「包装破损」，集中在同一批次，需要同步货代核查。\n\n优先级建议：先补货 + 改包装（P0），再做主图 A/B 测试（P1），最后调整广告预算（P2）。右侧诊断报告里有完整动作清单。`,
    };
  }

  if (intent === "image") {
    return {
      intent,
      creditCost: 30,
      tools: [
        {
          name: "商品识别",
          engine: "LinkFoxAI",
          input: { task: "product-understanding", keepSubject: true },
          output: "识别为「家居清洁工具」，主体边缘已锁定",
        },
        {
          name: "场景生成",
          engine: "LinkFoxAI",
          input: { ratio: "1:1", count: 4, style: "nordic-living-room" },
          output: "已生成 4 张候选，光影与透视自动匹配",
        },
      ],
      artifacts: [
        {
          id: "art_image",
          type: "image",
          title: "商品套图 · 4 张",
          subtitle: "1:1 · 2000×2000 · 保留商品本体",
          seed: "product-suite",
        },
      ],
      content: `已按「保留商品本体、替换为北欧家居场景」生成 **4 张**候选图，主体边缘、材质与阴影都做了保留处理。\n\n- 场景统一为浅木色 + 米白墙面，突出商品但不抢主体。\n- 第 2、4 张加入了手部使用动作，适合做主图第 2 位。\n- 全部输出 2000×2000，符合亚马逊主图规范。\n\n右侧可以直接下载，或让我继续：① 换一套户外场景 ② 局部重绘背景 ③ 生成 A+ 横幅尺寸。`,
    };
  }

  if (intent === "video") {
    return {
      intent,
      creditCost: 120,
      tools: [
        {
          name: "分镜脚本生成",
          engine: "LinkFoxAI",
          input: { duration: 15, structure: "hook-pain-demo-cta" },
          output: "4 段分镜，含口播与字幕节奏",
        },
        {
          name: "视频合成",
          engine: "Seedance 2.5",
          input: { ratio: "9:16", duration: 15, resolution: "1080p" },
          output: "渲染完成，已生成 1 条 15s 带货视频",
        },
      ],
      artifacts: [
        {
          id: "art_video",
          type: "video",
          title: "15s 带货视频 · 竖版",
          subtitle: "9:16 · 1080p · 含口播字幕",
          seed: "video-sale",
        },
      ],
      content: `15 秒竖版带货视频已生成，结构是 **3 秒钩子 → 痛点 → 演示 → CTA**。\n\n- 前 3 秒用「沙发全是毛」的特写抓注意力，避免开场品牌 Logo。\n- 演示段保留真实使用动作，字幕强调「不用撕纸、可重复用」。\n- 结尾 2 秒给出价格锚点与购物车指向。\n\n需要我再出 3 个不同钩子的版本做 A/B 测试吗？或者换成 30 秒口播版？`,
    };
  }

  return {
    intent: "general",
    creditCost: 6,
    tools: [
      {
        name: "知识检索",
        engine: "LinkFox 知识库",
        input: { query: prompt.slice(0, 40) },
        output: "命中 6 篇运营文档与 3 个同类案例",
      },
    ],
    artifacts: [],
    content: `我是 ${expertName}。关于「${topic}」，可以先按这个框架判断：\n\n- **目标**：先明确你要的是结论、清单还是可直接使用的素材。\n- **依据**：跨境电商的多数判断依赖站点、类目、价格带三个前提，缺一个结论就会偏。\n- **下一步**：把站点与类目补给我，我可以直接调用对应技能拉数据，而不是给通用建议。\n\n你也可以从首页选择一个专家（选品分析 / 市场分析 / Listing 生成），它们的流程更聚焦。`,
  };
}

export function aiConfig() {
  const mode = (process.env.AI_MODE || "auto").toLowerCase();
  if (mode === "mock") return null;

  const key = process.env.OPENAI_API_KEY;
  const base = process.env.OPENAI_BASE_URL;
  if (!key) return null;
  // auto 模式下必须显式配置 BASE_URL 才启用真实模型，
  // 避免系统里残留的其他项目 Key 把演示环境拖入长时间超时。
  if (mode !== "live" && !base) return null;

  return {
    key,
    baseUrl: (base || "https://api.openai.com/v1").replace(/\/$/, ""),
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  };
}
