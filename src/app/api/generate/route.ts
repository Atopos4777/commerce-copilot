import { NextRequest, NextResponse } from "next/server";
import { uid } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIZES: Record<string, { w: number; h: number }> = {
  "1:1": { w: 1024, h: 1024 },
  "4:3": { w: 1024, h: 768 },
  "3:4": { w: 768, h: 1024 },
  "16:9": { w: 1280, h: 720 },
  "9:16": { w: 720, h: 1280 },
};

// 能力名称 → 英文风格提示，帮助图像模型稳定出图
const ABILITY_HINTS: Record<string, string> = {
  商品套图: "clean studio product photo, soft diffused light, minimalist background",
  场景图合成: "product placed in a realistic lifestyle scene, natural window light, shallow depth of field",
  白底精修: "pure white seamless background, e-commerce main image, even lighting, no props",
  "AI 模特换装": "product worn by a model, fashion editorial lighting, natural pose",
  局部重绘: "seamless local retouch, matching lighting and texture",
  "换色 v2": "same product in a new colorway, accurate material and texture",
};

interface Payload {
  kind?: string;
  count?: number;
  prompt?: string;
  ratio?: string;
  ability?: string;
  image?: string;
}

/** 复用对话模型的 OpenAI 兼容配置，图片走 /images/generations */
function liveImageConfig() {
  const mode = (process.env.AI_MODE || "auto").toLowerCase();
  if (mode === "mock") return null;

  const key = process.env.OPENAI_API_KEY;
  const base = process.env.OPENAI_BASE_URL;
  if (!key) return null;
  if (mode !== "live" && !base) return null;

  return {
    key,
    baseUrl: (base || "https://api.openai.com/v1").replace(/\/$/, ""),
    model: process.env.IMAGE_MODEL || "gpt-image-1",
  };
}

/** 不同模型支持的尺寸不同，做一次映射 */
function apiSize(w: number, h: number, model: string) {
  if (w === h) return "1024x1024";
  if (model.startsWith("gpt-image")) return w > h ? "1536x1024" : "1024x1536";
  if (model.includes("dall-e-3")) return w > h ? "1792x1024" : "1024x1792";
  return `${w}x${h}`;
}

async function generateWithModel(
  config: { key: string; baseUrl: string; model: string },
  prompt: string,
  n: number,
  size: string,
  image?: string,
): Promise<string[]> {
  const callOnce = async (batch: number) => {
    // 不指定 response_format：各平台默认返回 url 或 b64，两种都兼容
    const body: Record<string, unknown> = { model: config.model, prompt, n: batch, size };
    // 有输入图时走图生图（qwen-image 系列用 image 字段接收）
    if (image) body.image = image;

    const res = await fetch(`${config.baseUrl}/images/generations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.key}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let detail = text.slice(0, 160);
      try {
        const j = JSON.parse(text);
        detail = j?.error?.message || j?.message || detail;
        if (/Arrearage|overdue-payment/i.test(text)) detail = "账户欠费或额度不足，请到阿里云控制台充值后重试";
        else if (/Free quota exhausted/i.test(text)) detail = "该模型免费额度已用尽，请充值后重试";
      } catch {
        /* 非 JSON 错误体，保留原文 */
      }
      throw new Error(`图片接口 ${res.status}：${detail.slice(0, 100)}`);
    }
    const json = await res.json().catch(() => null);
    const data = Array.isArray(json?.data) ? json.data : [];
    if (!data.length) throw new Error("图片接口返回为空");
    return data as { url?: string; b64_json?: string }[];
  };

  const out: string[] = [];
  // dall-e-3 只支持 n=1，需要按数量逐张请求
  if (config.model.includes("dall-e-3")) {
    for (let i = 0; i < n; i++) {
      for (const item of await callOnce(1)) {
        if (item.url) out.push(item.url);
        else if (item.b64_json) out.push(`data:image/png;base64,${item.b64_json}`);
      }
    }
  } else {
    for (const item of await callOnce(n)) {
      if (item.url) out.push(item.url);
      else if (item.b64_json) out.push(`data:image/png;base64,${item.b64_json}`);
    }
  }
  return out.filter(Boolean).slice(0, n);
}

/** 魔搭 API-Inference：注册即用、每日免费额度，异步任务制，支持图生图 */
function modelScopeConfig() {
  const token = process.env.MODELSCOPE_TOKEN;
  if (!token) return null;
  return { token, model: process.env.MODELSCOPE_IMAGE_MODEL || "Qwen/Qwen-Image-Edit-2509" };
}

async function generateWithModelScope(
  cfg: { token: string; model: string },
  prompt: string,
  n: number,
  size: string,
  image?: string,
): Promise<string[]> {
  const base = "https://api-inference.modelscope.cn/v1";
  const body: Record<string, unknown> = { model: cfg.model, prompt };
  if (image) body.image_url = [image];
  else {
    body.n = n;
    body.size = size;
  }

  const submit = await fetch(`${base}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
      "X-ModelScope-Async-Mode": "true",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });
  const submitText = await submit.text().catch(() => "");
  if (!submit.ok) throw new Error(`魔搭接口 ${submit.status}：${submitText.slice(0, 100)}`);

  let submitJson: any = {};
  try {
    submitJson = JSON.parse(submitText || "{}");
  } catch {
    throw new Error("魔搭接口返回非 JSON");
  }

  // 同步返回的情况
  const direct = Array.isArray(submitJson.images) ? submitJson.images : Array.isArray(submitJson.data) ? submitJson.data : [];
  if (direct.length) {
    return direct
      .map((it: any) => (typeof it === "string" ? it : it?.url))
      .filter(Boolean)
      .slice(0, n);
  }

  const taskId = submitJson.task_id;
  if (!taskId) throw new Error("魔搭未返回 task_id");

  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));
    const q = await fetch(`${base}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${cfg.token}`, "X-ModelScope-Task-Type": "image_generation" },
      signal: AbortSignal.timeout(30_000),
    });
    const j = await q.json().catch(() => ({}) as any);
    if (j.task_status === "SUCCEED") {
      const outs: string[] = Array.isArray(j.output_images) ? j.output_images : [];
      if (!outs.length) throw new Error("魔搭任务成功但未返回图片");
      return outs.slice(0, n);
    }
    if (j.task_status === "FAILED") {
      throw new Error(j?.errors?.message || "魔搭任务失败");
    }
  }
  throw new Error("魔搭任务超时（180s）");
}

