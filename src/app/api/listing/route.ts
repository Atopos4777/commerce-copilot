import { NextRequest, NextResponse } from "next/server";
import { aiConfig } from "@/lib/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ListingResult {
  title: string;
  bullets: string[];
  description: string;
  searchTerms: string[];
  aplus: string[];
  mode: "live" | "mock";
}

function mockListing(product: string, keyword: string, features: string): ListingResult {
  const core = keyword || "product";
  return {
    mode: "mock",
    title: `${product || "Reusable Cleaning Tool"} for Home & Travel — ${core
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")}, Durable & Easy to Clean`,
    bullets: [
      `ONE-SWIPE RESULTS — ${product || "本品"}一次操作即可完成大面积清理，无需电源、无需耗材，适合日常高频使用。`,
      "REUSABLE & MESS-FREE — 可反复使用，集尘仓一键开盖倾倒，长期成本低于一次性替代品。",
      "WORKS ON EVERY SURFACE — 织物、绒面、硬质表面均适用，附赠缝隙刷处理边角。",
      "SAFE FOR FAMILY & PETS — 无胶、无刺激性化学涂层，适合有孩子与宠物的家庭。",
      "ERGONOMIC & COMPACT — 防滑手柄贴合掌心，自带收纳挂钩，不占抽屉空间。",
    ],
    description: `这款${product || "产品"}为高频清洁场景设计，核心卖点是${features || "省力、可重复使用、适配多种表面"}。相比同类产品，我们减少了耗材依赖，并把清洁步骤压缩到「滚 → 开盖 → 倒」三步，适合放在客厅、车内或办公桌随手使用。`,
    searchTerms: [core, `${core} for couch`, `reusable ${core}`, `best ${core}`, `${core} for pet hair`],
    aplus: [
      "模块 1：使用前后对比图（真实场景）",
      "模块 2：三步使用说明（滚 → 开盖 → 倒）",
      "模块 3：与一次性产品的成本对比表",
      "模块 4：材质与安全认证说明",
    ],
  };
}

export async function POST(req: NextRequest) {
  let payload: { product?: string; keyword?: string; features?: string } = {};
  try {
    payload = (await req.json()) as typeof payload;
  } catch {
    /* 空请求体或非 JSON 时按空表单处理，仍返回可用文案 */
  }
  const product = typeof payload.product === "string" ? payload.product : "";
  const keyword = typeof payload.keyword === "string" ? payload.keyword : "";
  const features = typeof payload.features === "string" ? payload.features : "";

  const config = aiConfig();
  if (!config) {
    await new Promise((r) => setTimeout(r, 900));
    return NextResponse.json(mockListing(product, keyword, features));
  }

  try {
    const resp = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.key}` },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "你是亚马逊 Listing 文案专家。只输出 JSON，字段为 title(string)、bullets(string[5])、description(string)、searchTerms(string[])、aplus(string[])。简体中文说明 + 英文文案，避免绝对化违禁词。",
          },
          {
            role: "user",
            content: `商品：${product}\n核心关键词：${keyword}\n卖点：${features}`,
          },
        ],
      }),
    });
    if (!resp.ok) throw new Error(`upstream ${resp.status}`);
    const data = await resp.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    const result: ListingResult = {
      title: parsed.title ?? "",
      bullets: parsed.bullets ?? [],
      description: parsed.description ?? "",
      searchTerms: parsed.searchTerms ?? [],
      aplus: parsed.aplus ?? [],
      mode: "live",
    };
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(mockListing(product, keyword, features));
  }
}
