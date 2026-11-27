"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { automationTasks, candidates as seedCandidates, skills } from "./mock-data";
import type {
  AutomationTask,
  Candidate,
  ChatMessage,
  RunRecord,
  Session,
  Toast,
} from "./types";
import { uid } from "./utils";

const KEYS = {
  sessions: "cp.sessions.v1",
  installed: "cp.installed.v1",
  candidates: "cp.candidates.v1",
  tasks: "cp.tasks.v1",
  credits: "cp.credits.v1",
};

const PLAN_TOTAL = 24200;
const INITIAL_CREDITS = 22340;

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 存储配额满或被禁用时忽略，避免整页崩溃 */
  }
}

function seedSessions(): Session[] {
  const now = Date.now();
  const message: ChatMessage = {
    id: "msg_seed_1",
    role: "assistant",
    createdAt: now - 1000 * 60 * 42,
    content:
      "已完成美国站宠物类目的第一轮筛选，共命中 **37 个候选**，按竞争度与利润率综合排序后，建议优先跟进下面 4 个：\n\n- **宠物去毛滚筒**（$18.99）：BSR 1,240，月销约 4,200，头部评论数仅 682，属于可切入的低竞争区间。\n- **猫咪饮水机**（$32.99）：搜索量稳定，但头部评论壁垒较高，建议以静音/易清洗做差异化。\n- **宠物慢食碗**（$15.99）：价格带集中，适合做套装提升客单价。\n- **可折叠收纳箱**（$24.99）：跨类目机会品，家居场景搜索量近 90 天上升 18%。\n\n判断依据：近 90 天类目搜索量 +18%，头部 Listing 评论中位数 1,240，仍有明显空档。下一步可以 ① 按利润率重排 ② 为前 3 个生成 Listing ③ 拉取 30 天价格走势。",
    toolCalls: [
      {
        id: "tc_seed_1",
        name: "关键词搜索",
        engine: "卖家精灵",
        status: "success",
        input: { market: "US", category: "Pet Supplies", priceMin: 15, priceMax: 35, monthlySalesMin: 1000 },
        output: "matched: 486 → filtered: 37",
        duration: 2.4,
      },
      {
        id: "tc_seed_2",
        name: "价格历史",
        engine: "Keepa",
        status: "success",
        input: { asin: "B0CQ7X2K9L", range: "90d" },
        output: "均价 $18.42，波动 ±6%，无长期价格战",
        duration: 1.6,
      },
      {
        id: "tc_seed_3",
        name: "评论痛点聚类",
        engine: "卖家精灵",
        status: "success",
        input: { asin: "B0CQ7X2K9L", stars: "1-3", range: "12m" },
        output: "高频痛点：吸附力衰减 / 清理麻烦 / 手柄松动",
        duration: 3.1,
      },
    ],
    artifacts: [
      {
        id: "art_seed_1",
        type: "table",
        title: "候选产品清单",
        subtitle: "美国站 · 宠物用品 · $15–35",
        columns: ["主图", "标题", "ASIN", "价格", "BSR", "月销", "评分"],
        rows: seedCandidates.slice(0, 4).map((c) => [
          "",
          c.title,
          c.asin,
          `$${c.price.toFixed(2)}`,
          String(c.bsr),
          String(c.monthlySales),
          String(c.rating),
        ]),
        items: seedCandidates.slice(0, 4),
      },
    ],
  };

  return [
    {
      id: "session_seed_1",
      title: "美国站宠物类目低价长尾选品",
      expertId: "expert-selection",
      skillIds: ["seller-sprite-selection", "keepa-price-tracker"],
      createdAt: now - 1000 * 60 * 46,
      updatedAt: now - 1000 * 60 * 42,
      pinned: true,
      group: "美国站 / Q4",
      messages: [
        {
          id: "msg_seed_0",
          role: "user",
          content: "使用卖家精灵，帮我选出亚马逊美国站 $15–35 的宠物类目低价长尾产品，优先低竞争。",
          createdAt: now - 1000 * 60 * 46,
        },
        message,
      ],
    },
  ];
}

interface AppState {
  ready: boolean;
  credits: number;
  planTotal: number;
  installed: string[];
  candidates: Candidate[];
  sessions: Session[];
  tasks: AutomationTask[];
  toasts: Toast[];
}

interface AppActions {
  install: (id: string) => void;
  uninstall: (id: string) => void;
  addCandidate: (c: Candidate) => void;
  addCandidates: (cs: Candidate[]) => void;
  removeCandidate: (id: string) => void;
  updateCandidate: (id: string, patch: Partial<Candidate>) => void;
  createSession: (input: { title: string; expertId: string; skillIds: string[]; group?: string }) => Session;
  patchSession: (id: string, updater: (s: Session) => Session) => void;
  deleteSession: (id: string) => void;
  togglePin: (id: string) => void;
  spendCredits: (n: number, reason: string) => boolean;
  refundCredits: (n: number) => void;
  addTask: (t: AutomationTask) => void;
  updateTask: (id: string, patch: Partial<AutomationTask>) => void;
  deleteTask: (id: string) => void;
  pushRun: (taskId: string, run: RunRecord) => void;
  toast: (message: string, type?: Toast["type"]) => void;
}

