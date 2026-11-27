"use client";

import Link from "next/link";
import React from "react";
import {
  ArrowUpRight,
  Download,
  Image as ImageIcon,
  Loader2,
  Play,
  Sparkles,
  Upload,
  Video,
  Wand2,
  X,
} from "lucide-react";
import { Badge, Button, EmptyState, PageHeader } from "@/components/ui";
import { useAppActions, useAppState } from "@/lib/store";
import { cn, gradientFor } from "@/lib/utils";

const IMAGE_ABILITIES = ["商品套图", "场景图合成", "白底精修", "AI 模特换装", "局部重绘", "换色 v2"];
const VIDEO_ABILITIES = ["图生视频", "带货口播", "视频复刻", "视频翻译"];

const IMAGE_PROMPTS = [
  "把商品放进北欧风客厅，浅木色地板，自然侧光，保留商品本体",
  "生成厨房使用场景，突出材质细节，暖色调，留白适合放卖点文字",
  "白底主图精修，去除杂物与阴影，输出 2000×2000 合规主图",
];
const VIDEO_PROMPTS = [
  "15 秒竖版带货视频，3 秒钩子 + 痛点演示 + 价格 CTA，真人手持出镜",
  "把商品图转成 5 秒循环动态视频，轻微镜头推进，背景虚化",
  "生成一段英文口播，介绍三个核心卖点，字幕居中",
];

interface Result {
  id: string;
  ability: string;
  prompt: string;
  seed: string;
  at: number;
  url?: string;
}

const SIZE_LABEL: Record<string, string> = {
  "1:1": "1024×1024",
  "4:3": "1024×768",
  "3:4": "768×1024",
  "16:9": "1280×720",
  "9:16": "720×1280",
};

