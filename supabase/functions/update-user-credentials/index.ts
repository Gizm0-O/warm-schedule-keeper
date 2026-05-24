import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

    const { email, password } = await req.json();
    console.log("update request", { current: user.email, requested: email, hasPass: !!password });
    const admin = createClient(supaUrl, serviceKey);

    if (email && email !== user.email) {
      const { data: updated, error } = await admin.auth.admin.updateUserById(user.id, {
        email,
        email_confirm: true,
      });
      console.log("email update result", { newEmail: updated?.user?.email, error: error?.message });
      if (error) throw error;
      const { error: pErr } = await admin.from("profiles").update({ email }).eq("user_id", user.id);
      if (pErr) console.log("profile email update error", pErr.message);
    }

    if (password) {
      const { error } = await admin.auth.admin.updateUserById(user.id, { password });
      if (error) throw error;
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
