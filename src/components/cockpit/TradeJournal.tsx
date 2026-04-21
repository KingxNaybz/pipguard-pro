import { useMemo, useState } from "react";
import { useTrades } from "@/lib/cockpit-data";
import { fmtMoney, fmtNum, pnlColor, fmtPips, fmtTime } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export const TradeJournal = () => {
  const trades = useTrades(1000);
  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState<"" | "buy" | "sell">("");
  const [outcome, setOutcome] = useState<"" | "win" | "loss">("");

  const filtered = useMemo(() => {
    return (trades ?? []).filter((t) => {
      if (symbol && !t.symbol.toLowerCase().includes(symbol.toLowerCase())) return false;
      if (side && t.side !== side) return false;
      if (outcome === "win" && !t.win) return false;
      if (outcome === "loss" && t.win) return false;
      return true;
    });
  }, [trades, symbol, side, outcome]);

  const exportCsv = () => {
    const header = ["closed_at","symbol","side","lots","entry","exit","pips","profit","win","signal_strength"];
    const rows = filtered.map((t) => [t.closed_at, t.symbol, t.side, t.lots, t.entry, t.exit, t.pips, t.profit, t.win, t.signal_strength ?? ""]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `pipgold-trades-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Trade Journal</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Input placeholder="Symbol filter…" value={symbol} onChange={(e) => setSymbol(e.target.value)} className="h-8 w-32" />
          <select value={side} onChange={(e) => setSide(e.target.value as any)} className="h-8 rounded-md border border-input bg-background px-2 text-sm">
            <option value="">All sides</option><option value="buy">Buy</option><option value="sell">Sell</option>
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
              <th className="px-4 py-2">Closed</th>
              <th className="px-4 py-2">Symbol</th>
              <th className="px-4 py-2">Side</th>
              <th className="px-4 py-2 text-right">Lots</th>
              <th className="px-4 py-2 text-right">Entry → Exit</th>
              <th className="px-4 py-2 text-right">Pips</th>
              <th className="px-4 py-2 text-right">P/L</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No trades match</td></tr>}
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-border/40 hover:bg-surface-2">
                <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{fmtTime(t.closed_at)}</td>
                <td className="px-4 py-2 font-mono font-semibold">{t.symbol}</td>
                <td className="px-4 py-2">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${t.side === "buy" ? "bg-profit/15 text-profit" : "bg-loss/15 text-loss"}`}>{t.side}</span>
                </td>
                <td className="px-4 py-2 text-right font-mono">{fmtNum(t.lots, 2)}</td>
                <td className="px-4 py-2 text-right font-mono text-xs">{fmtNum(t.entry, 5)} → {fmtNum(t.exit, 5)}</td>
                <td className={`px-4 py-2 text-right font-mono ${pnlColor(t.pips)}`}>{fmtPips(t.pips)}</td>
                <td className={`px-4 py-2 text-right font-mono font-semibold ${pnlColor(t.profit)}`}>{t.profit >= 0 ? "+" : ""}{fmtMoney(t.profit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
