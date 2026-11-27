"use client";

import React from "react";
import {
  Check,
  ChevronDown,
  Crown,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Badge, Button, PageHeader, Progress } from "@/components/ui";
import { useAppActions, useAppState } from "@/lib/store";
import { cn, formatNumber } from "@/lib/utils";

const PLANS = [
  {
    id: "free",
    name: "免费体验",
    price: 0,
    desc: "先跑通一个完整流程",
    features: ["2,000 算力 / 月", "3 个并发任务", "基础技能 8 个", "商品库 50 条", "社区支持"],
    cta: "当前可用",
  },
  {
    id: "basic",
    name: "基础版",
    price: 99,
    desc: "个人卖家日常运营",
    features: ["10,000 算力 / 月", "5 个并发任务", "全部社区技能", "商品库 1,000 条", "定时任务 5 个", "邮件支持"],
    cta: "升级到基础版",
  },
  {
    id: "pro",
    name: "高级版",
    price: 299,
    desc: "多店铺精细化运营",
    features: ["24,200 算力 / 月", "20 个并发任务", "全部技能 + 优先新技能", "商品库不限", "定时任务不限", "团队共享 3 席位", "飞书 / 钉钉推送"],
    cta: "当前套餐",
    current: true,
  },
  {
    id: "team",
    name: "团队版",
    price: 899,
    desc: "团队协作与权限管理",
    features: ["80,000 算力 / 月，可共享", "50 个并发任务", "私有技能与专家", "API / MCP 接入", "10 席位 + 角色权限", "专属客户成功"],
    cta: "联系升级",
    highlight: true,
  },
];

const COSTS = [
  ["Agent 对话", "6–14 点 / 次", "按任务复杂度与挂载技能数量计费"],
  ["AI 作图", "30 点 / 张起", "商品套图 30 点，高清重绘 60 点"],
  ["视频生成", "120 点 / 条起", "15s 竖版 120 点，30s 口播 240 点"],
  ["技能调用", "1–14 点 / 次", "按数据源与检索规模计费，缓存期内不重复扣费"],
  ["定时任务", "1–5 点 / 次", "按巡检对象数量计费，失败自动返还"],
];

const FAQS = [
  ["算力会过期吗？", "套餐内算力按自然月重置，不结转；加油包算力有效期为 12 个月，优先消耗即将过期的部分。"],
  ["可以从免费版直接升级吗？", "可以，随时升级按剩余天数折算差价，权益立即生效。降级会在当前计费周期结束后生效。"],
  ["团队席位怎么共享算力？", "团队版所有席位共用一个算力池，管理员可在成员页设置每人每月额度上限，避免个别成员超额。"],
  ["支持哪些店铺平台？", "当前支持亚马逊、TikTok Shop、Temu、Shopee、Ozon 与 Walmart 的数据接入，授权方式分官方 API 与只读报表导入。"],
];

