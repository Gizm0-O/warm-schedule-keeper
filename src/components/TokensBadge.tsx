import { Coins, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTokens } from "@/hooks/useTokens";
import { useAdminMode } from "@/hooks/useAdminMode";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TokensBadgeProps {
  className?: string;
}

/**
 * Minimalist gaming-style badge showing Barča's token balance.
 * Admin sees +/- controls.
 */
export default function TokensBadge({ className }: TokensBadgeProps) {
  const { balance, max, setBalance, loading } = useTokens();
  const isAdmin = useAdminMode();

  if (loading) return null;

  const lowGlow = balance === 0;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "group relative inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 transition-all",
              "bg-gradient-to-br from-amber-400/20 via-orange-400/15 to-amber-600/20",
              "border-amber-400/40 shadow-[0_0_0_1px_hsl(45_90%_55%/0.15),0_2px_8px_-2px_hsl(35_95%_55%/0.4)]",
              "hover:shadow-[0_0_0_1px_hsl(45_90%_55%/0.25),0_3px_14px_-2px_hsl(35_95%_55%/0.55)]",
              lowGlow && "opacity-60",
              className,
            )}
          >
            {isAdmin && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setBalance(balance - 1); }}
                disabled={balance <= 0}
                aria-label="Odebrat token"
                className="flex h-5 w-5 items-center justify-center rounded text-amber-700 hover:bg-amber-500/20 disabled:opacity-30 dark:text-amber-300"
              >
                <Minus className="h-3 w-3" />
              </button>
            )}
            <Coins
              className={cn(
                "h-4 w-4 text-amber-500 drop-shadow-[0_0_4px_hsl(40_95%_55%/0.6)]",
                "transition-transform group-hover:rotate-12",
              )}
            />
            <span className="text-sm font-bold tabular-nums tracking-wide text-amber-700 dark:text-amber-200">
              {balance}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-amber-700/60 dark:text-amber-300/60">
              / {max}
            </span>
            {isAdmin && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setBalance(balance + 1); }}
                disabled={balance >= max}
                aria-label="Přidat token"
                className="flex h-5 w-5 items-center justify-center rounded text-amber-700 hover:bg-amber-500/20 disabled:opacity-30 dark:text-amber-300"
              >
                <Plus className="h-3 w-3" />
              </button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <div className="font-semibold">Tokeny Barči</div>
          <div className="text-muted-foreground">1 token = přehození Tadeášovy směny na „Z domu"</div>
          <div className="text-muted-foreground">+1 každou neděli · +1 každého 20.</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
