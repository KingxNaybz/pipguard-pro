import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Terminal, Copy, CheckCircle2, Radio, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth";
import { useBotState } from "@/lib/cockpit-data";
import { fmtAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const PROJECT_URL = import.meta.env.VITE_SUPABASE_URL as string;
const BOT_SYNC_URL = `${PROJECT_URL}/functions/v1/bot-sync`;

export const ConnectBotDialog = () => {
  const { session } = useSession();
  const state = useBotState();
  const [open, setOpen] = useState(false);
  const userId = session?.user.id ?? "<your-user-id>";

  const config = `# === PIPGOLD CLOUD COCKPIT CONFIG ===
WEB_API_URL = "${BOT_SYNC_URL}"
USER_ID     = "${userId}"
BOT_API_KEY = "<paste your BOT_API_KEY here>"`;

  const heartbeatState = useMemo(() => {
    const lastHeartbeat = state?.last_heartbeat ?? null;
    const ageMs = lastHeartbeat ? Date.now() - new Date(lastHeartbeat).getTime() : Infinity;

    if (ageMs < 60_000) {
      return {
        icon: CheckCircle2,
        title: "Bot is connected",
        message: `Receiving live pushes from your VPS. Last heartbeat ${fmtAgo(lastHeartbeat)}.`,
        tone: "border-profit/30 bg-profit/10 text-profit",
      };
    }

    if (lastHeartbeat) {
      return {
        icon: AlertTriangle,
        title: "Bot was seen before, but it is not live now",
        message: `Last heartbeat ${fmtAgo(lastHeartbeat)}. Make sure the Python bot is still running on the VPS and MT5 is open.`,
        tone: "border-warn/30 bg-warn/10 text-warn",
      };
    }

    return {
      icon: Radio,
      title: "Waiting for first heartbeat",
        message: "This button only opens the setup instructions. The cockpit will connect after you paste this config into pipgold_coinexx.py and run the bot on your VPS or PC. The URL must end with /bot-sync.",
      tone: "border-border bg-surface-2 text-muted-foreground",
    };
  }, [state?.last_heartbeat]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  const StatusIcon = heartbeatState.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Terminal className="mr-2 h-4 w-4" />
          Connect bot
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Connect your VPS bot</DialogTitle>
          <DialogDescription>
            Paste this config into <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">pipgold_coinexx.py</code>, then run the bot on the machine where MT5 is open.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className={cn("rounded-lg border p-4", heartbeatState.tone)}>
            <div className="flex items-start gap-3">
              <StatusIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <div className="font-medium">{heartbeatState.title}</div>
                <p className="mt-1 text-xs leading-relaxed text-inherit/80">{heartbeatState.message}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface-2 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Config block</span>
              <Button size="sm" variant="ghost" onClick={() => copy(config)}>
                <Copy className="mr-1 h-3 w-3" />
                Copy
              </Button>
            </div>
            <pre className="overflow-x-auto whitespace-pre font-mono text-xs leading-relaxed">{config}</pre>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground">
            <p><strong className="text-foreground">1.</strong> Download <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono">pipgold_coinexx.py</code>.</p>
            <p><strong className="text-foreground">2.</strong> Replace the config block at the top of the file and add your BOT_API_KEY. Make sure <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono">WEB_API_URL</code> ends with <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono">/bot-sync</code>.</p>
            <p><strong className="text-foreground">3.</strong> Run <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono">python pipgold_coinexx.py</code> on your Windows VPS or PC with MT5 open.</p>
            <p><strong className="text-foreground">4.</strong> Leave this dialog open if you want — the status above will update automatically when the first heartbeat arrives.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};