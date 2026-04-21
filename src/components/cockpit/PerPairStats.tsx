import { useMemo } from "react";
import { useTrades } from "@/lib/cockpit-data";
import { fmtMoney, pnlColor, fmtPips } from "@/lib/format";

export const PerPairStats = () => {
  const trades = useTrades(1000);

  const rows = useMemo(() => {
    const map = new Map<string, { count: number; wins: number; profit: number; pips: number }>();
    for (const t of trades ?? []) {
      const r = map.get(t.symbol) ?? { count: 0, wins: 0, profit: 0, pips: 0 };
      r.count++; r.wins += t.win ? 1 : 0; r.profit += Number(t.profit); r.pips += Number(t.pips);
      map.set(t.symbol, r);
    }
    return [...map.entries()].map(([symbol, r]) => ({
      symbol, ...r, winRate: r.count ? (r.wins / r.count) * 100 : 0,
    })).sort((a, b) => b.profit - a.profit);
  }, [trades]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Per-Pair Performance</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">Pair</th>
              <th className="px-4 py-3 text-right">Trades</th>
              <th className="px-4 py-3 text-right">Win %</th>
              <th className="px-4 py-3 text-right">Pips</th>
              <th className="px-4 py-3 text-right">Profit</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No data yet</td></tr>}
            {rows.map((r) => (
              <tr key={r.symbol} className="border-b border-border/40 hover:bg-surface-2">
                <td className="px-4 py-3 font-mono font-semibold">{r.symbol}</td>
                <td className="px-4 py-3 text-right font-mono">{r.count}</td>
                <td className="px-4 py-3 text-right font-mono">{r.winRate.toFixed(0)}%</td>
                <td className={`px-4 py-3 text-right font-mono ${pnlColor(r.pips)}`}>{fmtPips(r.pips)}</td>
                <td className={`px-4 py-3 text-right font-mono font-semibold ${pnlColor(r.profit)}`}>{r.profit >= 0 ? "+" : ""}{fmtMoney(r.profit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
