import { useMemo } from "react";
import { useTrades, useBotState } from "@/lib/cockpit-data";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format } from "date-fns";

export const EquityChart = () => {
  const trades = useTrades(1000);
  const state = useBotState();

  const data = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    const sorted = [...trades].sort((a, b) => new Date(a.closed_at).getTime() - new Date(b.closed_at).getTime());
    const startEquity = (state?.equity ?? 0) - sorted.reduce((s, t) => s + Number(t.profit), 0);
    let running = startEquity;
    return sorted.map((t) => {
      running += Number(t.profit);
      return {
        time: format(new Date(t.closed_at), "MMM d HH:mm"),
        equity: Number(running.toFixed(2)),
        pnl: Number(t.profit),
      };
    });
  }, [trades, state?.equity]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Equity Curve</h2>
        <span className="font-mono text-xs text-muted-foreground">{data.length} closed trades</span>
      </div>
      <div className="h-64">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No closed trades yet</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={{ stroke: "hsl(var(--border))" }} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={{ stroke: "hsl(var(--border))" }} tickLine={false} width={50} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 12 }}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              />
              <Area type="monotone" dataKey="equity" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#eq)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
