import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useBotState } from "@/lib/cockpit-data";
import { fmtAgo } from "@/lib/format";
import { Activity, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const TestConnection = () => {
  const state = useBotState();
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const run = async () => {
    setChecking(true);
    setResult(null);
    // Wait a beat so user sees feedback, then evaluate freshness
    await new Promise((r) => setTimeout(r, 400));
    const hb = state?.last_heartbeat ? new Date(state.last_heartbeat).getTime() : 0;
    const ageMs = hb ? Date.now() - hb : Infinity;
    if (!hb) {
      setResult({ ok: false, msg: "No heartbeat ever received. Bot has not synced yet." });
    } else if (ageMs < 60_000) {
      setResult({ ok: true, msg: `Bot is reachable. Last push ${fmtAgo(state!.last_heartbeat)}.` });
    } else if (ageMs < 5 * 60_000) {
      setResult({ ok: false, msg: `Stale: last push ${fmtAgo(state!.last_heartbeat)}. Bot may be slow.` });
    } else {
      setResult({ ok: false, msg: `Offline: no push in ${fmtAgo(state!.last_heartbeat)}.` });
    }
    setChecking(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">VPS Connection</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Last heartbeat: <span className="font-mono">{fmtAgo(state?.last_heartbeat)}</span>
            {state?.bot_version && <> · v{state.bot_version}</>}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={run} disabled={checking}>
          {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
          Test connection
        </Button>
      </div>
      {result && (
        <div className={cn(
          "mt-4 flex items-start gap-2 rounded-lg border p-3 text-sm",
          result.ok ? "border-profit/30 bg-profit/5 text-profit" : "border-loss/30 bg-loss/5 text-loss",
        )}>
          {result.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{result.msg}</span>
        </div>
      )}
    </div>
  );
};
