// GET ?user_id=... -> bot parameters
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-bot-key",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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

    const url = new URL(req.url);
    const user_id = url.searchParams.get("user_id");
    if (!user_id) throw new Error("user_id required");

    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data, error } = await sb.from("bot_params").select("*").eq("user_id", user_id).maybeSingle();
    if (error) throw error;

    return new Response(JSON.stringify({ params: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
