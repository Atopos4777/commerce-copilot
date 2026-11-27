"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { ArrowRight, BadgeCheck, Sparkles } from "lucide-react";
import { Badge, Button, PageHeader } from "@/components/ui";
import { experts, skillMap } from "@/lib/mock-data";
import { useAppActions } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function ExpertsPage() {
  const router = useRouter();
  const { createSession } = useAppActions();

  const use = (id: string) => {
    const expert = experts.find((e) => e.id === id)!;
    const s = createSession({
      title: `与「${expert.name}」开始新任务`,
      expertId: id,
      skillIds: expert.defaultSkills,
    });
    router.push(`/chat/${s.id}`);
  };

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6">
      <PageHeader
        eyebrow="Agent Studio"
        title="跨境专家"
        description="专家决定「你是谁、按什么流程做」，技能决定「你能用什么工具做」。同一个问题交给不同专家，会得到不同结构的结论。"
        actions={
          <Button variant="dark" size="sm">
            <Sparkles size={13} /> 创建自定义专家
          </Button>
        }
      />

      <div className="mb-5 grid gap-2 sm:grid-cols-3">
        {[
          ["专家自带方法论", "四段式流程把长任务拆成可中断的段"],
          ["默认挂载技能", "进入会话即可拉数据，不用重复配置"],
          ["产物自动落表", "候选产品、报告、清单直接进工作台"],
        ].map(([t, d], i) => (
          <div key={t} className="flex items-start gap-2 rounded-xl border border-cloud-200 bg-white px-3 py-2.5">
            <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-md bg-brand-50 font-mono text-[10px] font-semibold text-brand-600">
              {i + 1}
            </span>
            <div>
              <div className="text-[12px] font-medium text-ink-900">{t}</div>
              <div className="text-[10.5px] text-cloud-500">{d}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {experts.map((e) => (
          <div key={e.id} id={e.id} className="card card-hover flex scroll-mt-20 flex-col p-4">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[15px] font-semibold text-white shadow-sm",
                  e.accent,
                )}
              >
                {e.name.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-[14px] font-semibold text-ink-900">{e.name}</h2>
                  {e.official && (
                    <span className="flex items-center gap-0.5 text-[10px] text-brand-600">
                      <BadgeCheck size={12} /> 官方
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-[10.5px] text-cloud-400">{e.title}</div>
              </div>
            </div>

            <p className="mt-2.5 text-[12px] leading-relaxed text-cloud-500">{e.desc}</p>

            <div className="mt-3 grid grid-cols-2 gap-1.5">
              {e.methodology.map((m, i) => (
                <div key={m.title} className="rounded-lg bg-cloud-50 px-2 py-1.5">
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-[9px] text-brand-500">0{i + 1}</span>
                    <span className="text-[10.5px] font-medium text-ink-900">{m.title}</span>
                  </div>
                  <div className="mt-0.5 line-clamp-2 text-[9.5px] leading-snug text-cloud-500">{m.desc}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {e.tags.slice(0, 4).map((t) => (
                <Badge key={t} tone="gray">
                  {t}
                </Badge>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-cloud-100 pt-2.5">
              <div className="min-w-0">
                <div className="text-[9.5px] text-cloud-400">默认技能</div>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {e.defaultSkills.map((s) => (
                    <span key={s} className="chip bg-cloud-50 text-[9.5px] text-cloud-600">
                      {skillMap[s]?.name ?? s}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => use(e.id)}
                className="flex shrink-0 items-center gap-1 rounded-lg bg-ink-900 px-2.5 py-1.5 text-[11px] font-medium text-white transition hover:bg-ink-800"
              >
                使用专家 <ArrowRight size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cloud-200 bg-white px-5 py-4 shadow-card">
        <div>
          <div className="text-[12.5px] font-medium text-ink-900">想把自己的运营方法沉淀成专家？</div>
          <p className="mt-1 text-[11.5px] text-cloud-500">
            选一个基础模板，写清定位、方法论与默认技能，就能在团队内共享。
          </p>
        </div>
        <Button variant="ghost" size="sm">
          查看创建指南
        </Button>
      </div>
    </div>
  );
}
