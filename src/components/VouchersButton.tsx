import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RewardsVouchersPanel } from "@/components/RewardsVouchersPanel";

/**
 * Unified vouchers button in the header, visible to everyone.
 * - Barča: glows + shows count of AVAILABLE (unactivated) vouchers she has earned.
 * - Admin (Mr. Bambuls): glows + shows count of ACTIVE vouchers waiting to be marked complete.
 * Click opens a dialog with the full vouchers panel.
 */
const VouchersButton = () => {
  const { isAdmin, user } = useAuth();
  const [availableCount, setAvailableCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      const [{ count: a }, { count: b }] = await Promise.all([
        supabase.from("earned_rewards").select("id", { count: "exact", head: true }).eq("status", "available"),
        supabase.from("earned_rewards").select("id", { count: "exact", head: true }).eq("status", "active"),
      ]);
      if (!cancelled) {
        setAvailableCount(a ?? 0);
        setActiveCount(b ?? 0);
      }
    };
    load();
    const ch = supabase
      .channel("vouchers_button_" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "earned_rewards" }, load)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [user?.id]);

  if (!user) return null;

  const count = isAdmin ? activeCount : availableCount;
  const isGlowing = count > 0;
  const title = isAdmin
    ? count > 0
      ? `Barča má aktivovaných ${count} ${count === 1 ? "poukázku" : count < 5 ? "poukázky" : "poukázek"} ke splnění`
      : "Poukázky (přehled)"
    : count > 0
      ? `Máš ${count} ${count === 1 ? "novou poukázku" : count < 5 ? "nové poukázky" : "nových poukázek"} k aktivaci`
      : "Tvoje poukázky";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          title={title}
          aria-label={title}
          className={cn(
            "relative flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 border-2 transition-all",
            "bg-gradient-to-br from-amber-200 via-orange-300 to-yellow-400",
            isGlowing
              ? "border-amber-400/80 shadow-[0_0_16px_-2px_rgba(234,140,40,0.75)] animate-pulse-slow hover:scale-105"
              : "border-amber-400/40 opacity-70 hover:opacity-100 hover:scale-105"
          )}
        >
          <Gift className="h-4 w-4 text-amber-900" />
          {isGlowing && (
            <span
              className={cn(
                "min-w-[1.25rem] h-5 px-1 rounded-full text-[11px] font-bold flex items-center justify-center",
                "bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.9)] animate-pulse"
              )}
            >
              {count}
            </span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-warning" />
            {isAdmin ? "Poukázky – Barča" : "Moje poukázky"}
          </DialogTitle>
        </DialogHeader>
        <RewardsVouchersPanel />
      </DialogContent>
    </Dialog>
  );
};

export default VouchersButton;
