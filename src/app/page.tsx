"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { Suspense } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  Compass,
  Image as ImageIcon,
  Layers,
  Pin,
  Sparkles,
  TrendingUp,
  Video,
  Zap,
} from "lucide-react";
import { ExpertCard, HomeComposer } from "@/components/home-composer";
import { SkillCard } from "@/components/skill-card";
import { Badge, Tabs } from "@/components/ui";
import { experts, skillCategories, skills } from "@/lib/mock-data";
import { useAppState } from "@/lib/store";
import { cn, timeAgo } from "@/lib/utils";

const CASES = [
  {
    title: "选品指挥官",
    desc: "把「帮我找美国站能做的品」拆成 4 段可中断的流程，直接产出可执行候选清单。",
    tag: "多轮编排",
    accent: "from-ink-800 via-ink-900 to-ink-950",
    icon: Compass,
  },
  {
    title: "7 天测款 SOP",
    desc: "从对标、定价到广告冷启动，按天给你下一步动作，跑完自动出复盘。",
    tag: "可复用 SOP",
    accent: "from-[#4B2E83] via-[#6D5CF6] to-[#2B2160]",
    icon: TrendingUp,
  },
  {
    title: "店铺经营助手",
    desc: "每天 9:30 自动汇总销售、广告、库存与差评，把日报直接推到飞书群。",
    tag: "定时任务",
    accent: "from-[#0B4F3C] via-[#0FA97A] to-[#06301F]",
    icon: Layers,
  },
];

const CHIPS = ["全部", ...skillCategories.map((c) => c.name)];

