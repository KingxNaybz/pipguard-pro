import { useState } from "react";
import { Button } from "@/components/ui/button";
import { sendCommand } from "@/lib/cockpit-data";
import { toast } from "sonner";
import { AlertOctagon, BadgeDollarSign, Pause, Play, Loader2 } from "lucide-react";
import { useBotParams } from "@/lib/cockpit-data";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const ControlBar = () => {
  const params = useBotParams();
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

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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

      <Button
        size="lg" variant="outline"
        className="border-profit/40 bg-profit/10 text-profit hover:bg-profit hover:text-profit-foreground"
        disabled={busy === "close_profit"}
        onClick={() => run("close_profit", "Close Profitable")}
      >
        {busy === "close_profit" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeDollarSign className="mr-2 h-4 w-4" />}
        Close Profit
      </Button>

      {params?.paused ? (
        <Button size="lg" className="gradient-gold text-primary-foreground hover:opacity-90"
          onClick={() => run("resume", "Resume")}>
          <Play className="mr-2 h-4 w-4" /> Resume Bot
        </Button>
      ) : (
        <Button size="lg" variant="outline" className="border-warn/40 bg-warn/10 text-warn hover:bg-warn hover:text-warn-foreground"
          onClick={() => run("pause", "Pause")}>
          <Pause className="mr-2 h-4 w-4" /> Pause Bot
        </Button>
      )}

      <Button size="lg" variant="outline" disabled className="opacity-60">
        Status: {params?.paused ? "PAUSED" : "RUNNING"}
      </Button>
    </div>
  );
};
