/**
 * 星岑远航（StarCenVoyage）轻量内置评测
 * --------------------------------------------------------------
 * 离线层：直接调用生产代码 detectIntent / buildMockPlan，断言意图路由与计划结构契约。
 * 端到端层（--http）：对运行中的 dev/prod 服务 POST /api/chat，校验流式事件契约。
 *
 * 用法：
 *   npm run eval                 # 离线评测
 *   npm run eval -- --http       # 离线 + 对 http://localhost:3000 做端到端
 *   npm run eval -- --http http://localhost:3300
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildMockPlan, detectIntent } from "../src/lib/agent";
import type { Intent, MockPlan } from "../src/lib/agent";

interface Expectation {
  intent: Intent;
  minTools?: number;
  toolNames?: string[];
  artifactTypes?: string[];
  noArtifacts?: boolean;
  contentContains?: string[];
  creditCostMin?: number;
}

interface Case {
  id: string;
  group: string;
  prompt: string;
  expertId?: string;
  expect: Expectation;
}

interface Result {
  id: string;
  group: string;
  intent: Intent;
  tools: number;
  artifacts: number;
  ms: number;
  passed: boolean;
  reasons: string[];
  http?: { passed: boolean; ms: number; reasons: string[] };
}

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const httpIdx = args.indexOf("--http");
const httpUrl =
  httpIdx >= 0 ? (args[httpIdx + 1] && !args[httpIdx + 1].startsWith("--") ? args[httpIdx + 1] : "http://localhost:3000") : null;

const cases = JSON.parse(readFileSync(join(HERE, "eval-cases.json"), "utf-8")) as Case[];

function assertPlan(c: Case, plan: MockPlan): string[] {
  const reasons: string[] = [];
  if (plan.intent !== c.expect.intent) reasons.push(`intent=${plan.intent} 期望 ${c.expect.intent}`);
  if (typeof c.expect.minTools === "number" && plan.tools.length < c.expect.minTools) {
    reasons.push(`tools=${plan.tools.length} < ${c.expect.minTools}`);
  }
  const names = plan.tools.map((t) => t.name);
  for (const want of c.expect.toolNames ?? []) {
    if (!names.includes(want)) reasons.push(`缺少工具「${want}」`);
  }
  const types = plan.artifacts.map((a) => a.type);
  if (c.expect.noArtifacts && plan.artifacts.length !== 0) {
    reasons.push(`期望无产物，实际有 ${plan.artifacts.length} 个`);
  }
  for (const want of c.expect.artifactTypes ?? []) {
    if (!types.includes(want)) reasons.push(`缺少产物类型「${want}」`);
  }
  if (c.expect.contentContains && c.expect.contentContains.length) {
    const hit = c.expect.contentContains.some((s) => plan.content.includes(s));
    if (!hit) reasons.push(`正文未命中关键词 [${c.expect.contentContains.join("|")}]`);
  }
  if (typeof c.expect.creditCostMin === "number" && plan.creditCost < c.expect.creditCostMin) {
    reasons.push(`creditCost=${plan.creditCost} < ${c.expect.creditCostMin}`);
  }
  // 结构契约：每个工具必须有可展示字段
  for (const t of plan.tools) {
    if (!t.name || !t.engine) reasons.push(`工具字段缺失：${JSON.stringify(t)}`);
  }
  return reasons;
}

async function evalHttp(c: Case, url: string): Promise<{ passed: boolean; ms: number; reasons: string[] }> {
  const reasons: string[] = [];
  const t0 = Date.now();
  let res: Response;
  try {
    res = await fetch(`${url}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: c.prompt, expertId: c.expertId }),
    });
  } catch (e) {
    return { passed: false, ms: Date.now() - t0, reasons: [`请求失败：${(e as Error).message}`] };
  }
  if (!res.ok || !res.body) {
    return { passed: false, ms: Date.now() - t0, reasons: [`HTTP ${res.status}`] };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let metaIntent: Intent | null = null;
  let sawDone = false;
  let credits = 0;
  const toolNames = new Set<string>();
  const artifactTypes = new Set<string>();
  let sawError = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let evt: any;
      try {
        evt = JSON.parse(trimmed);
      } catch {
        continue;
      }
      if (evt.type === "meta") metaIntent = evt.intent ?? metaIntent;
      if (evt.type === "tool_start" && evt.tool?.name) toolNames.add(evt.tool.name);
      if (evt.type === "artifact" && evt.artifact?.type) artifactTypes.add(evt.artifact.type);
      if (evt.type === "done") {
        sawDone = true;
        credits = evt.credits ?? 0;
      }
      if (evt.type === "error") sawError = true;
    }
    if (Date.now() - t0 > 45_000) {
      reasons.push("流式超时 45s");
      break;
    }
  }

  if (!sawDone) reasons.push("未收到 done 事件");
  if (sawError) reasons.push("收到 error 事件");
  if (metaIntent !== c.expect.intent) reasons.push(`http meta.intent=${metaIntent} 期望 ${c.expect.intent}`);
  if (typeof c.expect.minTools === "number" && toolNames.size < c.expect.minTools) {
    reasons.push(`http 工具数=${toolNames.size} < ${c.expect.minTools}`);
  }
  for (const want of c.expect.toolNames ?? []) {
    if (!toolNames.has(want)) reasons.push(`http 缺少工具「${want}」`);
  }
  if (c.expect.noArtifacts && artifactTypes.size !== 0) reasons.push(`http 期望无产物`);
  for (const want of c.expect.artifactTypes ?? []) {
    if (!artifactTypes.has(want)) reasons.push(`http 缺少产物类型「${want}」`);
  }

  return { passed: reasons.length === 0, ms: Date.now() - t0, reasons };
}

function fmtCell(s: string, w: number): string {
  // 简单左对齐，中文按显示宽度近似
  const len = [...s].reduce((acc, ch) => acc + (ch.charCodeAt(0) > 127 ? 2 : 1), 0);
  return s + " ".repeat(Math.max(1, w - len));
}

async function main() {
  const results: Result[] = [];
const header = [fmtCell("用例", 22), fmtCell("意图", 10), fmtCell("工具", 5), fmtCell("产物", 5), fmtCell("耗时", 7), "结果"];
console.log(header.join(""));
console.log("-".repeat(70));

for (const c of cases) {
  const t0 = Date.now();
  const intent = detectIntent(c.prompt);
  const plan = buildMockPlan(c.prompt, "评测专家");
  const reasons = assertPlan(c, plan);
  const r: Result = {
    id: c.id,
    group: c.group,
    intent,
    tools: plan.tools.length,
    artifacts: plan.artifacts.length,
    ms: Date.now() - t0,
    passed: reasons.length === 0,
    reasons,
  };

  if (httpUrl) {
    r.http = await evalHttp(c, httpUrl);
    if (!r.http.passed) r.passed = false;
  }

  results.push(r);
  const status = r.passed ? "PASS" : "FAIL";
  console.log(
    [fmtCell(c.id, 22), fmtCell(intent, 10), fmtCell(String(plan.tools.length), 5), fmtCell(String(plan.artifacts.length), 5), fmtCell(`${r.ms}ms`, 7), status].join(""),
  );
  for (const reason of reasons) console.log(`    - ${reason}`);
  if (r.http) {
    const h = r.http.passed ? "PASS" : "FAIL";
    console.log(`    http(${r.http.ms}ms): ${h}${r.http.reasons.map((x) => ` · ${x}`).join("")}`);
  }
}

console.log("-".repeat(70));
const total = results.length;
const passed = results.filter((r) => r.passed).length;
const byGroup: Record<string, { p: number; t: number }> = {};
for (const r of results) {
  byGroup[r.group] = byGroup[r.group] ?? { p: 0, t: 0 };
  byGroup[r.group].t += 1;
  if (r.passed) byGroup[r.group].p += 1;
}
console.log("分组通过：");
for (const [g, v] of Object.entries(byGroup)) {
  console.log(`  ${fmtCell(g, 12)} ${v.p}/${v.t}`);
}
console.log(`\n总计 ${passed}/${total} 通过（${httpUrl ? "离线+HTTP" : "离线"}）`);

if (passed !== total) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