function HomeContent() {
  const params = useSearchParams();
  const { sessions, ready } = useAppState();
  const [tab, setTab] = React.useState<"experts" | "skills">("experts");
  const [chip, setChip] = React.useState("全部");

  const filteredSkills = chip === "全部" ? skills : skills.filter((s) => s.category === chip);
  const recent = [...sessions].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt).slice(0, 4);

  return (
    <div className="pb-16">
      {/* hero */}
      <section className="relative overflow-hidden border-b border-cloud-200">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-brand-50/70 via-white to-white" />
        <div className="pointer-events-none absolute left-1/2 top-[-180px] -z-10 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-brand-200/35 blur-[110px]" />
        <div className="pointer-events-none absolute right-[8%] top-[40px] -z-10 h-[220px] w-[220px] rounded-full bg-violet-100/60 blur-[80px]" />

        <div className="mx-auto max-w-[860px] px-5 pb-10 pt-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 py-1 pl-1.5 pr-3 text-[11.5px] text-cloud-600 shadow-sm backdrop-blur">
            <span className="flex items-center gap-1 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-semibold text-white">
              <Sparkles size={10} /> NEW
            </span>
            技能生态已上线 · 24 个跨境技能可直接安装
          </div>

          <h1 className="text-[34px] font-semibold leading-[1.18] tracking-[-.02em] text-ink-900 sm:text-[40px]">
            跨境电商
            <span className="bg-gradient-to-r from-brand-500 to-[#FF9A3D] bg-clip-text text-transparent"> AI 运营工作台</span>
          </h1>
          <p className="mx-auto mt-3 max-w-[560px] text-[13.5px] leading-relaxed text-cloud-500">
            选品、市场调研、Listing、作图、视频与店铺数据，全部在一个对话里完成。
            <br className="hidden sm:block" />
            专家决定流程，技能决定能力，产物自动落表。
          </p>

          <div className="mt-5 flex justify-center">
            <div className="inline-flex items-center gap-1 rounded-xl border border-cloud-200 bg-white p-1 shadow-card">
              <button className="flex items-center gap-1.5 rounded-lg bg-ink-900 px-3.5 py-1.5 text-[12.5px] font-medium text-white">
                <Sparkles size={13} /> 业务 Agent
              </button>
              <Link
                href="/studio/image"
                className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12.5px] text-cloud-500 transition hover:bg-cloud-50 hover:text-ink-900"
              >
                <ImageIcon size={13} /> 图片
              </Link>
              <Link
                href="/studio/video"
                className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12.5px] text-cloud-500 transition hover:bg-cloud-50 hover:text-ink-900"
              >
                <Video size={13} /> 视频
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-5 max-w-[760px] text-left">
            <HomeComposer initialPrompt={params.get("q") ?? ""} />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11.5px] text-cloud-400">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-mint-500" /> 24 个技能
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> 6 位跨境专家
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500" /> 9 个数据源
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> 4 大站点
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1180px] px-5">
        {/* experts / skills */}
        <section className="pt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="section-title">按场景开始</h2>
              <p className="mt-1 text-[12px] text-cloud-500">专家自带方法论与默认技能，也可以单独安装技能到任意会话。</p>
            </div>
            <div className="flex items-center gap-2">
              <Tabs
                value={tab}
                onChange={setTab}
                items={[
                  { value: "experts", label: "专家" },
                  { value: "skills", label: "技能" },
                ]}
              />
              <Link
                href={tab === "experts" ? "/experts" : "/skills"}
                className="hidden items-center gap-1 text-[12px] font-medium text-cloud-500 transition hover:text-brand-600 sm:flex"
              >
                查看全部 <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {tab === "experts" ? (
            <>
              <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1 scroll-x">
                {["推荐", "铺货选品", "市场调研", "产品开发", "竞品分析", "店铺经营", "Listing生成", "做图做口播"].map(
                  (c, i) => (
                    <button
                      key={c}
                      className={cn(
                        "shrink-0 rounded-full border px-3 py-1.5 text-[11.5px] transition",
                        i === 0
                          ? "border-ink-900 bg-ink-900 text-white"
                          : "border-cloud-200 bg-white text-cloud-500 hover:border-cloud-300 hover:text-ink-900",
                      )}
                    >
                      {c}
                    </button>
                  ),
                )}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {experts.slice(0, 3).map((e) => (
                  <Link key={e.id} href={`/experts#${e.id}`} className="block">
                    <ExpertCard id={e.id} />
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1 scroll-x">
                {CHIPS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setChip(c)}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1.5 text-[11.5px] transition",
                      chip === c
                        ? "border-ink-900 bg-ink-900 text-white"
                        : "border-cloud-200 bg-white text-cloud-500 hover:border-cloud-300 hover:text-ink-900",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredSkills.slice(0, 6).map((s) => (
                  <SkillCard key={s.id} skill={s} compact />
                ))}
              </div>
            </>
          )}
        </section>

        {/* cases */}
        <section className="pt-9">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="section-title">可复用的跨境方案</h2>
              <p className="mt-1 text-[12px] text-cloud-500">把跑通的流程存成 SOP，下次一句话复用。</p>
            </div>
            <span className="hidden text-[11.5px] text-cloud-400 sm:block">3 个官方方案</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {CASES.map((c) => {
              const Icon = c.icon;
              return (
                <Link
                  key={c.title}
                  href="/automation"
                  className={cn(
                    "group relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white shadow-card transition hover:-translate-y-0.5 hover:shadow-pop",
                    c.accent,
                  )}
                >
                  <div className="absolute inset-0 opacity-[.13] grid-pattern" />
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                        <Icon size={15} />
                      </span>
                      <Badge className="bg-white/15 text-white/90">{c.tag}</Badge>
                    </div>
                    <h3 className="mt-3 text-[13.5px] font-semibold">{c.title}</h3>
                    <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-white/60">{c.desc}</p>
                    <span className="mt-3 flex items-center gap-1 text-[11.5px] font-medium text-white/80 transition group-hover:text-white">
                      查看方案 <ArrowUpRight size={12} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* recent */}
        <section className="pt-9">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="section-title">最近任务</h2>
              <p className="mt-1 text-[12px] text-cloud-500">会话、产物与执行记录都会保留，可继续追问。</p>
            </div>
            <span className="text-[11.5px] text-cloud-400">{ready ? `${sessions.length} 个会话` : ""}</span>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-cloud-200 bg-white shadow-card">
            {!ready && (
              <div className="px-5 py-10 text-center text-[12.5px] text-cloud-400">正在载入本地会话…</div>
            )}
            {ready && recent.length === 0 && (
              <div className="px-5 py-10 text-center text-[12.5px] text-cloud-400">
                还没有任务，在上面的输入框里描述一个需求试试。
              </div>
            )}
            {ready && recent.map((s, i) => {
              const expert = experts.find((e) => e.id === s.expertId);
              return (
                <Link
                  key={s.id}
                  href={`/chat/${s.id}`}
                  className={cn(
                    "group flex items-center gap-3 px-4 py-3 transition hover:bg-cloud-50",
                    i !== 0 && "border-t border-cloud-100",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-[11px] font-semibold text-white",
                      expert?.accent ?? "from-cloud-400 to-cloud-600",
                    )}
                  >
                    {expert?.name.slice(0, 1) ?? "任"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {s.pinned && <Pin size={11} className="text-brand-500" />}
                      <span className="truncate text-[12.5px] font-medium text-ink-900">{s.title}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-cloud-400">
                      <span>{expert?.name}</span>
                      <span className="h-[3px] w-[3px] rounded-full bg-cloud-300" />
                      <Clock3 size={10} />
                      <span>{timeAgo(s.updatedAt)}</span>
                      <span className="h-[3px] w-[3px] rounded-full bg-cloud-300" />
                      <span>{s.messages.length} 条消息</span>
                    </div>
                  </div>
                  <span className="hidden items-center gap-1 text-[11px] text-cloud-400 group-hover:text-brand-600 sm:flex">
                    继续 <ArrowRight size={12} />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* cost strip */}
        <section className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cloud-200 bg-white px-5 py-4 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Zap size={16} />
            </span>
            <div>
              <div className="text-[12.5px] font-medium text-ink-900">算力按次计费，不结转不浪费</div>
              <div className="text-[11px] text-cloud-500">对话 6–14 点 · 作图 30 点 · 视频 120 点起，团队版支持批量与共享</div>
            </div>
          </div>
          <Link href="/pricing" className="btn-ghost h-8 px-3 text-[12px]">
            查看套餐 <ArrowRight size={12} />
          </Link>
        </section>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-10 text-[12px] text-cloud-400">加载工作台…</div>}>
      <HomeContent />
    </Suspense>
  );
}
