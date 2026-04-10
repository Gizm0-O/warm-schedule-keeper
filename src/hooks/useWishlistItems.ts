import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WishlistItem {
  id: string;
  name: string;
  done: boolean;
  quantity: number;
}

export function useWishlistItems() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("wishlist_items").select("*").order("created_at");
      if (data) setWishlist(data.map((r) => ({ ...r, quantity: r.quantity ?? 1 })));
      setLoading(false);
    };
    fetch();
  }, []);

  const addWish = useCallback(async (name: string) => {
    const { data } = await supabase.from("wishlist_items").insert({ name, done: false, quantity: 1 }).select().single();
    if (data) setWishlist((prev) => [...prev, { ...data, quantity: data.quantity ?? 1 }]);
  }, []);

  const toggleWish = useCallback(async (id: string) => {
    const item = wishlist.find((w) => w.id === id);
    if (!item) return;
    await supabase.from("wishlist_items").update({ done: !item.done }).eq("id", id);
    setWishlist((prev) => prev.map((w) => (w.id === id ? { ...w, done: !w.done } : w)));
  }, [wishlist]);

  const removeWish = useCallback(async (id: string) => {
    await supabase.from("wishlist_items").delete().eq("id", id);
    setWishlist((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const renameWish = useCallback(async (id: string, newName: string) => {
    if (!newName.trim()) return;
    await supabase.from("wishlist_items").update({ name: newName.trim() }).eq("id", id);
    setWishlist((prev) => prev.map((w) => (w.id === id ? { ...w, name: newName.trim() } : w)));
  }, []);

  const changeWishQty = useCallback(async (id: string, delta: number) => {
    const item = wishlist.find((w) => w.id === id);
    if (!item) return;
    const next = item.quantity + delta;
    if (next < 1) return;
    await supabase.from("wishlist_items").update({ quantity: next }).eq("id", id);
    setWishlist((prev) => prev.map((w) => (w.id === id ? { ...w, quantity: next } : w)));
  }, [wishlist]);

  const clearAll = useCallback(async () => {
    await supabase.from("wishlist_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    setWishlist([]);
  }, []);

  return { wishlist, loading, addWish, toggleWish, removeWish, renameWish, changeWishQty, clearAll };
}
