import { useSignals, useBotParams } from "@/lib/cockpit-data";
import { fmtAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

const PAIRS = ["EURUSD","GBPUSD","XAUUSD","GBPJPY","EURJPY","USDJPY","AUDUSD","USDCAD","NZDUSD","USDCHF","EURGBP"];

const defaultFor = (sym: string) => ({
  max_spread: sym === "XAUUSD" ? 50 : 30,
  min_freshness_sec: 600,
});

export const SignalsGrid = () => {
  const signals = useSignals();
  const params = useBotParams();
  const map = new Map((signals ?? []).map((s) => [s.symbol, s]));
  const pairSettings = params?.pair_settings ?? {};

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Signals · 11 pairs</h2>
        <span className="font-mono text-[10px] text-muted-foreground">strength / 6 · per-pair filters applied</span>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {PAIRS.map((symbol) => {
          const sig = map.get(symbol);
          const cfg = { ...defaultFor(symbol), ...(pairSettings[symbol] ?? {}) };
          const strength = sig?.strength ?? 0;
          const side = sig?.side ?? "none";

          // Filter checks
          const ageSec = sig ? (Date.now() - new Date(sig.scanned_at).getTime()) / 1000 : Infinity;
          const stale = sig ? ageSec > (cfg.min_freshness_sec ?? 600) : true;
          const spreadBad = sig?.spread != null && cfg.max_spread != null && Number(sig.spread) > cfg.max_spread;
          const blocked = stale || spreadBad;

          const accent = blocked
            ? "border-warn/30 bg-warn/5 opacity-70"
            : side === "buy" ? "border-profit/40 bg-profit/5"
            : side === "sell" ? "border-loss/40 bg-loss/5"
            : "border-border bg-surface-2";

          return (
            <div key={symbol} className={cn("rounded-lg border p-3 relative", accent)}>
              <div className="flex items-center justify-between">
                <div className="font-mono text-xs font-bold">{symbol}</div>
                {blocked ? (
                  <span title={spreadBad ? `Spread > ${cfg.max_spread}` : `Stale > ${cfg.min_freshness_sec}s`}
                    className="flex items-center gap-1 rounded bg-warn/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-warn">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    {spreadBad ? "spread" : "stale"}
                  </span>
                ) : side !== "none" && (
                  <span className={cn(
                    "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                    side === "buy" ? "bg-profit/20 text-profit" : "bg-loss/20 text-loss",
                  )}>{side}</span>
                )}
              </div>
              <div className="mt-2 flex gap-1">
                {[1,2,3,4,5,6].map((i) => (
                  <div key={i} className={cn(
                    "h-1.5 flex-1 rounded-full",
                    i <= strength
                      ? blocked ? "bg-warn/60"
                        : side === "sell" ? "bg-loss" : "bg-profit"
                      : "bg-surface-3",
                  )} />
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{sig?.regime ?? "—"}</span>
                <span className="font-mono">{sig ? fmtAgo(sig.scanned_at) : "no scan"}</span>
              </div>
              <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                <span>spread {sig?.spread != null ? Number(sig.spread).toFixed(1) : "—"} / {cfg.max_spread}</span>
                <span>≤{cfg.min_freshness_sec}s</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
