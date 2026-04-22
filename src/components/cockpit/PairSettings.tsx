import { useEffect, useState } from "react";
import { useBotParams } from "@/lib/cockpit-data";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Save, Loader2, Settings2 } from "lucide-react";

const ALL_PAIRS = ["EURUSD","GBPUSD","XAUUSD","GBPJPY","EURJPY","USDJPY","AUDUSD","USDCAD","NZDUSD","USDCHF","EURGBP"];

export type PairSetting = { max_spread?: number; min_freshness_sec?: number };
export type PairSettingsMap = Record<string, PairSetting>;

const defaultFor = (sym: string): PairSetting => ({
  max_spread: sym === "XAUUSD" ? 50 : 30,
  min_freshness_sec: 600,
});

export const PairSettings = () => {
  const { session } = useSession();
  const params = useBotParams();
  const [draft, setDraft] = useState<PairSettingsMap | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (params) {
      const existing = (params as any).pair_settings ?? {};
      const merged: PairSettingsMap = {};
      ALL_PAIRS.forEach((p) => { merged[p] = { ...defaultFor(p), ...existing[p] }; });
      setDraft(merged);
    }
  }, [params?.version]);

  if (!params || !draft) {
    return <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">Loading pair settings…</div>;
  }

  const update = (sym: string, key: keyof PairSetting, val: number) => {
    setDraft({ ...draft, [sym]: { ...draft[sym], [key]: val } });
  };

  const save = async () => {
    if (!session) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("bot_params")
        .update({
          pair_settings: draft as any,
          version: (params.version ?? 1) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", session.user.id);
      if (error) throw error;
      toast.success("Per-pair settings pushed to bot");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Per-pair settings</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Max spread (points) & min signal freshness (seconds). Applied live to signals grid and bot.</p>
          </div>
        </div>
        <Button size="sm" className="gradient-gold text-primary-foreground" disabled={saving} onClick={save}>
          {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
          Save
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="p-3 text-left">Pair</th>
              <th className="p-3 text-right">Max spread (pts)</th>
              <th className="p-3 text-right">Min freshness (sec)</th>
            </tr>
          </thead>
          <tbody>
            {ALL_PAIRS.map((sym) => (
              <tr key={sym} className="border-t border-border">
                <td className="p-3 font-mono text-xs font-bold">{sym}</td>
                <td className="p-3">
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={draft[sym]?.max_spread ?? ""}
                    onChange={(e) => update(sym, "max_spread", Number(e.target.value))}
                    className="ml-auto h-8 w-28 text-right font-mono"
                  />
                </td>
                <td className="p-3">
                  <Input
                    type="number"
                    min={0}
                    step={30}
                    value={draft[sym]?.min_freshness_sec ?? ""}
                    onChange={(e) => update(sym, "min_freshness_sec", Number(e.target.value))}
                    className="ml-auto h-8 w-28 text-right font-mono"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
