// Bot → Cloud sync endpoint. Auth via BOT_API_KEY bearer + user_id in body.
// Uses service role to bypass RLS (the bot is a trusted server).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-bot-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const user_id: string = body.user_id;
    if (!user_id) throw new Error("user_id required");

    const sb = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1) bot_state upsert
    if (body.state) {
      const s = body.state;
      await sb.from("bot_state").upsert({
        user_id,
        balance: s.balance ?? 0,
        equity: s.equity ?? 0,
        margin: s.margin ?? 0,
        free_margin: s.free_margin ?? 0,
        currency: s.currency ?? "USD",
        halted: !!s.halted,
        halt_reason: s.halt_reason ?? null,
        consecutive_losses: s.consecutive_losses ?? 0,
        daily_pl: s.daily_pl ?? 0,
        daily_drawdown: s.daily_drawdown ?? 0,
        trades_today: s.trades_today ?? 0,
        wins_today: s.wins_today ?? 0,
        losses_today: s.losses_today ?? 0,
        scan_count: s.scan_count ?? 0,
        last_heartbeat: new Date().toISOString(),
        bot_version: s.bot_version ?? null,
        updated_at: new Date().toISOString(),
      });
    }

    // 2) positions: replace all open positions for user
    if (Array.isArray(body.positions)) {
      const tickets = body.positions.map((p: any) => p.ticket);
      // delete positions no longer open
      if (tickets.length === 0) {
        await sb.from("positions").delete().eq("user_id", user_id);
      } else {
        await sb.from("positions").delete().eq("user_id", user_id).not("ticket", "in", `(${tickets.join(",")})`);
      }
      const rows = body.positions.map((p: any) => ({
        user_id,
        ticket: p.ticket,
        symbol: p.symbol,
        side: p.side,
        lots: p.lots,
        entry: p.entry,
        sl: p.sl ?? null,
        tp: p.tp ?? null,
        current_price: p.current_price ?? null,
        profit: p.profit ?? 0,
        swap: p.swap ?? 0,
        commission: p.commission ?? 0,
        opened_at: p.opened_at,
        updated_at: new Date().toISOString(),
      }));
      if (rows.length > 0) {
        await sb.from("positions").upsert(rows, { onConflict: "user_id,ticket" });
      }
    }

    // 3) signals (latest per pair)
    if (Array.isArray(body.signals)) {
      const rows = body.signals.map((sig: any) => ({
        user_id,
        symbol: sig.symbol,
        side: sig.side ?? "none",
        strength: sig.strength ?? 0,
        indicators: sig.indicators ?? {},
        spread: sig.spread ?? null,
        regime: sig.regime ?? null,
        scanned_at: new Date().toISOString(),
      }));
      if (rows.length > 0) {
        await sb.from("signals").upsert(rows, { onConflict: "user_id,symbol" });
      }
    }

    // 4) closed trades (append)
    if (Array.isArray(body.trades) && body.trades.length > 0) {
      const rows = body.trades.map((t: any) => ({
        user_id,
        ticket: t.ticket,
        symbol: t.symbol,
        side: t.side,
        lots: t.lots,
        entry: t.entry,
        exit: t.exit,
        sl: t.sl ?? null,
        tp: t.tp ?? null,
        pips: t.pips ?? 0,
        profit: t.profit ?? 0,
        win: !!t.win,
        signal_strength: t.signal_strength ?? null,
        opened_at: t.opened_at,
        closed_at: t.closed_at,
      }));
      await sb.from("trades").upsert(rows, { onConflict: "user_id,ticket" });
    }

    // 5) alerts (append)
    if (Array.isArray(body.alerts) && body.alerts.length > 0) {
      const rows = body.alerts.map((a: any) => ({
        user_id,
        type: a.type ?? "info",
        level: a.level ?? "info",
        message: a.message ?? "",
        meta: a.meta ?? {},
      }));
      await sb.from("alerts").insert(rows);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
