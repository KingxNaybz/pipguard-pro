// Bot → Cloud sync endpoint. Auth via BOT_API_KEY bearer + user_id in body.
// Uses service role to bypass RLS (the bot is a trusted server).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-bot-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type JsonObject = Record<string, unknown>;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const asObject = (value: unknown): JsonObject | null => (
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : null
);

const asArray = (value: unknown): JsonObject[] => (
  Array.isArray(value) ? value.map((entry) => asObject(entry)).filter((entry): entry is JsonObject => !!entry) : []
);

const asNumber = (value: unknown, fallback = 0): number => {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const asNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const asBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on";
  }
  return false;
};

const asString = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const asNullableString = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
};

const normalizeSide = (value: unknown, fallback: "buy" | "sell" | "none" = "none") => {
  const normalized = asString(value, fallback).trim().toLowerCase();
  if (normalized === "buy" || normalized === "sell" || normalized === "none") return normalized;
  return fallback;
};

const pickStatePayload = (body: JsonObject): JsonObject | null => {
  const candidates = [body.state, body.bot_state, body.account, body.metrics]
    .map((candidate) => asObject(candidate))
    .filter((candidate): candidate is JsonObject => !!candidate);

  if (candidates.length > 0) return candidates[0];

  const topLevelKeys = [
    "balance", "equity", "margin", "free_margin", "freeMargin", "currency", "halted",
    "halt_reason", "haltReason", "consecutive_losses", "consecutiveLosses", "daily_pl", "dailyPL",
    "daily_drawdown", "dailyDrawdown", "trades_today", "tradesToday", "wins_today", "winsToday",
    "losses_today", "lossesToday", "scan_count", "scanCount", "bot_version", "botVersion",
  ];

  return topLevelKeys.some((key) => body[key] !== undefined) ? body : null;
};

