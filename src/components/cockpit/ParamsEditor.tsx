import { useEffect, useState } from "react";
import { useBotParams } from "@/lib/cockpit-data";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

const ALL_PAIRS = ["EURUSD","GBPUSD","XAUUSD","GBPJPY","EURJPY","USDJPY","AUDUSD","USDCAD","NZDUSD","USDCHF","EURGBP"];

const FIELDS: { key: string; label: string; step?: number; help?: string }[] = [
  { key: "risk_percent", label: "Risk per trade", step: 0.001, help: "Fraction of equity (e.g. 0.005 = 0.5%)" },
  { key: "max_trades", label: "Max concurrent trades", step: 1 },
  { key: "min_signal_strength", label: "Min indicator confluence", step: 1, help: "Out of 6" },
  { key: "min_rrr", label: "Min Risk:Reward", step: 0.1 },
  { key: "daily_loss_limit", label: "Daily loss limit", step: 0.01, help: "Halt at this fraction (0.06 = 6%)" },
  { key: "max_consecutive_losses", label: "Max consecutive losses", step: 1 },
  { key: "max_lot_size", label: "Max lot size cap", step: 0.01 },
  { key: "max_spread_normal", label: "Max spread (normal)", step: 1, help: "Points" },
  { key: "max_spread_gold", label: "Max spread (XAUUSD)", step: 1, help: "Points" },
  { key: "scan_interval", label: "Scan interval (s)", step: 5 },
  { key: "sl_min", label: "Min SL pips", step: 1 },
  { key: "sl_max", label: "Max SL pips", step: 1 },
  { key: "atr_multiplier", label: "ATR multiplier", step: 0.1 },
  { key: "gold_sl_multiplier", label: "Gold SL multiplier", step: 0.1 },
];

const PROFIT_NUMERIC_FIELDS: { key: string; label: string; step?: number; help?: string }[] = [
  { key: "tp_multiplier", label: "TP multiplier", step: 0.1, help: "Take-profit = SL distance × this" },
  { key: "trailing_stop_activation_pips", label: "Trailing activation (pips)", step: 1, help: "Activate trail after N pips profit" },
  { key: "trailing_stop_distance_pips", label: "Trailing distance (pips)", step: 1, help: "Pips behind price the stop trails" },
  { key: "break_even_activation_pips", label: "Break-even activation (pips)", step: 1, help: "Move SL to entry after N pips profit" },
  { key: "daily_profit_target", label: "Daily profit target (USD)", step: 1, help: "0 = disabled" },
];

const PROFIT_TOGGLE_FIELDS: { key: string; label: string; help?: string }[] = [
  { key: "use_trailing_stop", label: "Use trailing stop", help: "Trail SL behind price as it moves in your favor" },
  { key: "use_break_even", label: "Use break-even", help: "Move SL to entry once trade is in profit" },
];

export const ParamsEditor = () => {
  const { session } = useSession();
  const params = useBotParams();
  const [draft, setDraft] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (params) setDraft(params); }, [params?.version]);

  if (!params || !draft) return <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">Loading params…</div>;

  const togglePair = (p: string) => {
    const set = new Set<string>(draft.enabled_pairs ?? []);
    set.has(p) ? set.delete(p) : set.add(p);
    setDraft({ ...draft, enabled_pairs: [...set] });
  };

  const save = async () => {
    if (!session) return;
    setSaving(true);
    try {
      const update: any = { ...draft, version: (draft.version ?? 1) + 1, updated_at: new Date().toISOString() };
      delete update.user_id;
      const { error } = await supabase.from("bot_params").update(update).eq("user_id", session.user.id);
      if (error) throw error;
      toast.success("Parameters pushed — bot picks them up on next scan");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Live Parameters</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Pushed to bot in real time. Version {draft.version}.</p>
        </div>
        <Button size="sm" className="gradient-gold text-primary-foreground" disabled={saving} onClick={save}>
          {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
          Push to bot
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 lg:grid-cols-3">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label className="text-xs">{f.label}</Label>
            <Input
              type="number"
              step={f.step ?? "any"}
              value={draft[f.key] ?? ""}
              onChange={(e) => setDraft({ ...draft, [f.key]: Number(e.target.value) })}
              className="font-mono"
            />
            {f.help && <p className="text-[10px] text-muted-foreground">{f.help}</p>}
          </div>
        ))}
      </div>

      <div className="border-t border-border p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Profit Management</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PROFIT_TOGGLE_FIELDS.map((f) => (
            <div key={f.key} className="flex items-start justify-between gap-3 rounded-md border border-border bg-surface-2 px-3 py-2.5">
              <div className="min-w-0">
                <Label className="text-xs">{f.label}</Label>
                {f.help && <p className="mt-0.5 text-[10px] text-muted-foreground">{f.help}</p>}
              </div>
              <Switch
                checked={!!draft[f.key]}
                onCheckedChange={(v) => setDraft({ ...draft, [f.key]: v })}
              />
            </div>
          ))}
          {PROFIT_NUMERIC_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label className="text-xs">{f.label}</Label>
              <Input
                type="number"
                step={f.step ?? "any"}
                value={draft[f.key] ?? ""}
                onChange={(e) => setDraft({ ...draft, [f.key]: Number(e.target.value) })}
                className="font-mono"
              />
              {f.help && <p className="text-[10px] text-muted-foreground">{f.help}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border p-5">
        <Label className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">Enabled pairs</Label>
        <div className="flex flex-wrap gap-2">
          {ALL_PAIRS.map((p) => {
            const on = draft.enabled_pairs?.includes(p);
            return (
              <button key={p} onClick={() => togglePair(p)} className={`rounded-md border px-3 py-1.5 font-mono text-xs transition-colors ${on ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface-2 text-muted-foreground"}`}>
                {p}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
