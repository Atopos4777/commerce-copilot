"use client";

import Link from "next/link";
import { Check, Download, Plus } from "lucide-react";
import { useAppActions, useAppState } from "@/lib/store";
import type { Skill } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "./ui";

const ACCENTS: Record<string, string> = {
  选品与开发: "from-brand-400 to-rose-500",
  产品运营: "from-violet-500 to-indigo-500",
  营销广告: "from-amber-400 to-orange-500",
  合规检测: "from-rose-400 to-red-500",
  产品视觉: "from-sky-400 to-blue-500",
  数据分析: "from-mint-500 to-emerald-600",
  "通用/热点": "from-cloud-400 to-cloud-600",
};

export function SkillCard({ skill, compact = false }: { skill: Skill; compact?: boolean }) {
  const { installed } = useAppState();
  const { install, uninstall } = useAppActions();
  const isInstalled = installed.includes(skill.id);

  return (
    <div className={cn("card card-hover flex flex-col", compact ? "p-3.5" : "p-4")}>
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br text-[12px] font-semibold text-white shadow-sm",
            ACCENTS[skill.category] ?? ACCENTS["通用/热点"],
          )}
        >
          {skill.name.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/skills/${skill.id}`}
              className="truncate text-[13px] font-semibold text-ink-900 hover:text-brand-600"
            >
              {skill.name}
            </Link>
            {skill.free && <Badge tone="mint">限时免费</Badge>}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-cloud-400">
            <span>{skill.category}</span>
            <span className="h-[3px] w-[3px] rounded-full bg-cloud-300" />
            <span>{skill.tool}</span>
          </div>
        </div>
      </div>

      <p className={cn("mt-2 text-[11.5px] leading-relaxed text-cloud-500", compact ? "line-clamp-2" : "line-clamp-2")}>
        {skill.desc}
      </p>

      <div className="mt-2.5 flex flex-wrap gap-1">
        {skill.tags.slice(0, compact ? 3 : 4).map((t) => (
          <span key={t} className="chip bg-cloud-50 px-2 py-0.5 text-[10px] text-cloud-500">
            {t}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-cloud-100 pt-2.5">
        <span className="flex items-center gap-1 text-[10.5px] text-cloud-400">
          <Download size={10} />
          {skill.installs > 10000 ? `${(skill.installs / 10000).toFixed(1)} 万` : skill.installs}
          <span className="mx-0.5">·</span>
          {skill.source}
        </span>
        <button
          onClick={() => (isInstalled ? uninstall(skill.id) : install(skill.id))}
          className={cn(
            "flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11.5px] font-medium transition",
            isInstalled
              ? "bg-mint-50 text-mint-600 hover:bg-mint-100"
              : "bg-ink-900 text-white hover:bg-ink-800",
          )}
        >
          {isInstalled ? <Check size={11} /> : <Plus size={11} />}
          {isInstalled ? "已安装" : "安装"}
        </button>
      </div>
    </div>
  );
}
