import { useState } from "react";
import { Plus, Trash2, ShoppingCart, Wrench, ChevronDown, ChevronRight } from "lucide-react";
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
import { type ShoppingCategory } from "@/data/shoppingCategories";
import { useShoppingItems } from "@/hooks/useShoppingItems";
import { useWishlistItems } from "@/hooks/useWishlistItems";
import { ShoppingItemRow } from "@/components/shopping/ShoppingItemRow";
import { WishlistItemRow } from "@/components/shopping/WishlistItemRow";
import { CategoryFilter } from "@/components/shopping/CategoryFilter";
import { useIsMobile } from "@/hooks/use-mobile";

const MAX_COMPLETED = 50;

const ShoppingPage = () => {
  const { items, addItem, toggleItem, removeItem, changeQty, renameItem, changeCategory, clearAll } = useShoppingItems();
  const { wishlist, addWish, toggleWish, removeWish, renameWish, changeWishQty, clearAll: clearWishlist } = useWishlistItems();
  const [newItem, setNewItem] = useState("");
  const [activeFilter, setActiveFilter] = useState<ShoppingCategory | null>(null);
  const [newWish, setNewWish] = useState("");
  const [showBought, setShowBought] = useState(false);
  const [showDoneWishes, setShowDoneWishes] = useState(false);
  const isMobile = useIsMobile();

  const handleAddItem = () => {
    if (!newItem.trim()) return;
    addItem(newItem.trim());
    setNewItem("");
  };

  const usedCategories = [...new Set(items.map((i) => i.category))];

  const filtered = activeFilter
    ? items.filter((i) => i.category === activeFilter)
    : items;

  const toBuy = filtered.filter((i) => !i.bought);
  const bought = filtered.filter((i) => i.bought).slice(0, MAX_COMPLETED);

  const doneWishes = wishlist.filter((w) => w.done).slice(0, MAX_COMPLETED);
  const activeWishes = wishlist.filter((w) => !w.done);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Nákupní seznam</h2>
        </div>
        {items.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 sm:w-auto sm:px-3">
                <Trash2 className="h-5 w-5 sm:h-[22px] sm:w-[22px]" />
                <span className="hidden sm:inline sm:ml-1 text-sm">Vymazat seznam</span>
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

      {/* Category filter — reduced gap */}
      <div className="-mb-3">
        <CategoryFilter
          usedCategories={usedCategories}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>

      {/* Item list */}
      <div className="glass rounded-2xl shadow-sm divide-y divide-border/50 animate-slide-up overflow-visible">
        {items.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Nákupní seznam je prázdný
          </p>
        )}
        {toBuy.map((item) => (
          <ShoppingItemRow
            key={item.id}
            item={item}
            isBought={false}
            onToggle={toggleItem}
            onRemove={removeItem}
            onChangeQty={changeQty}
            onRename={renameItem}
            onChangeCategory={changeCategory}
          />
        ))}
        {bought.length > 0 && (
          <>
            <button
              onClick={() => setShowBought((v) => !v)}
              className="flex w-full items-center gap-1.5 px-4 py-2 hover:bg-accent/30 transition-colors"
            >
              {showBought ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                V košíku ({bought.length})
              </span>
            </button>
            {showBought && bought.map((item) => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                isBought={true}
                onToggle={toggleItem}
                onRemove={removeItem}
                onChangeQty={changeQty}
                onRename={renameItem}
                onChangeCategory={changeCategory}
              />
            ))}
          </>
        )}
      </div>

      {/* Wishlist / Domácnost */}
      <div className="mt-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wrench className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Domácnost</h2>
          </div>
          {wishlist.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 sm:w-auto sm:px-3">
                  <Trash2 className="h-5 w-5 sm:h-[22px] sm:w-[22px]" />
                  <span className="hidden sm:inline sm:ml-1 text-sm">Vymazat seznam</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Vymazat seznam?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Opravdu si přejete smazat celý seznam „Domácnost"? Tuto akci nelze vrátit zpět.
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
          {activeWishes.map((w) => (
            <WishlistItemRow
              key={w.id}
              item={w}
              onToggle={toggleWish}
              onRemove={removeWish}
              onRename={renameWish}
              onChangeQty={changeWishQty}
            />
          ))}
          {doneWishes.length > 0 && (
            <>
              <button
                onClick={() => setShowDoneWishes((v) => !v)}
                className="flex w-full items-center gap-1.5 px-4 py-2 hover:bg-accent/30 transition-colors"
              >
                {showDoneWishes ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Koupeno ({doneWishes.length})
                </span>
              </button>
              {showDoneWishes && doneWishes.map((w) => (
                <WishlistItemRow
                  key={w.id}
                  item={w}
                  onToggle={toggleWish}
                  onRemove={removeWish}
                  onRename={renameWish}
                  onChangeQty={changeWishQty}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShoppingPage;