const requireSuccess = (error: { message: string } | null, context: string) => {
  if (error) throw new Error(`${context}: ${error.message}`);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const BOT_API_KEY = Deno.env.get("BOT_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!BOT_API_KEY) throw new Error("BOT_API_KEY not configured");

    const auth = req.headers.get("authorization") || req.headers.get("x-bot-key") || "";
    const token = auth.replace(/^Bearer\s+/i, "").trim();
    if (token !== BOT_API_KEY) {
      return json({ error: "unauthorized" }, 401);
    }

    const body = asObject(await req.json());
    if (!body) return json({ error: "invalid JSON body" }, 400);

    const user_id = asString(body.user_id ?? body.userId).trim();
    if (!user_id) return json({ error: "user_id required" }, 400);

    const now = new Date().toISOString();
    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    const statePayload = pickStatePayload(body);

    const stateUpdate: JsonObject = {
      user_id,
      last_heartbeat: asString(body.last_heartbeat ?? body.lastHeartbeat ?? body.heartbeat_at ?? body.heartbeatAt, now),
      updated_at: now,
    };

    if (statePayload) {
      stateUpdate.balance = asNumber(statePayload.balance);
      stateUpdate.equity = asNumber(statePayload.equity);
      stateUpdate.margin = asNumber(statePayload.margin);
      stateUpdate.free_margin = asNumber(statePayload.free_margin ?? statePayload.freeMargin);
      stateUpdate.currency = asString(statePayload.currency, "USD");
      stateUpdate.halted = asBoolean(statePayload.halted);
      stateUpdate.halt_reason = asNullableString(statePayload.halt_reason ?? statePayload.haltReason);
      stateUpdate.consecutive_losses = asNumber(statePayload.consecutive_losses ?? statePayload.consecutiveLosses);
      stateUpdate.daily_pl = asNumber(statePayload.daily_pl ?? statePayload.dailyPL);
      stateUpdate.daily_drawdown = asNumber(statePayload.daily_drawdown ?? statePayload.dailyDrawdown);
      stateUpdate.trades_today = asNumber(statePayload.trades_today ?? statePayload.tradesToday);
      stateUpdate.wins_today = asNumber(statePayload.wins_today ?? statePayload.winsToday);
      stateUpdate.losses_today = asNumber(statePayload.losses_today ?? statePayload.lossesToday);
      stateUpdate.scan_count = asNumber(statePayload.scan_count ?? statePayload.scanCount);
      stateUpdate.bot_version = asNullableString(statePayload.bot_version ?? statePayload.botVersion);
      if (statePayload.paused !== undefined) stateUpdate.paused = asBoolean(statePayload.paused);
      if (statePayload.dry_run !== undefined || statePayload.dryRun !== undefined)
        stateUpdate.dry_run = asBoolean(statePayload.dry_run ?? statePayload.dryRun);
      if (statePayload.weekly_anchor !== undefined || statePayload.weeklyAnchor !== undefined)
        stateUpdate.weekly_anchor = asNumber(statePayload.weekly_anchor ?? statePayload.weeklyAnchor);
      if (statePayload.monthly_anchor !== undefined || statePayload.monthlyAnchor !== undefined)
        stateUpdate.monthly_anchor = asNumber(statePayload.monthly_anchor ?? statePayload.monthlyAnchor);
    }

    const { error: stateError } = await sb.from("bot_state").upsert(stateUpdate, { onConflict: "user_id" });
    requireSuccess(stateError, "bot_state upsert failed");

    const positions = asArray(body.positions);
    if (Array.isArray(body.positions)) {
      const rows = positions
        .map((p) => ({
          user_id,
          ticket: asNumber(p.ticket, Number.NaN),
          symbol: asString(p.symbol).trim(),
          side: normalizeSide(p.side, "buy") as "buy" | "sell",
          lots: asNumber(p.lots),
          entry: asNumber(p.entry),
          sl: asNullableNumber(p.sl),
          tp: asNullableNumber(p.tp),
          current_price: asNullableNumber(p.current_price ?? p.currentPrice),
          profit: asNumber(p.profit),
          swap: asNumber(p.swap),
          commission: asNumber(p.commission),
          opened_at: asString(p.opened_at ?? p.openedAt, now),
          updated_at: now,
        }))
        .filter((row) => Number.isFinite(row.ticket) && row.symbol);

      const tickets = rows.map((p) => p.ticket);
      if (tickets.length === 0) {
        const { error } = await sb.from("positions").delete().eq("user_id", user_id);
        requireSuccess(error, "positions delete failed");
      } else {
        const { error: deleteError } = await sb.from("positions")
          .delete()
          .eq("user_id", user_id)
          .not("ticket", "in", `(${tickets.join(",")})`);
        requireSuccess(deleteError, "positions prune failed");

        const { error: upsertError } = await sb.from("positions").upsert(rows, { onConflict: "user_id,ticket" });
        requireSuccess(upsertError, "positions upsert failed");
      }
    }

    const signals = asArray(body.signals);
    if (Array.isArray(body.signals) && signals.length > 0) {
      const rows = signals
        .map((sig) => ({
          user_id,
          symbol: asString(sig.symbol).trim(),
          side: normalizeSide(sig.side),
          strength: asNumber(sig.strength),
          indicators: asObject(sig.indicators) ?? {},
          spread: asNullableNumber(sig.spread),
          regime: asNullableString(sig.regime),
          net_edge: asNumber(sig.net_edge ?? sig.netEdge),
          patterns: Array.isArray(sig.patterns) ? sig.patterns.map(String) : [],
          h1_trend: asNullableString(sig.h1_trend ?? sig.h1Trend),
          scanned_at: asString(sig.scanned_at ?? sig.scannedAt, now),
        }))
        .filter((row) => row.symbol);

      if (rows.length > 0) {
        const { error } = await sb.from("signals").upsert(rows, { onConflict: "user_id,symbol" });
        requireSuccess(error, "signals upsert failed");
      }
    }

    const trades = asArray(body.trades);
    if (Array.isArray(body.trades) && trades.length > 0) {
      const rows = trades
        .map((t) => ({
          user_id,
          ticket: asNumber(t.ticket, Number.NaN),
          symbol: asString(t.symbol).trim(),
          side: normalizeSide(t.side, "buy") as "buy" | "sell",
          lots: asNumber(t.lots),
          entry: asNumber(t.entry),
          exit: asNumber(t.exit),
          sl: asNullableNumber(t.sl),
          tp: asNullableNumber(t.tp),
          pips: asNumber(t.pips),
          profit: asNumber(t.profit),
          win: asBoolean(t.win),
          signal_strength: asNullableNumber(t.signal_strength ?? t.signalStrength),
          regime: asNullableString(t.regime),
          close_reason: asNullableString(t.close_reason ?? t.closeReason),
          opened_at: asString(t.opened_at ?? t.openedAt, now),
          closed_at: asString(t.closed_at ?? t.closedAt, now),
        }))
        .filter((row) => Number.isFinite(row.ticket) && row.symbol);

      if (rows.length > 0) {
        const { error } = await sb.from("trades").upsert(rows, { onConflict: "user_id,ticket" });
        requireSuccess(error, "trades upsert failed");
      }
    }

    const alerts = asArray(body.alerts);
    if (Array.isArray(body.alerts) && alerts.length > 0) {
      const rows = alerts.map((a) => ({
        user_id,
        type: asString(a.type, "info"),
        level: asString(a.level, "info"),
        message: asString(a.message),
        meta: asObject(a.meta) ?? {},
      }));

      const { error } = await sb.from("alerts").insert(rows);
      requireSuccess(error, "alerts insert failed");
    }

    return json({
      ok: true,
      heartbeat_at: stateUpdate.last_heartbeat,
      processed: {
        state: !!statePayload,
        positions: positions.length,
        signals: signals.length,
        trades: trades.length,
        alerts: alerts.length,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg }, 500);
  }
});
