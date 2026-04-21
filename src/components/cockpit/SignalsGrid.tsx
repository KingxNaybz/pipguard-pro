import { useSignals } from "@/lib/cockpit-data";
import { fmtAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAIRS = ["EURUSD","GBPUSD","XAUUSD","GBPJPY","EURJPY","USDJPY","AUDUSD","USDCAD","NZDUSD","USDCHF","EURGBP"];

export const SignalsGrid = () => {
  const signals = useSignals();
  const map = new Map((signals ?? []).map((s) => [s.symbol, s]));

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Signals · 11 pairs</h2>
        <span className="font-mono text-[10px] text-muted-foreground">strength / 6</span>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {PAIRS.map((symbol) => {
          const sig = map.get(symbol);
          const strength = sig?.strength ?? 0;
          const side = sig?.side ?? "none";
          const accent = side === "buy" ? "border-profit/40 bg-profit/5" : side === "sell" ? "border-loss/40 bg-loss/5" : "border-border bg-surface-2";

          return (
            <div key={symbol} className={cn("rounded-lg border p-3", accent)}>
              <div className="flex items-center justify-between">
                <div className="font-mono text-xs font-bold">{symbol}</div>
                {side !== "none" && (
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
                      ? side === "sell" ? "bg-loss" : "bg-profit"
                      : "bg-surface-3",
                  )} />
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{sig?.regime ?? "—"}</span>
                <span className="font-mono">{sig ? fmtAgo(sig.scanned_at) : "no scan"}</span>
              </div>
              {sig?.spread != null && (
                <div className="mt-1 font-mono text-[10px] text-muted-foreground">spread {Number(sig.spread).toFixed(1)}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
