"use client";

import React from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  History,
  Loader2,
  Play,
  Plus,
  Power,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import { Badge, Button, EmptyState, Modal, PageHeader } from "@/components/ui";
import { expertMap, experts } from "@/lib/mock-data";
import { useAppActions, useAppState } from "@/lib/store";
import type { AutomationTask, RunRecord } from "@/lib/types";
import { cn, timeAgo, uid } from "@/lib/utils";

const STATUS: Record<string, { label: string; tone: "mint" | "red" | "amber" | "gray"; icon: React.ElementType }> = {
  success: { label: "成功", tone: "mint", icon: CheckCircle2 },
  failed: { label: "失败", tone: "red", icon: XCircle },
  running: { label: "执行中", tone: "amber", icon: Loader2 },
  timeout: { label: "超时", tone: "red", icon: XCircle },
  idle: { label: "待执行", tone: "gray", icon: Clock3 },
};

export default function AutomationPage() {
  const { tasks } = useAppState();
  const { addTask, updateTask, deleteTask, toast } = useAppActions();
  const [open, setOpen] = React.useState(false);
  const [recordsFor, setRecordsFor] = React.useState<AutomationTask | null>(null);
  const [form, setForm] = React.useState({
    title: "",
    expertId: "expert-store",
    prompt: "",
    cycle: "每天",
    time: "09:00",
    remind: ["飞书"] as string[],
  });

  const running = tasks.filter((t) => t.lastStatus === "running").length;
  const totalRuns = tasks.reduce((s, t) => s + t.runs.length, 0);
  const successRuns = tasks.reduce(
    (s, t) => s + t.runs.filter((r) => r.status === "success").length,
    0,
  );
  const rate = totalRuns ? Math.round((successRuns / totalRuns) * 100) : 0;

  const runNow = (task: AutomationTask) => {
    if (task.lastStatus === "running") return;
    const run: RunRecord = {
      id: uid("run"),
      startedAt: Date.now(),
      status: "running",
      duration: 0,
      summary: "正在执行任务…",
    };
    updateTask(task.id, { lastStatus: "running", runs: [run, ...task.runs] });
    toast(`「${task.title}」已开始执行`, "info");

    setTimeout(() => {
      const done: RunRecord = {
        ...run,
        status: "success",
        duration: 38 + Math.floor(Math.random() * 40),
        summary: `执行完成：巡检 ${12} 个对象，命中 ${1 + Math.floor(Math.random() * 3)} 条异动，已推送提醒`,
      };
      updateTask(task.id, { lastStatus: "success", runs: [done, ...task.runs] });
      toast(`「${task.title}」执行完成`);
    }, 2600);
  };

  const commit = () => {
    if (!form.title.trim() || !form.prompt.trim()) {
      toast("请填写任务名称与任务说明", "info");
      return;
    }
    const task: AutomationTask = {
      id: uid("task"),
      title: form.title.trim(),
      expertId: form.expertId,
      prompt: form.prompt.trim(),
      scheduleLabel: `${form.cycle === "不重复" ? "仅一次" : form.cycle} ${form.time}`,
      cycle: form.cycle as AutomationTask["cycle"],
      remind: form.remind,
      enabled: true,
      lastStatus: "idle",
      runs: [],
    };
    addTask(task);
    setOpen(false);
    setForm({ title: "", expertId: "expert-store", prompt: "", cycle: "每天", time: "09:00", remind: ["飞书"] });
  };

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6">
      <PageHeader
        eyebrow="Automation"
        title="定时任务"
        description="把重复巡检交给 Agent：价格、库存、差评、热搜词与经营日报，按周期自动执行并推送到飞书 / 邮件。"
        actions={
          <Button variant="dark" size="sm" onClick={() => setOpen(true)}>
            <Plus size={13} /> 新建定时任务
          </Button>
        }
      />

      <div className="mb-4 grid gap-2.5 sm:grid-cols-3">
        {[
          { label: "已启用任务", value: `${tasks.filter((t) => t.enabled).length} / ${tasks.length}`, sub: "可在任务卡片上随时暂停" },
          { label: "累计执行", value: String(totalRuns), sub: `本周新增 ${tasks.reduce((s, t) => s + t.runs.filter((r) => Date.now() - r.startedAt < 7 * 864e5).length, 0)} 次` },
          { label: "成功率", value: `${rate}%`, sub: "失败会自动重试一次并通知" },
        ].map((k) => (
          <div key={k.label} className="card flex items-center justify-between px-4 py-3">
            <div>
              <div className="text-[10.5px] text-cloud-400">{k.label}</div>
              <div className="mt-1 text-[19px] font-semibold text-ink-900">{k.value}</div>
              <div className="text-[10px] text-cloud-400">{k.sub}</div>
            </div>
            {k.label === "已启用任务" && running > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] text-amber-700">
                <Loader2 size={10} className="animate-spin" /> {running} 个执行中
              </span>
            )}
          </div>
        ))}
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={<CalendarClock size={18} />}
          title="还没有定时任务"
          description="把「每天检查竞品价格」这类重复动作交给 Agent，到点自动执行并推送结果。"
          action={<Button onClick={() => setOpen(true)}>新建第一个任务</Button>}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {tasks.map((t) => {
            const expert = expertMap[t.expertId];
            const status = STATUS[t.lastStatus] ?? STATUS.idle;
            const Icon = status.icon;
            const last = t.runs[0];
            return (
              <div key={t.id} className="card flex flex-col p-4">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <CalendarClock size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h2 className="truncate text-[13px] font-semibold text-ink-900">{t.title}</h2>
                      <Badge tone={t.enabled ? "mint" : "gray"}>{t.enabled ? "已启用" : "已暂停"}</Badge>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10.5px] text-cloud-400">
                      <span>{expert?.name}</span>
                      <span className="h-[3px] w-[3px] rounded-full bg-cloud-300" />
                      <span className="flex items-center gap-1">
                        <Clock3 size={9} /> {t.scheduleLabel}
                      </span>
                      <span className="h-[3px] w-[3px] rounded-full bg-cloud-300" />
                      <span>{t.remind.join(" / ")}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => updateTask(t.id, { enabled: !t.enabled })}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] transition",
                      t.enabled ? "bg-mint-50 text-mint-600" : "bg-cloud-100 text-cloud-400",
                    )}
                  >
                    <Power size={10} /> {t.enabled ? "暂停" : "启用"}
                  </button>
                </div>

                <p className="mt-2.5 line-clamp-2 rounded-lg bg-cloud-50 px-2.5 py-2 text-[11px] leading-relaxed text-cloud-500">
                  {t.prompt}
                </p>

                <div className="mt-2.5 flex items-center gap-2 text-[10.5px]">
                  <span className={cn("flex items-center gap-1", t.lastStatus === "failed" ? "text-red-500" : t.lastStatus === "running" ? "text-amber-600" : "text-mint-600")}>
                    <Icon size={11} className={t.lastStatus === "running" ? "animate-spin" : ""} />
                    {status.label}
                  </span>
                  {last && (
                    <>
                      <span className="h-[3px] w-[3px] rounded-full bg-cloud-300" />
                      <span className="text-cloud-400">{timeAgo(last.startedAt)}</span>
                      {last.duration > 0 && <span className="text-cloud-300">· {last.duration}s</span>}
                    </>
                  )}
                </div>

                <div className="mt-2.5 flex items-center gap-1.5 border-t border-cloud-100 pt-2.5">
                  <button
                    onClick={() => runNow(t)}
                    disabled={t.lastStatus === "running"}
                    className="flex items-center gap-1 rounded-lg bg-ink-900 px-2.5 py-1.5 text-[10.5px] font-medium text-white transition hover:bg-ink-800 disabled:opacity-50"
                  >
                    {t.lastStatus === "running" ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
                    立即执行
                  </button>
                  <button
                    onClick={() => setRecordsFor(t)}
                    className="flex items-center gap-1 rounded-lg border border-cloud-200 px-2.5 py-1.5 text-[10.5px] text-cloud-600 hover:bg-cloud-50"
                  >
                    <History size={10} /> 记录 {t.runs.length}
                  </button>
                  <button
                    onClick={() => deleteTask(t.id)}
                    className="ml-auto rounded-lg p-1.5 text-cloud-300 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-cloud-200 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-900">
              <Sparkles size={13} className="text-brand-500" /> 推荐任务模板
            </div>
            <p className="mt-1 text-[11px] text-cloud-500">一键套用，改一下时间与阈值就能跑。</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["竞品降价巡检", "差评监控", "库存预警", "热搜词周报"].map((tpl) => (
              <button
                key={tpl}
                onClick={() => {
                  setForm((f) => ({ ...f, title: tpl, prompt: `按模板执行「${tpl}」，发现异常时推送飞书提醒，并输出一段摘要。` }));
                  setOpen(true);
                }}
                className="chip border border-cloud-200 bg-white text-[10.5px] text-cloud-600 hover:border-brand-200 hover:text-brand-600"
              >
                + {tpl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* new task */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="新建定时任务"
        description="任务会按周期自动执行，结果推送到你选择的渠道"
        width="max-w-xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={commit}>创建任务</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">任务名称</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="例如：竞品价格巡检"
              className="field"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">执行专家</label>
              <select
                value={form.expertId}
                onChange={(e) => setForm({ ...form, expertId: e.target.value })}
                className="field text-[12px]"
              >
                {experts.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">周期</label>
              <select
                value={form.cycle}
                onChange={(e) => setForm({ ...form, cycle: e.target.value })}
                className="field text-[12px]"
              >
                {["每天", "每周", "每月", "不重复"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">执行时间</label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className="field"
            />
          </div>
          <div>
            <label className="label">任务说明</label>
            <textarea
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              rows={3}
              placeholder="检查关注清单中 12 个 ASIN 的价格与库存，降价超过 8% 或断货时提醒…"
              className="field resize-none text-[12px] leading-relaxed"
            />
          </div>
          <div>
            <label className="label">提醒方式</label>
            <div className="flex gap-1.5">
              {["飞书", "邮件", "钉钉"].map((r) => {
                const active = form.remind.includes(r);
                return (
                  <button
                    key={r}
                    onClick={() =>
                      setForm({
                        ...form,
                        remind: active ? form.remind.filter((x) => x !== r) : [...form.remind, r],
                      })
                    }
                    className={cn(
                      "rounded-lg border px-2.5 py-1.5 text-[11px] transition",
                      active ? "border-brand-300 bg-brand-50 text-brand-600" : "border-cloud-200 text-cloud-500",
                    )}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* run records */}
      <Modal
        open={!!recordsFor}
        onClose={() => setRecordsFor(null)}
        title={`执行记录 · ${recordsFor?.title ?? ""}`}
        description="保留最近 30 天记录"
        width="max-w-xl"
      >
        <div className="space-y-2">
          {(recordsFor?.runs ?? []).length === 0 && (
            <div className="py-6 text-center text-[12px] text-cloud-400">还没有执行记录，点「立即执行」试一次。</div>
          )}
          {recordsFor?.runs.map((r) => {
            const s = STATUS[r.status] ?? STATUS.idle;
            const Icon = s.icon;
            return (
              <div key={r.id} className="flex items-start gap-2.5 rounded-xl border border-cloud-200 p-2.5">
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 items-center justify-center rounded-md",
                    r.status === "success" ? "bg-mint-50 text-mint-600" : r.status === "running" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500",
                  )}
                >
                  <Icon size={12} className={r.status === "running" ? "animate-spin" : ""} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11.5px] font-medium text-ink-900">{s.label}</span>
                    <span className="text-[10px] text-cloud-400">{timeAgo(r.startedAt)}</span>
                    {r.duration > 0 && <span className="text-[10px] text-cloud-300">· {r.duration}s</span>}
                  </div>
                  <p className="mt-0.5 text-[10.5px] leading-relaxed text-cloud-500">{r.summary}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
