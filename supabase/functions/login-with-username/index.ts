import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const GENERIC = "Nesprávné přihlašovací údaje";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!username || !password || username.length > 100 || password.length > 200) return json({ error: GENERIC }, 400);

    const supaUrl = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(supaUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const { data: email, error: rpcErr } = await admin.rpc("get_email_by_username", { _username: username });
    if (rpcErr || !email) return json({ error: GENERIC }, 400);

    const anon = createClient(supaUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });
    const { data, error } = await anon.auth.signInWithPassword({ email: email as string, password });
    if (error || !data.session) return json({ error: GENERIC }, 400);
    return json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
  } catch {
    return json({ error: GENERIC }, 400);
  }
});
