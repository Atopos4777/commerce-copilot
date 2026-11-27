"use client";

import { useRouter } from "next/navigation";
import React from "react";
import {
  ArrowUp,
  BookOpen,
  ChevronDown,
  FileText,
  Paperclip,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { experts, promptLibrary, skillMap } from "@/lib/mock-data";
import { useAppActions, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Badge, Modal, ProductThumb } from "./ui";

const COST = 12;

export function HomeComposer({
  initialPrompt = "",
  initialExpertId = "expert-selection",
}: {
  initialPrompt?: string;
  initialExpertId?: string;
}) {
  const router = useRouter();
  const { installed } = useAppState();
  const { createSession, toast } = useAppActions();
  const [prompt, setPrompt] = React.useState(initialPrompt);
  const [expertId, setExpertId] = React.useState(initialExpertId);
  const [skillIds, setSkillIds] = React.useState<string[]>([]);
  const [openExperts, setOpenExperts] = React.useState(false);
  const [openSkills, setOpenSkills] = React.useState(false);
  const [openPrompts, setOpenPrompts] = React.useState(false);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const expert = experts.find((e) => e.id === expertId) ?? experts[0];

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpenExperts(false);
        setOpenSkills(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  React.useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
      textareaRef.current?.focus();
    }
  }, [initialPrompt]);

  const toggleSkill = (id: string) => {
    setSkillIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const start = () => {
    const text = prompt.trim();
    if (!text) {
      toast("先描述一下你的任务，例如「帮我选美国站的低价长尾家居产品」", "info");
      textareaRef.current?.focus();
      return;
    }
    const session = createSession({
      title: text,
      expertId,
      skillIds: skillIds.length ? skillIds : expert.defaultSkills.slice(0, 2),
    });
    sessionStorage.setItem(
      `cp.pending.${session.id}`,
      JSON.stringify({
        prompt: text,
        expertId,
        skillIds: skillIds.length ? skillIds : expert.defaultSkills.slice(0, 2),
      }),
    );
    router.push(`/chat/${session.id}`);
  };

  return (
    <div ref={boxRef} className="relative">
      <div className="rounded-2xl border border-cloud-200 bg-white p-3 shadow-pop">
        <div className="mb-2 flex flex-wrap items-center gap-1.5 px-1">
          <div className="relative">
            <button
              onClick={() => {
                setOpenExperts((v) => !v);
                setOpenSkills(false);
              }}
              className="chip bg-brand-50 text-brand-600 transition hover:bg-brand-100"
            >
              <Sparkles size={11} /> {expert.name}
              <ChevronDown size={11} className={cn("transition", openExperts && "rotate-180")} />
            </button>
            {openExperts && (
              <div className="absolute left-0 top-9 z-30 w-[320px] animate-fade-up rounded-xl border border-cloud-200 bg-white p-1.5 shadow-pop">
                {experts.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => {
                      setExpertId(e.id);
                      setOpenExperts(false);
                    }}
                    className={cn(
                      "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition",
                      e.id === expertId ? "bg-brand-50" : "hover:bg-cloud-50",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-[10px] font-semibold text-white",
                        e.accent,
                      )}
                    >
                      {e.name.slice(0, 1)}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-medium text-ink-900">{e.name}</span>
                      <span className="block truncate text-[11px] text-cloud-500">{e.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {(skillIds.length ? skillIds : expert.defaultSkills).slice(0, 2).map((id) => {
            const s = skillMap[id];
            if (!s) return null;
            return (
              <span key={id} className="chip bg-cloud-100 text-cloud-600">
                {s.name}
                {skillIds.includes(id) && (
                  <button onClick={() => toggleSkill(id)} className="text-cloud-400 hover:text-ink-900">
                    <X size={10} />
                  </button>
                )}
              </span>
            );
          })}

          <div className="relative">
            <button
              onClick={() => {
                setOpenSkills((v) => !v);
                setOpenExperts(false);
              }}
              className="chip border border-dashed border-cloud-300 text-cloud-500 transition hover:border-brand-300 hover:text-brand-600"
            >
              <Plus size={11} /> 技能 {skillIds.length > 0 && `(${skillIds.length})`}
            </button>
            {openSkills && (
              <div className="absolute left-0 top-9 z-30 w-[300px] animate-fade-up rounded-xl border border-cloud-200 bg-white p-2 shadow-pop">
                <div className="px-1.5 pb-1.5 text-[11px] font-medium text-cloud-500">
                  已安装技能 · 可在本会话叠加
                </div>
                <div className="max-h-[220px] space-y-0.5 overflow-y-auto">
                  {installed.length === 0 && (
                    <div className="px-2 py-3 text-[12px] text-cloud-400">还没有安装技能，去技能广场看看</div>
                  )}
                  {installed.map((id) => {
                    const s = skillMap[id];
                    if (!s) return null;
                    const active = skillIds.includes(id);
                    return (
                      <button
                        key={id}
                        onClick={() => toggleSkill(id)}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-cloud-50"
                      >
                        <span
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded border text-[9px] text-white",
                            active ? "border-brand-500 bg-brand-500" : "border-cloud-300 bg-white",
                          )}
                        >
                          {active ? "✓" : ""}
                        </span>
                        <span className="flex-1 truncate text-[12px] text-ink-900">{s.name}</span>
                        <span className="text-[10px] text-cloud-400">{s.tool}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              start();
            }
          }}
          rows={3}
          placeholder={`描述你的任务，${expert.name}会拆解并调用技能执行…`}
          className="w-full resize-none bg-transparent px-1.5 py-1 text-[13.5px] leading-relaxed text-ink-900 outline-none placeholder:text-cloud-400"
        />

        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-cloud-100 px-1 pt-2.5">
          <div className="flex items-center gap-1">
            <button className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11.5px] text-cloud-500 transition hover:bg-cloud-100 hover:text-ink-900">
              <Paperclip size={13} /> 附件
            </button>
            <button
              onClick={() => setOpenPrompts(true)}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11.5px] text-cloud-500 transition hover:bg-cloud-100 hover:text-ink-900"
            >
              <BookOpen size={13} /> 提示词库
            </button>
            <span className="hidden items-center gap-1 rounded-lg px-2 py-1.5 text-[11.5px] text-cloud-400 sm:flex">
              <FileText size={13} /> 商品库 / 词库
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-[11px] text-cloud-400 sm:block">
              {expert.name} · 约 {COST} 算力
            </span>
            <button
              onClick={start}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white shadow-glow transition hover:bg-brand-600 active:scale-95"
            >
              <ArrowUp size={16} strokeWidth={2.6} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-cloud-400">试试：</span>
        {expert.examples.slice(0, 3).map((ex) => (
          <button
            key={ex}
            onClick={() => {
              setPrompt(ex);
              textareaRef.current?.focus();
            }}
            className="chip max-w-full truncate border border-cloud-200 bg-white/70 text-cloud-500 transition hover:border-brand-200 hover:text-brand-600"
          >
            {ex}
          </button>
        ))}
      </div>

      <Modal open={openPrompts} onClose={() => setOpenPrompts(false)} title="提示词库" description="个人与团队沉淀的可复用指令" width="max-w-2xl">
        <div className="grid gap-2 sm:grid-cols-2">
          {promptLibrary.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setPrompt(p.content);
                setOpenPrompts(false);
                setTimeout(() => textareaRef.current?.focus(), 50);
              }}
              className="rounded-xl border border-cloud-200 bg-white p-3 text-left transition hover:border-brand-300 hover:shadow-card"
            >
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-medium text-ink-900">{p.title}</span>
                <Badge tone="gray">{p.category}</Badge>
              </div>
              <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-cloud-500">{p.content}</p>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

export function ExpertCard({ id }: { id: string }) {
  const e = experts.find((x) => x.id === id)!;
  return (
    <div className="group card card-hover flex flex-col p-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[13px] font-semibold text-white shadow-sm",
            e.accent,
          )}
        >
          {e.name.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[13.5px] font-semibold text-ink-900">{e.name}</h3>
            {e.official && <Badge tone="brand">官方</Badge>}
          </div>
          <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-cloud-500">{e.desc}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {e.tags.slice(0, 3).map((t) => (
          <span key={t} className="chip bg-cloud-50 text-cloud-500">
            {t}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-cloud-100 pt-2.5">
        <div className="flex -space-x-1">
          {e.defaultSkills.slice(0, 3).map((s) => (
            <ProductThumb key={s} seed={s} label={skillMap[s]?.name ?? s} size="sm" className="h-4 w-4 rounded-full ring-2 ring-white" />
          ))}
        </div>
        <span className="flex items-center gap-1 text-[11.5px] font-medium text-brand-600 opacity-0 transition group-hover:opacity-100">
          前往使用 →
        </span>
      </div>
    </div>
  );
}
