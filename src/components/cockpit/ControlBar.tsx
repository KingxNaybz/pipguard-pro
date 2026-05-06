import { useState } from "react";
import { Button } from "@/components/ui/button";
import { sendCommand, useBotParams, useBotState } from "@/lib/cockpit-data";
import { toast } from "sonner";
import { AlertOctagon, BadgeDollarSign, Pause, Play, Loader2, Beaker, Send } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export const ControlBar = () => {
  const params = useBotParams();
  const state = useBotState();
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (type: any, label: string, payload: any = {}) => {
    setBusy(type);
    try {
      await sendCommand(type, payload);
      toast.success(`${label} queued — bot will execute within 5s`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const dryRun = !!state?.dry_run;

  return (
    <div className="space-y-3">
      {/* Mode banner */}
      <div className={cn(
        "flex items-center justify-between rounded-lg border px-4 py-2 text-sm",
        dryRun ? "border-info/40 bg-info/10" : "border-profit/40 bg-profit/10"
      )}>
        <div className="flex items-center gap-2">
          <Beaker className={cn("h-4 w-4", dryRun ? "text-info" : "text-muted-foreground")} />
          <span className="font-bold uppercase tracking-wider">
            {dryRun ? <span className="text-info">PAPER MODE</span> : <span className="text-profit">LIVE MODE</span>}
          </span>
          <span className="text-xs text-muted-foreground">{dryRun ? "No real orders are being placed" : "Bot is trading with real money"}</span>
        </div>
        <Button size="sm" variant="outline" disabled={busy === "set_dry_run"} onClick={() => run("set_dry_run", dryRun ? "Switch to LIVE" : "Switch to PAPER", { dry_run: !dryRun })}>
          {busy === "set_dry_run" && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
          Switch to {dryRun ? "LIVE" : "PAPER"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="lg" variant="outline" className="border-loss/40 bg-loss/10 text-loss hover:bg-loss hover:text-loss-foreground">
              <AlertOctagon className="mr-2 h-4 w-4" /> Close All
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Close every open position?</AlertDialogTitle>
              <AlertDialogDescription>
                This sends a close-all command to your bot. All open MT5 positions will be flattened immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => run("close_all", "Close All")} className="bg-loss text-loss-foreground hover:bg-loss/90">
                Close everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button size="lg" variant="outline"
          className="border-profit/40 bg-profit/10 text-profit hover:bg-profit hover:text-profit-foreground"
          disabled={busy === "close_profit"} onClick={() => run("close_profit", "Close Profitable")}>
          {busy === "close_profit" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeDollarSign className="mr-2 h-4 w-4" />}
          Close Profit
        </Button>

        {params?.paused ? (
          <Button size="lg" className="gradient-gold text-primary-foreground hover:opacity-90" onClick={() => run("resume", "Resume")}>
            <Play className="mr-2 h-4 w-4" /> Resume
          </Button>
        ) : (
          <Button size="lg" variant="outline" className="border-warn/40 bg-warn/10 text-warn hover:bg-warn hover:text-warn-foreground"
            onClick={() => run("pause", "Pause")}>
            <Pause className="mr-2 h-4 w-4" /> Pause
          </Button>
        )}

        <Button size="lg" variant="outline" disabled={busy === "send_forecast"} onClick={() => run("send_forecast", "Send Forecast")}>
          {busy === "send_forecast" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Send Forecast
        </Button>

        <Button size="lg" variant="outline" disabled className="opacity-60">
          {params?.paused ? "PAUSED" : "RUNNING"}
        </Button>
      </div>
    </div>
  );
};
