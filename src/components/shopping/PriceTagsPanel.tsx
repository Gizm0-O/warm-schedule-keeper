import { useEffect, useState } from "react";
import { Plus, Tag, Trash2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PriceTag {
  id: string;
  name: string;
  price: number;
  unit: string;
  note: string | null;
}

const UNITS = ["ks", "balení", "kg", "g", "l", "ml", "m"] as const;

export default function PriceTagsPanel() {
  const [items, setItems] = useState<PriceTag[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState<string>("ks");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editUnit, setEditUnit] = useState("ks");
  const [editName, setEditName] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("price_tags" as any)
      .select("*")
      .order("name", { ascending: true });
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

  const add = async () => {
    const p = parseFloat(price.replace(",", "."));
    if (!name.trim() || isNaN(p)) { toast.error("Vyplň název i cenu"); return; }
    const { error } = await supabase.from("price_tags" as any).insert({ name: name.trim(), price: p, unit });
    if (error) { toast.error(error.message); return; }
    setName(""); setPrice("");
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("price_tags" as any).delete().eq("id", id);
    load();
  };

  const startEdit = (t: PriceTag) => {
    setEditingId(t.id);
    setEditName(t.name);
    setEditPrice(String(t.price));
    setEditUnit(t.unit);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const p = parseFloat(editPrice.replace(",", "."));
    if (!editName.trim() || isNaN(p)) { toast.error("Neplatné údaje"); return; }
    await supabase.from("price_tags" as any).update({ name: editName.trim(), price: p, unit: editUnit }).eq("id", editingId);
    setEditingId(null);
    load();
  };

  return (
    <div className="glass rounded-2xl shadow-sm p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Tag className="h-5 w-5 text-primary" />
        <h3 className="font-bold">Cenovky</h3>
        <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
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
            onKeyDown={(e) => e.key === "Enter" && add()}
            className="h-8 text-sm flex-1"
          />
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger className="h-8 w-[80px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {UNITS.map((u) => <SelectItem key={u} value={u} className="text-xs">/{u}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="icon" onClick={add} className="h-8 w-8 shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="divide-y divide-border/50 -mx-2">
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4 italic">
            Zatím žádné cenovky
          </p>
        )}
        {items.map((t) => (
          <div key={t.id} className="px-2 py-2 group">
            {editingId === t.id ? (
              <div className="space-y-1">
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-7 text-xs" />
                <div className="flex gap-1">
                  <Input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="h-7 text-xs flex-1" />
                  <Select value={editUnit} onValueChange={setEditUnit}>
                    <SelectTrigger className="h-7 w-[70px] text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => <SelectItem key={u} value={u} className="text-xs">/{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit}><Check className="h-3 w-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="h-3 w-3" /></Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.name}</div>
                  <div className="text-xs text-primary font-semibold">
                    {Number(t.price).toLocaleString("cs-CZ", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} Kč
                    <span className="text-muted-foreground font-normal">/{t.unit}</span>
                  </div>
                </div>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEdit(t)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => remove(t.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
