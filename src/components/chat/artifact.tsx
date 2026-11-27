"use client";

import React from "react";
import {
  ArrowDownToLine,
  Check,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Images,
  Play,
  Plus,
  Video as VideoIcon,
} from "lucide-react";
import { useAppActions } from "@/lib/store";
import type { Artifact } from "@/lib/types";
import { cn, downloadText, gradientFor } from "@/lib/utils";
import { ProductThumb } from "../ui";

export function ArtifactCard({ artifact, compact = false }: { artifact: Artifact; compact?: boolean }) {
  const { addCandidates, toast } = useAppActions();
  const [expanded, setExpanded] = React.useState(false);
  const [added, setAdded] = React.useState(false);

  const icon =
    artifact.type === "table" ? (
      <FileSpreadsheet size={13} />
    ) : artifact.type === "report" ? (
      <FileText size={13} />
    ) : artifact.type === "video" ? (
      <VideoIcon size={13} />
    ) : (
      <Images size={13} />
    );

  const exportCsv = () => {
    if (!artifact.columns || !artifact.rows) return;
    const body = artifact.rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    downloadText(
      `${artifact.title}.csv`,
      [artifact.columns.join(","), body].join("\n"),
    );
    toast("CSV 已开始下载");
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-cloud-200 bg-white",
        compact ? "shadow-none" : "shadow-card",
      )}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-cloud-100 px-3 py-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-brand-600">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-medium text-ink-900">{artifact.title}</div>
          {artifact.subtitle && <div className="truncate text-[10px] text-cloud-400">{artifact.subtitle}</div>}
        </div>
        {artifact.type === "table" && artifact.items && (
          <button
            onClick={() => {
              addCandidates(artifact.items!);
              setAdded(true);
            }}
            disabled={added}
            className={cn(
              "flex h-6 items-center gap-1 rounded-md px-2 text-[10.5px] font-medium transition",
              added ? "bg-mint-50 text-mint-600" : "bg-ink-900 text-white hover:bg-ink-800",
            )}
          >
            {added ? <Check size={10} /> : <Plus size={10} />}
            {added ? "已加入候选池" : "全部加入候选池"}
          </button>
        )}
        {artifact.type === "table" && (
          <button onClick={exportCsv} className="btn-ghost h-6 px-2 text-[10.5px]">
            <ArrowDownToLine size={10} /> CSV
          </button>
        )}
        {artifact.type === "report" && (
          <button onClick={() => setExpanded((v) => !v)} className="btn-ghost h-6 px-2 text-[10.5px]">
            {expanded ? "收起" : "查看全文"}
            <ChevronDown size={10} className={cn("transition", expanded && "rotate-180")} />
          </button>
        )}
        {artifact.type === "image" && (
          <button
            onClick={() => toast("素材已加入「我的文件」", "info")}
            className="btn-ghost h-6 px-2 text-[10.5px]"
          >
            <ArrowDownToLine size={10} /> 下载
          </button>
        )}
      </div>

      {artifact.type === "table" && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="bg-cloud-50/70 text-[10px] uppercase tracking-wide text-cloud-400">
                {artifact.columns?.map((c) => (
                  <th key={c} className="whitespace-nowrap px-2.5 py-1.5 font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {artifact.rows?.map((row, i) => (
                <tr key={i} className="border-t border-cloud-100 text-[11px] text-cloud-600">
                  {row.map((cell, j) => (
                    <td key={j} className="max-w-[220px] truncate px-2.5 py-1.5">
                      {j === 0 && artifact.items?.[i] ? (
                        <ProductThumb
                          seed={artifact.items[i].asin}
                          label={artifact.items[i].title}
                          size="sm"
                          className="h-6 w-6"
                        />
                      ) : (
                        <span className={cn(j === 1 && "font-medium text-ink-900")}>{cell}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {artifact.type === "report" && (
        <div className={cn("px-3 py-2.5", expanded ? "max-h-[420px] overflow-y-auto" : "max-h-[92px] overflow-hidden")}>
          <pre className="whitespace-pre-wrap font-sans text-[11.5px] leading-relaxed text-cloud-600">
            {artifact.content}
          </pre>
        </div>
      )}

      {artifact.type === "image" && (
        <div className="grid grid-cols-2 gap-1.5 p-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn("relative aspect-square overflow-hidden rounded-lg bg-gradient-to-br", gradientFor(`${artifact.seed}-${i}`))}
            >
              <div className="absolute inset-0 opacity-25 grid-pattern" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9.5px] font-medium text-white backdrop-blur">
                  场景 {String(i + 1).padStart(2, "0")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {artifact.type === "video" && (
        <div className="p-2">
          <div
            className={cn(
              "relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br",
              gradientFor(artifact.seed ?? "video"),
            )}
          >
            <div className="absolute inset-0 opacity-25 grid-pattern" />
            <button
              onClick={() => toast("视频预览（演示环境）", "info")}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur transition hover:bg-white/40"
            >
              <Play size={16} fill="white" />
            </button>
            <span className="absolute bottom-2 right-2 rounded bg-black/35 px-1.5 py-0.5 text-[9.5px] text-white">
              00:15
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
