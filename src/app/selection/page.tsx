"use client";

import { useRouter } from "next/navigation";
import React from "react";
import {
  ArrowUpRight,
  Download,
  Filter,
  Layers,
  Search,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { Badge, Button, EmptyState, PageHeader, ProductThumb } from "@/components/ui";
import { useAppActions, useAppState } from "@/lib/store";
import type { CandidateStatus } from "@/lib/types";
import { cn, downloadText, formatNumber } from "@/lib/utils";

const STATUSES: CandidateStatus[] = ["候选", "调研中", "已选品", "已排除"];

const METHODS = [
  {
    icon: TrendingUp,
    title: "低价长尾",
    desc: "价格 $10–30，月销 1,000+，头部评论 < 1,000，避开红海主词。",
    tone: "bg-brand-50 text-brand-600",
  },
  {
    icon: Target,
    title: "低竞争",
    desc: "Top30 评论中位数 < 1,500，CR10 品牌集中度 < 40%。",
    tone: "bg-violet-50 text-violet-600",
  },
  {
    icon: Layers,
    title: "高利润",
    desc: "毛利 > 35%，退货率 < 5%，头程与 FBA 后仍有价格空间。",
    tone: "bg-mint-50 text-mint-600",
  },
];

export default function SelectionPage() {
  const router = useRouter();
  const { candidates } = useAppState();
  const { updateCandidate, removeCandidate, createSession, toast } = useAppActions();
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<"全部" | CandidateStatus>("全部");
  const [sort, setSort] = React.useState<"score" | "bsr" | "sales" | "price">("score");

  const list = candidates
    .filter(
      (c) =>
        (status === "全部" || c.status === status) &&
        (!q.trim() || `${c.title}${c.asin}${c.keyword}`.toLowerCase().includes(q.trim().toLowerCase())),
    )
    .sort((a, b) => {
      if (sort === "bsr") return a.bsr - b.bsr;
      if (sort === "sales") return b.monthlySales - a.monthlySales;
      if (sort === "price") return a.price - b.price;
      return b.score - a.score;
    });

  const avgBsr = list.length ? Math.round(list.reduce((s, c) => s + c.bsr, 0) / list.length) : 0;
  const potential = list.reduce((s, c) => s + c.price * c.monthlySales * 0.32, 0);

  const exportCsv = () => {
    const header = ["ASIN", "标题", "平台", "价格", "BSR", "月销", "评分", "状态"];
    const body = list.map((c) =>
      [c.asin, c.title, c.platform, c.price, c.bsr, c.monthlySales, c.rating, c.status]
        .map((x) => `"${String(x).replace(/"/g, '""')}"`)
        .join(","),
    );
    downloadText("候选产品清单.csv", [header.join(","), ...body].join("\n"));
    toast(`已导出 ${list.length} 个候选产品`);
  };

  const quote = (asin: string, title: string) => {
    const session = createSession({
      title: `分析候选产品 ${asin}`,
      expertId: "expert-selection",
      skillIds: ["seller-sprite-selection", "keepa-price-tracker"],
    });
    sessionStorage.setItem(
      `cp.pending.${session.id}`,
      JSON.stringify({
        prompt: `分析候选产品 ${asin}（${title}）的竞争度、价格稳定性与利润空间，判断是否值得进入，并给出切入价位建议。`,
        expertId: "expert-selection",
        skillIds: ["seller-sprite-selection", "keepa-price-tracker"],
      }),
    );
    router.push(`/chat/${session.id}`);
  };

  return (
    <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6">
      <PageHeader
        eyebrow="Sourcing"
        title="选品工作台"
        description="会话里产出的候选会汇总到这里，可以按方法二次筛选、批量导出，或把单个产品带回对话继续深挖。"
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={exportCsv}>
              <Download size={13} /> 导出 CSV
            </Button>
            <Button variant="dark" size="sm" onClick={() => router.push("/")}>
              <Sparkles size={13} /> 让 Agent 选品
            </Button>
          </>
        }
      />

      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "候选产品", value: String(candidates.length), sub: `当前筛选 ${list.length}` },
          { label: "平均 BSR", value: formatNumber(avgBsr), sub: "越低竞争越小" },
          {
            label: "预估月 GMV 空间",
            value: `$${formatNumber(Math.round(potential))}`,
            sub: "按 32% 毛利估算",
          },
          { label: "已选品", value: String(candidates.filter((c) => c.status === "已选品").length), sub: "进入 Listing 阶段" },
        ].map((k) => (
          <div key={k.label} className="card px-4 py-3">
            <div className="text-[10.5px] text-cloud-400">{k.label}</div>
            <div className="mt-1 text-[20px] font-semibold tracking-tight text-ink-900">{k.value}</div>
            <div className="text-[10px] text-cloud-400">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_270px]">
        <div className="min-w-0">
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <div className="flex h-8 min-w-[200px] flex-1 items-center gap-1.5 rounded-lg border border-cloud-200 bg-white px-2.5 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-50 sm:max-w-[300px]">
              <Search size={13} className="text-cloud-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜索标题、ASIN、关键词"
                className="w-full bg-transparent text-[12px] outline-none placeholder:text-cloud-400"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="h-8 rounded-lg border border-cloud-200 bg-white px-2 text-[11.5px] text-cloud-600 outline-none focus:border-brand-300"
            >
              {["全部", ...STATUSES].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="h-8 rounded-lg border border-cloud-200 bg-white px-2 text-[11.5px] text-cloud-600 outline-none focus:border-brand-300"
            >
              <option value="score">综合评分</option>
              <option value="bsr">BSR 由低到高</option>
              <option value="sales">月销由高到低</option>
              <option value="price">价格由低到高</option>
            </select>
            <span className="ml-auto flex items-center gap-1 text-[10.5px] text-cloud-400">
              <Filter size={11} /> {list.length} 条
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-cloud-200 bg-white shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left">
                <thead>
                  <tr className="border-b border-cloud-200 bg-cloud-50/70 text-[10px] uppercase tracking-wide text-cloud-400">
                    <th className="px-3 py-2.5 font-medium">产品</th>
                    <th className="px-2 py-2.5 font-medium">价格</th>
                    <th className="px-2 py-2.5 font-medium">BSR</th>
                    <th className="px-2 py-2.5 font-medium">月销</th>
                    <th className="px-2 py-2.5 font-medium">评分</th>
                    <th className="px-2 py-2.5 font-medium">状态</th>
                    <th className="px-2 py-2.5 text-right font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id} className="group border-b border-cloud-100 last:border-0 hover:bg-cloud-50/60">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <ProductThumb seed={c.asin} label={c.title} className="h-9 w-9" />
                          <div className="min-w-0">
                            <div className="max-w-[280px] truncate text-[11.5px] font-medium text-ink-900">
                              {c.title}
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[9.5px] text-cloud-400">
                              <span className="font-mono">{c.asin}</span>
                              <span className="h-[2px] w-[2px] rounded-full bg-cloud-300" />
                              <span>{c.platform}</span>
                              <span className="h-[2px] w-[2px] rounded-full bg-cloud-300" />
                              <span>{c.category}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2.5 font-mono text-[11.5px] text-ink-900">${c.price.toFixed(2)}</td>
                      <td className="px-2 py-2.5 font-mono text-[11.5px] text-cloud-600">{formatNumber(c.bsr)}</td>
                      <td className="px-2 py-2.5 font-mono text-[11.5px] text-cloud-600">{formatNumber(c.monthlySales)}</td>
                      <td className="px-2 py-2.5">
                        <span className="text-[11.5px] text-ink-900">{c.rating}</span>
                        <span className="ml-1 text-[9.5px] text-cloud-400">({c.reviews})</span>
                      </td>
                      <td className="px-2 py-2.5">
                        <select
                          value={c.status}
                          onChange={(e) => updateCandidate(c.id, { status: e.target.value as CandidateStatus })}
                          className={cn(
                            "rounded-full border-0 px-2 py-1 text-[10px] font-medium outline-none",
                            c.status === "已选品"
                              ? "bg-mint-50 text-mint-600"
                              : c.status === "调研中"
                                ? "bg-amber-50 text-amber-700"
                                : c.status === "已排除"
                                  ? "bg-cloud-100 text-cloud-400"
                                  : "bg-brand-50 text-brand-600",
                          )}
                        >
                          {STATUSES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            onClick={() => quote(c.asin, c.title)}
                            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[10.5px] font-medium text-brand-600 transition hover:bg-brand-50"
                          >
                            引用 <ArrowUpRight size={10} />
                          </button>
                          <button
                            onClick={() => removeCandidate(c.id)}
                            className="rounded-md p-1 text-cloud-300 transition hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {list.length === 0 && (
              <div className="p-6">
                <EmptyState
                  compact
                  title="没有匹配的候选"
                  description="调整筛选条件，或让选品 Agent 先跑一轮。"
                  action={
                    <Button size="sm" onClick={() => router.push("/")}>
                      去新建选品任务
                    </Button>
                  }
                />
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] text-cloud-400">
            <span>评分 = 竞争度 40% + 需求 30% + 利润 20% + 趋势 10%</span>
            <span>数据为演示样本</span>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="card p-4">
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-brand-500" />
              <span className="text-[12px] font-semibold text-ink-900">选品方法</span>
            </div>
            <p className="mt-1 text-[10.5px] leading-relaxed text-cloud-400">
              选择一套方法，让 Agent 按对应阈值重新筛选。
            </p>
            <div className="mt-3 space-y-2">
              {METHODS.map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.title} className="rounded-xl border border-cloud-200 p-2.5 transition hover:border-brand-200">
                    <div className="flex items-center gap-2">
                      <span className={cn("flex h-6 w-6 items-center justify-center rounded-md", m.tone)}>
                        <Icon size={12} />
                      </span>
                      <span className="text-[11.5px] font-medium text-ink-900">{m.title}</span>
                      <button
                        onClick={() => {
                          const session = createSession({
                            title: `按「${m.title}」方法重新筛选`,
                            expertId: "expert-selection",
                            skillIds: ["seller-sprite-selection"],
                          });
                          sessionStorage.setItem(
                            `cp.pending.${session.id}`,
                            JSON.stringify({
                              prompt: `使用卖家精灵，按「${m.title}」方法筛选亚马逊美国站 $15–35 的家居/宠物产品。筛选标准：${m.desc} 输出 15 个候选并说明入选理由。`,
                              expertId: "expert-selection",
                              skillIds: ["seller-sprite-selection"],
                            }),
                          );
                          router.push(`/chat/${session.id}`);
                        }}
                        className="ml-auto text-[10px] text-brand-600 hover:underline"
                      >
                        应用
                      </button>
                    </div>
                    <p className="mt-1.5 text-[10px] leading-relaxed text-cloud-500">{m.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-4">
            <div className="text-[12px] font-semibold text-ink-900">状态分布</div>
            <div className="mt-2.5 space-y-2">
              {STATUSES.map((s) => {
                const n = candidates.filter((c) => c.status === s).length;
                const pct = candidates.length ? (n / candidates.length) * 100 : 0;
                return (
                  <div key={s}>
                    <div className="mb-1 flex items-center justify-between text-[10.5px]">
                      <span className="text-cloud-500">{s}</span>
                      <span className="font-mono text-cloud-400">{n}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-cloud-100">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          s === "已选品"
                            ? "bg-mint-500"
                            : s === "调研中"
                              ? "bg-amber-400"
                              : s === "已排除"
                                ? "bg-cloud-300"
                                : "bg-brand-500",
                        )}
                        style={{ width: `${Math.max(3, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-ink-900 p-4 text-white">
            <div className="flex items-center gap-1.5 text-[11.5px] font-medium">
              <Sparkles size={12} className="text-brand-400" /> 下一步
            </div>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-white/50">
              把「已选品」的产品交给 Listing Agent，一次生成标题、五点与 A+ 文案。
            </p>
            <button
              onClick={() => router.push("/listing")}
              className="mt-2.5 flex items-center gap-1 text-[11px] text-brand-300 hover:text-brand-200"
            >
              打开 Listing 生成 <ArrowUpRight size={11} />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
