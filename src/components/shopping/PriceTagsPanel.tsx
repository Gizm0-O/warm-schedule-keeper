import { useEffect, useMemo, useState } from "react";
import { Plus, Tag, Trash2, Pencil, Check, X, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PriceTag {
  id: string;
  name: string;
  price: number;
  unit: string;
  quantity: number;
  note: string | null;
  store: string | null;
}

const UNITS = ["ks", "balení", "kg", "g", "l", "ml", "m"] as const;

function formatQty(q: number, unit: string) {
  const n = Number(q);
  if (n === 1) return `/${unit}`;
  const s = n.toLocaleString("cs-CZ", { maximumFractionDigits: 3 });
  return `/${s} ${unit}`;
}

function formatPrice(p: number) {
  return Number(p).toLocaleString("cs-CZ", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function PriceTagsPanel() {
  const [items, setItems] = useState<PriceTag[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<string>("ks");
  const [store, setStore] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [variantPrice, setVariantPrice] = useState("");
  const [variantQty, setVariantQty] = useState("1");
  const [variantUnit, setVariantUnit] = useState("ks");
  const [variantStore, setVariantStore] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editQty, setEditQty] = useState("1");
  const [editUnit, setEditUnit] = useState("ks");
  const [editStore, setEditStore] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("price_tags" as any)
      .select("*")
      .order("name", { ascending: true })
      .order("created_at", { ascending: true });
    if (data) setItems(data as any);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("price_tags_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "price_tags" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, PriceTag[]>();
    for (const t of items) {
      const key = t.name.trim().toLowerCase();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return Array.from(map.entries()).map(([k, arr]) => ({
      key: k,
      name: arr[0].name,
      variants: arr,
    }));
  }, [items]);

  const add = async () => {
    const p = parseFloat(price.replace(",", "."));
    const q = parseFloat(quantity.replace(",", ".")) || 1;
    if (!name.trim() || isNaN(p)) { toast.error("Vyplň název i cenu"); return; }
    const { error } = await supabase.from("price_tags" as any).insert({ name: name.trim(), price: p, unit, quantity: q, store: store.trim() || null });
    if (error) { toast.error(error.message); return; }
    setName(""); setPrice(""); setQuantity("1"); setStore("");
    load();
  };

  const addVariant = async (groupName: string) => {
    const p = parseFloat(variantPrice.replace(",", "."));
    const q = parseFloat(variantQty.replace(",", ".")) || 1;
    if (isNaN(p)) { toast.error("Vyplň cenu"); return; }
    const { error } = await supabase.from("price_tags" as any).insert({ name: groupName, price: p, unit: variantUnit, quantity: q, store: variantStore.trim() || null });
    if (error) { toast.error(error.message); return; }
    setAddingFor(null); setVariantPrice(""); setVariantQty("1"); setVariantUnit("ks"); setVariantStore("");
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("price_tags" as any).delete().eq("id", id);
    load();
  };

  const startEdit = (t: PriceTag) => {
    setEditingId(t.id);
    setEditPrice(String(t.price));
    setEditQty(String(t.quantity ?? 1));
    setEditUnit(t.unit);
    setEditStore(t.store ?? "");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const p = parseFloat(editPrice.replace(",", "."));
    const q = parseFloat(editQty.replace(",", ".")) || 1;
    if (isNaN(p)) { toast.error("Neplatné údaje"); return; }
    await supabase.from("price_tags" as any).update({ price: p, unit: editUnit, quantity: q, store: editStore.trim() || null }).eq("id", editingId);
    setEditingId(null);
    load();
  };

  return (
    <div className="glass rounded-2xl shadow-sm p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Tag className="h-5 w-5 text-primary" />
        <h3 className="font-bold">Cenovky</h3>
        <span className="ml-auto text-xs text-muted-foreground">{groups.length}</span>
      </div>

      <div className="space-y-2">
        <Input
          placeholder="Název"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 text-sm"
        />
        <div className="flex gap-1">
          <Input
            placeholder="Cena"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-8 text-sm flex-1 min-w-0"
          />
          <span className="text-xs text-muted-foreground self-center">/</span>
          <Input
            placeholder="1"
            inputMode="decimal"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="h-8 text-sm w-12"
          />
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger className="h-8 w-[70px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {UNITS.map((u) => <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="icon" onClick={add} className="h-8 w-8 shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Input
          placeholder="Obchod (např. DM) – nepovinné"
          value={store}
          onChange={(e) => setStore(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      <div className="divide-y divide-border/50 -mx-2">
        {groups.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4 italic">
            Zatím žádné cenovky
          </p>
        )}
        {groups.map((g) => {
          const isOpen = openGroups[g.key] ?? true;
          const hasMultiple = g.variants.length > 1;
          return (
            <div key={g.key} className="px-2 py-2 group">
              <div className="flex items-center gap-1">
                {hasMultiple ? (
                  <button
                    onClick={() => setOpenGroups((o) => ({ ...o, [g.key]: !isOpen }))}
                    className="p-0.5 hover:bg-accent/40 rounded"
                  >
                    {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </button>
                ) : <span className="w-4" />}
                <div className="text-sm font-medium truncate flex-1">{g.name}</div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => { setAddingFor(g.name); setVariantPrice(""); setVariantQty("1"); setVariantUnit(g.variants[0].unit); setVariantStore(""); }}
                  title="Přidat variantu"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {isOpen && (
                <div className="pl-5 mt-1 space-y-1">
                  {g.variants.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 group/v">
                      {editingId === t.id ? (
                        <div className="flex flex-wrap gap-1 flex-1">
                          <Input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="h-7 text-xs w-14" />
                          <Input value={editQty} onChange={(e) => setEditQty(e.target.value)} className="h-7 text-xs w-10" />
                          <Select value={editUnit} onValueChange={setEditUnit}>
                            <SelectTrigger className="h-7 w-[60px] text-[10px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {UNITS.map((u) => <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Obchod"
                            value={editStore}
                            onChange={(e) => setEditStore(e.target.value)}
                            className="h-7 text-xs w-full"
                          />
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit}><Check className="h-3 w-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="h-3 w-3" /></Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 text-xs">
                            <span className="text-primary font-semibold">{formatPrice(t.price)} Kč</span>
                            <span className="text-muted-foreground">{formatQty(t.quantity ?? 1, t.unit)}</span>
                            {t.store && (
                              <span className="ml-1 text-muted-foreground">– {t.store}</span>
                            )}
                          </div>
                          <div className="flex opacity-0 group-hover/v:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEdit(t)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => remove(t.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {addingFor === g.name && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      <Input
                        placeholder="Cena"
                        inputMode="decimal"
                        value={variantPrice}
                        onChange={(e) => setVariantPrice(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addVariant(g.name)}
                        autoFocus
                        className="h-7 text-xs flex-1 min-w-0"
                      />
                      <span className="text-xs text-muted-foreground self-center">/</span>
                      <Input
                        placeholder="1"
                        inputMode="decimal"
                        value={variantQty}
                        onChange={(e) => setVariantQty(e.target.value)}
                        className="h-7 text-xs w-10"
                      />
                      <Select value={variantUnit} onValueChange={setVariantUnit}>
                        <SelectTrigger className="h-7 w-[60px] text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {UNITS.map((u) => <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => addVariant(g.name)}><Check className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setAddingFor(null)}><X className="h-3 w-3" /></Button>
                      <Input
                        placeholder="Obchod (nepovinné)"
                        value={variantStore}
                        onChange={(e) => setVariantStore(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addVariant(g.name)}
                        className="h-7 text-xs w-full"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