/** 无 Key 时的免费通道（Pollinations，无需注册） */
function freeImageUrls(prompt: string, n: number, w: number, h: number, seed: number) {
  const model = process.env.IMAGE_FREE_MODEL || "turbo";
  return Array.from({ length: n }, (_, i) => {
    const q = new URLSearchParams({
      width: String(w),
      height: String(h),
      seed: String(seed + i),
      model,
      nologo: "true",
    });
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${q.toString()}`;
  });
}

export async function POST(req: NextRequest) {
  let payload: Payload = {};
  try {
    payload = (await req.json()) as Payload;
  } catch {
    /* 空请求体按默认参数处理 */
  }

  const kind = payload.kind === "video" ? "video" : "image";
  const rawCount = Number(payload.count);
  const count = Number.isFinite(rawCount) ? Math.min(Math.max(Math.trunc(rawCount), 1), 8) : 4;
  const ratio = payload.ratio && SIZES[payload.ratio] ? payload.ratio : kind === "video" ? "9:16" : "1:1";
  const { w, h } = SIZES[ratio];
  const seed = Date.now();

  // 视频模型暂未接入，保留占位，前端据 notice 提示
  if (kind === "video") {
    await new Promise((r) => setTimeout(r, 1200));
    return NextResponse.json({
      id: uid("job"),
      kind,
      count,
      seed: `video-${seed}`,
      createdAt: seed,
      mode: "placeholder",
      images: [],
      notice: "视频生成尚未接入模型，当前为演示占位",
    });
  }

  const rawPrompt = (payload.prompt || "").trim().slice(0, 500);
  const hint = ABILITY_HINTS[payload.ability || ""] || "";

  const image = typeof payload.image === "string" ? payload.image.trim() : "";
  if (image && !/^data:image\/(png|jpe?g|webp);base64,/i.test(image) && !/^https?:\/\//i.test(image)) {
    return NextResponse.json({ error: "上传图片格式不支持，请用 JPG / PNG / WEBP" }, { status: 400 });
  }
  if (image.length > 12_000_000) {
    return NextResponse.json({ error: "上传图片过大，请压缩后再试" }, { status: 413 });
  }

  const prompt = [
    hint,
    image ? "keep the exact product from the reference image, only replace the scene and background" : "",
    rawPrompt || "professional e-commerce product photo",
    "high quality, no text, no watermark",
  ]
    .filter(Boolean)
    .join(", ");

  let images: string[] = [];
  let mode: "live" | "free" = "free";
  let notice: string | undefined;
  let liveError: string | undefined;

  const config = liveImageConfig();
  const ms = modelScopeConfig();

  if (ms) {
    try {
      images = await generateWithModelScope(ms, prompt, count, `${w}x${h}`, image || undefined);
      mode = "live";
    } catch (e) {
      liveError = `魔搭调用失败（${(e as Error).message.slice(0, 90)}）`;
    }
  }

  if (!images.length && config) {
    try {
      images = await generateWithModel(config, prompt, count, apiSize(w, h, config.model), image || undefined);
      mode = "live";
      liveError = undefined;
    } catch (e) {
      liveError = `模型调用失败（${(e as Error).message.slice(0, 90)}）`;
    }
  }

  if (!images.length) {
    // 图生图必须用真实模型，免费通道无法保留商品本体
    if (image) {
      return NextResponse.json(
        { error: liveError ?? "当前未配置支持图片输入的图像模型，无法完成图生图" },
        { status: 502 },
      );
    }
    if (liveError) notice = `${liveError}，已切换到免费通道`;
    if (process.env.IMAGE_FREE_FALLBACK === "off") {
      return NextResponse.json({ error: "未配置可用的生图模型" }, { status: 502 });
    }
    images = freeImageUrls(prompt, count, w, h, seed);
  }

  return NextResponse.json({
    id: uid("job"),
    kind,
    count: images.length,
    seed: `image-${seed}`,
    createdAt: seed,
    mode,
    images,
    usedImage: Boolean(image),
    notice,
  });
}
