import { useState, useRef, useEffect } from "react";
import { Check, Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { type ShoppingCategory } from "@/data/shoppingCategories";
import { CategoryBadge } from "./CategoryBadge";

export interface ShoppingItemData {
  id: string;
  name: string;
  quantity: number;
  bought: boolean;
  category: ShoppingCategory;
}

interface ShoppingItemRowProps {
  item: ShoppingItemData;
  isBought: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onChangeQty: (id: string, delta: number) => void;
  onRename: (id: string, newName: string) => void;
  onChangeCategory: (id: string, newCategory: ShoppingCategory) => void;
}

export const ShoppingItemRow = ({
  item,
  isBought,
  onToggle,
  onRemove,
  onChangeQty,
  onRename,
  onChangeCategory,
}: ShoppingItemRowProps) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commitEdit = () => {
    if (editValue.trim() && editValue.trim() !== item.name) {
      onRename(item.id, editValue);
    } else {
      setEditValue(item.name);
    }
    setEditing(false);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2.5 transition-colors hover:bg-accent/50 sm:gap-3 sm:px-4 sm:py-3",
        isBought && "opacity-60"
      )}
    >
      {/* Check circle */}
      <button
        onClick={() => onToggle(item.id)}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          isMobile ? "h-5 w-5" : "h-6 w-6",
          isBought
            ? "border-transparent bg-primary text-primary-foreground"
            : "border-primary/40 hover:border-primary hover:bg-primary/10"
        )}
      >
        {isBought && <Check className={cn(isMobile ? "h-3 w-3" : "h-3.5 w-3.5")} />}
      </button>

      {/* Name + category */}
      <div className="flex flex-1 min-w-0 items-center gap-1.5 sm:gap-2">
        {editing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") { setEditValue(item.name); setEditing(false); }
            }}
            className="flex-1 bg-transparent text-sm text-foreground border-b border-primary/40 outline-none py-0.5"
          />
        ) : (
          <div
            className={cn(
              "flex min-w-0 cursor-pointer",
              isMobile ? "flex-col gap-0.5" : "flex-row items-center gap-2"
            )}
            onClick={() => { setEditValue(item.name); setEditing(true); }}
            title="Klikni pro úpravu"
          >
            <span
              className={cn(
                "text-foreground truncate",
                isMobile ? "text-xs" : "text-sm",
                isBought && "line-through"
              )}
            >
              {item.name}
            </span>
            <CategoryBadge
              category={item.category}
              onChangeCategory={(cat) => onChangeCategory(item.id, cat)}
            />
          </div>
        )}
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        <button
          onClick={() => onChangeQty(item.id, -1)}
          className={cn(
            "flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary transition-colors",
            isMobile ? "h-5 w-5" : "h-6 w-6"
          )}
        >
          <Minus className={cn(isMobile ? "h-2.5 w-2.5" : "h-3 w-3")} />
        </button>
        <span className={cn(
          "min-w-[1.2rem] text-center font-medium text-foreground",
          isMobile ? "text-[10px]" : "text-xs"
        )}>
          {item.quantity}×
        </span>
        <button
          onClick={() => onChangeQty(item.id, 1)}
          className={cn(
            "flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary transition-colors",
            isMobile ? "h-5 w-5" : "h-6 w-6"
          )}
        >
          <Plus className={cn(isMobile ? "h-2.5 w-2.5" : "h-3 w-3")} />
        </button>
      </div>

      {/* Delete */}
      <button
        onClick={() => onRemove(item.id)}
        className="rounded-lg p-1 sm:p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
      >
        <Trash2 className={cn(isMobile ? "h-3.5 w-3.5" : "h-4 w-4")} />
      </button>
    </div>
  );
};
