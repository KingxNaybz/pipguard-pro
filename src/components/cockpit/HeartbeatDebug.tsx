import { useEffect, useState } from "react";
import { Activity, RefreshCw, Copy, AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBotState, useAlerts } from "@/lib/cockpit-data";
import { fmtAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";

const SYNC_ALERT_TYPES = ["sync", "heartbeat", "connection", "network", "error"];

export const HeartbeatDebug = () => {
  const state = useBotState();
  const alerts = useAlerts(50);
  const [now, setNow] = useState(() => Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const { session } = useSession();

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleRefresh = async () => {
    if (!session) {
      toast.error("Not signed in");
      return;
    }
    setRefreshing(true);
    try {
      const [{ data: stateRow, error: stateErr }, { data: alertRows, error: alertErr }] = await Promise.all([
        supabase.from("bot_state").select("*").eq("user_id", session.user.id).maybeSingle(),
        supabase.from("alerts").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(1),
      ]);
      if (stateErr) throw stateErr;
      if (alertErr) throw alertErr;
      setNow(Date.now());
      const hb = (stateRow as any)?.last_heartbeat;
      const ageMs = hb ? Date.now() - new Date(hb).getTime() : Infinity;
      if (!hb) {
        toast.message("No heartbeat yet", { description: "The bot has never reached the cloud." });
      } else if (ageMs < 60_000) {
        toast.success(`Live · last heartbeat ${fmtAgo(hb)}`);
      } else {
        toast.warning(`Offline · last heartbeat ${fmtAgo(hb)}`);
      }
      void alertRows;
    } catch (e: any) {
      toast.error(e?.message ?? "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  const lastHb = state?.last_heartbeat ? new Date(state.last_heartbeat).getTime() : 0;
  const ageMs = lastHb ? now - lastHb : Infinity;
  const live = ageMs < 60_000;
  const stale = !live && ageMs < 5 * 60_000;

  const syncAlerts = (alerts ?? [])
    .filter((a) => {
      const t = (a.type || "").toLowerCase();
      const lvl = (a.level || "").toLowerCase();
      return SYNC_ALERT_TYPES.some((k) => t.includes(k)) || lvl === "error" || lvl === "warn";
    })
    .slice(0, 8);

  const payload = state ? JSON.stringify(state, null, 2) : "// no bot_state row received yet";

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Heartbeat Debug
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Live view of what the cloud last received from your VPS bot.
            </p>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="mr-1 h-3 w-3" />
          )}
          Refresh
        </Button>
      </div>

      {/* Heartbeat status */}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div
          className={cn(
            "rounded-lg border p-3",
            live
              ? "border-profit/30 bg-profit/5"
              : stale
              ? "border-warn/30 bg-warn/5"
              : "border-loss/30 bg-loss/5",
          )}
        >
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            {live ? (
              <CheckCircle2 className="h-3 w-3 text-profit" />
            ) : (
              <AlertTriangle className={cn("h-3 w-3", stale ? "text-warn" : "text-loss")} />
            )}
            Last heartbeat
          </div>
          <div className={cn("mt-1 font-mono text-sm", live ? "text-profit" : stale ? "text-warn" : "text-loss")}>
            {fmtAgo(state?.last_heartbeat)}
          </div>
          <div className="mt-1 break-all font-mono text-[10px] text-muted-foreground">
            {state?.last_heartbeat ?? "—"}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface-2 p-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Clock className="h-3 w-3" /> Last DB write
          </div>
          <div className="mt-1 font-mono text-sm">{fmtAgo(state?.updated_at)}</div>
          <div className="mt-1 break-all font-mono text-[10px] text-muted-foreground">
            {state?.updated_at ?? "—"}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface-2 p-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Bot version</div>
          <div className="mt-1 font-mono text-sm">{state?.bot_version ? `v${state.bot_version}` : "—"}</div>
          <div className="mt-1 font-mono text-[10px] text-muted-foreground">
            scans: {state?.scan_count ?? 0}
          </div>
        </div>
      </div>

      {/* Last response payload */}
      <div className="mt-4 rounded-lg border border-border bg-surface-2 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Last bot_state payload (cloud-side)
          </span>
          <Button size="sm" variant="ghost" onClick={() => copy(payload)}>
            <Copy className="mr-1 h-3 w-3" /> Copy
          </Button>
        </div>
        <pre className="max-h-60 overflow-auto whitespace-pre font-mono text-[11px] leading-relaxed">
          {payload}
        </pre>
      </div>

      {/* Sync error / warning alerts */}
      <div className="mt-4">
        <div className="mb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Recent sync errors & warnings
        </div>
        {syncAlerts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
            No sync errors or warnings received from the bot.
          </div>
        ) : (
          <ul className="space-y-2">
            {syncAlerts.map((a) => (
              <li
                key={a.id}
                className={cn(
                  "rounded-lg border p-2 text-xs",
                  a.level === "error"
                    ? "border-loss/30 bg-loss/5"
                    : a.level === "warn"
                    ? "border-warn/30 bg-warn/5"
                    : "border-border bg-surface-2",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium uppercase tracking-wider text-[10px] text-muted-foreground">
                    {a.type} · {a.level}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {fmtAgo(a.created_at)}
                  </span>
                </div>
                <div className="mt-1 font-mono text-[11px]">{a.message}</div>
                {a.meta && Object.keys(a.meta).length > 0 && (
                  <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap font-mono text-[10px] text-muted-foreground">
                    {JSON.stringify(a.meta, null, 2)}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">
        Note: timestamps reflect what the cloud received. If "Last heartbeat" never updates, the bot
        process is not reaching the <code className="font-mono">/bot-sync</code> endpoint — check the
        bot terminal for HTTP errors.
      </p>
    </div>
  );
};
