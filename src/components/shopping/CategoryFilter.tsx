import { useState } from "react";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  type ShoppingCategory,
  CATEGORY_INFO,
} from "@/data/shoppingCategories";

const ALL_CATEGORIES = Object.keys(CATEGORY_INFO) as ShoppingCategory[];

interface CategoryFilterProps {
  usedCategories: ShoppingCategory[];
  activeFilter: ShoppingCategory | null;
  onFilterChange: (cat: ShoppingCategory | null) => void;
}

export const CategoryFilter = ({ usedCategories, activeFilter, onFilterChange }: CategoryFilterProps) => {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (usedCategories.length === 0) return null;

  const chips = (
    <>
      <button
        onClick={() => { onFilterChange(null); setMobileOpen(false); }}
        className={cn(
          "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors",
          activeFilter === null
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground hover:bg-accent"
        )}
      >
        <Filter className="h-3 w-3" />
        Vše
      </button>
      {ALL_CATEGORIES.filter((c) => usedCategories.includes(c)).map((cat) => {
        const info = CATEGORY_INFO[cat];
        const isActive = activeFilter === cat;
        return (
          <button
            key={cat}
            onClick={() => { onFilterChange(isActive ? null : cat); setMobileOpen(false); }}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-all",
              isActive ? "ring-2 ring-ring ring-offset-1 ring-offset-background" : "opacity-80 hover:opacity-100"
            )}
            style={{
              backgroundColor: `hsl(${info.color})`,
              color: `hsl(${info.textColor})`,
            }}
          >
            {info.label}
          </button>
        );
      })}
    </>
  );

  if (isMobile) {
    return (
      <div className="relative">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            activeFilter
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          {activeFilter ? CATEGORY_INFO[activeFilter].label : "Filtr"}
        </button>
        {mobileOpen && (
          <div className="absolute left-0 top-full mt-1 z-50 flex flex-wrap gap-1.5 rounded-xl border border-border bg-popover p-2 shadow-lg animate-in fade-in-0 zoom-in-95 min-w-[200px]">
            {chips}
          </div>
        )}
      </div>
    );
  }

  return <div className="flex flex-wrap gap-1.5">{chips}</div>;
};
