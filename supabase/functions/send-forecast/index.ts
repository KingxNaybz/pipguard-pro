// Edge function: send-forecast
// Reads latest forecast for a user and posts a Telegram message via Bot API.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const TG_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const TG_CHAT = Deno.env.get("TELEGRAM_CHAT_ID");

    if (!TG_TOKEN || !TG_CHAT) {
      return json({ error: "TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID secrets not configured" }, 400);
    }

    const sb = createClient(SUPABASE_URL, SERVICE_KEY);

    // Try to identify user (auth header optional while login is disabled)
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader && !authHeader.includes(Deno.env.get("SUPABASE_ANON_KEY") ?? "____")) {
      const sbAuth = createClient(SUPABASE_URL, SERVICE_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data } = await sbAuth.auth.getUser();
      userId = data.user?.id ?? null;
    }
    let bodyText = "";
    try {
      const body = await req.json();
      if (typeof body?.text === "string") bodyText = body.text;
    } catch (_e) { /* no body */ }

    if (!bodyText) {
      // Build text from latest forecasts in DB (only if we know which user)
      let forecasts: any[] = [];
      if (userId) {
        const { data } = await sb
          .from("bot_forecasts")
          .select("*")
          .eq("user_id", userId)
          .order("scanned_at", { ascending: false })
          .limit(50);
        forecasts = data ?? [];
      }

      const lines = ["<b>📊 PIPGOLD FORECAST</b>", ""];
      if (forecasts.length === 0) {
        lines.push("<i>No forecasts available yet.</i>");
      }
      for (const f of forecasts) {
        const dir = String(f.direction).toUpperCase();
        const arrow = dir.startsWith("S") ? "🔻" : "🔺";
        const status = String(f.status ?? "WATCHING").toUpperCase();
        const dot = status.includes("READY") ? "🟢" : status.includes("BUILDING") ? "🟡" : "⚪";
        lines.push(`${dot} ${arrow} <b>${f.symbol}</b> ${dir} · ${f.strength ?? f.net_edge}/6 · edge ${f.net_edge}`);
        if (f.entry_zone) lines.push(`  Entry <code>${f.entry_zone}</code>  SL <code>${f.sl ?? "—"}</code>  TP <code>${f.tp ?? "—"}</code>  RR <code>${f.rrr ?? "—"}</code>`);
        if (f.regime) lines.push(`  <i>${f.regime}</i>${(f.patterns ?? []).length ? " · " + (f.patterns as string[]).join(", ") : ""}`);
      }
      lines.push("", "<i>Not financial advice. Algorithmic signals.</i>");
      bodyText = lines.join("\n");
    }

    const tgResp = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TG_CHAT,
        text: bodyText,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const tgJson = await tgResp.json();
    if (!tgJson.ok) return json({ error: "telegram error", details: tgJson }, 502);

    return json({ ok: true, message_id: tgJson.result?.message_id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg }, 500);
  }
});
