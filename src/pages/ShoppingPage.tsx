import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Check, ShoppingCart, Minus, Filter, Pencil, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  type ShoppingCategory,
  CATEGORY_INFO,
} from "@/data/shoppingCategories";
import { useShoppingItems } from "@/hooks/useShoppingItems";
import { useWishlistItems } from "@/hooks/useWishlistItems";

const ALL_CATEGORIES = Object.keys(CATEGORY_INFO) as ShoppingCategory[];

const ShoppingPage = () => {
  const { items, addItem, toggleItem, removeItem, changeQty, renameItem, clearAll } = useShoppingItems();
  const { wishlist, addWish, toggleWish, removeWish, clearAll: clearWishlist } = useWishlistItems();
  const [newItem, setNewItem] = useState("");
  const [activeFilter, setActiveFilter] = useState<ShoppingCategory | null>(null);
  const [newWish, setNewWish] = useState("");

  const handleAddItem = () => {
    if (!newItem.trim()) return;
    addItem(newItem.trim());
    setNewItem("");
  };

  // categories present in current list
  const usedCategories = [...new Set(items.map((i) => i.category))];

  const filtered = activeFilter
    ? items.filter((i) => i.category === activeFilter)
    : items;

  const toBuy = filtered.filter((i) => !i.bought);
  const bought = filtered.filter((i) => i.bought);

  const CategoryBadge = ({ category }: { category: ShoppingCategory }) => {
    const info = CATEGORY_INFO[category];
    return (
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight whitespace-nowrap"
        style={{
          backgroundColor: `hsl(${info.color})`,
          color: `hsl(${info.textColor})`,
        }}
      >
        {info.label}
      </span>
    );
  };

  const ItemRow = ({ item, isBought }: { item: typeof items[0]; isBought: boolean }) => {
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(item.name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (editing) inputRef.current?.focus();
    }, [editing]);

    const commitEdit = () => {
      if (editValue.trim() && editValue.trim() !== item.name) {
        renameItem(item.id, editValue);
      } else {
        setEditValue(item.name);
      }
      setEditing(false);
    };

    return (
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50",
          isBought && "opacity-60"
        )}
      >
        <button
          onClick={() => toggleItem(item.id)}
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            isBought
              ? "border-transparent bg-primary text-primary-foreground"
              : "border-primary/40 hover:border-primary hover:bg-primary/10"
          )}
        >
          {isBought && <Check className="h-3.5 w-3.5" />}
        </button>

        <div className="flex flex-1 items-center gap-2 min-w-0">
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
              className={cn("text-sm text-foreground truncate cursor-pointer", isBought && "line-through")}
              onDoubleClick={() => { setEditValue(item.name); setEditing(true); }}
              title="Dvojklikem upravíš název"
            >
              {item.name}
            </span>
          )}
          <CategoryBadge category={item.category} />
        </div>

        {!editing && (
          <button
            onClick={() => { setEditValue(item.name); setEditing(true); }}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary transition-colors"
            title="Upravit název"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}

      {/* Quantity controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => changeQty(item.id, -1)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary transition-colors"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="min-w-[1.5rem] text-center text-xs font-medium text-foreground">
          {item.quantity}×
        </span>
        <button
          onClick={() => changeQty(item.id, 1)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary transition-colors"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      <button
        onClick={() => removeItem(item.id)}
        className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Nákupní seznam</h2>
        </div>
        {items.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="mr-1 h-4 w-4" /> Vymazat seznam
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Vymazat nákupní seznam?</AlertDialogTitle>
                <AlertDialogDescription>
                  Opravdu si přejete smazat celý nákupní seznam? Tuto akci nelze vrátit zpět.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Zrušit</AlertDialogCancel>
                <AlertDialogAction onClick={() => { clearAll(); setActiveFilter(null); }}>
                  Smazat vše
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Add item */}
      <div className="flex gap-2">
        <Input
          placeholder="Položka..."
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
          className="flex-1"
        />
        <Button onClick={handleAddItem}>
          <Plus className="mr-1 h-4 w-4" /> Přidat
        </Button>
      </div>

      {/* Category filter chips */}
      {usedCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveFilter(null)}
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
                onClick={() => setActiveFilter(isActive ? null : cat)}
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
        </div>
      )}

      {/* Item list */}
      <div className="glass rounded-2xl shadow-sm divide-y divide-border/50 animate-slide-up">
        {items.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Nákupní seznam je prázdný
          </p>
        )}
        {toBuy.map((item) => (
          <ItemRow key={item.id} item={item} isBought={false} />
        ))}
        {bought.length > 0 && (
          <>
            <div className="px-4 py-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                V košíku ({bought.length})
              </span>
            </div>
            {bought.map((item) => (
              <ItemRow key={item.id} item={item} isBought={true} />
            ))}
          </>
        )}
      </div>

      {/* Wishlist – věci ke koupi "někdy" */}
      <div className="mt-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wrench className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Domácnost</h2>
          </div>
          {wishlist.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="mr-1 h-4 w-4" /> Vymazat seznam
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Vymazat seznam?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Opravdu si přejete smazat celý seznam „Na koupit"? Tuto akci nelze vrátit zpět.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Zrušit</AlertDialogCancel>
                  <AlertDialogAction onClick={() => clearWishlist()}>
                    Smazat vše
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Šroubky, komoda, baterie..."
            value={newWish}
            onChange={(e) => setNewWish(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newWish.trim()) {
                addWish(newWish.trim());
                setNewWish("");
              }
            }}
            className="flex-1"
          />
          <Button
            variant="secondary"
            onClick={() => {
              if (!newWish.trim()) return;
              addWish(newWish.trim());
              setNewWish("");
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> Přidat
          </Button>
        </div>

        <div className="glass rounded-2xl shadow-sm divide-y divide-border/50 animate-slide-up">
          {wishlist.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Zatím nic – zapiš si sem věci, které potřebuješ koupit, ale nespěchají
            </p>
          )}
          {wishlist.filter((w) => !w.done).map((w) => (
            <div key={w.id} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors">
              <button
                onClick={() => toggleWish(w.id)}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/30 hover:border-primary hover:bg-primary/10 transition-colors"
              />
              <span className="flex-1 text-sm text-foreground">{w.name}</span>
              <button
                onClick={() => removeWish(w.id)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {wishlist.some((w) => w.done) && (
            <>
              <div className="px-4 py-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Koupeno ({wishlist.filter((w) => w.done).length})
                </span>
              </div>
              {wishlist.filter((w) => w.done).map((w) => (
                <div key={w.id} className="flex items-center gap-3 px-4 py-3 opacity-60">
                  <button
                    onClick={() => toggleWish(w.id)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <span className="flex-1 text-sm text-foreground line-through">{w.name}</span>
                  <button
                    onClick={() => removeWish(w.id)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShoppingPage;
