import { useBotState, useBotParams, usePositions } from "@/lib/cockpit-data";
import { fmtMoney } from "@/lib/format";
import { Shield, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export const DailyRiskCard = () => {
  const state = useBotState();
  const params = useBotParams();
  const positions = usePositions() ?? [];

  const equity = Number(state?.equity ?? 0);
  const balance = Number(state?.balance ?? equity);
  const dailyPL = Number(state?.daily_pl ?? 0);
  const lossLimitPct = Number(params?.daily_loss_limit ?? 0.06);
  const lossBudget = balance * lossLimitPct;

  // Realised loss today (negative daily_pl portion)
  const realisedLoss = dailyPL < 0 ? Math.abs(dailyPL) : 0;

  // Open risk = sum of (entry - sl) * lots-equivalent profit at SL hit
  // Approximation: if SL set, use abs(profit-if-SL). Otherwise use current floating loss only.
  const openRisk = positions.reduce((sum, p) => {
    if (p.sl == null || !p.entry) {
      return sum + Math.max(0, -Number(p.profit ?? 0));
    }
    const dist = Math.abs(Number(p.entry) - Number(p.sl));
    const entryDist = Math.abs(Number(p.entry));
    if (!entryDist) return sum;
    // Estimate worst-case loss = current profit adjusted by SL distance vs current price distance
    const cur = Number(p.current_price ?? p.entry);
    const adverse = p.side === "buy" ? Math.max(0, Number(p.entry) - Number(p.sl)) : Math.max(0, Number(p.sl) - Number(p.entry));
    const worst = Number(p.profit ?? 0) - (adverse / entryDist) * Number(p.lots ?? 0) * cur;
    return sum + Math.max(0, -worst);
  }, 0);

  const totalRisk = realisedLoss + openRisk;
  const remaining = Math.max(0, lossBudget - totalRisk);
  const usedPct = lossBudget > 0 ? Math.min(100, (totalRisk / lossBudget) * 100) : 0;
  const breakerActive = !!state?.halted;
  const nearLimit = usedPct >= 75 && !breakerActive;

  const accent = breakerActive ? "loss" : nearLimit ? "warn" : "profit";

  return (
    <div className={cn(
      "rounded-xl border bg-card p-5 shadow-card relative overflow-hidden",
      breakerActive ? "border-loss/40" : nearLimit ? "border-warn/40" : "border-border",
    )}>
      <div className={cn(
        "absolute inset-x-0 top-0 h-px",
        accent === "loss" && "bg-loss",
        accent === "warn" && "bg-warn",
        accent === "profit" && "bg-profit",
      )} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Daily Risk</div>
          <div className="mt-2 font-mono text-3xl font-semibold leading-none">
            {fmtMoney(totalRisk, state?.currency)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            of <span className="font-mono">{fmtMoney(lossBudget, state?.currency)}</span> budget · {(lossLimitPct * 100).toFixed(1)}%
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase",
          breakerActive ? "border-loss/40 bg-loss/10 text-loss"
            : nearLimit ? "border-warn/40 bg-warn/10 text-warn"
            : "border-profit/30 bg-profit/10 text-profit",
        )}>
          {breakerActive ? <ShieldAlert className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
          {breakerActive ? "Breaker ON" : nearLimit ? "Near limit" : "Safe"}
        </div>
      </div>

      {/* Bar */}
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-3">
        <div
          className={cn(
            "h-full transition-all",
            breakerActive ? "bg-loss" : nearLimit ? "bg-warn" : "bg-profit",
          )}
          style={{ width: `${usedPct}%` }}
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <div>
          <div className="text-muted-foreground">Realised</div>
          <div className="font-mono">{fmtMoney(realisedLoss, state?.currency)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Open risk</div>
          <div className="font-mono">{fmtMoney(openRisk, state?.currency)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Remaining</div>
          <div className={cn("font-mono", remaining <= 0 ? "text-loss" : "text-profit")}>
            {fmtMoney(remaining, state?.currency)}
          </div>
        </div>
      </div>

      {breakerActive && state?.halt_reason && (
        <div className="mt-3 rounded border border-loss/30 bg-loss/10 p-2 text-[11px] text-loss">
          Halted: {state.halt_reason}
        </div>
      )}
    </div>
  );
};
