import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supaUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supaUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: uErr } = await userClient.auth.getUser();
    if (uErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { email, password, username } = await req.json();
    const admin = createClient(supaUrl, serviceKey);
    const cleanEmail = typeof email === "string" ? email.trim() : "";
    const cleanUsername = typeof username === "string" ? username.trim() : "";

    if (cleanUsername) {
      const { error } = await admin
        .from("profiles")
        .update({ username: cleanUsername, display_name: cleanUsername })
        .eq("user_id", user.id);
      if (error) throw error;
    }

    if (cleanEmail && cleanEmail !== user.email) {
      const { data: updated, error } = await admin.auth.admin.updateUserById(user.id, {
        email: cleanEmail,
        email_confirm: true,
      });
      if (error) throw error;
      const savedEmail = updated?.user?.email ?? cleanEmail;
      const { error: pErr } = await admin.from("profiles").update({ email: savedEmail }).eq("user_id", user.id);
      if (pErr) throw pErr;
    }

    if (password) {
      const { error } = await admin.auth.admin.updateUserById(user.id, { password });
      if (error) throw error;
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = (e as Error).message || "Chyba";
    const lower = msg.toLowerCase();
    let status = 500;
    let friendly = msg;
    if (lower.includes("weak") || lower.includes("pwned") || lower.includes("known to be")) {
      status = 400;
      friendly = "Heslo je příliš slabé nebo bylo nalezeno v úniku dat. Zvol prosím jiné.";
    } else if (lower.includes("password should be at least") || lower.includes("password is too short")) {
      status = 400;
      friendly = "Heslo je příliš krátké.";
    }
    return new Response(JSON.stringify({ error: friendly }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
