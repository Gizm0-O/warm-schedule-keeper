import { useState } from "react";
import { Gift, Check, X, Sparkles, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEarnedRewards, type EarnedReward } from "@/hooks/useCustomRewards";
import { useAdminMode } from "@/hooks/useAdminMode";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

export const RewardsVouchersPanel = () => {
  const { rewards, activate, deactivate, complete, remove } = useEarnedRewards();
  const isAdmin = useAdminMode();
  const [showHistory, setShowHistory] = useState(false);

  const available = rewards.filter((r) => r.status === "available");
  const active = rewards.filter((r) => r.status === "active");
  const completed = rewards.filter((r) => r.status === "completed");

  const VoucherCard = ({ r }: { r: EarnedReward }) => {
    const isActive = r.status === "active";
    const isDone = r.status === "completed";
    return (
      <div
        className={cn(
          "relative rounded-xl border-2 px-3 py-2.5 transition-all overflow-hidden",
          isDone && "border-muted bg-muted/30 opacity-70",
          isActive &&
            "border-amber-400/70 bg-gradient-to-br from-amber-200 via-orange-300 to-yellow-400 shadow-[0_8px_24px_-8px_rgba(234,140,40,0.65)] ring-2 ring-amber-300/60 animate-pulse-slow",
          !isActive && !isDone &&
            "border-amber-400/50 bg-gradient-to-br from-amber-100 via-orange-200 to-yellow-200 hover:border-amber-500/70 hover:shadow-[0_6px_20px_-6px_rgba(234,140,40,0.55)] hover:from-amber-200 hover:to-yellow-300"
        )}
      >
        <div className="flex items-start gap-2">
          <span className="text-lg leading-none mt-0.5">
            {isDone ? "✅" : isActive ? "✨" : "🎁"}
          </span>
          <div className="flex-1 min-w-0">
            <div
              className={cn(
                "text-sm font-semibold leading-tight",
                isDone && "line-through text-muted-foreground"
              )}
            >
              {r.label}
            </div>
            {r.todo_text && (
              <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                z úkolu: {r.todo_text}
              </div>
            )}
            {(isActive || isDone) && (
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {isActive && !isAdmin && (
                  <>
                    <span className="text-[10px] font-medium text-orange-800">
                      aktivní – čeká na potvrzení
                    </span>
                    <button
                      onClick={() => deactivate(r.id)}
                      className="text-[10px] text-muted-foreground hover:text-foreground underline"
                    >
                      zrušit
                    </button>
                  </>
                )}
                {isActive && isAdmin && (
                  <>
                    <Button
                      size="sm"
                      className="h-6 text-[11px] px-2 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => complete(r.id)}
                    >
                      <Check className="h-3 w-3" /> Splněno
                    </Button>
                    <button
                      onClick={() => deactivate(r.id)}
                      className="text-[10px] text-muted-foreground hover:text-foreground underline"
                    >
                      zrušit aktivaci
                    </button>
                  </>
                )}
                {isDone && r.completed_at && (
                  <span className="text-[10px] text-muted-foreground">
                    splněno {format(new Date(r.completed_at), "d.M.yyyy", { locale: cs })}
                  </span>
                )}
              </div>
            )}
          </div>
          {!isDone && !isActive && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px] px-2 gap-1 border-warning/40 text-warning hover:bg-warning/10 shrink-0"
              onClick={() => activate(r.id)}
            >
              <Sparkles className="h-3 w-3" /> Aktivovat
            </Button>
          )}
          {isAdmin && (
            <button
              onClick={() => remove(r.id)}
              className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
              title="Smazat poukázku"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  if (rewards.length === 0) {
    return (
      <div className="text-center py-8 space-y-2">
        <Gift className="h-10 w-10 text-muted-foreground/40 mx-auto" />
        <p className="text-sm text-muted-foreground">
          Zatím žádné poukázky. Dokonči úkol s odměnou a získej první! 🎁
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {active.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-warning" />
            <span className="text-xs font-semibold text-warning uppercase tracking-wider">
              Aktivní ({active.length})
            </span>
          </div>
          <div className="space-y-2">
            {active.map((r) => <VoucherCard key={r.id} r={r} />)}
          </div>
        </div>
      )}

      {available.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-warning" />
            <span className="text-xs font-semibold text-warning uppercase tracking-wider">
              K vyzvednutí ({available.length})
            </span>
          </div>
          <div className="space-y-2">
            {available.map((r) => <VoucherCard key={r.id} r={r} />)}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div className="space-y-1.5">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-2 w-full hover:opacity-80 transition-opacity"
          >
            <History className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Historie ({completed.length}) {showHistory ? "▼" : "▶"}
            </span>
          </button>
          {showHistory && (
            <div className="space-y-2">
              {completed.map((r) => <VoucherCard key={r.id} r={r} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
