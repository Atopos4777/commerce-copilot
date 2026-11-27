"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";
import { ArrowLeft, Check, Download, Plus, Share2, Sparkles, Zap } from "lucide-react";
import { Badge, Button, CopyButton, EmptyState } from "@/components/ui";
import { skillMap, skills } from "@/lib/mock-data";
import { useAppActions, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function SkillDetailPage() {
  const params = useParams<{ id: string }>();
  const skill = skillMap[params?.id as string];
  const { installed } = useAppState();
  const { install, uninstall, toast } = useAppActions();

  if (!skill) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <EmptyState
          title="技能不存在"
          description="该技能可能已下线，去技能广场看看其他能力。"
          action={
            <Link href="/skills" className="btn-primary h-9 px-4">
              返回技能广场
            </Link>
          }
        />
      </div>
    );
  }

  const isInstalled = installed.includes(skill.id);
  const related = skills.filter((s) => s.category === skill.category && s.id !== skill.id).slice(0, 3);

  return (
    <div className="mx-auto max-w-[1080px] px-4 py-6 sm:px-6">
      <Link href="/skills" className="mb-5 inline-flex items-center gap-1.5 text-[12px] text-cloud-500 transition hover:text-ink-900">
        <ArrowLeft size={13} /> 返回技能广场
      </Link>

      <div className="card p-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-rose-500 text-[18px] font-semibold text-white shadow-sm">
            {skill.name.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[21px] font-semibold tracking-tight text-ink-900">{skill.name}</h1>
              {skill.free && <Badge tone="mint">限时免费</Badge>}
              <Badge tone="brand">{skill.category}</Badge>
            </div>
            <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-cloud-500">{skill.desc}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-cloud-400">
              <span>数据源：{skill.tool}</span>
              <span className="h-[3px] w-[3px] rounded-full bg-cloud-300" />
              <span>{skill.version}</span>
              <span className="h-[3px] w-[3px] rounded-full bg-cloud-300" />
              <span>安装量 {skill.installs.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => toast("链接已复制", "info")}>
              <Share2 size={13} /> 分享
            </Button>
            <Button
              variant={isInstalled ? "subtle" : "primary"}
              size="sm"
              onClick={() => (isInstalled ? uninstall(skill.id) : install(skill.id))}
            >
              {isInstalled ? <Check size={13} /> : <Plus size={13} />}
              {isInstalled ? "已安装" : "安装到我的技能"}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <section className="card p-5">
            <h2 className="text-[13.5px] font-semibold text-ink-900">概述</h2>
            <p className="mt-2 text-[12.5px] leading-[1.9] text-cloud-600">{skill.overview}</p>

            <h3 className="mt-5 text-[12.5px] font-semibold text-ink-900">适用于</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {skill.applicable.map((a) => (
                <span key={a} className="chip border border-cloud-200 bg-white text-cloud-600">
                  {a}
                </span>
              ))}
            </div>

            <h3 className="mt-5 text-[12.5px] font-semibold text-ink-900">能力标签</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {skill.tags.map((t) => (
                <span key={t} className="chip bg-brand-50 text-brand-600">
                  {t}
                </span>
              ))}
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-cloud-100 px-5 py-3">
              <div>
                <h2 className="text-[13px] font-semibold text-ink-900">调用示例</h2>
                <p className="mt-0.5 text-[11px] text-cloud-400">会话内由 Agent 自动构造参数，也可通过开放 API 直接调用</p>
              </div>
              <CopyButton
                text={`{\n  "skill": "${skill.slug}",\n  "input": {\n    "market": "US",\n    "keyword": "pet hair remover"\n  }\n}`}
                label="复制"
              />
            </div>
            <pre className="overflow-x-auto bg-ink-950 p-4 font-mono text-[11px] leading-relaxed text-white/70">
              {`POST /api/skills/${skill.slug}/invoke
{
  "market": "US",
  "keyword": "pet hair remover",
  "priceRange": [15, 35]
}

// response
{
  "ok": true,
  "data": { "matched": 486, "candidates": 37 },
  "credits": 2
}`}
            </pre>
          </section>

          <section className="card p-5">
            <h2 className="text-[13px] font-semibold text-ink-900">边界与限制</h2>
            <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-cloud-600">
              <li>· 数据来自第三方平台公开页面或已授权接口，不保证 100% 实时，缓存时间以详情为准。</li>
              <li>· 结果用于运营决策参考，不构成法律或投资意见；涉及合规判断请以专业机构结论为准。</li>
              <li>· 每次调用按次扣除算力，相同参数在缓存有效期内不重复计费。</li>
            </ul>
          </section>
        </div>

        <aside className="space-y-3">
          <div className="card p-4">
            <div className="text-[11px] text-cloud-400">计费方式</div>
            <div className="mt-1 flex items-center gap-1 text-[13px] font-semibold text-ink-900">
              <Zap size={13} className="text-brand-500" /> 按次计费
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-cloud-500">{skill.pricing}</p>
            <div className="mt-3 space-y-2 border-t border-cloud-100 pt-3 text-[11.5px]">
              <div className="flex justify-between">
                <span className="text-cloud-400">版本</span>
                <span className="text-ink-900">{skill.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cloud-400">安装量</span>
                <span className="text-ink-900">{skill.installs.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cloud-400">来源</span>
                <span className="text-ink-900">{skill.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cloud-400">数据源</span>
                <span className="text-ink-900">{skill.tool}</span>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="mb-2 text-[11.5px] font-medium text-ink-900">同类技能</div>
            <div className="space-y-1">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/skills/${r.id}`}
                  className="group flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition hover:bg-cloud-50"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cloud-100 text-[10px] font-medium text-cloud-600">
                    {r.name.slice(0, 1)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11.5px] text-cloud-700 group-hover:text-ink-900">
                    {r.name}
                  </span>
                  <Download size={10} className="text-cloud-300" />
                </Link>
              ))}
              {related.length === 0 && <div className="text-[11px] text-cloud-400">暂无同类技能</div>}
            </div>
          </div>

          <div className={cn("rounded-2xl p-4 text-white", "bg-gradient-to-br from-ink-800 to-ink-950")}>
            <Sparkles size={15} className="text-brand-400" />
            <div className="mt-2 text-[12px] font-medium">组合使用效果更好</div>
            <p className="mt-1 text-[10.5px] leading-relaxed text-white/50">
              选品类技能叠加 Keepa 价格追踪，可以在同一次会话内完成数据拉取与价格验证。
            </p>
            <Link href="/experts" className="mt-2.5 inline-flex items-center gap-1 text-[11px] text-brand-300 hover:text-brand-200">
              找对应的专家 Agent →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