/** 读取本地图片并压到最长边 1024，转成 data URL 传给图像模型 */
function fileToDataUrl(file: File, max = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("读取图片失败"));
    reader.onload = () => {
      const src = String(reader.result);
      const img = new Image();
      img.onerror = () => reject(new Error("图片解析失败"));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

export function StudioPage({ mode }: { mode: "image" | "video" }) {
  const isVideo = mode === "video";
  const abilities = isVideo ? VIDEO_ABILITIES : IMAGE_ABILITIES;
  const examples = isVideo ? VIDEO_PROMPTS : IMAGE_PROMPTS;
  const cost = isVideo ? 120 : 30;
  const { credits } = useAppState();
  const { spendCredits, refundCredits, toast } = useAppActions();

  const [ability, setAbility] = React.useState(abilities[0]);
  const [prompt, setPrompt] = React.useState("");
  const [ratio, setRatio] = React.useState(isVideo ? "9:16" : "1:1");
  const [count, setCount] = React.useState(4);
  const [upload, setUpload] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<Result[]>([]);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const generate = async () => {
    if (!prompt.trim() && !upload) {
      toast("先上传商品图或描述你想要的画面", "info");
      return;
    }
    if (!spendCredits(cost * count, isVideo ? "视频生成" : "AI 作图")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: mode, count, prompt: prompt.trim(), ratio, ability, image: upload || undefined }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        seed: string;
        count: number;
        images?: string[];
        mode?: string;
        usedImage?: boolean;
        notice?: string;
      };
      if (!data || typeof data.count !== "number") throw new Error("返回格式异常");
      const urls = Array.isArray(data.images) ? data.images : [];
      const now = Date.now();
      const next: Result[] = Array.from({ length: data.count }).map((_, i) => ({
        id: `${data.seed}-${i}`,
        ability,
        prompt: prompt.trim() || (upload ? "（未填写描述，按上传商品图生成）" : "（未填写提示词，按默认风格生成）"),
        seed: `${data.seed}-${i}`,
        at: now,
        url: urls[i],
      }));
      setResults((prev) => [...next, ...prev]);
      const channel = data.mode === "live" ? "模型生成" : data.mode === "free" ? "免费通道" : "演示占位";
      const extra = data.usedImage ? " · 已参考上传的商品图" : "";
      toast(`已生成 ${data.count} ${isVideo ? "条视频" : "张图片"}（${channel}${extra}），消耗 ${cost * count} 算力`);
      if (data.notice) toast(data.notice, "info");
    } catch (e) {
      refundCredits(cost * count);
      toast(`生成失败：${(e as Error).message}，算力已退回`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
      <PageHeader
        eyebrow="AI Studio"
        title={isVideo ? "视频生成" : "AI 作图"}
        description={
          isVideo
            ? "图生视频、带货口播、视频复刻与翻译。输出 9:16 / 16:9，可直接用于 TikTok、Reels 与商品详情页。"
            : "商品套图、场景合成、白底精修与模特换装。保留商品本体，输出符合平台规范的尺寸。"
        }
        actions={
          <>
            <div className="inline-flex items-center gap-1 rounded-xl bg-cloud-100 p-1">
              <Link
                href="/studio/image"
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[12px] font-medium transition",
                  mode === "image" ? "bg-white text-ink-900 shadow-sm" : "text-cloud-500 hover:text-ink-900",
                )}
              >
                作图
              </Link>
              <Link
                href="/studio/video"
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[12px] font-medium transition",
                  mode === "video" ? "bg-white text-ink-900 shadow-sm" : "text-cloud-500 hover:text-ink-900",
                )}
              >
                视频
              </Link>
            </div>
            <span className="hidden items-center gap-1 text-[11px] text-cloud-400 sm:flex">
              <Sparkles size={12} className="text-brand-500" /> 剩余 {credits.toLocaleString()} 算力
            </span>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        {/* control panel */}
        <div className="card h-fit p-4">
          <div className="text-[12px] font-semibold text-ink-900">{isVideo ? "1. 上传商品图" : "1. 上传商品图"}</div>
          <div
            onClick={() => fileRef.current?.click()}
            className="group mt-2 flex h-[132px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-cloud-300 bg-cloud-50 transition hover:border-brand-300 hover:bg-brand-50/40"
          >
            {upload ? (
              <div className="relative h-full w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={upload} alt="上传的商品图" className="h-full w-full object-cover" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUpload(null);
                  }}
                  className="absolute right-1.5 top-1.5 rounded-md bg-black/50 p-1 text-white"
                >
                  <X size={11} />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white text-cloud-400 shadow-card transition group-hover:text-brand-500">
                  <Upload size={15} />
                </div>
                <div className="mt-2 text-[11.5px] text-cloud-600">点击上传白底图 / 平铺图</div>
                <div className="mt-0.5 text-[10px] text-cloud-400">支持 JPG / PNG，建议 2000px 以上</div>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                setUpload(await fileToDataUrl(f));
              } catch {
                toast("图片读取失败，请换一张试试", "error");
              }
              e.target.value = "";
            }}
          />

          <div className="mt-4 text-[12px] font-semibold text-ink-900">2. 选择能力</div>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {abilities.map((a) => (
              <button
                key={a}
                onClick={() => setAbility(a)}
                className={cn(
                  "rounded-lg border px-1.5 py-2 text-[10.5px] transition",
                  ability === a
                    ? "border-brand-300 bg-brand-50 font-medium text-brand-600"
                    : "border-cloud-200 bg-white text-cloud-500 hover:border-cloud-300 hover:text-ink-900",
                )}
              >
                {a}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-ink-900">3. 描述画面</span>
            <button
              onClick={() => {
                setPrompt(examples[Math.floor(Math.random() * examples.length)]);
                toast("已填入一条示例提示词", "info");
              }}
              className="flex items-center gap-1 text-[10.5px] text-brand-600 hover:underline"
            >
              <Wand2 size={10} /> 用示例
            </button>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder={isVideo ? "描述镜头、节奏、口播内容…" : "描述场景、光线、材质与构图，越具体越稳定…"}
            className="field mt-2 resize-none text-[11.5px] leading-relaxed"
          />

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <label className="label">比例</label>
              <select value={ratio} onChange={(e) => setRatio(e.target.value)} className="field py-2 text-[11.5px]">
                {(isVideo ? ["9:16", "16:9", "1:1"] : ["1:1", "4:3", "3:4", "16:9"]).map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">数量</label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="field py-2 text-[11.5px]"
              >
                {[1, 2, 4].map((n) => (
                  <option key={n} value={n}>
                    {n} {isVideo ? "条" : "张"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="btn-primary mt-4 h-9 w-full text-[12.5px]"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : isVideo ? <Video size={14} /> : <Sparkles size={14} />}
            {loading ? "生成中…" : `开始生成 · ${cost * count} 算力`}
          </button>
          <p className="mt-2 text-center text-[9.5px] text-cloud-400">
            {isVideo ? "视频生成约 60–120 秒" : "单张约 5–20 秒"} · 生成失败自动返还算力
          </p>
        </div>

        {/* results */}
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-[14px] font-semibold text-ink-900">{loading ? "正在生成" : "生成结果"}</h2>
              <p className="mt-0.5 text-[11px] text-cloud-400">
                {results.length ? `本次会话共 ${results.length} 个产物` : "生成的素材会自动存入「我的文件」"}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge tone="gray">{ratio}</Badge>
              <Badge tone="gray">{isVideo ? "1080p" : SIZE_LABEL[ratio] ?? "1024×1024"}</Badge>
              <button
                onClick={() => toast("已加入「我的文件」", "info")}
                className="btn-ghost h-7 px-2 text-[10.5px]"
              >
                全部下载
              </button>
            </div>
          </div>

          {loading && (
            <div className="mb-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {Array.from({ length: count }).map((_, i) => (
                <div key={i} className={cn("relative overflow-hidden rounded-xl", isVideo ? "aspect-video" : "aspect-square")}>
                  <div className="absolute inset-0 shimmer" />
                  <div className="absolute inset-0 flex items-center justify-center text-[10.5px] text-cloud-400">
                    {isVideo ? "渲染中…" : "绘制中…"}
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.length > 0 ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {results.map((r) => (
                <div
                  key={r.id}
                  className={cn(
                    "group relative overflow-hidden rounded-xl bg-gradient-to-br ring-1 ring-inset ring-white/20",
                    gradientFor(r.seed),
                    isVideo ? "aspect-video" : "aspect-square",
                  )}
                >
                  {r.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.url}
                      alt={r.ability}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  {!r.url && <div className="absolute inset-0 opacity-25 grid-pattern" />}
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/25 px-1.5 py-0.5 text-[9px] text-white backdrop-blur">
                    {isVideo ? <Play size={8} fill="white" /> : <ImageIcon size={8} />}
                    {r.ability}
                  </div>
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur transition group-hover:scale-105">
                        <Play size={14} fill="white" />
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent p-2">
                    <div className="line-clamp-1 text-[9.5px] text-white/85">{r.prompt}</div>
                  </div>
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => {
                        if (!r.url) {
                          toast(isVideo ? "视频为演示占位，暂无可下载文件" : "这张图暂无可下载文件", "info");
                          return;
                        }
                        const a = document.createElement("a");
                        a.href = r.url;
                        a.download = `${r.ability}-${r.id}.jpg`;
                        a.target = "_blank";
                        a.rel = "noreferrer";
                        a.click();
                      }}
                      className="rounded-md bg-black/35 p-1 text-white backdrop-blur hover:bg-black/55"
                    >
                      <Download size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <EmptyState
                icon={isVideo ? <Video size={18} /> : <ImageIcon size={18} />}
                title={isVideo ? "还没有生成视频" : "还没有生成图片"}
                description="上传商品图、选一个能力并描述画面，生成结果会出现在这里。"
                action={
                  <Button size="sm" variant="ghost" onClick={() => setPrompt(examples[0])}>
                    用示例提示词试试
                  </Button>
                }
              />
            )
          )}

          <div className="mt-5">
            <div className="mb-2 text-[12px] font-semibold text-ink-900">示例作品</div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {["主图 · 白底", "场景 · 北欧客厅", isVideo ? "15s 口播" : "细节 · 材质", isVideo ? "循环动效" : "模特 · 上身"].map(
                (label, i) => (
                  <div key={label} className="group relative aspect-square overflow-hidden rounded-xl">
                    <div className={cn("absolute inset-0 bg-gradient-to-br", gradientFor(`demo-${mode}-${i}`))} />
                    <div className="absolute inset-0 opacity-20 grid-pattern" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/30 to-transparent p-2">
                      <div className="text-[9.5px] text-white/90">{label}</div>
                    </div>
                    <div className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100">
                      <ArrowUpRight size={12} className="text-white" />
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
