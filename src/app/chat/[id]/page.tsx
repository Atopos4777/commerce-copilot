"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import {
  ArrowLeft,
  ArrowUp,
  BookOpen,
  ChevronRight,
  FileSpreadsheet,
  Link2,
  Loader2,
  MoreHorizontal,
  Paperclip,
  Pin,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { ArtifactCard } from "@/components/chat/artifact";
import { RichText } from "@/components/chat/rich-text";
import { ToolCard } from "@/components/chat/tool-card";
import { Badge, Button, EmptyState, Modal, ProductThumb } from "@/components/ui";
import { expertMap, keywordLibrary, skillMap } from "@/lib/mock-data";
import { useAppActions, useAppState } from "@/lib/store";
import type { Artifact, ChatMessage, ToolCall } from "@/lib/types";
import { cn, formatNumber, timeAgo, uid } from "@/lib/utils";

type StreamEvent =
  | { type: "meta"; intent: string; mode: "mock" | "live" }
  | { type: "tool_start"; tool: ToolCall }
  | { type: "tool_end"; tool: { id: string; status: "success" | "error"; duration: number } }
  | { type: "artifact"; artifact: Artifact }
  | { type: "token"; value: string }
  | { type: "done"; credits: number; mode: "mock" | "live" }
  | { type: "notice"; message: string }
  | { type: "error"; message: string };

