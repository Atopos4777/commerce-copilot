"use client";

import React from "react";
import { Check, ChevronDown, CircleAlert, Loader2, Wrench } from "lucide-react";
import type { ToolCall } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ToolCard({ tool }: { tool: ToolCall }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="mb-2 overflow-hidden rounded-xl border border-cloud-200 bg-cloud-50/70">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-cloud-100/70"
      >
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md",
            tool.status === "running"
              ? "bg-brand-50 text-brand-600"
              : tool.status === "error"
                ? "bg-red-50 text-red-500"
                : "bg-mint-50 text-mint-600",
          )}
        >
          {tool.status === "running" ? (
            <Loader2 size={13} className="animate-spin" />
          ) : tool.status === "error" ? (
            <CircleAlert size={13} />
          ) : (
            <Check size={13} />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[12px] font-medium text-ink-900">{tool.name}</span>
            <span className="rounded bg-white px-1.5 py-0.5 text-[9.5px] text-cloud-500 ring-1 ring-inset ring-cloud-200">
              {tool.engine}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-[10.5px] text-cloud-400">
            {tool.status === "running"
              ? "正在调用…"
              : tool.status === "error"
                ? "调用失败"
                : tool.output ?? "已完成"}
            {tool.duration ? ` · ${tool.duration}s` : ""}
          </span>
        </span>
        <ChevronDown size={13} className={cn("text-cloud-400 transition", open && "rotate-180")} />
      </button>

      {open && (
        <div className="space-y-2 border-t border-cloud-200/70 px-3 py-2.5">
          <div>
            <div className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-cloud-400">
              <Wrench size={9} /> 入参
            </div>
            <pre className="overflow-x-auto rounded-lg bg-white p-2 font-mono text-[10.5px] leading-relaxed text-cloud-600 ring-1 ring-inset ring-cloud-200">
              {JSON.stringify(tool.input, null, 2)}
            </pre>
          </div>
          {tool.output && (
            <div>
              <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-cloud-400">返回</div>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-white p-2 font-mono text-[10.5px] leading-relaxed text-cloud-600 ring-1 ring-inset ring-cloud-200">
                {tool.output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
