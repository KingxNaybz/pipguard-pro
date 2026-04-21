// GET ?user_id=... -> pending commands (and marks them picked)
// POST { user_id, command_id, status, result } -> report result
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-bot-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

    const sb = createClient(SUPABASE_URL, SERVICE_KEY);

    if (req.method === "GET") {
      const url = new URL(req.url);
      const user_id = url.searchParams.get("user_id");
      if (!user_id) throw new Error("user_id required");

      const { data, error } = await sb
        .from("commands")
        .select("*")
        .eq("user_id", user_id)
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(20);
      if (error) throw error;

      const ids = (data ?? []).map((c) => c.id);
      if (ids.length > 0) {
        await sb.from("commands").update({ picked_at: new Date().toISOString() }).in("id", ids);
      }
      return new Response(JSON.stringify({ commands: data ?? [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { command_id, status, result } = body;
      if (!command_id || !status) throw new Error("command_id and status required");
      const { error } = await sb.from("commands").update({
        status,
        result: result ?? null,
        completed_at: new Date().toISOString(),
      }).eq("id", command_id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
