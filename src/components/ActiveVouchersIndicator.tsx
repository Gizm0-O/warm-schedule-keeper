import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminMode } from "@/hooks/useAdminMode";
import { cn } from "@/lib/utils";

/**
 * Shows a glowing badge in the header when Barča has active vouchers.
 * Visible only for admin (Mr. Bambuls).
 */
const ActiveVouchersIndicator = () => {
  const isAdmin = useAdminMode();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;

    const load = async () => {
      const { count: c } = await supabase
        .from("earned_rewards")
        .select("id", { count: "exact", head: true })
        .eq("status", "active");
      if (!cancelled) setCount(c ?? 0);
    };
    load();

    const ch = supabase
      .channel("active_vouchers_indicator")
      .on("postgres_changes", { event: "*", schema: "public", table: "earned_rewards" }, load)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [isAdmin]);

  if (!isAdmin || count === 0) return null;

  return (
    <Link
      to="/"
      title={`Barča má aktivní ${count === 1 ? "poukázku" : count < 5 ? "poukázky" : "poukázek"}`}
      className={cn(
        "relative flex items-center gap-1.5 rounded-xl px-2.5 py-1.5",
        "border-2 border-amber-400/70",
        "bg-gradient-to-br from-amber-200 via-orange-300 to-yellow-400",
        "shadow-[0_0_16px_-2px_rgba(234,140,40,0.75)]",
        "animate-pulse-slow hover:scale-105 transition-transform"
      )}
    >
      <Gift className="h-4 w-4 text-amber-900" />
      <span
        className={cn(
          "min-w-[1.25rem] h-5 px-1 rounded-full text-[11px] font-bold",
          "bg-rose-500 text-white flex items-center justify-center",
          "shadow-[0_0_10px_rgba(244,63,94,0.9)] animate-pulse"
        )}
      >
        {count}
      </span>
    </Link>
  );
};

export default ActiveVouchersIndicator;
