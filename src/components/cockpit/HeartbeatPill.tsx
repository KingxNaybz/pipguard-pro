import { fmtAgo } from "@/lib/format";
import { useBotState } from "@/lib/cockpit-data";
import { cn } from "@/lib/utils";

export const HeartbeatPill = () => {
  const state = useBotState();
  const isLive = state?.last_heartbeat && (Date.now() - new Date(state.last_heartbeat).getTime() < 60_000);

  return (
    <div className={cn(
      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
      isLive ? "border-profit/30 bg-profit/10 text-profit" : "border-loss/30 bg-loss/10 text-loss",
    )}>
      <span className={cn("h-2 w-2 rounded-full", isLive ? "bg-profit heartbeat" : "bg-loss")} />
      <span className="font-medium">{isLive ? "LIVE" : "OFFLINE"}</span>
      <span className="text-muted-foreground">· {fmtAgo(state?.last_heartbeat)}</span>
    </div>
  );
};
