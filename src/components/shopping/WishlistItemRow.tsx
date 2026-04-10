import { useState, useRef, useEffect } from "react";
import { Check, Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface WishlistItemRowProps {
  item: { id: string; name: string; done: boolean; quantity: number };
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onChangeQty: (id: string, delta: number) => void;
}

export const WishlistItemRow = ({ item, onToggle, onRemove, onRename, onChangeQty }: WishlistItemRowProps) => {
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
        item.done && "opacity-60"
      )}
    >
      <button
        onClick={() => onToggle(item.id)}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          isMobile ? "h-5 w-5" : "h-6 w-6",
          item.done
            ? "border-transparent bg-primary text-primary-foreground"
            : "border-primary/40 hover:border-primary hover:bg-primary/10"
        )}
      >
        {item.done && <Check className={cn(isMobile ? "h-3 w-3" : "h-3.5 w-3.5")} />}
      </button>

      <div className="flex flex-1 min-w-0 items-center gap-1.5">
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
          <span
            className={cn(
              "truncate cursor-pointer",
              isMobile ? "text-xs" : "text-sm",
              item.done && "line-through"
            )}
            onClick={() => { setEditValue(item.name); setEditing(true); }}
            title="Klikni pro úpravu"
          >
            {item.name}
          </span>
        )}
      </div>

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

      <button
        onClick={() => onRemove(item.id)}
        className="rounded-lg p-1 sm:p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
      >
        <Trash2 className={cn(isMobile ? "h-3.5 w-3.5" : "h-4 w-4")} />
      </button>
    </div>
  );
};
