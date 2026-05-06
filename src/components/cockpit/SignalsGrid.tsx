import { useState } from "react";
import { useSignals, useBotParams } from "@/lib/cockpit-data";
import { fmtAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowUp, ArrowDown } from "lucide-react";

const PAIRS = ["EURUSD","GBPUSD","XAUUSD","GBPJPY","EURJPY","USDJPY","AUDUSD","USDCAD","NZDUSD","USDCHF","EURGBP"];

const REGIME_STYLES: Record<string, string> = {
  trending_calm: "bg-info/15 text-info border-info/30",
  trending_volatile: "bg-primary/15 text-primary border-primary/30",
  ranging_calm: "bg-profit/15 text-profit border-profit/30",
  choppy_volatile: "bg-warn/15 text-warn border-warn/30",
};

const defaultFor = (sym: string) => ({
  max_spread: sym === "XAUUSD" ? 50 : 30,
  min_freshness_sec: 600,
});

export const SignalsGrid = () => {
  const signals = useSignals();
  const params = useBotParams();
  const [filter, setFilter] = useState<string>("");
  const map = new Map((signals ?? []).map((s) => [s.symbol, s]));
  const pairSettings = params?.pair_settings ?? {};

  const regimes = Array.from(new Set((signals ?? []).map((s) => s.regime).filter(Boolean) as string[]));

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Signals · 11 pairs</h2>
        <div className="flex items-center gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-7 rounded-md border border-input bg-background px-2 text-xs">
            <option value="">All regimes</option>
            {regimes.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <span className="font-mono text-[10px] text-muted-foreground">strength / 6 · edge / 6</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {PAIRS.map((symbol) => {
          const sig = map.get(symbol);
          if (filter && sig?.regime !== filter) return null;
          const cfg = { ...defaultFor(symbol), ...(pairSettings[symbol] ?? {}) };
          const strength = sig?.strength ?? 0;
          const netEdge = sig?.net_edge ?? 0;
          const side = sig?.side ?? "none";

          const ageSec = sig ? (Date.now() - new Date(sig.scanned_at).getTime()) / 1000 : Infinity;
          const stale = sig ? ageSec > (cfg.min_freshness_sec ?? 600) : true;
          const spreadBad = sig?.spread != null && cfg.max_spread != null && Number(sig.spread) > cfg.max_spread;
          const blocked = stale || spreadBad;
          const weak = netEdge < 2;

          const accent = blocked
            ? "border-warn/30 bg-warn/5 opacity-70"
            : weak ? "border-border bg-surface-2 opacity-80"
            : side === "buy" ? "border-profit/40 bg-profit/5"
            : side === "sell" ? "border-loss/40 bg-loss/5"
            : "border-border bg-surface-2";

          const Arrow = side === "buy" ? ArrowUp : side === "sell" ? ArrowDown : null;

          return (
            <div key={symbol} className={cn("rounded-lg border p-3 relative", accent)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 font-mono text-xs font-bold">
                  {symbol}
                  {sig?.h1_trend && (
                    <span className="text-[10px]" title={`H1: ${sig.h1_trend}`}>
                      {sig.h1_trend === "up" ? "↗" : sig.h1_trend === "down" ? "↘" : "→"}
                    </span>
                  )}
                </div>
                {blocked ? (
                  <span title={spreadBad ? `Spread > ${cfg.max_spread}` : `Stale > ${cfg.min_freshness_sec}s`}
                    className="flex items-center gap-1 rounded bg-warn/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-warn">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    {spreadBad ? "spread" : "stale"}
                  </span>
                ) : Arrow && (
                  <span className={cn(
                    "flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                    side === "buy" ? "bg-profit/20 text-profit" : "bg-loss/20 text-loss",
                  )}>
                    <Arrow className="h-2.5 w-2.5" />{side}
                  </span>
                )}
              </div>
              <div className="mt-2 flex gap-1">
                {[1,2,3,4,5,6].map((i) => (
                  <div key={i} className={cn(
                    "h-1.5 flex-1 rounded-full",
                    i <= strength
                      ? blocked || weak ? "bg-muted-foreground/40"
                        : netEdge >= 3 ? (side === "sell" ? "bg-loss" : "bg-profit")
                        : "bg-warn/70"
                      : "bg-surface-3",
                  )} />
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px]">
                {sig?.regime ? (
                  <span className={cn("rounded border px-1 py-0.5 text-[9px]", REGIME_STYLES[sig.regime] ?? "bg-surface-3 text-muted-foreground border-border")}>
                    {sig.regime}
                  </span>
                ) : <span className="text-muted-foreground">—</span>}
                <span className="font-mono text-muted-foreground">edge {netEdge}</span>
              </div>
              {sig?.patterns && sig.patterns.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {sig.patterns.slice(0, 3).map((p) => (
                    <span key={p} className="rounded bg-surface-3 px-1 py-0.5 text-[8px] text-muted-foreground">{p}</span>
                  ))}
                </div>
              )}
              <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                <span>spr {sig?.spread != null ? Number(sig.spread).toFixed(1) : "—"}/{cfg.max_spread}</span>
                <span>{sig ? fmtAgo(sig.scanned_at) : "no scan"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
