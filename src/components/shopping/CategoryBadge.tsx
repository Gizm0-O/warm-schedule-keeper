import { useState, useRef, useEffect } from "react";
import {
  type ShoppingCategory,
  CATEGORY_INFO,
} from "@/data/shoppingCategories";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const ALL_CATEGORIES = Object.keys(CATEGORY_INFO) as ShoppingCategory[];

interface CategoryBadgeProps {
  category: ShoppingCategory;
  onChangeCategory?: (newCategory: ShoppingCategory) => void;
}

export const CategoryBadge = ({ category, onChangeCategory }: CategoryBadgeProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const info = CATEGORY_INFO[category];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onChangeCategory) setOpen((v) => !v);
        }}
        className={cn(
          "rounded-full px-2 py-0.5 font-semibold leading-tight whitespace-nowrap transition-opacity hover:opacity-80",
          isMobile ? "text-[8px]" : "text-[10px]"
        )}
        style={{
          backgroundColor: `hsl(${info.color})`,
          color: `hsl(${info.textColor})`,
        }}
        title="Změnit kategorii"
      >
        {info.label}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-[9999] min-w-[140px] max-w-[200px] rounded-xl border border-border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95">
          {ALL_CATEGORIES.map((cat) => {
            const catInfo = CATEGORY_INFO[cat];
            const isActive = cat === category;
            return (
              <button
                key={cat}
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeCategory?.(cat);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50 text-foreground"
                )}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: `hsl(${catInfo.color})` }}
                />
                {catInfo.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
