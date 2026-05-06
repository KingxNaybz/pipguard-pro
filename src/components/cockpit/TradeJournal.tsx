import { useMemo, useState } from "react";
import { useTrades } from "@/lib/cockpit-data";
import { fmtMoney, fmtNum, pnlColor, fmtPips, fmtTime } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

export const TradeJournal = () => {
  const trades = useTrades(2000);
  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState<"" | "buy" | "sell">("");
  const [outcome, setOutcome] = useState<"" | "win" | "loss">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    return (trades ?? []).filter((t) => {
      if (symbol && !t.symbol.toLowerCase().includes(symbol.toLowerCase())) return false;
      if (side && t.side !== side) return false;
      if (outcome === "win" && !t.win) return false;
      if (outcome === "loss" && t.win) return false;
      if (from && t.closed_at < from) return false;
      if (to && t.closed_at > to + "T23:59:59") return false;
      return true;
    });
  }, [trades, symbol, side, outcome, from, to]);

  // Analytics
  const stats = useMemo(() => {
    const total = filtered.length;
    const wins = filtered.filter((t) => t.win).length;
    const losses = total - wins;
    const winPips = filtered.filter((t) => t.win).reduce((s, t) => s + Number(t.pips ?? 0), 0);
    const lossPips = filtered.filter((t) => !t.win).reduce((s, t) => s + Number(t.pips ?? 0), 0);
    const grossWin = filtered.filter((t) => t.profit > 0).reduce((s, t) => s + Number(t.profit), 0);
    const grossLoss = Math.abs(filtered.filter((t) => t.profit < 0).reduce((s, t) => s + Number(t.profit), 0));
    const pf = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;
    const totalProfit = filtered.reduce((s, t) => s + Number(t.profit ?? 0), 0);

    const byPair = new Map<string, number>();
    for (const t of filtered) byPair.set(t.symbol, (byPair.get(t.symbol) ?? 0) + Number(t.profit ?? 0));
    const sortedPairs = [...byPair.entries()].sort((a, b) => b[1] - a[1]);

    const byRegime = new Map<string, { wins: number; total: number }>();
    for (const t of filtered) {
      const r = t.regime ?? "unknown";
      const cur = byRegime.get(r) ?? { wins: 0, total: 0 };
      cur.total += 1; if (t.win) cur.wins += 1;
      byRegime.set(r, cur);
    }

    const byStrength = new Map<number, { wins: number; total: number }>();
    for (const t of filtered) {
      const s = t.signal_strength ?? 0;
      if (!s) continue;
      const cur = byStrength.get(s) ?? { wins: 0, total: 0 };
      cur.total += 1; if (t.win) cur.wins += 1;
      byStrength.set(s, cur);
    }

    return {
      total, wins, losses,
      winRate: total ? (wins / total) * 100 : 0,
      pf, totalProfit,
      avgWin: wins ? winPips / wins : 0,
      avgLoss: losses ? lossPips / losses : 0,
      best: sortedPairs[0],
      worst: sortedPairs[sortedPairs.length - 1],
      byRegime: [...byRegime.entries()].map(([r, v]) => ({ regime: r, winRate: v.total ? Math.round((v.wins / v.total) * 100) : 0, total: v.total })),
      byStrength: [...byStrength.entries()].sort((a, b) => a[0] - b[0]).map(([s, v]) => ({ strength: s, winRate: v.total ? Math.round((v.wins / v.total) * 100) : 0, total: v.total })),
    };
  }, [filtered]);

  const equityCurve = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => a.closed_at.localeCompare(b.closed_at));
    let cum = 0;
    return sorted.map((t) => {
      cum += Number(t.profit ?? 0);
      return { t: t.closed_at.slice(5, 10), eq: Math.round(cum * 100) / 100 };
    });
  }, [filtered]);

  const exportCsv = () => {
    const header = ["closed_at","symbol","side","lots","entry","exit","pips","profit","win","signal_strength","regime","close_reason"];
    const rows = filtered.map((t) => [t.closed_at, t.symbol, t.side, t.lots, t.entry, t.exit, t.pips, t.profit, t.win, t.signal_strength ?? "", t.regime ?? "", t.close_reason ?? ""]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `pipgold-trades-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <div className="rounded-lg border border-border bg-card p-3"><div className="text-[10px] uppercase text-muted-foreground">Trades</div><div className="font-mono text-lg font-bold">{stats.total}</div></div>
        <div className="rounded-lg border border-border bg-card p-3"><div className="text-[10px] uppercase text-muted-foreground">Win Rate</div><div className="font-mono text-lg font-bold">{stats.winRate.toFixed(1)}%</div></div>
        <div className="rounded-lg border border-border bg-card p-3"><div className="text-[10px] uppercase text-muted-foreground">Profit Factor</div><div className="font-mono text-lg font-bold">{Number.isFinite(stats.pf) ? stats.pf.toFixed(2) : "∞"}</div></div>
        <div className="rounded-lg border border-border bg-card p-3"><div className="text-[10px] uppercase text-muted-foreground">Total P/L</div><div className={cn("font-mono text-lg font-bold", pnlColor(stats.totalProfit))}>{fmtMoney(stats.totalProfit)}</div></div>
        <div className="rounded-lg border border-border bg-card p-3"><div className="text-[10px] uppercase text-muted-foreground">Avg Win / Loss</div><div className="font-mono text-sm"><span className="text-profit">+{stats.avgWin.toFixed(1)}</span> / <span className="text-loss">{stats.avgLoss.toFixed(1)}</span></div></div>
        <div className="rounded-lg border border-border bg-card p-3"><div className="text-[10px] uppercase text-muted-foreground">Best / Worst</div><div className="font-mono text-xs"><span className="text-profit">{stats.best?.[0] ?? "—"}</span> / <span className="text-loss">{stats.worst?.[0] ?? "—"}</span></div></div>
      </div>

      {/* Breakdown + equity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <h4 className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Win Rate by Regime</h4>
          {stats.byRegime.length === 0 ? <div className="text-xs text-muted-foreground">No data</div> : stats.byRegime.map((r) => (
            <div key={r.regime} className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{r.regime}</span>
              <span className="font-mono">{r.winRate}% <span className="text-muted-foreground">({r.total})</span></span>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <h4 className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Win Rate by Strength</h4>
          {stats.byStrength.length === 0 ? <div className="text-xs text-muted-foreground">No data</div> : stats.byStrength.map((r) => (
            <div key={r.strength} className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Strength {r.strength}/6</span>
              <span className="font-mono">{r.winRate}% <span className="text-muted-foreground">({r.total})</span></span>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <h4 className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Equity Curve</h4>
          {equityCurve.length === 0 ? <div className="text-xs text-muted-foreground">No data</div> : (
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={equityCurve}>
                <XAxis dataKey="t" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
                <Line type="monotone" dataKey="eq" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Trade Journal</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 w-36" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 w-36" />
            <Input placeholder="Symbol…" value={symbol} onChange={(e) => setSymbol(e.target.value)} className="h-8 w-28" />
            <select value={side} onChange={(e) => setSide(e.target.value as any)} className="h-8 rounded-md border border-input bg-background px-2 text-sm">
              <option value="">Sides</option><option value="buy">Buy</option><option value="sell">Sell</option>
            </select>
            <select value={outcome} onChange={(e) => setOutcome(e.target.value as any)} className="h-8 rounded-md border border-input bg-background px-2 text-sm">
              <option value="">All</option><option value="win">Wins</option><option value="loss">Losses</option>
            </select>
            <Button size="sm" variant="outline" onClick={exportCsv}><Download className="mr-1 h-3 w-3" /> CSV</Button>
          </div>
        </div>
        <div className="max-h-[480px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2">Closed</th>
                <th className="px-3 py-2">Symbol</th>
                <th className="px-3 py-2">Side</th>
                <th className="px-3 py-2 text-right">Lots</th>
                <th className="px-3 py-2 text-right">Entry → Exit</th>
                <th className="px-3 py-2 text-right">Pips</th>
                <th className="px-3 py-2 text-right">P/L</th>
                <th className="px-3 py-2 text-center">Strength</th>
                <th className="px-3 py-2">Regime</th>
                <th className="px-3 py-2">Close Reason</th>
                <th className="px-3 py-2 text-center">W/L</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">No trades match</td></tr>}
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-border/40 hover:bg-surface-2">
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{fmtTime(t.closed_at)}</td>
                  <td className="px-3 py-2 font-mono font-semibold">{t.symbol}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${t.side === "buy" ? "bg-profit/15 text-profit" : "bg-loss/15 text-loss"}`}>{t.side}</span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{fmtNum(t.lots, 2)}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs">{fmtNum(t.entry, 5)} → {fmtNum(t.exit, 5)}</td>
                  <td className={`px-3 py-2 text-right font-mono ${pnlColor(t.pips)}`}>{fmtPips(t.pips)}</td>
                  <td className={`px-3 py-2 text-right font-mono font-semibold ${pnlColor(t.profit)}`}>{t.profit >= 0 ? "+" : ""}{fmtMoney(t.profit)}</td>
                  <td className="px-3 py-2 text-center font-mono text-xs">{t.signal_strength ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{t.regime ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{t.close_reason ?? "—"}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${t.win ? "bg-profit/15 text-profit" : "bg-loss/15 text-loss"}`}>{t.win ? "WIN" : "LOSS"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
