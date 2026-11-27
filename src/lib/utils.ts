export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatMoney(n: number, currency = "$") {
  return `${currency}${n.toFixed(2)}`;
}

export function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} 小时前`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day} 天前`;
  return new Date(ts).toLocaleDateString("zh-CN");
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now()
    .toString(36)
    .slice(-4)}`;
}

export function downloadText(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob(["\ufeff" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Deterministic gradient per seed, used for product / skill artwork */
const GRADIENTS = [
  "from-[#FFD9C4] via-[#FFB48A] to-[#FF7F45]",
  "from-[#D9F4EA] via-[#9FE3CA] to-[#3CB98F]",
  "from-[#E4E1FD] via-[#C3BCFB] to-[#8778F8]",
  "from-[#FFE7CC] via-[#FFCF9A] to-[#F2A34B]",
  "from-[#DCE9FF] via-[#B4CDFF] to-[#5D8EF7]",
  "from-[#FFE0E9] via-[#FFB6CA] to-[#F4688F]",
  "from-[#E6F7D9] via-[#C5EBA5] to-[#7FBF3F]",
  "from-[#E8EAF0] via-[#C8CEDB] to-[#8B97AB]",
];

export function gradientFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

export function initialsOf(text: string, len = 2) {
  const clean = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "");
  return clean.slice(0, len).toUpperCase();
}
