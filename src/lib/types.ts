export type Platform = "亚马逊" | "TikTok Shop" | "Temu" | "Shopee" | "Ozon" | "Walmart";

export type CandidateStatus = "候选" | "调研中" | "已选品" | "已排除";

export interface Candidate {
  id: string;
  asin: string;
  title: string;
  category: string;
  platform: Platform;
  price: number;
  bsr: number;
  monthlySales: number;
  rating: number;
  reviews: number;
  keyword: string;
  status: CandidateStatus;
  addedAt: number;
  score: number;
}

export type SkillCategory =
  | "选品与开发"
  | "产品运营"
  | "营销广告"
  | "合规检测"
  | "产品视觉"
  | "数据分析"
  | "通用/热点";

export interface Skill {
  id: string;
  slug: string;
  name: string;
  category: SkillCategory;
  tool: string;
  desc: string;
  tags: string[];
  source: "LinkFox 官方" | "社区创作者";
  installs: number;
  version: string;
  free: boolean;
  overview: string;
  applicable: string[];
  pricing: string;
}

export interface Expert {
  id: string;
  name: string;
  title: string;
  desc: string;
  accent: string;
  official: boolean;
  tags: string[];
  methodology: { title: string; desc: string }[];
  examples: string[];
  defaultSkills: string[];
}

export interface ToolCall {
  id: string;
  name: string;
  engine: string;
  status: "running" | "success" | "error";
  input: Record<string, unknown>;
  output?: string;
  duration?: number;
}

export interface Artifact {
  id: string;
  type: "table" | "report" | "image" | "file" | "video";
  title: string;
  subtitle?: string;
  columns?: string[];
  rows?: string[][];
  items?: Candidate[];
  content?: string;
  seed?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  artifacts?: Artifact[];
  streaming?: boolean;
  createdAt: number;
  expertId?: string;
  skillIds?: string[];
}

export interface Session {
  id: string;
  title: string;
  expertId: string;
  skillIds: string[];
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
  group: string;
}

export interface RunRecord {
  id: string;
  startedAt: number;
  status: "running" | "success" | "failed" | "timeout";
  duration: number;
  summary: string;
}

export interface AutomationTask {
  id: string;
  title: string;
  expertId: string;
  prompt: string;
  scheduleLabel: string;
  cycle: "每天" | "每周" | "每月" | "不重复";
  remind: string[];
  enabled: boolean;
  lastStatus: "success" | "failed" | "running" | "timeout" | "idle";
  runs: RunRecord[];
}

export interface StoreProduct {
  id: string;
  asin: string;
  title: string;
  category: string;
  price: number;
  sales30d: number;
  stock: number;
  status: "在售" | "低库存" | "缺货" | "已下架";
}

export interface Keyword {
  id: string;
  word: string;
  volume: number;
  competition: "低" | "中" | "高";
  trend: number;
  library: string;
}

export interface PromptItem {
  id: string;
  title: string;
  category: string;
  content: string;
  uses: number;
}

export interface FileItem {
  id: string;
  name: string;
  type: "xlsx" | "pdf" | "png" | "mp4" | "csv";
  size: string;
  date: string;
}

export interface Campaign {
  id: string;
  name: string;
  type: string;
  spend: number;
  sales: number;
  acos: number;
  clicks: number;
  status: "投放中" | "已暂停" | "预算受限";
}

export interface OrderRow {
  id: string;
  orderNo: string;
  product: string;
  site: string;
  amount: number;
  status: "已发货" | "待发货" | "已签收" | "退款";
  time: string;
}

export interface StoreAuth {
  id: string;
  name: string;
  site: string;
  status: "已授权" | "授权过期" | "未授权";
  expiry: string;
  listings: number;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}