export default function PricingPage() {
  const { credits, planTotal } = useAppState();
  const { toast } = useAppActions();
  const [billing, setBilling] = React.useState<"monthly" | "yearly">("monthly");
  const [openFaq, setOpenFaq] = React.useState<number | null>(0);

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6">
      <PageHeader
        eyebrow="Billing"
        title="套餐与算力"
        description="算力按实际调用计费，不用不扣。团队版支持共享算力池与成员额度管理。"
        actions={
          <div className="inline-flex items-center gap-1 rounded-xl bg-cloud-100 p-1">
            <button
              onClick={() => setBilling("monthly")}
              className={cn("rounded-lg px-3 py-1.5 text-[11.5px] transition", billing === "monthly" ? "bg-white font-medium text-ink-900 shadow-sm" : "text-cloud-500")}
            >
              月付
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={cn("rounded-lg px-3 py-1.5 text-[11.5px] transition", billing === "yearly" ? "bg-white font-medium text-ink-900 shadow-sm" : "text-cloud-500")}
            >
              年付 <span className="text-mint-600">-20%</span>
            </button>
          </div>
        }
      />

      <div className="rounded-2xl bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950 p-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Crown size={15} className="text-brand-400" />
              <span className="text-[12px] text-white/60">当前套餐</span>
              <Badge className="bg-white/15 text-white">高级版</Badge>
            </div>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-[30px] font-semibold leading-none">{formatNumber(credits)}</span>
              <span className="pb-1 text-[11.5px] text-white/50">/ {formatNumber(planTotal)} 算力剩余</span>
            </div>
            <div className="mt-3 w-[300px] max-w-full">
              <Progress value={credits} max={planTotal} className="bg-white/10" />
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-white/40">
                <span>本周期已用 {formatNumber(planTotal - credits)}</span>
                <span>12-20 重置</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => toast("购买入口（演示环境）", "info")}
              className="rounded-xl bg-brand-500 px-3.5 py-2 text-[12px] font-medium text-white transition hover:bg-brand-600"
            >
              购买算力加油包
            </button>
            <button
              onClick={() => toast("已生成本月账单", "info")}
              className="rounded-xl border border-white/15 px-3.5 py-2 text-[12px] text-white/80 transition hover:bg-white/10"
            >
              查看账单
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 border-t border-white/10 pt-3 sm:grid-cols-3">
          {[
            ["本月已执行任务", "128 次"],
            ["节省人工时长", "约 42 小时"],
            ["平均单任务成本", "¥1.86"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 text-[10.5px] text-white/45">
              <span className="h-1 w-1 rounded-full bg-brand-400" />
              {k} <span className="font-medium text-white/85">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((p) => {
          const price = billing === "yearly" && p.price > 0 ? Math.round(p.price * 0.8) : p.price;
          return (
            <div
              key={p.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-white p-4 shadow-card",
                p.highlight ? "border-brand-300 ring-2 ring-brand-100" : "border-cloud-200",
              )}
            >
              {p.highlight && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-brand-500 px-2 py-0.5 text-[9.5px] font-medium text-white">
                  团队首选
                </span>
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-semibold text-ink-900">{p.name}</span>
                {p.current && <Badge tone="mint">当前</Badge>}
              </div>
              <div className="text-[10.5px] text-cloud-400">{p.desc}</div>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-[26px] font-semibold leading-none tracking-tight text-ink-900">¥{price}</span>
                <span className="pb-0.5 text-[10.5px] text-cloud-400">/ 月</span>
              </div>
              {billing === "yearly" && p.price > 0 && (
                <div className="mt-0.5 text-[9.5px] text-mint-600">年付 ¥{price * 12}，省 ¥{p.price * 12 - price * 12}</div>
              )}
              <ul className="mt-3 flex-1 space-y-1.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-[10.5px] leading-relaxed text-cloud-600">
                    <Check size={11} className="mt-0.5 shrink-0 text-mint-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => toast(p.current ? "当前已是高级版" : `已发起「${p.name}」变更（演示）`, p.current ? "info" : "success")}
                disabled={p.current}
                className={cn(
                  "mt-4 h-8 rounded-lg text-[11.5px] font-medium transition",
                  p.current
                    ? "bg-cloud-100 text-cloud-400"
                    : p.highlight
                      ? "bg-brand-500 text-white hover:bg-brand-600"
                      : "border border-cloud-200 text-ink-900 hover:bg-cloud-50",
                )}
              >
                {p.cta}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_320px]">
        <div className="card overflow-hidden">
          <div className="border-b border-cloud-100 px-4 py-3">
            <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-900">
              <Zap size={13} className="text-brand-500" /> 算力消耗规则
            </div>
            <p className="mt-0.5 text-[10.5px] text-cloud-400">按实际调用扣除，失败与缓存命中不重复计费</p>
          </div>
          <div className="divide-y divide-cloud-100">
            {COSTS.map(([name, cost, desc]) => (
              <div key={name} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-[86px] shrink-0 text-[11.5px] font-medium text-ink-900">{name}</span>
                <span className="w-[92px] shrink-0 font-mono text-[10.5px] text-brand-600">{cost}</span>
                <span className="flex-1 text-[10.5px] leading-relaxed text-cloud-500">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-cloud-200 bg-white p-4 shadow-card">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-900">
              <Users size={13} className="text-violet-500" /> 团队协作
            </div>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-cloud-500">
              共享算力池、成员额度、技能与专家的团队级分发，产物可设置只读或协作。
            </p>
            <button onClick={() => toast("已发送销售咨询（演示）", "info")} className="mt-2.5 flex w-full items-center justify-center gap-1 rounded-lg bg-ink-900 py-1.5 text-[10.5px] text-white hover:bg-ink-800">
              <Sparkles size={10} /> 预约产品演示
            </button>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 p-4 text-white">
            <div className="text-[11.5px] font-medium">年付更划算</div>
            <p className="mt-1 text-[10.5px] leading-relaxed text-white/75">
              年付立减 20%，并锁定当前价格。高级版年付 ¥2,870，平均每月 ¥239。
            </p>
            <button onClick={() => setBilling("yearly")} className="mt-2 text-[10.5px] font-medium text-white/90 hover:text-white">
              切到年付 →
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2.5 text-[13px] font-semibold text-ink-900">常见问题</div>
        <div className="overflow-hidden rounded-2xl border border-cloud-200 bg-white shadow-card">
          {FAQS.map(([q, a], i) => (
            <div key={q} className={cn(i !== 0 && "border-t border-cloud-100")}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span className="text-[12px] font-medium text-ink-900">{q}</span>
                <ChevronDown size={13} className={cn("text-cloud-400 transition", openFaq === i && "rotate-180")} />
              </button>
              {openFaq === i && <p className="px-4 pb-3 text-[11px] leading-relaxed text-cloud-500">{a}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