const COST_HINT = 12;

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sessionId = params?.id as string;
  const { ready, sessions, candidates, credits } = useAppState();
  const { patchSession, deleteSession, togglePin, spendCredits, toast } = useAppActions();

  const session = sessions.find((s) => s.id === sessionId);
  const expert = expertMap[session?.expertId ?? "expert-selection"];
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [quote, setQuote] = React.useState<{ count: number; titles: string[] } | null>(null);
  const [panel, setPanel] = React.useState<"candidates" | "artifacts" | "keywords">("candidates");
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"mock" | "live">("mock");

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const autoScroll = React.useRef(true);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const startedRef = React.useRef(false);

  const messages = session?.messages ?? [];

  const send = React.useCallback(
    async (raw: string, opts?: { silent?: boolean }) => {
      const text = raw.trim();
      if (!text || !session || sending) return;

      const userMsg: ChatMessage = {
        id: uid("msg"),
        role: "user",
        content: text,
        createdAt: Date.now(),
      };
      const assistantId = uid("msg");
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: Date.now(),
        toolCalls: [],
        artifacts: [],
        streaming: true,
      };

      setSending(true);
      autoScroll.current = true;
      setInput("");
      setQuote(null);
      patchSession(session.id, (s) => ({
        ...s,
        messages: [...s.messages, userMsg, assistantMsg],
        updatedAt: Date.now(),
      }));

      const update = (fn: (m: ChatMessage) => ChatMessage) =>
        patchSession(session.id, (s) => ({
          ...s,
          messages: s.messages.map((m) => (m.id === assistantId ? fn(m) : m)),
        }));

      try {
        const history = session.messages
          .filter((m) => m.content)
          .slice(-6)
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: text,
            expertId: session.expertId,
            skillIds: session.skillIds,
            history,
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (!res.body) throw new Error("连接失败");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let acc = "";
        let timer: ReturnType<typeof setTimeout> | null = null;

        const flush = () => {
          if (!acc) return;
          const chunk = acc;
          acc = "";
          update((m) => ({ ...m, content: m.content + chunk }));
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            let evt: StreamEvent;
            try {
              evt = JSON.parse(trimmed) as StreamEvent;
            } catch {
              continue;
            }

            if (evt.type === "meta") {
              setMode(evt.mode);
            } else if (evt.type === "tool_start") {
              update((m) => ({ ...m, toolCalls: [...(m.toolCalls ?? []), evt.tool] }));
            } else if (evt.type === "tool_end") {
              update((m) => ({
                ...m,
                toolCalls: (m.toolCalls ?? []).map((t) =>
                  t.id === evt.tool.id
                    ? { ...t, status: evt.tool.status, duration: evt.tool.duration }
                    : t,
                ),
              }));
            } else if (evt.type === "artifact") {
              update((m) => ({ ...m, artifacts: [...(m.artifacts ?? []), evt.artifact] }));
            } else if (evt.type === "token") {
              acc += evt.value;
              if (!timer) {
                timer = setTimeout(() => {
                  timer = null;
                  flush();
                }, 45);
              }
            } else if (evt.type === "done") {
              flush();
              update((m) => ({ ...m, streaming: false }));
              if (evt.credits > 0) spendCredits(evt.credits, expert?.name ?? "Agent 任务");
            } else if (evt.type === "notice") {
              toast(evt.message, "info");
            } else if (evt.type === "error") {
              update((m) => ({
                ...m,
                streaming: false,
                content: `${m.content}\n\n> ${evt.message}`,
              }));
              toast(evt.message, "error");
            }
          }
        }

        flush();
        update((m) => ({ ...m, streaming: false }));
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          update((m) => ({
            ...m,
            streaming: false,
            content: `${m.content}\n\n> 请求中断，请检查服务是否正常后重试。`,
          }));
          toast("请求中断，请重试", "error");
        }
      } finally {
        setSending(false);
      }
    },
    [session, sending, patchSession, spendCredits, toast, expert?.name],
  );

  // auto-run a prompt handed over from the home composer
  React.useEffect(() => {
    if (!ready || !session || startedRef.current) return;
    const pending = sessionStorage.getItem(`cp.pending.${session.id}`);
    if (pending) {
      startedRef.current = true;
      sessionStorage.removeItem(`cp.pending.${session.id}`);
      try {
        const p = JSON.parse(pending) as { prompt: string };
        void send(p.prompt);
      } catch {
        /* ignore malformed payload */
      }
    }
  }, [ready, session, send]);

  // autoscroll
  React.useEffect(() => {
    if (!autoScroll.current) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  if (!ready) {
    return (
      <div className="flex h-[calc(100vh-56px)] items-center justify-center text-[12px] text-cloud-400">
        <Loader2 size={16} className="mr-2 animate-spin" /> 正在加载会话…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-[calc(100vh-56px)] items-center justify-center px-6">
        <EmptyState
          title="会话不存在或已被删除"
          description="返回工作台新建一个任务，历史会话会保留在「最近任务」里。"
          action={
            <Link href="/" className="btn-primary h-9 px-4">
              返回工作台
            </Link>
          }
        />
      </div>
    );
  }

  const allArtifacts = messages.flatMap((m) => m.artifacts ?? []);
  const activeCandidates = candidates.filter((c) => c.status !== "已排除");
  const skills = session.skillIds.map((id) => skillMap[id]).filter(Boolean);

  const submit = () => {
    if (!input.trim()) return;
    const text = quote
      ? `（引用候选产品 ${quote.count} 个：${quote.titles.join("、")}）\n${input.trim()}`
      : input.trim();
    void send(text);
  };

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-white">
      {/* conversation */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-[54px] shrink-0 items-center gap-2 border-b border-cloud-200 px-3 sm:px-5">
          <Link href="/" className="rounded-lg p-1.5 text-cloud-400 transition hover:bg-cloud-100 hover:text-ink-900">
            <ArrowLeft size={16} />
          </Link>
          <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-[11px] font-semibold text-white", expert?.accent)}>
            {expert?.name.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[13px] font-semibold text-ink-900">{expert?.name}</span>
              <Badge tone="brand">官方</Badge>
            </div>
            <div className="hidden truncate text-[10.5px] text-cloud-400 sm:block">{session.title}</div>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <span className="mr-1 hidden items-center gap-1 rounded-lg bg-cloud-50 px-2 py-1 text-[10.5px] text-cloud-500 sm:flex">
              {mode === "live" ? "真实模型" : "模拟模式"} · 剩余 {formatNumber(credits)}
            </span>
            <button onClick={() => setShareOpen(true)} className="rounded-lg p-1.5 text-cloud-400 transition hover:bg-cloud-100 hover:text-ink-900">
              <Link2 size={15} />
            </button>
            <button
              onClick={() => togglePin(session.id)}
              className={cn(
                "rounded-lg p-1.5 transition hover:bg-cloud-100",
                session.pinned ? "text-brand-500" : "text-cloud-400 hover:text-ink-900",
              )}
            >
              <Pin size={15} />
            </button>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-lg p-1.5 text-cloud-400 transition hover:bg-cloud-100 hover:text-ink-900"
              >
                <MoreHorizontal size={15} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 z-30 w-[150px] animate-fade-up rounded-xl border border-cloud-200 bg-white p-1 shadow-pop">
                  <button
                    onClick={() => {
                      deleteSession(session.id);
                      router.push("/");
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 size={13} /> 删除会话
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setPanelOpen(true)}
              className="ml-1 flex items-center gap-1 rounded-lg border border-cloud-200 px-2 py-1 text-[11px] text-cloud-500 xl:hidden"
            >
              <FileSpreadsheet size={12} /> 产物
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            autoScroll.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          }}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="mx-auto w-full max-w-[760px] px-4 py-5 sm:px-6">
            {messages.length === 0 && (
              <div className="pt-4">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[.14em] text-brand-500">开始之前</div>
                <h2 className="text-[19px] font-semibold tracking-tight text-ink-900">
                  {expert?.title ?? "跨境 AI 助手"}
                </h2>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-cloud-500">{expert?.desc}</p>

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {expert?.methodology.map((m, i) => (
                    <div key={m.title} className="card p-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand-50 font-mono text-[10px] font-semibold text-brand-600">
                          {i + 1}
                        </span>
                        <span className="text-[12px] font-medium text-ink-900">{m.title}</span>
                      </div>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-cloud-500">{m.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <div className="mb-2 text-[11.5px] font-medium text-cloud-500">示例提示词</div>
                  <div className="flex flex-col gap-1.5">
                    {expert?.examples.map((ex) => (
                      <button
                        key={ex}
                        onClick={() => {
                          setInput(ex);
                          textareaRef.current?.focus();
                        }}
                        className="group flex items-center justify-between rounded-xl border border-cloud-200 bg-white px-3 py-2.5 text-left text-[12px] text-cloud-600 transition hover:border-brand-200 hover:bg-brand-50/40 hover:text-ink-900"
                      >
                        <span className="truncate">{ex}</span>
                        <ChevronRight size={13} className="shrink-0 text-cloud-300 group-hover:text-brand-500" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10.5px] text-cloud-400">已挂载技能：</span>
                  {skills.map((s) => (
                    <span key={s!.id} className="chip bg-cloud-100 text-[10px] text-cloud-600">
                      <Sparkles size={9} /> {s!.name}
                    </span>
                  ))}
                  <Link href="/skills" className="chip text-[10px] text-brand-600 hover:bg-brand-50">
                    + 添加技能
                  </Link>
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={cn("mb-5", m.role === "user" && "flex justify-end")}>
                {m.role === "user" ? (
                  <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-ink-900 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-white/90">
                    {m.content}
                  </div>
                ) : (
                  <div className="flex gap-2.5">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 shadow-sm">
                      <svg viewBox="0 0 32 32" className="h-[15px] w-[15px]" fill="none">
                        <path d="M4.5 5.5l6.2 4.1h10.6l6.2-4.1-1.9 12.4L16 27 6.4 17.9 4.5 5.5z" fill="white" opacity=".95" />
                        <circle cx="11.6" cy="14.4" r="1.4" fill="#C43606" />
                        <circle cx="20.4" cy="14.4" r="1.4" fill="#C43606" />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <span className="text-[11.5px] font-medium text-ink-900">{expert?.name}</span>
                        <span className="text-[10px] text-cloud-400">{timeAgo(m.createdAt)}</span>
                      </div>

                      {m.toolCalls && m.toolCalls.length > 0 && (
                        <div className="mb-2.5">
                          {m.toolCalls.map((t) => (
                            <ToolCard key={t.id} tool={t} />
                          ))}
                        </div>
                      )}

                      {m.artifacts && m.artifacts.length > 0 && (
                        <div className="mb-2.5 space-y-2">
                          {m.artifacts.map((a) => (
                            <ArtifactCard key={a.id} artifact={a} />
                          ))}
                        </div>
                      )}

                      {m.content ? (
                        <RichText text={m.content} />
                      ) : m.streaming ? (
                        <div className="flex items-center gap-1.5 py-1 text-[11.5px] text-cloud-400">
                          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-brand-500" />
                          正在思考…
                        </div>
                      ) : null}

                      {m.streaming && m.content && (
                        <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-brand-500 align-middle" />
                      )}

                      {!m.streaming && m.content && (
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-cloud-300">
                          <span>星岑远航 Agent</span>
                          <span className="h-[3px] w-[3px] rounded-full bg-cloud-300" />
                          <span>产物已存入工作台</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* composer */}
        <div className="shrink-0 border-t border-cloud-200 bg-white px-3 pb-3 pt-2.5 sm:px-6">
          <div className="mx-auto max-w-[760px]">
            {quote && (
              <div className="mb-2 flex items-center gap-2 rounded-lg border border-brand-100 bg-brand-50 px-2.5 py-1.5">
                <span className="chip bg-white/70 text-[10px] text-brand-600">引用候选产品 · {quote.count}</span>
                <span className="min-w-0 flex-1 truncate text-[11px] text-cloud-600">{quote.titles.join("、")}</span>
                <button onClick={() => setQuote(null)} className="text-cloud-400 hover:text-ink-900">
                  <X size={12} />
                </button>
              </div>
            )}
            <div className="rounded-xl border border-cloud-200 bg-white px-2.5 py-1.5 shadow-card focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-50">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    submit();
                  }
                }}
                rows={2}
                placeholder="继续追问，或让 Agent 执行下一步…  Enter 发送 / Shift+Enter 换行"
                className="max-h-[140px] w-full resize-none bg-transparent px-1 py-1 text-[13px] leading-relaxed outline-none placeholder:text-cloud-400"
              />
              <div className="flex items-center justify-between border-t border-cloud-100 pt-1.5">
                <div className="flex items-center gap-0.5">
                  <button className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-cloud-500 transition hover:bg-cloud-100">
                    <Paperclip size={12} /> 附件
                  </button>
                  <button
                    onClick={() => setPanel("keywords")}
                    className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-cloud-500 transition hover:bg-cloud-100"
                  >
                    <BookOpen size={12} /> 词库
                  </button>
                  <span className="ml-1 hidden text-[10.5px] text-cloud-400 sm:block">
                    {skills.map((s) => s!.name).join(" · ")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] text-cloud-400">约 {COST_HINT} 算力</span>
                  <button
                    onClick={submit}
                    disabled={sending || !input.trim()}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-white transition hover:bg-brand-600 disabled:opacity-40"
                  >
                    {sending ? <Loader2 size={14} className="animate-spin" /> : <ArrowUp size={15} strokeWidth={2.6} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-1.5 text-center text-[9.5px] text-cloud-300">内容由 AI 生成，请结合业务判断后使用</div>
          </div>
        </div>
      </div>

      {/* workspace panel */}
      <aside
        className={cn(
          "z-50 w-[340px] shrink-0 flex-col border-l border-cloud-200",
          panelOpen
            ? "fixed bottom-0 right-0 top-[56px] flex bg-white shadow-pop"
            : "hidden xl:flex",
        )}
      >
        <div className="flex h-[54px] shrink-0 items-center gap-2 border-b border-cloud-200 px-3">
          <div className="flex-1">
            <span className="text-[12px] font-semibold text-ink-900">工作台</span>
            <span className="ml-1.5 text-[10px] text-cloud-400">会话产物</span>
          </div>
          <button onClick={() => setPanelOpen(false)} className="rounded p-1 text-cloud-400 xl:hidden">
            <X size={15} />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1 border-b border-cloud-200 px-2 py-1.5">
          {(
            [
              ["candidates", `候选产品 ${activeCandidates.length}`],
              ["artifacts", `产物 ${allArtifacts.length}`],
              ["keywords", "词库"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPanel(key)}
              className={cn(
                "rounded-md px-2 py-1 text-[11px] transition",
                panel === key ? "bg-white font-medium text-ink-900 shadow-sm" : "text-cloud-500 hover:text-ink-900",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
          {panel === "candidates" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1 pb-1">
                <span className="text-[10.5px] text-cloud-400">点击「引用」把产品带入对话</span>
                <Link href="/selection" className="text-[10.5px] text-brand-600 hover:underline">
                  打开选品台
                </Link>
              </div>
              {activeCandidates.map((c) => (
                <div key={c.id} className="group rounded-lg border border-cloud-200 bg-white p-2">
                  <div className="flex items-start gap-2">
                    <ProductThumb seed={c.asin} label={c.title} className="h-9 w-9" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px] font-medium text-ink-900">{c.title}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[9.5px] text-cloud-400">
                        <span>{c.asin}</span>
                        <span className="h-[2px] w-[2px] rounded-full bg-cloud-300" />
                        <span>${c.price.toFixed(2)}</span>
                        <span className="h-[2px] w-[2px] rounded-full bg-cloud-300" />
                        <span>BSR {formatNumber(c.bsr)}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        <Badge tone={c.status === "已选品" ? "mint" : c.status === "调研中" ? "amber" : "gray"}>
                          {c.status}
                        </Badge>
                        <button
                          onClick={() => {
                            setQuote((q) =>
                              q ? { count: q.count + 1, titles: [...q.titles, c.asin] } : { count: 1, titles: [c.asin] },
                            );
                            setPanelOpen(false);
                            toast(`已引用 ${c.asin} 到输入框`, "info");
                            textareaRef.current?.focus();
                          }}
                          className="ml-auto rounded px-1.5 py-0.5 text-[9.5px] text-brand-600 opacity-0 transition hover:bg-brand-50 group-hover:opacity-100"
                        >
                          引用
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {panel === "artifacts" &&
            (allArtifacts.length ? (
              <div className="space-y-2">
                {allArtifacts.map((a) => (
                  <ArtifactCard key={a.id} artifact={a} compact />
                ))}
              </div>
            ) : (
              <EmptyState compact title="暂无产物" description="任务产出的表格、报告、图片会出现在这里。" />
            ))}

          {panel === "keywords" && (
            <div className="space-y-1">
              {keywordLibrary.slice(0, 10).map((k) => (
                <button
                  key={k.id}
                  onClick={() => setInput((v) => `${v}${v ? " " : ""}${k.word}`)}
                  className="flex w-full items-center gap-2 rounded-lg border border-transparent bg-white px-2 py-1.5 text-left transition hover:border-cloud-200"
                >
                  <span className="min-w-0 flex-1 truncate text-[11px] text-ink-900">{k.word}</span>
                  <span className="font-mono text-[9.5px] text-cloud-400">{formatNumber(k.volume)}</span>
                  <span
                    className={cn(
                      "rounded px-1 py-0.5 text-[9px]",
                      k.trend > 0 ? "bg-mint-50 text-mint-600" : "bg-red-50 text-red-500",
                    )}
                  >
                    {k.trend > 0 ? "+" : ""}
                    {k.trend}%
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      <Modal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="分享会话"
        description="接收方打开后可查看只读回放"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShareOpen(false)}>
              取消
            </Button>
            <Button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(`${window.location.origin}/chat/${session.id}`);
                  toast("只读链接已复制");
                } catch {
                  toast("复制失败，请手动复制地址栏链接", "error");
                }
                setShareOpen(false);
              }}
            >
              复制链接
            </Button>
          </>
        }
      >
        <div className="rounded-xl border border-cloud-200 bg-cloud-50 px-3 py-2 font-mono text-[11px] text-cloud-500">
          {typeof window !== "undefined" ? `${window.location.origin}/chat/${session.id}` : ""}
        </div>
        <p className="mt-2 text-[11.5px] text-cloud-500">被分享者只能查看对话与产物，不能继续发送消息。</p>
      </Modal>
    </div>
  );
}
