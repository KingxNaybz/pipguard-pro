import { usePositions, sendCommand } from "@/lib/cockpit-data";
import { fmtMoney, fmtNum, pnlColor, fmtAgo } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";

export const PositionsTable = () => {
  const positions = usePositions();

  const close = async (ticket: number, symbol: string) => {
    try {
      await sendCommand("close_one", { ticket });
      toast.success(`Close ${symbol} #${ticket} queued`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const total = (positions ?? []).reduce((s, p) => s + Number(p.profit), 0);

  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Open Positions</h2>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">{positions?.length ?? 0} open</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Floating P/L</div>
          <div className={`font-mono text-xl font-semibold ${pnlColor(total)}`}>
            {total >= 0 ? "+" : ""}{fmtMoney(total)}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">Symbol</th>
              <th className="px-4 py-3">Side</th>
              <th className="px-4 py-3 text-right">Lots</th>
              <th className="px-4 py-3 text-right">Entry</th>
              <th className="px-4 py-3 text-right">Current</th>
              <th className="px-4 py-3 text-right">SL / TP</th>
              <th className="px-4 py-3 text-right">P/L</th>
              <th className="px-4 py-3 text-right">Age</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(positions ?? []).length === 0 && (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">No open positions</td></tr>
            )}
            {(positions ?? []).map((p) => (
              <tr key={p.id} className="border-b border-border/40 hover:bg-surface-2">
                <td className="px-4 py-3 font-mono font-semibold">{p.symbol}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${p.side === "buy" ? "bg-profit/15 text-profit" : "bg-loss/15 text-loss"}`}>
                    {p.side}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono">{fmtNum(p.lots, 2)}</td>
                <td className="px-4 py-3 text-right font-mono text-muted-foreground">{fmtNum(p.entry, 5)}</td>
                <td className="px-4 py-3 text-right font-mono">{p.current_price ? fmtNum(p.current_price, 5) : "—"}</td>
                <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                  {p.sl ? fmtNum(p.sl, 5) : "—"} / {p.tp ? fmtNum(p.tp, 5) : "—"}
                </td>
                <td className={`px-4 py-3 text-right font-mono font-semibold ${pnlColor(p.profit)}`}>
                  {p.profit >= 0 ? "+" : ""}{fmtMoney(p.profit)}
                </td>
                <td className="px-4 py-3 text-right text-xs text-muted-foreground">{fmtAgo(p.opened_at)}</td>
                <td className="px-4 py-3 text-right">
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-loss" onClick={() => close(p.ticket, p.symbol)}>
                    <X className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
