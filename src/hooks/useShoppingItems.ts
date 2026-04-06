import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type ShoppingCategory, detectCategory } from "@/data/shoppingCategories";

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  bought: boolean;
  category: ShoppingCategory;
}

export function useShoppingItems() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("shopping_items").select("*").order("created_at");
      if (data) setItems(data.map((r) => ({ ...r, category: r.category as ShoppingCategory })));
      setLoading(false);
    };
    fetch();
  }, []);

  const addItem = useCallback(async (name: string) => {
    const category = detectCategory(name);
    const { data } = await supabase
      .from("shopping_items")
      .insert({ name, quantity: 1, bought: false, category })
      .select()
      .single();
    if (data) setItems((prev) => [...prev, { ...data, category: data.category as ShoppingCategory }]);
  }, []);

  const toggleItem = useCallback(async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    await supabase.from("shopping_items").update({ bought: !item.bought }).eq("id", id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, bought: !i.bought } : i)));
  }, [items]);

  const removeItem = useCallback(async (id: string) => {
    await supabase.from("shopping_items").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const changeQty = useCallback(async (id: string, delta: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const next = item.quantity + delta;
    if (next < 1) return;
    await supabase.from("shopping_items").update({ quantity: next }).eq("id", id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: next } : i)));
  }, [items]);

  const renameItem = useCallback(async (id: string, newName: string) => {
    if (!newName.trim()) return;
    const category = detectCategory(newName.trim());
    await supabase.from("shopping_items").update({ name: newName.trim(), category }).eq("id", id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, name: newName.trim(), category } : i)));
  }, []);

  const clearAll = useCallback(async () => {
    await supabase.from("shopping_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    setItems([]);
  }, []);

  return { items, loading, addItem, toggleItem, removeItem, changeQty, renameItem, clearAll };
}
