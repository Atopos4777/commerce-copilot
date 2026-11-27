"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  Download,
  Package,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  Target,
  TrendingUp,
  Truck,
  Zap,
} from "lucide-react";
import { AreaChart, Badge, Button, Donut, PageHeader, ProductThumb, Progress } from "@/components/ui";
import {
  campaigns,
  orderRows,
  salesSeries,
  siteShare,
  storeAuths,
  storeProducts,
} from "@/lib/mock-data";
import { useAppActions } from "@/lib/store";
import { cn, formatNumber } from "@/lib/utils";

type TabKey = "overview" | "products" | "ads" | "orders" | "inventory" | "auth";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "总览" },
  { key: "products", label: "商品" },
  { key: "ads", label: "广告" },
  { key: "orders", label: "订单" },
  { key: "inventory", label: "库存" },
  { key: "auth", label: "授权" },
];

function DashboardContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { createSession } = useAppActions();
  const initialTab = params.get("tab") as TabKey | null;
  const [tab, setTab] = React.useState<TabKey>(
    initialTab && TABS.some((x) => x.key === initialTab) ? initialTab : "overview",
  );
  const [period, setPeriod] = React.useState("30d");

  React.useEffect(() => {
    const t = params.get("tab") as TabKey | null;
    if (t && TABS.some((x) => x.key === t)) setTab(t);
  }, [params]);

  const dailyReport = () => {
    const s = createSession({
      title: "生成本周店铺经营日报",
      expertId: "expert-store",
      skillIds: ["bsr-tracker", "ads-acos-diagnose"],
    });
    sessionStorage.setItem(
      `cp.pending.${s.id}`,
      JSON.stringify({
        prompt: "汇总近 30 天店铺经营数据：销售额、订单、ACOS、库存与差评，定位本周最大的一个问题，并输出按优先级排序的行动清单。",
        expertId: "expert-store",
        skillIds: ["bsr-tracker", "ads-acos-diagnose"],
      }),
    );
    router.push(`/chat/${s.id}`);
  };

  const total = salesSeries.reduce((s, v) => s + v, 0);

  return (
    <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6">
      <PageHeader
        eyebrow="Store Analytics"
        title="店铺经营助手"
        description="销售、广告、库存、订单与授权汇总在一个看板里；发现问题可以直接交给经营 Agent 拆解。"
        actions={
          <>
            <Button variant="ghost" size="sm">
              <RefreshCw size={13} /> 同步数据
            </Button>
            <Button variant="dark" size="sm" onClick={dailyReport}>
              <Sparkles size={13} /> 生成经营日报
            </Button>
          </>
        }
      />

      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "近 30 天销售额", value: `$${formatNumber(total)}`, delta: "+18.2%", up: true, icon: CircleDollarSign, data: salesSeries.slice(-12) },
          { label: "订单量", value: "3,842", delta: "+12.4%", up: true, icon: ShoppingCart, data: [32, 36, 34, 40, 39, 44, 42, 47, 45, 49, 52, 50] },
          { label: "广告 ACOS", value: "21.4%", delta: "-2.1pt", up: true, icon: Target, data: [28, 27, 26, 27, 25, 24, 24, 23, 22, 22, 21, 21] },
          { label: "库存周转", value: "6.8 次", delta: "+0.4", up: true, icon: Package, data: [5.8, 6, 6.1, 6.0, 6.2, 6.3, 6.4, 6.4, 6.5, 6.6, 6.7, 6.8] },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="card px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] text-cloud-400">{k.label}</span>
                <Icon size={13} className="text-cloud-300" />
              </div>
              <div className="mt-1 flex items-end justify-between gap-2">
                <span className="text-[21px] font-semibold tracking-tight text-ink-900">{k.value}</span>
                <span className={cn("flex items-center gap-0.5 text-[10.5px] font-medium", k.up ? "text-mint-600" : "text-red-500")}>
                  {k.up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                  {k.delta}
                </span>
              </div>
              <div className="mt-1 h-6">
                <AreaChart data={k.data} height={24} showGrid={false} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-4 flex items-center gap-1 overflow-x-auto border-b border-cloud-200 pb-0 scroll-x">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              router.replace(t.key === "overview" ? "/dashboard" : `/dashboard?tab=${t.key}`, { scroll: false });
            }}
            className={cn(
              "relative shrink-0 px-3 py-2 text-[12.5px] transition",
              tab === t.key ? "font-medium text-ink-900" : "text-cloud-500 hover:text-ink-900",
            )}
          >
            {t.label}
            {tab === t.key && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-brand-500" />}
          </button>
        ))}
        <div className="ml-auto hidden items-center gap-1 pb-1.5 text-[10.5px] text-cloud-400 sm:flex">
          <CalendarDays size={11} /> 数据截至 11-20 10:00
        </div>
      </div>

      {tab === "overview" && (
        <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            <div className="card p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[12.5px] font-semibold text-ink-900">销售趋势</div>
                  <div className="text-[10.5px] text-cloud-400">全部站点 · 单位 USD</div>
                </div>
                <div className="inline-flex items-center gap-1 rounded-lg bg-cloud-100 p-0.5">
                  {["7d", "30d", "90d"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={cn(
                        "rounded-md px-2 py-1 text-[10.5px] transition",
                        period === p ? "bg-white font-medium text-ink-900 shadow-sm" : "text-cloud-500",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <AreaChart data={salesSeries} height={172} />
              <div className="mt-2 flex items-center justify-between text-[10px] text-cloud-400">
                <span>10-22</span>
                <span>11-20</span>
              </div>
            </div>

            <div className="card p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-[12.5px] font-semibold text-ink-900">Top ASIN</span>
                <button className="flex items-center gap-1 text-[10.5px] text-cloud-400 hover:text-brand-600">
                  <Download size={10} /> 导出
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left">
                  <thead>
                    <tr className="text-[9.5px] uppercase tracking-wide text-cloud-400">
                      <th className="pb-1.5 font-medium">商品</th>
                      <th className="pb-1.5 font-medium">30 天销量</th>
                      <th className="pb-1.5 font-medium">库存</th>
                      <th className="pb-1.5 text-right font-medium">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storeProducts.slice(0, 5).map((p) => (
                      <tr key={p.id} className="border-t border-cloud-100">
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <ProductThumb seed={p.asin} label={p.title} className="h-7 w-7" />
                            <div className="min-w-0">
                              <div className="max-w-[220px] truncate text-[11px] font-medium text-ink-900">{p.title}</div>
                              <div className="font-mono text-[9px] text-cloud-400">{p.asin}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 font-mono text-[11px] text-cloud-600">{formatNumber(p.sales30d)}</td>
                        <td className="py-2 font-mono text-[11px] text-cloud-600">{formatNumber(p.stock)}</td>
                        <td className="py-2 text-right">
                          <Badge tone={p.status === "在售" ? "mint" : p.status === "低库存" ? "amber" : "red"}>
                            {p.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="card p-4">
              <div className="text-[12.5px] font-semibold text-ink-900">站点销售占比</div>
              <div className="mt-3 flex items-center gap-4">
                <Donut
                  segments={siteShare.map((s) => ({ value: s.value, color: s.color }))}
                  centerValue="5"
                  centerLabel="个站点"
                />
                <div className="flex-1 space-y-1.5">
                  {siteShare.map((s) => (
                    <div key={s.site} className="flex items-center gap-1.5 text-[10.5px]">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                      <span className="flex-1 text-cloud-500">{s.site}</span>
                      <span className="font-mono text-ink-900">{s.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-amber-500" />
                <span className="text-[12.5px] font-semibold text-ink-900">需要处理</span>
                <span className="ml-auto rounded-full bg-amber-50 px-1.5 py-0.5 text-[9.5px] text-amber-700">3</span>
              </div>
              <div className="mt-2.5 space-y-2">
                {[
                  { title: "烘焙垫库存仅 18 天", desc: "按当前销量将在下月初断货", tone: "text-red-500" },
                  { title: "德国站授权已过期", desc: "影响 42 个 Listing 数据同步", tone: "text-amber-600" },
                  { title: "5 条差评提到包装破损", desc: "集中在同一物流批次", tone: "text-cloud-500" },
                ].map((a) => (
                  <div key={a.title} className="rounded-lg border border-cloud-200 px-2.5 py-2">
                    <div className={cn("text-[11px] font-medium", a.tone)}>{a.title}</div>
                    <div className="text-[10px] text-cloud-400">{a.desc}</div>
                  </div>
                ))}
              </div>
              <button onClick={dailyReport} className="mt-2.5 flex w-full items-center justify-center gap-1 rounded-lg bg-ink-900 py-1.5 text-[10.5px] text-white hover:bg-ink-800">
                <Sparkles size={10} /> 让 Agent 生成处理方案
              </button>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 p-4 text-white">
              <div className="flex items-center gap-1.5 text-[11.5px] font-medium">
                <Zap size={12} /> 本周经营摘要
              </div>
              <p className="mt-1.5 text-[10.5px] leading-relaxed text-white/75">
                GMV 环比 +6.4%，但转化率下降 0.8pt。主要受烘焙垫详情页停留时长下降影响，建议先做主图 A/B 测试。
              </p>
              <button onClick={dailyReport} className="mt-2 text-[10.5px] font-medium text-white/90 hover:text-white">
                查看完整诊断 →
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "products" && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-cloud-100 px-4 py-3">
            <span className="text-[12.5px] font-semibold text-ink-900">商品表现</span>
            <span className="text-[10.5px] text-cloud-400">近 30 天 · {storeProducts.length} 个 ASIN</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="bg-cloud-50/70 text-[10px] uppercase tracking-wide text-cloud-400">
                  <th className="px-4 py-2 font-medium">商品</th>
                  <th className="px-3 py-2 font-medium">类目</th>
                  <th className="px-3 py-2 font-medium">价格</th>
                  <th className="px-3 py-2 font-medium">30 天销量</th>
                  <th className="px-3 py-2 font-medium">库存</th>
                  <th className="px-4 py-2 text-right font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {storeProducts.map((p) => (
                  <tr key={p.id} className="border-t border-cloud-100 hover:bg-cloud-50/50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <ProductThumb seed={p.asin} label={p.title} className="h-8 w-8" />
                        <div>
                          <div className="text-[11.5px] font-medium text-ink-900">{p.title}</div>
                          <div className="font-mono text-[9.5px] text-cloud-400">{p.asin}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-cloud-500">{p.category}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-ink-900">${p.price.toFixed(2)}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-cloud-600">{formatNumber(p.sales30d)}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-cloud-600">{formatNumber(p.stock)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Badge tone={p.status === "在售" ? "mint" : p.status === "低库存" ? "amber" : "red"}>{p.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "ads" && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-cloud-100 px-4 py-3">
            <span className="text-[12.5px] font-semibold text-ink-900">广告活动</span>
            <span className="text-[10.5px] text-cloud-400">近 30 天 · ACOS 21.4%</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="bg-cloud-50/70 text-[10px] uppercase tracking-wide text-cloud-400">
                  <th className="px-4 py-2 font-medium">活动</th>
                  <th className="px-3 py-2 font-medium">类型</th>
                  <th className="px-3 py-2 font-medium">花费</th>
                  <th className="px-3 py-2 font-medium">销售额</th>
                  <th className="px-3 py-2 font-medium">ACOS</th>
                  <th className="px-3 py-2 font-medium">点击</th>
                  <th className="px-4 py-2 text-right font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-t border-cloud-100 hover:bg-cloud-50/50">
                    <td className="px-4 py-2.5 text-[11.5px] font-medium text-ink-900">{c.name}</td>
                    <td className="px-3 py-2.5 text-[11px] text-cloud-500">{c.type}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-cloud-600">${formatNumber(c.spend)}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-cloud-600">${formatNumber(c.sales)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "font-mono text-[11px]",
                            c.acos > 25 ? "text-red-500" : c.acos < 18 ? "text-mint-600" : "text-ink-900",
                          )}
                        >
                          {c.acos}%
                        </span>
                        <div className="h-1 w-12 overflow-hidden rounded-full bg-cloud-100">
                          <div
                            className={cn("h-full rounded-full", c.acos > 25 ? "bg-red-400" : "bg-mint-500")}
                            style={{ width: `${Math.min(100, c.acos * 2.6)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-cloud-600">{formatNumber(c.clicks)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Badge tone={c.status === "投放中" ? "mint" : c.status === "预算受限" ? "amber" : "gray"}>
                        {c.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-cloud-100 px-4 py-3">
            <span className="text-[12.5px] font-semibold text-ink-900">最近订单</span>
            <span className="text-[10.5px] text-cloud-400">今日 3,842 单</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead>
                <tr className="bg-cloud-50/70 text-[10px] uppercase tracking-wide text-cloud-400">
                  <th className="px-4 py-2 font-medium">订单号</th>
                  <th className="px-3 py-2 font-medium">商品</th>
                  <th className="px-3 py-2 font-medium">站点</th>
                  <th className="px-3 py-2 font-medium">金额</th>
                  <th className="px-3 py-2 font-medium">时间</th>
                  <th className="px-4 py-2 text-right font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {orderRows.map((o) => (
                  <tr key={o.id} className="border-t border-cloud-100 hover:bg-cloud-50/50">
                    <td className="px-4 py-2.5 font-mono text-[10.5px] text-cloud-500">{o.orderNo}</td>
                    <td className="px-3 py-2.5 text-[11px] text-ink-900">{o.product}</td>
                    <td className="px-3 py-2.5 text-[11px] text-cloud-500">{o.site}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-ink-900">${o.amount.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-[10.5px] text-cloud-400">{o.time}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Badge
                        tone={
                          o.status === "已签收" ? "mint" : o.status === "退款" ? "red" : o.status === "待发货" ? "amber" : "gray"
                        }
                      >
                        {o.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "inventory" && (
        <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-cloud-100 px-4 py-3">
              <span className="text-[12.5px] font-semibold text-ink-900">库存与可售天数</span>
              <span className="text-[10.5px] text-cloud-400">低于 30 天标红</span>
            </div>
            <div className="divide-y divide-cloud-100">
              {storeProducts.slice(0, 6).map((p) => {
                const days = p.sales30d ? Math.round((p.stock / p.sales30d) * 30) : 0;
                return (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                    <ProductThumb seed={p.asin} label={p.title} className="h-8 w-8" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11.5px] font-medium text-ink-900">{p.title}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <Progress
                          value={Math.min(days, 90)}
                          max={90}
                          className="w-32"
                          barClassName={days < 30 ? "bg-red-400" : days < 45 ? "bg-amber-400" : "bg-mint-500"}
                        />
                        <span className={cn("font-mono text-[10px]", days < 30 ? "text-red-500" : "text-cloud-500")}>
                          {days} 天
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-[11px] text-ink-900">{formatNumber(p.stock)}</div>
                      <div className="text-[9.5px] text-cloud-400">库存</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card h-fit p-4">
            <div className="flex items-center gap-1.5">
              <Truck size={13} className="text-brand-500" />
              <span className="text-[12.5px] font-semibold text-ink-900">补货建议</span>
            </div>
            <div className="mt-2.5 space-y-2">
              {[
                { asin: "B0D1M8T4P2", qty: "600 件", note: "18 天可售，最高优先级" },
                { asin: "B0C8V6B3M1", qty: "300 件", note: "26 天可售" },
                { asin: "B0D9W3E5Y8", qty: "400 件", note: "已缺货，需加急" },
              ].map((a) => (
                <div key={a.asin} className="rounded-lg border border-cloud-200 px-2.5 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10.5px] text-ink-900">{a.asin}</span>
                    <span className="text-[10.5px] font-medium text-brand-600">{a.qty}</span>
                  </div>
                  <div className="text-[9.5px] text-cloud-400">{a.note}</div>
                </div>
              ))}
            </div>
            <button onClick={dailyReport} className="mt-2.5 w-full rounded-lg bg-ink-900 py-1.5 text-[10.5px] text-white hover:bg-ink-800">
              生成补货计划
            </button>
          </div>
        </div>
      )}

      {tab === "auth" && (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {storeAuths.map((s) => (
            <div key={s.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cloud-100 text-cloud-500">
                    <ShoppingCart size={15} />
                  </span>
                  <div>
                    <div className="text-[12.5px] font-medium text-ink-900">{s.name}</div>
                    <div className="text-[10.5px] text-cloud-400">{s.site}</div>
                  </div>
                </div>
                <Badge tone={s.status === "已授权" ? "mint" : s.status === "授权过期" ? "amber" : "gray"}>
                  {s.status}
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-cloud-100 pt-2.5 text-[10.5px]">
                <span className="text-cloud-400">授权到期：{s.expiry}</span>
                <span className="text-cloud-500">{s.listings} 个 Listing</span>
              </div>
              <div className="mt-2 flex gap-1.5">
                <button
                  className={cn(
                    "flex-1 rounded-lg py-1.5 text-[10.5px] font-medium",
                    s.status === "已授权"
                      ? "bg-cloud-100 text-cloud-600 hover:bg-cloud-200"
                      : "bg-brand-500 text-white hover:bg-brand-600",
                  )}
                >
                  {s.status === "已授权" ? "管理授权" : "立即授权"}
                </button>
                <button className="rounded-lg border border-cloud-200 px-2.5 py-1.5 text-[10.5px] text-cloud-500">
                  同步
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-[10px] text-cloud-400">
        <span className="flex items-center gap-1">
          <TrendingUp size={10} /> 数据每 30 分钟自动同步 · 演示数据
        </span>
        <span className="hidden sm:block">店铺经营助手 · 支持亚马逊 / TikTok Shop / Temu</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-10 text-[12px] text-cloud-400">加载看板…</div>}>
      <DashboardContent />
    </Suspense>
  );
}
