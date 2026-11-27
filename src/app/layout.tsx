import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "星岑远航 StarCenVoyage · 跨境 AI 运营工作台",
  description:
    "面向跨境电商团队的 AI Agent 工作台：选品、市场调研、Listing、作图、视频、店铺数据与定时任务，全部在一个对话里完成。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="font-sans">
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