const StateCtx = createContext<AppState | null>(null);
const ActionsCtx = createContext<AppActions | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [credits, setCredits] = useState(INITIAL_CREDITS);
  const [installed, setInstalled] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>(seedCandidates);
  const [sessions, setSessions] = useState<Session[]>(seedSessions);
  const [tasks, setTasks] = useState<AutomationTask[]>(automationTasks);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const creditsRef = useRef(INITIAL_CREDITS);

  useEffect(() => {
    creditsRef.current = credits;
  }, [credits]);

  useEffect(() => {
    setInstalled(load(KEYS.installed, ["seller-sprite-selection", "listing-bullet-writer"]));
    setCandidates(load(KEYS.candidates, seedCandidates));
    setSessions(load(KEYS.sessions, seedSessions()));
    setTasks(load(KEYS.tasks, automationTasks));
    setCredits(load(KEYS.credits, INITIAL_CREDITS));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    save(KEYS.installed, installed);
  }, [ready, installed]);

  useEffect(() => {
    if (!ready) return;
    save(KEYS.candidates, candidates);
  }, [ready, candidates]);

  useEffect(() => {
    if (!ready) return;
    save(KEYS.sessions, sessions);
  }, [ready, sessions]);

  useEffect(() => {
    if (!ready) return;
    save(KEYS.tasks, tasks);
  }, [ready, tasks]);

  useEffect(() => {
    if (!ready) return;
    save(KEYS.credits, credits);
  }, [ready, credits]);

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, []);

  const toast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = uid("toast");
    setToasts((prev) => [...prev, { id, message, type }]);
    timers.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete timers.current[id];
    }, 3200);
  }, []);

  const spendCredits = useCallback(
    (n: number, reason: string) => {
      const balance = creditsRef.current;
      if (balance < n) {
        toast(`算力不足，本次「${reason}」需要 ${n} 点，当前剩余 ${balance} 点`, "error");
        return false;
      }
      creditsRef.current = balance - n;
      setCredits((c) => Math.max(0, c - n));
      return true;
    },
    [toast],
  );

  const refundCredits = useCallback((n: number) => {
    if (n <= 0) return;
    creditsRef.current += n;
    setCredits((c) => c + n);
  }, []);

  const actions = useMemo<AppActions>(
    () => ({
      install: (id) => {
        setInstalled((prev) => (prev.includes(id) ? prev : [...prev, id]));
        const s = skills.find((x) => x.id === id);
        toast(`「${s?.name ?? "技能"}」已安装到我的技能`);
      },
      uninstall: (id) => {
        setInstalled((prev) => prev.filter((x) => x !== id));
        toast("已卸载技能", "info");
      },
      addCandidate: (c) => {
        setCandidates((prev) => (prev.some((x) => x.asin === c.asin) ? prev : [c, ...prev]));
        toast("已加入候选产品");
      },
      addCandidates: (cs) => {
        setCandidates((prev) => {
          const exist = new Set(prev.map((p) => p.asin));
          return [...cs.filter((c) => !exist.has(c.asin)), ...prev];
        });
        toast(`已加入 ${cs.length} 个候选产品`);
      },
      removeCandidate: (id) => {
        setCandidates((prev) => prev.filter((c) => c.id !== id));
        toast("已从候选池移除", "info");
      },
      updateCandidate: (id, patch) => {
        setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      },
      createSession: ({ title, expertId, skillIds, group }) => {
        const now = Date.now();
        const session: Session = {
          id: uid("session"),
          title: title.slice(0, 40) || "未命名任务",
          expertId,
          skillIds,
          messages: [],
          createdAt: now,
          updatedAt: now,
          pinned: false,
          group: group ?? "默认分组",
        };
        setSessions((prev) => [session, ...prev]);
        return session;
      },
      patchSession: (id, updater) => {
        setSessions((prev) => prev.map((s) => (s.id === id ? updater(s) : s)));
      },
      deleteSession: (id) => {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        toast("会话已删除", "info");
      },
      togglePin: (id) => {
        setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s)));
      },
      spendCredits,
      refundCredits,
      addTask: (t) => {
        setTasks((prev) => [t, ...prev]);
        toast("定时任务已创建");
      },
      updateTask: (id, patch) => {
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      },
      deleteTask: (id) => {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        toast("任务已删除", "info");
      },
      pushRun: (taskId, run) => {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, runs: [run, ...t.runs], lastStatus: run.status } : t)),
        );
      },
      toast,
    }),
    [spendCredits, refundCredits, toast],
  );

  const state = useMemo<AppState>(
    () => ({ ready, credits, planTotal: PLAN_TOTAL, installed, candidates, sessions, tasks, toasts }),
    [ready, credits, installed, candidates, sessions, tasks, toasts],
  );

  return (
    <StateCtx.Provider value={state}>
      <ActionsCtx.Provider value={actions}>{children}</ActionsCtx.Provider>
    </StateCtx.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(StateCtx);
  if (!ctx) throw new Error("useAppState must be used inside AppProvider");
  return ctx;
}

export function useAppActions() {
  const ctx = useContext(ActionsCtx);
  if (!ctx) throw new Error("useAppActions must be used inside AppProvider");
  return ctx;
}
