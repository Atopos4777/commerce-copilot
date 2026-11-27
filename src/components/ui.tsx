"use client";

import React from "react";
import { Check, Copy, X } from "lucide-react";
import { cn, gradientFor, initialsOf } from "@/lib/utils";

/* ------------------------------------------------------------------ button */

type ButtonVariant = "primary" | "dark" | "ghost" | "subtle" | "text" | "danger";

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
}) {
  const variants: Record<ButtonVariant, string> = {
    primary: "btn-primary",
    dark: "btn-dark",
    ghost: "btn-ghost",
    subtle: "btn-subtle",
    text: "btn text-cloud-600 hover:bg-cloud-100 hover:text-ink-900",
    danger: "btn bg-red-500 text-white hover:bg-red-600",
  };
  const sizes = {
    sm: "h-8 px-3 text-[12px]",
    md: "h-[38px] px-4 py-2",
    lg: "h-11 px-5 text-[14px]",
  };
  return (
    <button className={cn(variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------- badge */

type BadgeTone = "brand" | "mint" | "violet" | "gray" | "amber" | "red" | "blue";

export function Badge({
  tone = "gray",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  const tones: Record<BadgeTone, string> = {
    brand: "bg-brand-50 text-brand-600",
    mint: "bg-mint-50 text-mint-600",
    violet: "bg-violet-50 text-violet-600",
    gray: "bg-cloud-100 text-cloud-600",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-600",
  };
  return <span className={cn("chip", tones[tone], className)}>{children}</span>;
}

/* ------------------------------------------------------------------- modal */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn(
          "relative w-full animate-fade-up rounded-2xl border border-cloud-200 bg-white shadow-pop",
          width,
        )}
      >
        <div className="flex items-start justify-between border-b border-cloud-100 px-6 py-4">
          <div>
            <h3 className="text-[15px] font-semibold text-ink-900">{title}</h3>
            {description && <p className="mt-0.5 text-[12px] text-cloud-500">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-cloud-400 transition hover:bg-cloud-100 hover:text-ink-900"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-cloud-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- tabs */

export function Tabs<T extends string>({
  value,
  onChange,
  items,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { value: T; label: React.ReactNode }[];
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-1 rounded-xl bg-cloud-100 p-1", className)}>
      {items.map((it) => (
        <button
          key={it.value}
          onClick={() => onChange(it.value)}
          className={cn(
            "rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium transition-all",
            value === it.value
              ? "bg-white text-ink-900 shadow-sm"
              : "text-cloud-500 hover:text-ink-900",
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- progress */

export function Progress({
  value,
  max = 100,
  className,
  barClassName,
}: {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-cloud-200", className)}>
      <div
        className={cn("h-full rounded-full bg-brand-500 transition-all duration-500", barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* -------------------------------------------------------------- page header */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.14em] text-brand-500">
            <span className="h-1 w-1 rounded-full bg-brand-500" />
            {eyebrow}
          </div>
        )}
        <h1 className="text-[24px] font-semibold tracking-tight text-ink-900">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-cloud-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------- empty */

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-cloud-300 bg-cloud-50/60 text-center",
        compact ? "px-6 py-8" : "px-6 py-16",
      )}
    >
      {icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-cloud-400 shadow-card">
          {icon}
        </div>
      )}
      <div className="text-[13px] font-medium text-ink-900">{title}</div>
      {description && <div className="mt-1 max-w-sm text-[12px] leading-relaxed text-cloud-500">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------- product art */

export function ProductThumb({
  seed,
  label,
  className,
  size = "md",
}: {
  seed: string;
  label: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const textSize = size === "sm" ? "text-[10px]" : size === "lg" ? "text-[22px]" : "text-[13px]";
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-lg bg-gradient-to-br ring-1 ring-inset ring-white/30",
        gradientFor(seed),
        className,
      )}
    >
      <div className="absolute inset-0 opacity-20 grid-pattern" />
      <div className="absolute -right-3 -top-3 h-9 w-9 rounded-full bg-white/25 blur-[2px]" />
      <div className="absolute bottom-0 left-0 h-1/2 w-full bg-gradient-to-t from-black/15 to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("font-semibold tracking-[.06em] text-white/95 drop-shadow-sm", textSize)}>
          {initialsOf(label)}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ charts */

export function AreaChart({
  data,
  height = 120,
  stroke = "#FF6224",
  fill = "rgba(255,98,36,.16)",
  showGrid = true,
}: {
  data: number[];
  height?: number;
  stroke?: string;
  fill?: string;
  showGrid?: boolean;
}) {
  const w = 600;
  const h = height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 8 - ((v - min) / span) * (h - 22);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} />
          <stop offset="100%" stopColor="rgba(255,98,36,0)" />
        </linearGradient>
      </defs>
      {showGrid &&
        [0.25, 0.5, 0.75].map((r) => (
          <line key={r} x1="0" x2={w} y1={h * r} y2={h * r} stroke="#EDF0F4" strokeWidth="1" />
        ))}
      <path d={area} fill="url(#area-fill)" />
      <path d={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill="white" stroke={stroke} strokeWidth="2" />
    </svg>
  );
}

export function Bars({
  data,
  labels,
  height = 120,
}: {
  data: number[];
  labels?: string[];
  height?: number;
}) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className="group relative flex flex-1 flex-col items-center justify-end">
          <div className="absolute -top-5 hidden rounded bg-ink-900 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
            {v}
          </div>
          <div
            className="w-full rounded-t-[4px] bg-gradient-to-t from-brand-200 to-brand-500 transition-all duration-300 group-hover:from-brand-300 group-hover:to-brand-600"
            style={{ height: `${Math.max(6, (v / max) * 100)}%` }}
          />
          {labels && <span className="mt-1.5 text-[10px] text-cloud-400">{labels[i]}</span>}
        </div>
      ))}
    </div>
  );
}

export function Donut({
  segments,
  size = 118,
  thickness = 12,
  centerLabel,
  centerValue,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F3F6" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      {(centerValue || centerLabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[17px] font-semibold text-ink-900">{centerValue}</div>
          <div className="text-[10px] text-cloud-400">{centerLabel}</div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------- copy button */

export function CopyButton({ text, label = "复制" }: { text: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          setCopied(false);
        }
      }}
      className="btn-ghost h-7 px-2 text-[11px]"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "已复制" : label}
    </button>
  );
}
