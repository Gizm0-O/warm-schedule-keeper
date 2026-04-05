import { useState } from "react";
import { Plus, Trash2, Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  bought: boolean;
}

const ShoppingPage = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [newQty, setNewQty] = useState("");

  const addItem = () => {
    if (!newItem.trim()) return;
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: newItem.trim(), quantity: newQty.trim() || "1×", bought: false },
    ]);
    setNewItem("");
    setNewQty("");
  };

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, bought: !i.bought } : i))
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const toBuy = items.filter((i) => !i.bought);
  const bought = items.filter((i) => i.bought);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <ShoppingCart className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Nákupní seznam</h2>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Položka..."
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          className="flex-1"
        />
        <Input
          placeholder="Množství"
          value={newQty}
          onChange={(e) => setNewQty(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          className="w-24"
        />
        <Button onClick={addItem}>
          <Plus className="mr-1 h-4 w-4" /> Přidat
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm divide-y divide-border">
        {items.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Nákupní seznam je prázdný
          </p>
        )}
        {toBuy.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50">
            <button
              onClick={() => toggleItem(item.id)}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-primary/40 transition-colors hover:border-primary hover:bg-primary/10"
            />
            <span className="flex-1 text-sm text-foreground">{item.name}</span>
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {item.quantity}
            </span>
            <button onClick={() => removeItem(item.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {bought.length > 0 && (
          <>
            <div className="px-4 py-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                V košíku ({bought.length})
              </span>
            </div>
            {bought.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3 opacity-60">
                <button
                  onClick={() => toggleItem(item.id)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <span className="flex-1 text-sm text-foreground line-through">{item.name}</span>
                <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                  {item.quantity}
                </span>
                <button onClick={() => removeItem(item.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default ShoppingPage;
