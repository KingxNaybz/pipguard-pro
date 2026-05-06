import { useMemo, useState } from "react";
import { useForecasts, sendCommand } from "@/lib/cockpit-data";
import { fmtAgo, fmtNum } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Share2, Send, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_ORDER: Record<string, number> = { READY: 0, BUILDING: 1, WATCHING: 2 };

const cleanStatus = (s: string) => s.replace(/[🟢🟡⚪\s]/g, "").toUpperCase() || "WATCHING";

const statusStyle = (s: string) => {
  const k = cleanStatus(s);
  if (k === "READY") return { dot: "bg-profit", chip: "bg-profit/15 text-profit border-profit/30", label: "🟢 READY" };
  if (k === "BUILDING") return { dot: "bg-warn", chip: "bg-warn/15 text-warn border-warn/30", label: "🟡 BUILDING" };
  return { dot: "bg-muted-foreground", chip: "bg-surface-3 text-muted-foreground border-border", label: "⚪ WATCHING" };
};

const regimeStyle = (r: string | null) => {
  switch ((r ?? "").toLowerCase()) {
    case "trending_calm": return "bg-info/15 text-info border-info/30";
    case "trending_volatile": return "bg-primary/15 text-primary border-primary/30";
    case "ranging_calm": return "bg-profit/10 text-profit border-profit/30";
    case "choppy_volatile": return "bg-warn/15 text-warn border-warn/30";
    default: return "bg-surface-3 text-muted-foreground border-border";
  }
};

export const ForecastScanner = () => {
  const forecasts = useForecasts();
  const [sending, setSending] = useState(false);

  const sorted = useMemo(() => {
    return [...(forecasts ?? [])].sort((a, b) => {
      const sa = STATUS_ORDER[cleanStatus(a.status)] ?? 9;
      const sb = STATUS_ORDER[cleanStatus(b.status)] ?? 9;
      if (sa !== sb) return sa - sb;
      return (b.net_edge ?? 0) - (a.net_edge ?? 0);
    });
  }, [forecasts]);

  const lastScan = sorted[0]?.scanned_at;

  const formatText = () => {
    const lines = ["📊 PIPGOLD FORECAST", `Updated ${fmtAgo(lastScan)}`, ""];
    for (const f of sorted) {
      const st = cleanStatus(f.status);
      const arrow = f.direction.toUpperCase().startsWith("S") ? "🔻" : "🔺";
      lines.push(`${st === "READY" ? "🟢" : st === "BUILDING" ? "🟡" : "⚪"} ${arrow} ${f.symbol} ${f.direction} · ${f.strength ?? f.net_edge}/6 · edge ${f.net_edge}`);
      if (f.entry_zone) lines.push(`   Entry ${f.entry_zone}  SL ${f.sl ?? "—"}  TP ${f.tp ?? "—"}  RR ${f.rrr ?? "—"}`);
      if (f.regime) lines.push(`   ${f.regime}${f.patterns?.length ? " · " + f.patterns.join(", ") : ""}`);
    }
    lines.push("", "Not financial advice. Algorithmic signals.");
    return lines.join("\n");
  };

  const share = () => {
    navigator.clipboard.writeText(formatText());
    toast.success("Forecast copied to clipboard");
  };

  const sendTelegram = async () => {
    setSending(true);
    try {
      await sendCommand("send_forecast", { text: formatText() });
      toast.success("Telegram broadcast queued");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Forecast Scanner</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Last scan: <span className="font-mono text-foreground">{fmtAgo(lastScan)}</span> · {sorted.length} setups tracked
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={share}><Share2 className="mr-1 h-3 w-3" /> Copy</Button>
          <Button size="sm" className="gradient-gold text-primary-foreground" disabled={sending} onClick={sendTelegram}>
            {sending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Send className="mr-1 h-3 w-3" />}
            Share to Telegram
          </Button>
        </div>
      </div>

      {sorted.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center text-sm text-muted-foreground">
          No forecasts yet. The bot will populate this when it pushes its next scan.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((f) => {
          const st = statusStyle(f.status);
          const isBuy = !f.direction.toUpperCase().startsWith("S");
          const Arrow = isBuy ? ArrowUp : ArrowDown;
          const dirColor = isBuy ? "text-profit" : "text-loss";
          const strengthNum = Number(String(f.strength ?? f.net_edge).split("/")[0]) || 0;
          return (
            <div key={f.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", st.dot)} />
                    <span className="font-mono text-lg font-bold">{f.symbol}</span>
                  </div>
                  <div className={cn("mt-1 flex items-center gap-1 text-sm font-bold", dirColor)}>
                    <Arrow className="h-4 w-4" />
                    {f.direction.toUpperCase()}
                  </div>
                </div>
                <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", st.chip)}>
                  {st.label}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-1">
                  {[1,2,3,4,5,6].map((i) => (
                    <div key={i} className={cn("h-1.5 w-4 rounded-full", i <= strengthNum ? (isBuy ? "bg-profit" : "bg-loss") : "bg-surface-3")} />
                  ))}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  edge <span className="font-mono text-sm font-bold text-foreground">{f.net_edge}</span>
                </div>
              </div>

              {f.regime && (
                <div className="mt-3">
                  <span className={cn("rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider", regimeStyle(f.regime))}>
                    {f.regime}
                  </span>
                </div>
              )}

              <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg border border-border bg-surface-2 p-2 font-mono text-[11px]">
                <div><div className="text-[9px] uppercase text-muted-foreground">Entry</div>{f.entry_zone ?? "—"}</div>
                <div><div className="text-[9px] uppercase text-muted-foreground">SL</div>{f.sl != null ? fmtNum(f.sl, 4) : "—"}</div>
                <div><div className="text-[9px] uppercase text-muted-foreground">TP</div>{f.tp != null ? fmtNum(f.tp, 4) : "—"}</div>
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>R:R <span className="font-mono text-foreground">{f.rrr ?? "—"}</span></span>
                <span>RSI <span className="font-mono text-foreground">{f.rsi != null ? fmtNum(f.rsi, 1) : "—"}</span></span>
              </div>

              {f.patterns?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {f.patterns.map((p) => (
                    <span key={p} className="rounded bg-surface-3 px-1.5 py-0.5 text-[9px] text-muted-foreground">{p}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground">
        Not financial advice. Signals are generated algorithmically. Trade at your own risk.
      </p>
    </div>
  );
};
