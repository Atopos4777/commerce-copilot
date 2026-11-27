import { NextRequest, NextResponse } from "next/server";
import { aiConfig, buildMockPlan } from "@/lib/agent";
import { expertMap, skills } from "@/lib/mock-data";
import { uid } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 真实模型调用失败后 60 秒内直接走演示模式，避免每条消息都等待网络超时
let liveDownUntil = 0;

export async function POST(req: NextRequest) {
  let body: {
    prompt: string;
    expertId?: string;
    skillIds?: string[];
    history?: { role: "user" | "assistant"; content: string }[];
  };
  try {
    body = (await req.json()) as {
      prompt: string;
      expertId?: string;
      skillIds?: string[];
      history?: { role: "user" | "assistant"; content: string }[];
    };
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }

  const prompt = (body.prompt || "").trim();
  const expert = expertMap[body.expertId || "expert-selection"] ?? expertMap["expert-selection"];
  const attached = (body.skillIds || []).map((id) => skills.find((s) => s.id === id)).filter(Boolean);
  const plan = buildMockPlan(prompt, expert.name);
  const config = aiConfig();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (obj: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
        } catch {
          closed = true;
        }
      };

      const runMock = async () => {
        for (const tool of plan.tools) {
          const id = uid("tool");
          send({ type: "tool_start", tool: { ...tool, id } });
          await sleep(620 + Math.random() * 520);
          send({
            type: "tool_end",
            tool: { id, status: "success", duration: Math.round((0.6 + Math.random() * 0.9) * 10) / 10 },
          });
        }

        for (const artifact of plan.artifacts) {
          await sleep(280);
          send({ type: "artifact", artifact });
        }

        await sleep(260);
        const chunks = plan.content.match(/[\s\S]{1,5}/g) || [];
        for (const chunk of chunks) {
          if (req.signal.aborted) break;
          send({ type: "token", value: chunk });
          await sleep(13 + Math.random() * 12);
        }

        send({ type: "done", credits: plan.creditCost, mode: "mock" });
      };

      try {
        const useLive = Boolean(config) && Date.now() >= liveDownUntil;
        send({ type: "meta", intent: plan.intent, mode: useLive ? "live" : "mock" });

        if (useLive && config) {
          try {
            const system = [
              `你是星岑远航（StarCenVoyage）的跨境电商 AI 运营专家「${expert.name}」（${expert.title}）。`,
              "用简体中文回答，结构清晰，先给结论再给依据，尽量给出可执行动作与数字。",
              attached.length
                ? `本轮已挂载技能：${attached.map((s) => s!.name).join("、")}。请在回答中体现这些能力的视角。`
                : "",
              "不要编造不确定的具体数据；如果需要更多信息，先说明你的假设。",
            ]
              .filter(Boolean)
              .join("\n");

            const messages = [
              { role: "system", content: system },
              ...(body.history || []).slice(-6),
              { role: "user", content: prompt },
            ];

            const resp = await fetch(`${config.baseUrl}/chat/completions`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${config.key}`,
              },
              body: JSON.stringify({ model: config.model, messages, stream: true, temperature: 0.6 }),
              signal: req.signal,
            });

            if (!resp.ok || !resp.body) {
              throw new Error(`模型接口返回 ${resp.status}`);
            }

            const reader = resp.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let full = "";
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";
              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith("data:")) continue;
                const data = trimmed.slice(5).trim();
                if (!data || data === "[DONE]") continue;
                try {
                  const json = JSON.parse(data);
                  const delta = json.choices?.[0]?.delta?.content;
                  if (delta) {
                    full += delta;
                    send({ type: "token", value: delta });
                  }
                } catch {
                  /* ignore malformed chunks */
                }
              }
            }
            send({ type: "done", credits: plan.creditCost, mode: "live", length: full.length });
            controller.close();
            return;
          } catch (liveErr) {
            // 真实模型不可用（未联网 / Key 无效等）时自动回退演示模式，保证对话可用
            liveDownUntil = Date.now() + 60_000;
            const reason = liveErr instanceof Error ? liveErr.message : "未知错误";
            send({ type: "meta", intent: plan.intent, mode: "mock" });
            send({ type: "notice", message: `真实模型不可用（${reason}），已切换为演示模式` });
            await runMock();
            controller.close();
            return;
          }
        }

        await runMock();
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "未知错误";
        send({ type: "error", message: `模型调用失败：${message}` });
        send({ type: "done", credits: 0, mode: "live" });
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
