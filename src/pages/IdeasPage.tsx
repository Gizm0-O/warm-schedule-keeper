import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Lightbulb, Filter } from "lucide-react";
import IdeaCard, { type Idea } from "@/components/ideas/IdeaCard";
import IdeaFormDialog from "@/components/ideas/IdeaFormDialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_FILTERS: { value: "all" | Idea["status"]; label: string }[] = [
  { value: "all", label: "Vše" },
  { value: "new", label: "Nové" },
  { value: "planned", label: "Plánované" },
  { value: "in_progress", label: "Realizuje se" },
  { value: "done", label: "Hotovo" },
  { value: "rejected", label: "Zamítnuto" },
];

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Idea | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | Idea["status"]>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ideas")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setIdeas((data ?? []) as Idea[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const categories = useMemo(() => {
    const s = new Set<string>();
    ideas.forEach((i) => i.category && s.add(i.category));
    return Array.from(s).sort();
  }, [ideas]);

  const filtered = useMemo(() => {
    return ideas.filter((i) => {
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (categoryFilter !== "all" && i.category !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!i.name.toLowerCase().includes(q) && !(i.description ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [ideas, statusFilter, categoryFilter, search]);

  const startNew = () => { setEditing(null); setOpen(true); };
  const startEdit = (i: Idea) => { setEditing(i); setOpen(true); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Lightbulb className="h-7 w-7 text-amber-500" /> Nápady
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Co bychom chtěli zrealizovat ✨</p>
        </div>
        <Button onClick={startNew}>
          <Plus className="h-4 w-4 mr-1" /> Nový nápad
        </Button>
      </div>

      <div className="glass rounded-xl p-3 flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-all",
              statusFilter === f.value ? "bg-primary text-primary-foreground" : "bg-secondary/50 hover:bg-secondary text-muted-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
        {categories.length > 0 && (
          <>
            <span className="h-4 w-px bg-border mx-1" />
            <button
              onClick={() => setCategoryFilter("all")}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all",
                categoryFilter === "all" ? "bg-primary text-primary-foreground" : "bg-secondary/50 hover:bg-secondary text-muted-foreground"
              )}
            >
              Všechny kategorie
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all",
                  categoryFilter === c ? "bg-primary text-primary-foreground" : "bg-secondary/50 hover:bg-secondary text-muted-foreground"
                )}
              >
                #{c}
              </button>
            ))}
          </>
        )}
        <Input
          placeholder="Hledat…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto max-w-[200px] h-8"
        />
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Načítám…</div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-muted-foreground italic">
          {ideas.length === 0 ? "Zatím žádné nápady. Přidej první ✨" : "Nic neodpovídá filtru."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((i) => (
            <IdeaCard key={i.id} idea={i} onEdit={() => startEdit(i)} onChanged={load} />
          ))}
        </div>
      )}

      <IdeaFormDialog open={open} onOpenChange={setOpen} idea={editing} onSaved={load} />
    </div>
  );
}
