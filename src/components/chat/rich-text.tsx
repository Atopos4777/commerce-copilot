import React from "react";
import { cn } from "@/lib/utils";

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) {
          return <strong key={i}>{p.slice(2, -2)}</strong>;
        }
        if (p.startsWith("`") && p.endsWith("`")) {
          return <code key={i}>{p.slice(1, -1)}</code>;
        }
        return <React.Fragment key={i}>{p}</React.Fragment>;
      })}
    </>
  );
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  let ordered = false;

  const flush = () => {
    if (!list.length) return;
    const Tag = ordered ? "ol" : "ul";
    blocks.push(
      <Tag key={`list-${blocks.length}`} className={cn(ordered ? "list-decimal" : "list-disc", "mb-2.5 space-y-1 pl-5")}>
        {list.map((item, i) => (
          <li key={i}>
            <Inline text={item} />
          </li>
        ))}
      </Tag>,
    );
    list = [];
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-•]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);

    if (bullet) {
      if (ordered) flush();
      ordered = false;
      list.push(bullet[1]);
      return;
    }
    if (numbered) {
      if (!ordered) flush();
      ordered = true;
      list.push(numbered[1]);
      return;
    }

    flush();
    if (!line.trim()) {
      return;
    }
    if (line.startsWith("### ")) {
      blocks.push(
        <h4 key={idx} className="mb-1.5 mt-3 text-[12.5px] font-semibold text-ink-900">
          {line.slice(4)}
        </h4>,
      );
      return;
    }
    if (line.startsWith("## ")) {
      blocks.push(
        <h3 key={idx} className="mb-1.5 mt-3 text-[13px] font-semibold text-ink-900">
          {line.slice(3)}
        </h3>,
      );
      return;
    }
    blocks.push(
      <p key={idx}>
        <Inline text={line} />
      </p>,
    );
  });
  flush();

  return <div className={cn("prose-chat", className)}>{blocks}</div>;
}
