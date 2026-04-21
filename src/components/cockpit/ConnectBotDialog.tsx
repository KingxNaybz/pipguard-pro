import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Terminal, Copy } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth";

const PROJECT_URL = import.meta.env.VITE_SUPABASE_URL as string;

export const ConnectBotDialog = () => {
  const { session } = useSession();
  const [open, setOpen] = useState(false);
  const userId = session?.user.id ?? "<your-user-id>";

  const config = `# === PIPGOLD CLOUD COCKPIT CONFIG ===
WEB_API_URL = "${PROJECT_URL}/functions/v1"
USER_ID     = "${userId}"
BOT_API_KEY = "<paste your BOT_API_KEY here>"`;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Terminal className="mr-2 h-4 w-4" /> Connect bot</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Connect your VPS bot</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Paste these constants at the top of <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">pipgold_coinexx.py</code>.
            The bot will start pushing data to this cockpit within ~3 seconds.
          </p>

          <div className="rounded-lg border border-border bg-surface-2 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Config block</span>
              <Button size="sm" variant="ghost" onClick={() => copy(config)}><Copy className="mr-1 h-3 w-3" /> Copy</Button>
            </div>
            <pre className="overflow-x-auto whitespace-pre font-mono text-xs leading-relaxed">{config}</pre>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground">
            <p><strong className="text-foreground">1.</strong> Download <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono">pipgold_coinexx.py</code> (link will be provided in chat by Lovable).</p>
            <p><strong className="text-foreground">2.</strong> Replace the config block at the top of the file.</p>
            <p><strong className="text-foreground">3.</strong> Run <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono">python pipgold_coinexx.py</code> on your Windows VPS or PC with MT5 open.</p>
            <p><strong className="text-foreground">4.</strong> The LIVE pill at the top right of this cockpit will turn green within seconds.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
