// Bootstrap initial admin account (Tadeáš). Idempotent.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "tadeas@bambuls.app";
const ADMIN_PASSWORD = "Sebastian1";
const ADMIN_NAME = "Tadeáš";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Check if user exists
    const { data: list } = await supabase.auth.admin.listUsers();
    let user = list?.users?.find((u) => u.email === ADMIN_EMAIL);

    if (!user) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { display_name: ADMIN_NAME },
      });
      if (error) throw error;
      user = data.user!;
    }

    // Approve profile
    await supabase
      .from("profiles")
      .update({ status: "approved", display_name: ADMIN_NAME })
      .eq("user_id", user!.id);

    // Grant admin role
    await supabase
      .from("user_roles")
      .upsert({ user_id: user!.id, role: "admin" }, { onConflict: "user_id,role" });

    return new Response(
      JSON.stringify({ ok: true, email: ADMIN_EMAIL, user_id: user!.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
