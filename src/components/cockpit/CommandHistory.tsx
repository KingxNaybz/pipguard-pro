import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { fmtAgo, fmtTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { History } from "lucide-react";

type Command = {
  id: string;
  type: string;
  payload: any;
  status: string;
  result: any;
  created_at: string;
  picked_at: string | null;
  completed_at: string | null;
};

const TYPE_LABEL: Record<string, string> = {
  close_all: "Close All",
  close_profit: "Close Profit",
  close_one: "Close One",
  pause: "Pause",
  resume: "Resume",
  flatten_symbol: "Flatten Symbol",
};

const statusStyle = (s: string) => {
  switch (s) {
    case "done":
    case "ok":
    case "success": return "border-profit/30 bg-profit/10 text-profit";
    case "error":
    case "failed": return "border-loss/30 bg-loss/10 text-loss";
    case "picked": return "border-warn/30 bg-warn/10 text-warn";
    default: return "border-border bg-surface-2 text-muted-foreground";
  }
};

export const CommandHistory = () => {
  const { session } = useSession();
  const [commands, setCommands] = useState<Command[]>([]);

  useEffect(() => {
    if (!session) return;
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("commands")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(25);
      if (active) setCommands((data as Command[]) ?? []);
    };
    load();
    const ch = supabase
      .channel(`rt-commands-${Math.random()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "commands", filter: `user_id=eq.${session.user.id}` }, load)
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [session?.user.id]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      <div className="flex items-center gap-2 border-b border-border p-4">
        <History className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Command History</h2>
        <span className="ml-auto text-[10px] text-muted-foreground">last 25</span>
      </div>
      {commands.length === 0 ? (
        <div className="p-6 text-center text-xs text-muted-foreground">No commands sent yet.</div>
      ) : (
        <ul className="divide-y divide-border">
          {commands.map((c) => {
            const resultMsg = c.result?.message ?? c.result?.error ?? (c.result ? JSON.stringify(c.result) : null);
            return (
              <li key={c.id} className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold">{TYPE_LABEL[c.type] ?? c.type}</span>
                    <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold uppercase border", statusStyle(c.status))}>
                      {c.status}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground" title={fmtTime(c.created_at)}>
                    {fmtAgo(c.created_at)}
                  </span>
                </div>
                {resultMsg && (
                  <div className="mt-1.5 truncate font-mono text-[10px] text-muted-foreground" title={resultMsg}>
                    → {resultMsg}
                  </div>
                )}
                {c.completed_at && (
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    completed {fmtAgo(c.completed_at)}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
