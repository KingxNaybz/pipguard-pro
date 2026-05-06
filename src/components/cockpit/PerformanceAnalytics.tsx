import { useMemo } from "react";
import { useTrades } from "@/lib/cockpit-data";
import { fmtMoney, fmtNum, pnlColor } from "@/lib/format";
import { cn } from "@/lib/utils";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid, ReferenceLine } from "recharts";

export const PerformanceAnalytics = () => {
  const trades = useTrades(2000) ?? [];

  // Time-of-day heatmap (hour x pair)
  const { heatmap, pairs, hourMax } = useMemo(() => {
    const grid = new Map<string, Map<number, { wins: number; total: number; profit: number }>>();
    for (const t of trades) {
      const hr = new Date(t.closed_at).getUTCHours();
      const key = t.symbol;
      if (!grid.has(key)) grid.set(key, new Map());
      const row = grid.get(key)!;
      const cur = row.get(hr) ?? { wins: 0, total: 0, profit: 0 };
      cur.total += 1;
      cur.profit += Number(t.profit ?? 0);
      if (t.win) cur.wins += 1;
      row.set(hr, cur);
    }
    let max = 1;
    for (const row of grid.values()) for (const c of row.values()) max = Math.max(max, Math.abs(c.profit));
    return { heatmap: grid, pairs: [...grid.keys()].sort(), hourMax: max };
  }, [trades]);

  // Regime performance
  const regimeData = useMemo(() => {
    const m = new Map<string, { wins: number; losses: number; profit: number }>();
    for (const t of trades) {
      const r = t.regime ?? "unknown";
      const cur = m.get(r) ?? { wins: 0, losses: 0, profit: 0 };
      if (t.win) cur.wins += 1; else cur.losses += 1;
      cur.profit += Number(t.profit ?? 0);
      m.set(r, cur);
    }
    return [...m.entries()].map(([regime, v]) => ({
      regime,
      winRate: v.wins + v.losses ? Math.round((v.wins / (v.wins + v.losses)) * 100) : 0,
      profit: Math.round(v.profit * 100) / 100,
    }));
  }, [trades]);

  // Strength vs outcome
  const strengthData = useMemo(() => {
    const m = new Map<number, { count: number; profit: number; wins: number }>();
    for (const t of trades) {
      const s = t.signal_strength ?? 0;
      if (!s) continue;
      const cur = m.get(s) ?? { count: 0, profit: 0, wins: 0 };
      cur.count += 1; cur.profit += Number(t.profit ?? 0); if (t.win) cur.wins += 1;
      m.set(s, cur);
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([s, v]) => ({
      strength: `${s}/6`,
      avgProfit: v.count ? Math.round((v.profit / v.count) * 100) / 100 : 0,
      winRate: v.count ? Math.round((v.wins / v.count) * 100) / 100 * 100 : 0,
    }));
  }, [trades]);

  // Pair leaderboard
  const pairStats = useMemo(() => {
    const m = new Map<string, { trades: number; wins: number; pips: number; profit: number; best: number; worst: number }>();
    for (const t of trades) {
      const cur = m.get(t.symbol) ?? { trades: 0, wins: 0, pips: 0, profit: 0, best: -Infinity, worst: Infinity };
      cur.trades += 1; if (t.win) cur.wins += 1;
      cur.pips += Number(t.pips ?? 0); cur.profit += Number(t.profit ?? 0);
      cur.best = Math.max(cur.best, Number(t.profit ?? 0));
      cur.worst = Math.min(cur.worst, Number(t.profit ?? 0));
      m.set(t.symbol, cur);
    }
    return [...m.entries()].map(([symbol, v]) => ({ symbol, ...v, winRate: v.trades ? Math.round((v.wins / v.trades) * 100) : 0 }))
      .sort((a, b) => b.profit - a.profit);
  }, [trades]);

  // Rolling Sharpe (7d) — daily returns
  const rolling = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const t of trades) {
      const d = t.closed_at.slice(0, 10);
      byDay.set(d, (byDay.get(d) ?? 0) + Number(t.profit ?? 0));
    }
    const days = [...byDay.entries()].sort();
    let cum = 0; const equity: { date: string; equity: number; ret: number }[] = [];
    for (const [d, p] of days) { cum += p; equity.push({ date: d, equity: cum, ret: p }); }
    const sharpe: { date: string; sharpe: number }[] = [];
    for (let i = 6; i < equity.length; i++) {
      const window = equity.slice(i - 6, i + 1).map((x) => x.ret);
      const mean = window.reduce((s, v) => s + v, 0) / window.length;
      const variance = window.reduce((s, v) => s + (v - mean) ** 2, 0) / window.length;
      const sd = Math.sqrt(variance) || 1;
      sharpe.push({ date: equity[i].date.slice(5), sharpe: Math.round((mean / sd) * 100) / 100 });
    }
    return { equity: equity.map((e) => ({ date: e.date.slice(5), equity: Math.round(e.equity * 100) / 100 })), sharpe };
  }, [trades]);

  if (trades.length === 0) {
    return <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center text-sm text-muted-foreground">No trade data yet.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Heatmap */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Time-of-Day Profitability (UTC)</h3>
        <div className="overflow-x-auto">
          <table className="text-[10px]">
            <thead>
              <tr>
                <th className="w-16 p-1 text-left text-muted-foreground">Pair</th>
                {Array.from({ length: 24 }).map((_, h) => <th key={h} className="w-7 p-1 font-mono text-muted-foreground">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {pairs.map((p) => (
                <tr key={p}>
                  <td className="p-1 pr-2 font-mono text-xs font-bold">{p}</td>
                  {Array.from({ length: 24 }).map((_, h) => {
                    const cell = heatmap.get(p)?.get(h);
                    const intensity = cell ? Math.min(1, Math.abs(cell.profit) / hourMax) : 0;
                    const positive = cell && cell.profit >= 0;
                    const bg = !cell ? "transparent"
                      : positive ? `hsl(var(--profit) / ${0.15 + intensity * 0.7})`
                      : `hsl(var(--loss) / ${0.15 + intensity * 0.7})`;
                    return (
                      <td key={h} className="p-0.5">
                        <div className="h-6 w-6 rounded" style={{ background: bg }} title={cell ? `${p} @${h}h: ${cell.wins}/${cell.total} • ${fmtMoney(cell.profit)}` : undefined} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regime + Strength side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Regime Performance</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={regimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="regime" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Bar dataKey="winRate" fill="hsl(var(--primary))" name="Win %" />
              <Bar dataKey="profit" fill="hsl(var(--profit))" name="P/L" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Signal Strength → Outcome</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={strengthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="strength" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Bar dataKey="avgProfit" fill="hsl(var(--primary))" name="Avg P/L" />
              <Bar dataKey="winRate" fill="hsl(var(--info))" name="Win %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rolling Sharpe + Equity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Equity Curve</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={rolling.equity}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Line type="monotone" dataKey="equity" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">7-Day Rolling Sharpe</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={rolling.sharpe}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Line type="monotone" dataKey="sharpe" stroke="hsl(var(--info))" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pair leaderboard */}
      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pair Performance</h3>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {pairStats.map((p, i) => (
            <div key={p.symbol} className="rounded-lg border border-border bg-surface-2 p-3">
              <div className="flex items-center justify-between">
                <div className="font-mono font-bold">{p.symbol}</div>
                <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[10px] text-muted-foreground">#{i + 1}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
                <div><span className="text-muted-foreground">Trades</span> <span className="font-mono">{p.trades}</span></div>
                <div><span className="text-muted-foreground">Win%</span> <span className="font-mono">{p.winRate}</span></div>
                <div><span className="text-muted-foreground">Pips</span> <span className={cn("font-mono", pnlColor(p.pips))}>{fmtNum(p.pips, 1)}</span></div>
                <div><span className="text-muted-foreground">P/L</span> <span className={cn("font-mono", pnlColor(p.profit))}>{fmtMoney(p.profit)}</span></div>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
                <div>Best <span className="font-mono text-profit">{fmtMoney(p.best === -Infinity ? 0 : p.best)}</span></div>
                <div>Worst <span className="font-mono text-loss">{fmtMoney(p.worst === Infinity ? 0 : p.worst)}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
