"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import {
  Bell,
  CalendarClock,
  ChevronDown,
  Compass,
  FolderOpen,
  HelpCircle,
  Image as ImageIcon,
  LayoutGrid,
  Menu,
  MessageSquarePlus,
  PenLine,
  Plus,
  Search,
  Settings,
  Sparkles,
  Store,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useAppState } from "@/lib/store";
import { cn, formatNumber, timeAgo } from "@/lib/utils";
import { Progress } from "./ui";

const NAV: {
  href: string;
  label: string;
  icon: React.ElementType;
  hot?: boolean;
  children?: { href: string; label: string }[];
}[] = [
  { href: "/", label: "新任务", icon: MessageSquarePlus },
  {
    href: "/studio/image",
    label: "作图 & 视频",
    icon: ImageIcon,
    hot: true,
    children: [
      { href: "/studio/image", label: "AI 作图" },
      { href: "/studio/video", label: "视频生成" },
    ],
  },
  { href: "/selection", label: "选品工作台", icon: Compass },
  { href: "/listing", label: "Listing 生成", icon: PenLine },
  {
    href: "/dashboard",
    label: "店铺经营助手",
    icon: Store,
    children: [
      { href: "/dashboard", label: "经营总览" },
      { href: "/dashboard?tab=products", label: "商品" },
      { href: "/dashboard?tab=ads", label: "广告" },
      { href: "/dashboard?tab=orders", label: "订单" },
      { href: "/dashboard?tab=inventory", label: "库存" },
      { href: "/dashboard?tab=auth", label: "授权" },
    ],
  },
  { href: "/automation", label: "定时任务", icon: CalendarClock },
  { href: "/assets", label: "资产库", icon: FolderOpen },
  {
    href: "/skills",
    label: "技能 · 专家",
    icon: Sparkles,
    children: [
      { href: "/skills", label: "技能广场" },
      { href: "/experts", label: "跨境专家" },
    ],
  },
  { href: "/pricing", label: "套餐与算力", icon: Wallet },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-1">
      <span className="relative flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-brand-400 to-brand-600 shadow-glow">
        <svg viewBox="0 0 32 32" className="h-[19px] w-[19px]" fill="none">
          <path d="M4.5 5.5l6.2 4.1h10.6l6.2-4.1-1.9 12.4L16 27 6.4 17.9 4.5 5.5z" fill="white" opacity=".96" />
          <circle cx="11.6" cy="14.4" r="1.5" fill="#C43606" />
          <circle cx="20.4" cy="14.4" r="1.5" fill="#C43606" />
          <path d="M13 19.4h6l-3 3.2-3-3.2z" fill="#C43606" opacity=".85" />
        </svg>
      </span>
      <span className="leading-none">
        <span className="block text-[14.5px] font-semibold tracking-tight text-white">星岑远航</span>
        <span className="mt-1 block text-[9.5px] tracking-[.08em] text-white/40">StarCenVoyage · 跨境 AI 运营</span>
      </span>
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { sessions, credits, planTotal, ready } = useAppState();
  const [open, setOpen] = React.useState<string | null>(null);
  const recent = [...sessions].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt).slice(0, 4);

  const isActive = (item: (typeof NAV)[number]) => {
    if (item.href === "/") return pathname === "/";
    if (item.href === "/dashboard") return pathname.startsWith("/dashboard");
    return pathname.startsWith(item.href);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-3 pb-3 pt-5">
        <Logo />
      </div>

      <div className="px-3 pb-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="group flex h-9 items-center justify-between rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-3 text-[13px] font-medium text-white shadow-glow transition hover:brightness-105"
        >
          <span className="flex items-center gap-2">
            <Plus size={15} strokeWidth={2.4} /> 新任务
          </span>
          <span className="rounded-md bg-white/15 px-1.5 py-0.5 font-mono text-[10px] text-white/80">N</span>
        </Link>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 no-scrollbar">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          const expanded = open === item.label;
          return (
            <div key={item.label}>
              <div className="relative">
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition",
                    active ? "bg-white/10 font-medium text-white" : "text-white/60 hover:bg-white/[.06] hover:text-white/90",
                  )}
                >
                  <Icon size={16} className={cn("shrink-0", active ? "text-brand-400" : "text-white/45 group-hover:text-white/70")} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.hot && (
                    <span className="rounded bg-brand-500/20 px-1.5 py-[1px] text-[9px] font-semibold tracking-wide text-brand-300">
                      HOT
                    </span>
                  )}
                  {item.children && (
                    <button
                      aria-label="展开子菜单"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpen(expanded ? null : item.label);
                      }}
                      className="rounded p-0.5 text-white/30 hover:bg-white/10 hover:text-white/80"
                    >
                      <ChevronDown size={13} className={cn("transition", expanded && "rotate-180")} />
                    </button>
                  )}
                </Link>
                {active && <span className="absolute -left-2 top-2 h-5 w-[3px] rounded-r bg-brand-500" />}
              </div>
              {expanded && item.children && (
                <div className="mb-1 ml-[26px] mt-0.5 space-y-0.5 border-l border-white/10 pl-2.5">
                  {item.children.map((c) => (
                    <Link
                      key={c.label}
                      href={c.href}
                      onClick={onNavigate}
                      className="block rounded-md px-2 py-1.5 text-[12px] text-white/45 transition hover:bg-white/[.06] hover:text-white/85"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="mt-5 px-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-white/30">最近任务</span>
            <Link href="/" className="text-[10px] text-white/30 hover:text-white/60" onClick={onNavigate}>
              全部
            </Link>
          </div>
        </div>
        <div className="mt-1.5 space-y-0.5">
          {!ready && <div className="px-2.5 py-2 text-[11px] text-white/20">载入中…</div>}
          {ready && recent.length === 0 && <div className="px-2.5 py-2 text-[11.5px] text-white/25">还没有任务</div>}
          {ready && recent.map((s) => (
            <Link
              key={s.id}
              href={`/chat/${s.id}`}
              onClick={onNavigate}
              className="flex items-start gap-2 rounded-md px-2.5 py-1.5 text-[11.5px] leading-snug text-white/50 transition hover:bg-white/[.06] hover:text-white/85"
            >
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-white/20" />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{s.title}</span>
                <span className="text-[10px] text-white/25">{timeAgo(s.updatedAt)}</span>
              </span>
            </Link>
          ))}
        </div>
      </nav>

      <div className="px-3 pb-3">
        <div className="rounded-xl border border-white/10 bg-white/[.04] p-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-white/60">
              <Zap size={12} className="text-brand-400" /> 本月算力
            </span>
            <span className="font-mono text-white/85">{formatNumber(credits)}</span>
          </div>
          <Progress value={credits} max={planTotal} className="mt-2 bg-white/10" barClassName="bg-brand-500" />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-white/30">共 {formatNumber(planTotal)} 点</span>
            <Link href="/pricing" onClick={onNavigate} className="text-[10.5px] font-medium text-brand-300 hover:text-brand-200">
              升级套餐 →
            </Link>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2.5 rounded-xl px-1.5 py-2 transition hover:bg-white/[.05]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-300 to-brand-600 text-[11px] font-semibold text-white">
            AT
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-medium text-white/85">Atopos</div>
            <div className="text-[10px] text-white/35">高级版 · 个人账号</div>
          </div>
          <Settings size={14} className="text-white/30" />
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = React.useState(false);
  const { credits, toasts } = useAppState();
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  const title =
    NAV.find((n) => (n.href === "/" ? pathname === "/" : pathname.startsWith(n.href)))?.label ?? "工作台";

  return (
    <div className="min-h-screen">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[248px] bg-ink-900 md:block">
        <SidebarContent />
      </aside>

      {/* mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <div className="absolute inset-0 bg-ink-950/50" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-[272px] animate-fade-up bg-ink-900">
            <button
              onClick={() => setDrawer(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
            <SidebarContent onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="md:pl-[248px]">
        <header className="sticky top-0 z-40 flex h-[56px] items-center gap-3 border-b border-cloud-200 bg-white/85 px-4 backdrop-blur-xl md:px-6">
          <button
            className="rounded-lg p-1.5 text-cloud-500 hover:bg-cloud-100 md:hidden"
            onClick={() => setDrawer(true)}
          >
            <Menu size={18} />
          </button>
          <div className="hidden items-center gap-1.5 text-[12px] text-cloud-400 sm:flex">
            <LayoutGrid size={13} />
            <span>工作台</span>
            <span className="text-cloud-300">/</span>
            <span className="font-medium text-ink-900">{title}</span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!q.trim()) return;
              router.push(`/?q=${encodeURIComponent(q.trim())}`);
            }}
            className="ml-auto hidden h-8 w-[220px] items-center gap-2 rounded-lg border border-cloud-200 bg-cloud-50 px-2.5 transition focus-within:border-brand-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-50 lg:flex"
          >
            <Search size={13} className="text-cloud-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索任务、技能、商品"
              className="w-full bg-transparent text-[12px] outline-none placeholder:text-cloud-400"
            />
            <span className="kbd">⌘K</span>
          </form>

          <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
            <Link
              href="/pricing"
              className="hidden items-center gap-1.5 rounded-lg border border-cloud-200 px-2.5 py-1.5 text-[11.5px] text-cloud-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 sm:flex"
            >
              <Zap size={12} className="text-brand-500" />
              <span className="font-mono font-medium">{formatNumber(credits)}</span>
              <span className="text-cloud-400">算力</span>
            </Link>
            <button className="relative rounded-lg p-2 text-cloud-400 transition hover:bg-cloud-100 hover:text-ink-900">
              <Bell size={16} />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand-500" />
            </button>
            <button className="hidden rounded-lg p-2 text-cloud-400 transition hover:bg-cloud-100 hover:text-ink-900 sm:block">
              <HelpCircle size={16} />
            </button>
            <div className="ml-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-300 to-brand-600 text-[10px] font-semibold text-white">
              AT
            </div>
          </div>
        </header>

        <main>{children}</main>
      </div>

      {/* toasts */}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[90] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex animate-fade-up items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[12.5px] shadow-pop",
              t.type === "error"
                ? "border-red-100 bg-red-50 text-red-700"
                : t.type === "info"
                  ? "border-cloud-200 bg-white text-cloud-700"
                  : "border-mint-100 bg-mint-50 text-mint-600",
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-full text-[9px] text-white",
                t.type === "error" ? "bg-red-500" : t.type === "info" ? "bg-cloud-500" : "bg-mint-500",
              )}
            >
              {t.type === "error" ? "!" : "✓"}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
