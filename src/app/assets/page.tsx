"use client";

import React from "react";
import {
  ArrowDownToLine,
  FileSpreadsheet,
  FileText,
  Film,
  ImageIcon,
  Library,
  Plus,
  Search,
  Sparkles,
  Tag,
} from "lucide-react";
import {
  Badge,
  Button,
  CopyButton,
  EmptyState,
  PageHeader,
  ProductThumb,
  Tabs,
} from "@/components/ui";
import { fileItems, keywordLibrary, promptLibrary } from "@/lib/mock-data";
import { useAppActions, useAppState } from "@/lib/store";
import type { FileItem } from "@/lib/types";
import { cn, downloadText, formatNumber } from "@/lib/utils";

type TabKey = "products" | "keywords" | "prompts" | "files";

const FILE_STYLE: Record<FileItem["type"], { icon: React.ElementType; tone: string }> = {
  xlsx: { icon: FileSpreadsheet, tone: "bg-mint-50 text-mint-600" },
  csv: { icon: FileSpreadsheet, tone: "bg-mint-50 text-mint-600" },
  pdf: { icon: FileText, tone: "bg-red-50 text-red-500" },
  png: { icon: ImageIcon, tone: "bg-violet-50 text-violet-600" },
  mp4: { icon: Film, tone: "bg-blue-50 text-blue-600" },
};

