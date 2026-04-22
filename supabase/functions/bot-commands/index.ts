// GET ?user_id=... -> pending commands (and marks them picked)
// POST { user_id, command_id, status, result } -> report result
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-bot-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

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
      requireSuccess(error, "commands fetch failed");

      const ids = (data ?? []).map((c) => c.id);
      if (ids.length > 0) {
        const { error: updateError } = await sb
          .from("commands")
          .update({ picked_at: new Date().toISOString() })
          .in("id", ids);
        requireSuccess(updateError, "commands picked_at update failed");
      }
      return json({ commands: data ?? [] });
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
      requireSuccess(error, "command completion update failed");
      return json({ ok: true });
    }

    return json({ error: "method not allowed" }, 405);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg }, 500);
  }
});
