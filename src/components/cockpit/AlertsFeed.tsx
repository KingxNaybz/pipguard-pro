import { useAlerts } from "@/lib/cockpit-data";
import { fmtAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

const ICON: Record<string, any> = {
  error: AlertCircle,
  warn: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};
const COLOR: Record<string, string> = {
  error: "text-loss",
  warn: "text-warn",
  success: "text-profit",
  info: "text-info",
};

export const AlertsFeed = () => {
  const alerts = useAlerts(50);

  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Live Feed</h2>
      </div>
      <div className="max-h-[480px] overflow-auto">
        {(alerts ?? []).length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No alerts yet</div>}
        {(alerts ?? []).map((a) => {
          const Icon = ICON[a.level] ?? Info;
          return (
            <div key={a.id} className="flex items-start gap-3 border-b border-border/40 px-4 py-3 hover:bg-surface-2">
              <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", COLOR[a.level])} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{a.type}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{fmtAgo(a.created_at)}</span>
                </div>
                <p className="mt-1 text-sm">{a.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
