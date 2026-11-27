"use client";

import Link from "next/link";
import React from "react";
import { Plus, Search, Server, SlidersHorizontal, Sparkles } from "lucide-react";
import { SkillCard } from "@/components/skill-card";
import { Badge, Button, EmptyState, Modal, PageHeader, Tabs } from "@/components/ui";
import { skillCategories, skills as allSkills } from "@/lib/mock-data";
import { useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function SkillsPage() {
  const { installed } = useAppState();
  const [tab, setTab] = React.useState<"community" | "mine">("community");
  const [cat, setCat] = React.useState("全部");
  const [tool, setTool] = React.useState("全部工具");
  const [q, setQ] = React.useState("");
  const [mcp, setMcp] = React.useState(false);

  const tools = ["全部工具", ...Array.from(new Set(allSkills.map((s) => s.tool)))];
  const source = tab === "mine" ? allSkills.filter((s) => installed.includes(s.id)) : allSkills;
  const list = source.filter(
    (s) =>
      (cat === "全部" || s.category === cat) &&
      (tool === "全部工具" || s.tool === tool) &&
      (!q.trim() || `${s.name}${s.desc}${s.tags.join("")}`.toLowerCase().includes(q.trim().toLowerCase())),
  );

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
      <PageHeader
        eyebrow="Skills"
        title="技能广场"
        description="技能是可安装的跨境执行能力：决定 Agent 能调什么数据、按什么规范产出。安装后可在任意会话叠加。"
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setMcp(true)}>
              <Server size={13} /> MCP 管理
            </Button>
            <Button variant="dark" size="sm">
              <Plus size={13} /> 创建自定义技能
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "community", label: `社区技能 ${allSkills.length}` },
            { value: "mine", label: `我的技能 ${installed.length}` },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-8 w-[220px] items-center gap-1.5 rounded-lg border border-cloud-200 bg-white px-2.5 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-50">
            <Search size={13} className="text-cloud-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索技能、能力、数据源"
              className="w-full bg-transparent text-[12px] outline-none placeholder:text-cloud-400"
            />
          </div>
          <select
            value={tool}
            onChange={(e) => setTool(e.target.value)}
            className="h-8 rounded-lg border border-cloud-200 bg-white px-2 text-[11.5px] text-cloud-600 outline-none focus:border-brand-300"
          >
            {tools.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-1.5 overflow-x-auto pb-1 scroll-x">
        {["全部", ...skillCategories.map((c) => c.name)].map((c) => {
          const count = c === "全部" ? allSkills.length : skillCategories.find((x) => x.name === c)?.count ?? 0;
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] transition",
                cat === c
                  ? "border-ink-900 bg-ink-900 text-white"
                  : "border-cloud-200 bg-white text-cloud-500 hover:border-cloud-300 hover:text-ink-900",
              )}
            >
              {c}
              <span className={cn("font-mono text-[9.5px]", cat === c ? "text-white/50" : "text-cloud-400")}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-3 flex items-center justify-between text-[11px] text-cloud-400">
        <span>
          共 <span className="font-medium text-ink-900">{list.length}</span> 个技能
          {cat !== "全部" && <span> · {cat}</span>}
        </span>
        <span className="hidden items-center gap-1 sm:flex">
          <SlidersHorizontal size={11} /> 按安装量排序
        </span>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={18} />}
          title={tab === "mine" ? "还没有安装技能" : "没有匹配的技能"}
          description={tab === "mine" ? "去社区技能里挑几个装上，安装后即可在会话里挂载。" : "换个关键词或分类再试试。"}
          action={
            tab === "mine" ? (
              <Button size="sm" onClick={() => setTab("community")}>
                浏览社区技能
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((s) => (
            <SkillCard key={s.id} skill={s} />
          ))}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-cloud-200 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[12.5px] font-medium text-ink-900">把你的 SOP 封装成技能</div>
            <p className="mt-1 text-[11.5px] text-cloud-500">
              写一份 SKILL.md，描述触发条件、输入输出与边界，就能在团队内分发复用。
            </p>
          </div>
          <Link href="/skills" className="btn-ghost h-8 px-3 text-[11.5px]">
            查看创作指南
          </Link>
        </div>
      </div>

      <Modal
        open={mcp}
        onClose={() => setMcp(false)}
        title="MCP 管理"
        description="把外部工具与数据源接入 Agent"
        footer={
          <>
            <Button variant="ghost" onClick={() => setMcp(false)}>
              取消
            </Button>
            <Button onClick={() => setMcp(false)}>保存并验证</Button>
          </>
        }
      >
        <div className="space-y-3">
          {[
            ["1", "获取第三方 MCP Server 链接与鉴权信息", "例如领星 MCP：https://openmcp.lingxing.com/mcp-servers/lingxing-mcp"],
            ["2", "填写连接配置", "服务器名称、链接地址、认证方式（Header / OAuth）"],
            ["3", "验证并启用", "系统会做一次握手校验，成功后技能即可调用"],
          ].map(([n, t, d]) => (
            <div key={n} className="flex gap-2.5 rounded-xl border border-cloud-200 bg-cloud-50/60 p-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-ink-900 font-mono text-[10px] text-white">
                {n}
              </span>
              <div>
                <div className="text-[12px] font-medium text-ink-900">{t}</div>
                <div className="mt-0.5 text-[11px] leading-relaxed text-cloud-500">{d}</div>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <Badge tone="mint">当前状态：未配置</Badge>
            <span className="text-[10.5px] text-cloud-400">配置后可在会话中直接调用外部数据</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
