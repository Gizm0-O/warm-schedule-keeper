// Bootstrap initial admin account (Tadeáš). Idempotent.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "tadeas@bambuls.app";
const ADMIN_PASSWORD = "Sebastian1";
const ADMIN_NAME = "Tadeáš";

const listAllUsers = async (admin: ReturnType<typeof createClient>) => {
  const users = [];
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...(data?.users ?? []));
    if (!data?.users?.length || data.users.length < 1000) break;
    page += 1;
  }
  return users;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", ADMIN_EMAIL)
      .order("user_id")
      .limit(1)
      .maybeSingle();

    const users = await listAllUsers(supabase);
    const sameEmailUsers = users.filter((u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    let user = users.find((u) => u.id === profile?.user_id) ?? sameEmailUsers[0];

    if (!user) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { display_name: ADMIN_NAME },
      });
      if (error) throw error;
      user = data.user!;
    } else {
      const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { display_name: ADMIN_NAME },
      });
      if (error) throw error;
      user = data.user!;
    }

    const duplicateUserIds = sameEmailUsers.filter((u) => u.id !== user!.id).map((u) => u.id);
    await Promise.all(duplicateUserIds.map((id) => supabase.auth.admin.deleteUser(id)));
    if (duplicateUserIds.length > 0) {
      await supabase.from("profiles").delete().in("user_id", duplicateUserIds);
    }

    // Approve profile
    await supabase
      .from("profiles")
      .update({ status: "approved", display_name: ADMIN_NAME, username: ADMIN_NAME, email: ADMIN_EMAIL })
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
