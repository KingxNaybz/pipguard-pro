import { format, formatDistanceToNowStrict } from "date-fns";

export const fmtMoney = (n: number | null | undefined, currency = "USD", digits = 2) => {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);
};

export const fmtNum = (n: number | null | undefined, digits = 2) => {
  const v = Number(n ?? 0);
  return v.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

export const fmtPips = (n: number | null | undefined) => {
  const v = Number(n ?? 0);
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}`;
};

export const fmtTime = (iso: string | null | undefined) => {
  if (!iso) return "—";
  return format(new Date(iso), "MMM d, HH:mm:ss");
};

export const fmtAgo = (iso: string | null | undefined) => {
  if (!iso) return "never";
  try { return formatDistanceToNowStrict(new Date(iso), { addSuffix: true }); }
  catch { return "—"; }
};

export const pnlColor = (n: number | null | undefined) =>
  Number(n ?? 0) > 0 ? "text-profit" : Number(n ?? 0) < 0 ? "text-loss" : "text-muted-foreground";