export default function AssetsPage() {
  const { candidates } = useAppState();
  const { toast } = useAppActions();
  const [tab, setTab] = React.useState<TabKey>("products");
  const [q, setQ] = React.useState("");

  const words = keywordLibrary.filter((k) => !q.trim() || k.word.includes(q.trim().toLowerCase()));
  const prompts = promptLibrary.filter((p) => !q.trim() || `${p.title}${p.content}`.includes(q.trim()));
  const files = fileItems.filter((f) => !q.trim() || f.name.toLowerCase().includes(q.trim().toLowerCase()));
  const products = candidates.filter((c) => !q.trim() || `${c.title}${c.asin}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
      <PageHeader
        eyebrow="Assets"
        title="资产库"
        description="商品、关键词、提示词与生成文件都在这里沉淀。会话里产出的产物会自动归档，可跨任务复用。"
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => toast("已导出词库 CSV")}>
              <ArrowDownToLine size={13} /> 导出
            </Button>
            <Button variant="dark" size="sm" onClick={() => toast("上传入口已打开（演示环境）", "info")}>
              <Plus size={13} /> 上传文件
            </Button>
          </>
        }
      />

      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "商品", value: candidates.length, icon: Tag },
          { label: "关键词", value: keywordLibrary.length, icon: Search },
          { label: "提示词", value: promptLibrary.length, icon: Sparkles },
          { label: "文件", value: fileItems.length, icon: Library },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card flex items-center gap-3 px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cloud-50 text-cloud-500">
                <Icon size={15} />
              </span>
              <div>
                <div className="text-[18px] font-semibold leading-none text-ink-900">{s.value}</div>
                <div className="mt-1 text-[10.5px] text-cloud-400">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "products", label: "商品库" },
            { value: "keywords", label: "词库" },
            { value: "prompts", label: "提示词库" },
            { value: "files", label: "我的文件" },
          ]}
        />
        <div className="flex h-8 w-[230px] items-center gap-1.5 rounded-lg border border-cloud-200 bg-white px-2.5 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-50">
          <Search size={13} className="text-cloud-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索当前资产"
            className="w-full bg-transparent text-[12px] outline-none placeholder:text-cloud-400"
          />
        </div>
      </div>

      {tab === "products" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((c) => (
            <div key={c.id} className="card card-hover overflow-hidden">
              <div className="relative aspect-[4/3] bg-gradient-to-br">
                <ProductThumb seed={c.asin} label={c.title} className="h-full w-full rounded-none" size="lg" />
                <div className="absolute left-2 top-2">
                  <Badge tone={c.status === "已选品" ? "mint" : "gray"}>{c.status}</Badge>
                </div>
              </div>
              <div className="p-3">
                <div className="line-clamp-1 text-[11.5px] font-medium text-ink-900">{c.title}</div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-mono text-[9.5px] text-cloud-400">{c.asin}</span>
                  <span className="font-mono text-[11px] text-ink-900">${c.price.toFixed(2)}</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="chip bg-cloud-50 text-[9px] text-cloud-500">BSR {formatNumber(c.bsr)}</span>
                  <span className="chip bg-cloud-50 text-[9px] text-cloud-500">月销 {formatNumber(c.monthlySales)}</span>
                </div>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-4">
              <EmptyState compact title="没有匹配的商品" description="去选品工作台让 Agent 跑一轮，候选会自动进入商品库。" />
            </div>
          )}
        </div>
      )}

      {tab === "keywords" && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="bg-cloud-50/70 text-[10px] uppercase tracking-wide text-cloud-400">
                  <th className="px-4 py-2.5 font-medium">关键词</th>
                  <th className="px-3 py-2.5 font-medium">月搜索量</th>
                  <th className="px-3 py-2.5 font-medium">竞争度</th>
                  <th className="px-3 py-2.5 font-medium">90 天趋势</th>
                  <th className="px-3 py-2.5 font-medium">所属词库</th>
                  <th className="px-4 py-2.5 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {words.map((k) => (
                  <tr key={k.id} className="border-t border-cloud-100 hover:bg-cloud-50/50">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-ink-900">{k.word}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-cloud-600">{formatNumber(k.volume)}</td>
                    <td className="px-3 py-2.5">
                      <Badge tone={k.competition === "低" ? "mint" : k.competition === "中" ? "amber" : "red"}>
                        {k.competition}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={cn("font-mono text-[11px]", k.trend > 0 ? "text-mint-600" : "text-red-500")}>
                        {k.trend > 0 ? "+" : ""}
                        {k.trend}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[10.5px] text-cloud-500">{k.library}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={() => toast(`已复制关键词 ${k.word}`, "info")}
                          className="rounded-md px-1.5 py-1 text-[10px] text-cloud-500 hover:bg-cloud-100 hover:text-ink-900"
                        >
                          复制
                        </button>
                        <button
                          onClick={() => toast(`已把 ${k.word} 加入待投放词库`)}
                          className="rounded-md px-1.5 py-1 text-[10px] text-brand-600 hover:bg-brand-50"
                        >
                          投放
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {words.length === 0 && <div className="p-6"><EmptyState compact title="没有匹配的关键词" /></div>}
        </div>
      )}

      {tab === "prompts" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {prompts.map((p) => (
            <div key={p.id} className="card flex flex-col p-4">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-medium text-ink-900">{p.title}</span>
                <Badge tone="violet">{p.category}</Badge>
              </div>
              <p className="mt-2 flex-1 text-[11px] leading-relaxed text-cloud-500">{p.content}</p>
              <div className="mt-3 flex items-center justify-between border-t border-cloud-100 pt-2.5">
                <span className="text-[10px] text-cloud-400">被使用 {p.uses} 次</span>
                <CopyButton text={p.content} label="复制提示词" />
              </div>
            </div>
          ))}
          {prompts.length === 0 && <div className="sm:col-span-2 lg:col-span-3"><EmptyState compact title="没有匹配的提示词" /></div>}
        </div>
      )}

      {tab === "files" && (
        <div className="card overflow-hidden">
          <div className="divide-y divide-cloud-100">
            {files.map((f) => {
              const style = FILE_STYLE[f.type];
              const Icon = style.icon;
              return (
                <div key={f.id} className="flex items-center gap-3 px-4 py-3 hover:bg-cloud-50/50">
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", style.tone)}>
                    <Icon size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11.5px] font-medium text-ink-900">{f.name}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-cloud-400">
                      <span className="uppercase">{f.type}</span>
                      <span className="h-[3px] w-[3px] rounded-full bg-cloud-300" />
                      <span>{f.size}</span>
                      <span className="h-[3px] w-[3px] rounded-full bg-cloud-300" />
                      <span>{f.date}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      downloadText(f.name.replace(/\.[^.]+$/, "") + ".txt", `${f.name}\n演示文件，仅用于展示下载流程。`);
                      toast("已开始下载");
                    }}
                    className="btn-ghost h-7 px-2 text-[10.5px]"
                  >
                    <ArrowDownToLine size={11} /> 下载
                  </button>
                </div>
              );
            })}
          </div>
          {files.length === 0 && <div className="p-6"><EmptyState compact title="没有匹配的文件" /></div>}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-[10px] text-cloud-400">
        <span>资产会随会话自动归档，团队版支持共享与权限管理</span>
        <span>共 {files.length + words.length + prompts.length + products.length} 项资产</span>
      </div>
    </div>
  );
}
