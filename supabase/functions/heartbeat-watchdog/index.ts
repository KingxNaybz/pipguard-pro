// Heartbeat watchdog: flags bots as disconnected when last_heartbeat is older than timeout.
// Runs on a schedule (pg_cron). No auth required - service role only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Default timeout in seconds; overridable per-request via ?timeout=NN
const DEFAULT_TIMEOUT_SEC = 90;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(SUPABASE_URL, SERVICE_KEY);

    const url = new URL(req.url);
    const timeoutSec = Math.max(
      30,
      parseInt(url.searchParams.get("timeout") ?? `${DEFAULT_TIMEOUT_SEC}`, 10) || DEFAULT_TIMEOUT_SEC,
    );
    const cutoff = new Date(Date.now() - timeoutSec * 1000).toISOString();

    // Find bots that look online (not halted) but whose heartbeat is stale OR null with recent activity.
    const { data: stale, error: selErr } = await sb
      .from("bot_state")
      .select("user_id, last_heartbeat, halted, halt_reason")
      .or(`last_heartbeat.lt.${cutoff},last_heartbeat.is.null`);
    if (selErr) throw selErr;

    const flagged: string[] = [];
    for (const row of stale ?? []) {
      // Skip if already halted with disconnect reason (avoid alert spam)
      if (row.halted && row.halt_reason === "heartbeat_timeout") continue;

      const ageSec = row.last_heartbeat
        ? Math.round((Date.now() - new Date(row.last_heartbeat).getTime()) / 1000)
        : null;

      // Mark halted with disconnect reason
      await sb
        .from("bot_state")
        .update({
          halted: true,
          halt_reason: "heartbeat_timeout",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", row.user_id);

      // Insert alert (one per transition)
      await sb.from("alerts").insert({
        user_id: row.user_id,
        type: "heartbeat",
        level: "error",
        message: ageSec === null
          ? `Bot offline: no heartbeat received yet`
          : `Bot offline: last heartbeat ${ageSec}s ago (timeout ${timeoutSec}s)`,
        meta: { age_sec: ageSec, timeout_sec: timeoutSec, source: "watchdog" },
      });

      flagged.push(row.user_id);
    }

    // Auto-recover: bots flagged as heartbeat_timeout that now have a fresh heartbeat
    const { data: recovered, error: recErr } = await sb
      .from("bot_state")
      .select("user_id, last_heartbeat")
      .eq("halted", true)
      .eq("halt_reason", "heartbeat_timeout")
      .gt("last_heartbeat", cutoff);
    if (recErr) throw recErr;

    const cleared: string[] = [];
    for (const row of recovered ?? []) {
      await sb
        .from("bot_state")
        .update({ halted: false, halt_reason: null, updated_at: new Date().toISOString() })
        .eq("user_id", row.user_id);
      await sb.from("alerts").insert({
        user_id: row.user_id,
        type: "heartbeat",
        level: "success",
        message: `Bot reconnected — heartbeat restored`,
        meta: { source: "watchdog" },
      });
      cleared.push(row.user_id);
    }

    return new Response(
      JSON.stringify({ ok: true, timeout_sec: timeoutSec, flagged, recovered: cleared }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
