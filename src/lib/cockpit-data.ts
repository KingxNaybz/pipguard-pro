import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";

export type BotState = {
  user_id: string;
  balance: number;
  equity: number;
  margin: number;
  free_margin: number;
  currency: string;
  halted: boolean;
  halt_reason: string | null;
  consecutive_losses: number;
  daily_pl: number;
  daily_drawdown: number;
  trades_today: number;
  wins_today: number;
  losses_today: number;
  scan_count: number;
  last_heartbeat: string | null;
  bot_version: string | null;
  updated_at: string;
  paused: boolean;
  dry_run: boolean;
  weekly_anchor: number;
  monthly_anchor: number;
};

export type Position = {
  id: string;
  ticket: number;
  symbol: string;
  side: "buy" | "sell";
  lots: number;
  entry: number;
  sl: number | null;
  tp: number | null;
  current_price: number | null;
  profit: number;
  swap: number;
  commission: number;
  opened_at: string;
};

export type Signal = {
  id: string;
  symbol: string;
  side: "buy" | "sell" | "none" | null;
  strength: number;
  indicators: Record<string, any>;
  spread: number | null;
  regime: string | null;
  net_edge: number;
  patterns: string[];
  h1_trend: string | null;
  scanned_at: string;
};

export type Trade = {
  id: string;
  ticket: number;
  symbol: string;
  side: "buy" | "sell";
  lots: number;
  entry: number;
  exit: number;
  pips: number;
  profit: number;
  win: boolean;
  signal_strength: number | null;
  regime: string | null;
  close_reason: string | null;
  opened_at: string;
  closed_at: string;
};

export type Forecast = {
  id: string;
  symbol: string;
  direction: string;
  strength: string | null;
  net_edge: number;
  status: string;
  regime: string | null;
  entry_zone: string | null;
  sl: number | null;
  tp: number | null;
  rrr: number | null;
  rsi: number | null;
  patterns: string[];
  scanned_at: string;
};

export type Alert = {
  id: string;
  type: string;
  level: "info" | "success" | "warn" | "error";
  message: string;
  meta: Record<string, any>;
  created_at: string;
};

export type BotParams = {
  user_id: string;
  risk_percent: number;
  max_trades: number;
  min_signal_strength: number;
  min_rrr: number;
  daily_loss_limit: number;
  max_consecutive_losses: number;
  max_lot_size: number;
  max_spread_normal: number;
  max_spread_gold: number;
  scan_interval: number;
  sl_min: number;
  sl_max: number;
  atr_multiplier: number;
  gold_sl_multiplier: number;
  paused: boolean;
  enabled_pairs: string[];
  pair_settings: Record<string, { max_spread?: number; min_freshness_sec?: number }>;
  version: number;
  updated_at: string;
};

const useRealtime = <T,>(
  table: string,
  initial: () => Promise<T>,
  filter?: string,
) => {
  const { session } = useSession();
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    if (!session) return;
    let active = true;
    const refresh = async () => {
      const next = await initial();
      if (active) setData(next);
    };

    refresh();

    const channel = supabase
      .channel(`rt-${table}-${Math.random()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: filter ?? `user_id=eq.${session.user.id}` },
        refresh,
      )
      .subscribe();

    const intervalId = window.setInterval(refresh, 10_000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id, table]);

  return data;
};

export const useBotState = () => {
  const { session } = useSession();
  return useRealtime<BotState | null>("bot_state", async () => {
    if (!session) return null;
    const { data } = await supabase.from("bot_state").select("*").eq("user_id", session.user.id).maybeSingle();
    return (data as BotState) ?? null;
  });
};

export const usePositions = () => {
  const { session } = useSession();
  return useRealtime<Position[]>("positions", async () => {
    if (!session) return [];
    const { data } = await supabase.from("positions").select("*").eq("user_id", session.user.id).order("opened_at", { ascending: false });
    return (data as Position[]) ?? [];
  });
};

export const useSignals = () => {
  const { session } = useSession();
  return useRealtime<Signal[]>("signals", async () => {
    if (!session) return [];
    const { data } = await supabase.from("signals").select("*").eq("user_id", session.user.id).order("symbol");
    return (data as Signal[]) ?? [];
  });
};

export const useTrades = (limit = 500) => {
  const { session } = useSession();
  return useRealtime<Trade[]>("trades", async () => {
    if (!session) return [];
    const { data } = await supabase.from("trades").select("*").eq("user_id", session.user.id).order("closed_at", { ascending: false }).limit(limit);
    return (data as Trade[]) ?? [];
  });
};

export const useAlerts = (limit = 100) => {
  const { session } = useSession();
  return useRealtime<Alert[]>("alerts", async () => {
    if (!session) return [];
    const { data } = await supabase.from("alerts").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(limit);
    return (data as Alert[]) ?? [];
  });
};

export const useBotParams = () => {
  const { session } = useSession();
  return useRealtime<BotParams | null>("bot_params", async () => {
    if (!session) return null;
    const { data } = await supabase.from("bot_params").select("*").eq("user_id", session.user.id).maybeSingle();
    return (data as BotParams) ?? null;
  });
};

export const useForecasts = () => {
  const { session } = useSession();
  return useRealtime<Forecast[]>("bot_forecasts", async () => {
    if (!session) return [];
    const { data } = await supabase
      .from("bot_forecasts")
      .select("*")
      .eq("user_id", session.user.id)
      .order("scanned_at", { ascending: false });
    return (data as Forecast[]) ?? [];
  });
};

export const sendCommand = async (
  type: "close_all" | "close_profit" | "close_one" | "pause" | "resume" | "flatten_symbol" | "set_dry_run" | "send_forecast",
  payload: Record<string, any> = {},
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");
  const { error } = await supabase.from("commands").insert({ user_id: user.id, type, payload });
  if (error) throw error;
};
