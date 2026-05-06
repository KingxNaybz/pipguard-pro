import { useBotState, useBotParams, usePositions } from "@/lib/cockpit-data";
import { fmtMoney, fmtNum, pnlColor } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Shield, ShieldAlert, TrendingUp, Activity } from "lucide-react";

const RiskBar = ({ label, value, limit, currency }: { label: string; value: number; limit: number; currency?: string }) => {
  const pct = limit > 0 ? Math.min(100, (Math.abs(value) / limit) * 100) : 0;
  const color = pct >= 90 ? "bg-loss" : pct >= 50 ? "bg-warn" : "bg-profit";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">
          <span className={pnlColor(-Math.abs(value))}>{fmtMoney(value, currency)}</span>
          <span className="text-muted-foreground"> / {fmtMoney(limit, currency)}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-3">
        <div className={cn("h-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-0.5 text-right text-[10px] text-muted-foreground">{pct.toFixed(0)}%</div>
    </div>
  );
};

export const RiskDashboard = () => {
  const state = useBotState();
  const params = useBotParams();
  const positions = usePositions() ?? [];

  const equity = Number(state?.equity ?? 0);
  const dailyLossLimit = equity * Number(params?.daily_loss_limit ?? 0.06);
  const weeklyLossLimit = equity * 0.10;
  const monthlyLossLimit = equity * 0.15;

  const dailyDD = Math.abs(Number(state?.daily_drawdown ?? 0));
  const weeklyAnchor = Number(state?.weekly_anchor ?? 0);
  const monthlyAnchor = Number(state?.monthly_anchor ?? 0);
  const weeklyDD = weeklyAnchor > 0 ? Math.max(0, weeklyAnchor - equity) : 0;
  const monthlyDD = monthlyAnchor > 0 ? Math.max(0, monthlyAnchor - equity) : 0;

  // Currency exposure
  const exposure = new Map<string, number>();
  for (const p of positions) {
    const sym = p.symbol;
    if (sym.length < 6) continue;
    const base = sym.slice(0, 3);
    const quote = sym.slice(3, 6);
    const sign = p.side === "buy" ? 1 : -1;
    exposure.set(base, (exposure.get(base) ?? 0) + sign * p.lots);
    exposure.set(quote, (exposure.get(quote) ?? 0) - sign * p.lots);
  }
  const expEntries = [...exposure.entries()].filter(([, v]) => Math.abs(v) > 0.001).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const maxExp = Math.max(0.5, ...expEntries.map(([, v]) => Math.abs(v)));

  const halted = state?.halted;
  const consec = state?.consecutive_losses ?? 0;
  const consecLimit = params?.max_consecutive_losses ?? 5;

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className={cn(
        "flex items-center justify-between rounded-xl border p-4",
        halted ? "border-loss/40 bg-loss/10" : "border-profit/40 bg-profit/10"
      )}>
        <div className="flex items-center gap-3">
          {halted ? <ShieldAlert className="h-6 w-6 text-loss" /> : <Shield className="h-6 w-6 text-profit" />}
          <div>
            <div className={cn("font-bold uppercase tracking-wider", halted ? "text-loss" : "text-profit")}>
              {halted ? "HALTED" : "ACTIVE"}
            </div>
            <div className="text-xs text-muted-foreground">{halted ? state?.halt_reason ?? "Circuit breaker triggered" : "All circuit breakers within safe range"}</div>
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div>Adaptive risk: <span className="font-mono text-foreground">{((params?.risk_percent ?? 0) * 100).toFixed(2)}%</span></div>
          {consec > 0 && <div>Risk scaled down due to <span className="text-warn">{consec} consecutive loss{consec > 1 ? "es" : ""}</span></div>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Circuit breakers */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Activity className="h-4 w-4" /> Circuit Breakers
          </h3>
          <div className="space-y-4">
            <RiskBar label="Daily Loss" value={dailyDD} limit={dailyLossLimit} currency={state?.currency} />
            <RiskBar label="Weekly Loss" value={weeklyDD} limit={weeklyLossLimit} currency={state?.currency} />
            <RiskBar label="Monthly Loss" value={monthlyDD} limit={monthlyLossLimit} currency={state?.currency} />
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Consecutive Losses</span>
                <span className="font-mono">{consec} / {consecLimit}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                <div className={cn("h-full", consec >= consecLimit ? "bg-loss" : consec >= consecLimit * 0.6 ? "bg-warn" : "bg-profit")}
                  style={{ width: `${Math.min(100, (consec / consecLimit) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Exposure */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="h-4 w-4" /> Currency Exposure
          </h3>
          {expEntries.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No open positions</div>
          ) : (
            <div className="space-y-2">
              {expEntries.map(([cur, lots]) => {
                const pct = (Math.abs(lots) / maxExp) * 100;
                const long = lots > 0;
                return (
                  <div key={cur} className="flex items-center gap-3">
                    <span className="w-10 font-mono text-sm font-bold">{cur}</span>
                    <div className="flex-1">
                      <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                        <div className={cn("h-full", long ? "bg-profit" : "bg-loss")} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className={cn("w-20 text-right font-mono text-xs", long ? "text-profit" : "text-loss")}>
                      {long ? "+" : ""}{fmtNum(lots, 2)} lots
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Position management */}
      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Position Management</h3>
        </div>
        {positions.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No open positions</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-2">Symbol</th>
                <th className="px-4 py-2">Side</th>
                <th className="px-4 py-2 text-right">Lots</th>
                <th className="px-4 py-2 text-right">R:R achieved</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">P/L</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => {
                const risk = p.sl ? Math.abs(p.entry - p.sl) : 0;
                const moved = p.current_price ? Math.abs(p.current_price - p.entry) : 0;
                const rr = risk > 0 ? (p.side === "buy" ? (p.current_price ?? p.entry) - p.entry : p.entry - (p.current_price ?? p.entry)) / risk : 0;
                const breakeven = p.sl != null && Math.abs(p.sl - p.entry) < risk * 0.05;
                const trailing = !breakeven && rr > 1;
                return (
                  <tr key={p.id} className="border-b border-border/40 hover:bg-surface-2">
                    <td className="px-4 py-2 font-mono font-semibold">{p.symbol}</td>
                    <td className="px-4 py-2">
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold uppercase", p.side === "buy" ? "bg-profit/15 text-profit" : "bg-loss/15 text-loss")}>{p.side}</span>
                    </td>
                    <td className="px-4 py-2 text-right font-mono">{fmtNum(p.lots, 2)}</td>
                    <td className={cn("px-4 py-2 text-right font-mono", pnlColor(rr))}>{rr >= 0 ? "+" : ""}{rr.toFixed(2)}R</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {breakeven && <span className="rounded bg-info/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-info">Break-even</span>}
                        {trailing && <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary">Trailing</span>}
                        {!breakeven && !trailing && <span className="text-[10px] text-muted-foreground">—</span>}
                      </div>
                    </td>
                    <td className={cn("px-4 py-2 text-right font-mono font-semibold", pnlColor(p.profit))}>
                      {p.profit >= 0 ? "+" : ""}{fmtMoney(p.profit, state?.currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
