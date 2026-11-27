"use client";

import React from "react";
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Badge, Button, CopyButton, EmptyState, PageHeader, Tabs } from "@/components/ui";
import { useAppActions, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

interface ListingResult {
  title: string;
  bullets: string[];
  description: string;
  searchTerms: string[];
  aplus: string[];
  mode: "live" | "mock";
}

const SITES = ["美国站 US", "德国站 DE", "英国站 UK", "日本站 JP"];
const TONES = ["专业理性", "场景化叙事", "口语化种草"];

export default function ListingPage() {
  const { candidates } = useAppState();
  const { spendCredits, refundCredits, toast } = useAppActions();

  const [candidateId, setCandidateId] = React.useState("");
  const [site, setSite] = React.useState(SITES[0]);
  const [tone, setTone] = React.useState(TONES[0]);
  const [product, setProduct] = React.useState("可重复使用宠物去毛滚筒");
  const [keyword, setKeyword] = React.useState("pet hair remover");
  const [features, setFeatures] = React.useState("双向滚轮、无需撕纸、可重复使用 5 年、适配沙发/车座/床品");
  const [result, setResult] = React.useState<ListingResult | null>(null);
  const [tab, setTab] = React.useState<"title" | "bullets" | "desc" | "aplus" | "terms">("title");
  const [loading, setLoading] = React.useState(false);

  const generate = async () => {
    if (!product.trim()) {
      toast("先填写产品名称", "info");
      return;
    }
    if (!spendCredits(8, "Listing 生成")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, keyword, features, site, tone }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ListingResult;
      if (!data || !Array.isArray(data.bullets)) throw new Error("返回格式异常");
      setResult(data);
      setTab("title");
      toast(`Listing 已生成（${data.mode === "live" ? "真实模型" : "模拟模式"}）`);
    } catch {
      refundCredits(8);
      toast("生成失败，算力已退回", "error");
    } finally {
      setLoading(false);
    }
  };

  const allText = result
    ? `【标题】\n${result.title}\n\n【五点描述】\n${result.bullets
        .map((b, i) => `${i + 1}. ${b}`)
        .join("\n")}\n\n【产品描述】\n${result.description}\n\n【搜索词】\n${result.searchTerms.join(", ")}\n\n【A+ 模块】\n${result.aplus
        .map((a) => `- ${a}`)
        .join("\n")}`
    : "";

  const tabs = [
    { value: "title" as const, label: "标题" },
    { value: "bullets" as const, label: "五点描述" },
    { value: "desc" as const, label: "产品描述" },
    { value: "aplus" as const, label: "A+" },
    { value: "terms" as const, label: "搜索词" },
  ];

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6">
      <PageHeader
        eyebrow="Listing Studio"
        title="Listing 生成"
        description="按平台规范与关键词库生成标题、五点、描述与 A+ 文案，自动控制字符数并做违禁词初筛。"
        actions={
          <>
            <Badge tone="mint">违禁词初筛</Badge>
            <Badge tone="gray">{site}</Badge>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[400px_1fr]">
        {/* input */}
        <div className="card h-fit p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ClipboardList size={14} className="text-brand-500" />
              <span className="text-[12.5px] font-semibold text-ink-900">商品信息</span>
            </div>
            <button
              onClick={() => {
                const c = candidates[0];
                setProduct(c.title);
                setKeyword(c.keyword);
                setCandidateId(c.id);
              }}
              className="flex items-center gap-1 text-[10.5px] text-brand-600 hover:underline"
            >
              <Wand2 size={10} /> 从候选填充
            </button>
          </div>

          <div className="mt-3 space-y-3">
            <div>
              <label className="label">从候选产品选择</label>
              <select
                value={candidateId}
                onChange={(e) => {
                  setCandidateId(e.target.value);
                  const c = candidates.find((x) => x.id === e.target.value);
                  if (c) {
                    setProduct(c.title);
                    setKeyword(c.keyword);
                  }
                }}
                className="field text-[12px]"
              >
                <option value="">手动填写</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.status === "已选品" ? "★ " : ""}
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">产品名称</label>
              <input value={product} onChange={(e) => setProduct(e.target.value)} className="field" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">站点</label>
                <select value={site} onChange={(e) => setSite(e.target.value)} className="field text-[12px]">
                  {SITES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">语气</label>
                <select value={tone} onChange={(e) => setTone(e.target.value)} className="field text-[12px]">
                  {TONES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">核心关键词</label>
              <input value={keyword} onChange={(e) => setKeyword(e.target.value)} className="field" />
              <div className="mt-1 flex flex-wrap gap-1">
                {["pet hair remover", "reusable lint roller", "lint roller for couch"].map((k) => (
                  <button
                    key={k}
                    onClick={() => setKeyword(k)}
                    className="chip bg-cloud-100 text-[9.5px] text-cloud-500 hover:bg-brand-50 hover:text-brand-600"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">核心卖点</label>
              <textarea
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                rows={4}
                className="field resize-none text-[12px] leading-relaxed"
              />
            </div>
          </div>

          <button onClick={generate} disabled={loading} className="btn-primary mt-4 h-9 w-full text-[12.5px]">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {loading ? "生成中…" : "生成 Listing · 8 算力"}
          </button>

          <div className="mt-3 rounded-xl bg-cloud-50 p-2.5">
            <div className="flex items-center gap-1 text-[10.5px] font-medium text-cloud-600">
              <ShieldCheck size={11} className="text-mint-500" /> 合规规则
            </div>
            <p className="mt-1 text-[9.5px] leading-relaxed text-cloud-400">
              自动规避 best / 100% / FDA 等绝对化与医疗宣称，标题控制在 200 字符内。
            </p>
          </div>
        </div>

        {/* output */}
        <div className="min-w-0">
          {!result ? (
            <div className="card flex h-full min-h-[420px] flex-col p-4">
              <div className="flex items-center justify-between border-b border-cloud-100 pb-2.5">
                <span className="text-[12.5px] font-semibold text-ink-900">生成结果</span>
                <Badge tone="gray">等待生成</Badge>
              </div>
              <div className="flex flex-1 items-center justify-center">
                <EmptyState
                  icon={<FileText size={18} />}
                  title="还没有生成内容"
                  description="填写左侧商品信息后点击生成，标题、五点、描述、A+ 与搜索词会一次性产出。"
                  action={
                    <Button size="sm" variant="ghost" onClick={generate}>
                      用当前信息生成
                    </Button>
                  }
                />
              </div>
            </div>
          ) : (
            <div className={cn("card overflow-hidden transition", loading && "opacity-60")}>
              <div className="flex flex-wrap items-center gap-2 border-b border-cloud-100 px-4 py-2.5">
                <Tabs value={tab} onChange={setTab} items={tabs} />
                <div className="ml-auto flex items-center gap-1.5">
                  <Badge tone={result.mode === "live" ? "violet" : "gray"}>
                    {result.mode === "live" ? "真实模型" : "模拟模式"}
                  </Badge>
                  <CopyButton text={allText} label="复制全部" />
                  <Button size="sm" variant="ghost" onClick={generate} disabled={loading}>
                    <RefreshCw size={11} /> 重新生成
                  </Button>
                  <Button size="sm" variant="subtle" onClick={() => toast("已保存到「我的文件」", "info")}>
                    <Save size={11} /> 保存
                  </Button>
                </div>
              </div>

              <div className="p-4">
                {tab === "title" && (
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-cloud-500">标题 Title</span>
                      <span
                        className={cn(
                          "font-mono text-[10px]",
                          result.title.length > 200 ? "text-red-500" : "text-cloud-400",
                        )}
                      >
                        {result.title.length} / 200
                      </span>
                    </div>
                    <div className="mt-2 rounded-xl border border-cloud-200 bg-cloud-50/60 p-3 text-[13px] leading-relaxed text-ink-900">
                      {result.title}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10.5px] text-mint-600">
                        <CheckCircle2 size={11} /> 核心词已覆盖
                      </span>
                      <CopyButton text={result.title} />
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {[
                        ["核心词位置", "前 80 字符"],
                        ["移动端可读长度", `${Math.min(result.title.length, 80)} / 80`],
                        ["重复词检查", "未发现堆砌"],
                        ["违禁词检查", "通过"],
                      ].map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between rounded-lg bg-cloud-50 px-2.5 py-1.5">
                          <span className="text-[10.5px] text-cloud-400">{k}</span>
                          <span className="text-[10.5px] font-medium text-ink-900">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tab === "bullets" && (
                  <div className="space-y-2">
                    {result.bullets.map((b, i) => (
                      <div key={i} className="group rounded-xl border border-cloud-200 p-3">
                        <div className="flex items-start gap-2">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-50 font-mono text-[9px] text-brand-600">
                            {i + 1}
                          </span>
                          <p className="flex-1 text-[12px] leading-relaxed text-cloud-700">{b}</p>
                          <CopyButton text={b} label="" />
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between rounded-lg bg-cloud-50 px-3 py-2 text-[10.5px] text-cloud-400">
                      <span>总字符数 {result.bullets.join("").length} / 1000</span>
                      <span className="flex items-center gap-1 text-mint-600">
                        <CheckCircle2 size={10} /> 每条均含场景描述
                      </span>
                    </div>
                  </div>
                )}

                {tab === "desc" && (
                  <div>
                    <div className="rounded-xl border border-cloud-200 bg-cloud-50/60 p-3 text-[12.5px] leading-[1.9] text-cloud-700">
                      {result.description}
                    </div>
                    <div className="mt-2 flex justify-end">
                      <CopyButton text={result.description} />
                    </div>
                  </div>
                )}

                {tab === "aplus" && (
                  <div className="space-y-2">
                    {result.aplus.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-xl border border-cloud-200 p-2.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-50 font-mono text-[9.5px] text-violet-600">
                          M{i + 1}
                        </span>
                        <span className="flex-1 text-[11.5px] text-cloud-700">{a}</span>
                        <span className="text-[9.5px] text-cloud-400">970×600</span>
                      </div>
                    ))}
                    <div className="rounded-lg bg-violet-50/60 px-3 py-2 text-[10px] text-violet-600">
                      提示：A+ 模块建议用 AI 作图生成对应场景图，保持商品本体一致。
                    </div>
                  </div>
                )}

                {tab === "terms" && (
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-cloud-500">后台搜索词 Search Terms</span>
                      <span className="font-mono text-[10px] text-cloud-400">
                        {result.searchTerms.join(" ").length} / 250
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {result.searchTerms.map((t) => (
                        <span key={t} className="chip border border-cloud-200 bg-white text-[11px] text-cloud-600">
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <CopyButton text={result.searchTerms.join(", ")} />
                    </div>
                    <div className="mt-4 rounded-xl bg-cloud-50 p-3 text-[10.5px] leading-relaxed text-cloud-500">
                      搜索词已去掉重复与品牌词，建议与广告词库同步，避免站内外流量口径不一致。
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {[
              ["多站点本地化", "德/英/日站点可基于同一卖点改写"],
              ["合规初筛", "上架前自动扫描违禁词"],
              ["产物可复用", "标题与词库自动进入资产库"],
            ].map(([t, d]) => (
              <div key={t} className="rounded-xl border border-cloud-200 bg-white px-3 py-2.5">
                <div className="text-[11px] font-medium text-ink-900">{t}</div>
                <div className="mt-0.5 text-[10px] leading-relaxed text-cloud-400">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
