import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const monthKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

/**
 * Jednou za měsíc pošle adminovi notifikaci, aby zkontroloval a odsouhlasil
 * příběhové úkoly pro Barču na daný měsíc.
 */
export function useStoriesReminder() {
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (!user || !isAdmin) return;
    let cancelled = false;

    (async () => {
      const month = monthKey();
      const body = `Měsíc ${month} – zkontroluj a odsouhlas příběhové úkoly pro Barču.`;

      // už poslané pro tento měsíc?
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", "stories_review")
        .eq("body", body)
        .limit(1);
      if (cancelled || (existing && existing.length > 0)) return;

      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Nové úkoly na měsíc 📝",
        body,
        type: "stories_review",
        link: "/todo",
        created_by: user.id,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isAdmin]);
}
