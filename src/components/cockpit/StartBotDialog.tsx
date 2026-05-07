import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Rocket, Copy, Check, AlertTriangle, Play } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const commands = [
  {
    label: "Paper Trading",
    desc: "Safe testing — no real trades",
    command: "python pipgold_ultra_v3.py --dry-run",
    accent: "info" as const,
  },
  {
    label: "Live Trading",
    desc: "Real money — make sure you're ready",
    command: "python pipgold_ultra_v3.py",
    accent: "warn" as const,
    warning: true,
  },
  {
    label: "CLI Mode",
    desc: "Interactive terminal commands",
    command: "python pipgold_ultra_v3.py --cli",
    accent: "primary" as const,
  },
];

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleCopy}
      className={cn(
        "shrink-0 transition-all duration-300",
        copied && "text-profit neon-text-profit"
      )}
    >
      {copied ? (
        <Check className="mr-1 h-3.5 w-3.5" />
      ) : (
        <Copy className="mr-1 h-3.5 w-3.5" />
      )}
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
};

export const StartBotDialog = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="neon-border hover:shadow-glow transition-shadow duration-300"
        >
          <Rocket className="mr-2 h-4 w-4" />
          Start Bot
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono tracking-wider">
            <Rocket className="h-5 w-5 neon-text-primary" />
            START PIPGOLD BOT
          </DialogTitle>
          <DialogDescription>
            Open a terminal in your bot folder and run one of these commands.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {commands.map((cmd) => (
            <div
              key={cmd.command}
              className={cn(
                "rounded-lg border p-3 transition-all duration-200",
                "bg-surface-2/50 border-border hover:border-primary/30 hover:shadow-glow/20"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {cmd.warning ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-warn" />
                  ) : (
                    <Play className="h-3.5 w-3.5 text-primary" />
                  )}
                  <span className={cn(
                    "text-sm font-semibold",
                    cmd.warning ? "text-warn" : "text-foreground"
                  )}>
                    {cmd.label}
                  </span>
                </div>
                <CopyButton text={cmd.command} />
              </div>
              <p className="text-[10px] text-muted-foreground mb-2">{cmd.desc}</p>
              <div className="rounded-md bg-background/60 border border-border/50 px-3 py-2">
                <code className="font-mono text-xs neon-text-primary">
                  {cmd.command}
                </code>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 rounded-lg border border-border/50 bg-surface-1/50 p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
            Before you start
          </p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="neon-text-primary mt-0.5">▸</span>
              Make sure MT5 is open and logged into Coinexx-Live
            </li>
            <li className="flex items-start gap-2">
              <span className="neon-text-primary mt-0.5">▸</span>
              Terminal must be in the same folder as <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[10px]">pipgold_ultra_v3.py</code>
            </li>
            <li className="flex items-start gap-2">
              <span className="neon-text-primary mt-0.5">▸</span>
              The cockpit will show <span className="text-profit font-medium">ONLINE</span> once the first heartbeat arrives
            </li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};
