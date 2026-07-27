import { useEffect, useState, useCallback } from "react";
import { History, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { formatMonth } from "@/hooks/useFinance";
import { useToast } from "@/hooks/use-toast";

interface DeletedRow {
  id: string;
  entry_id: string;
  month: string;
  section: string;
  category: string | null;
  name: string;
  planned: number;
  actual: number;
  due_day: string | null;
  note: string | null;
  original_created_at: string | null;
  deleted_at: string;
}

const SECTION_LABEL: Record<string, string> = {
  income: "Příjmy",
  subscription: "Předplatné",
  fixed: "Fixní náklady",
  daily: "Každodenní",
  food: "Jídlo",
};

export function FinanceDeletedLog({ onRestored }: { onRestored: () => void }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<DeletedRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("finance_entries_deleted_log")
      .select("*")
      .order("deleted_at", { ascending: false })
      .limit(200);
    if (error) console.error("[finance-log]", error);
    setRows((data as DeletedRow[]) ?? []);
  }, []);

  useEffect(() => { if (open) load(); }, [open, load]);

  const restore = async (r: DeletedRow) => {
    setBusy(r.id);
    const { error } = await supabase.from("finance_entries").insert({
      id: r.entry_id,
      month: r.month,
      section: r.section,
      category: r.category,
      name: r.name,
      planned: r.planned,
      actual: r.actual,
      due_day: r.due_day,
      note: r.note,
    });
    if (error) {
      toast({ title: "Nelze obnovit", description: error.message, variant: "destructive" });
    } else {
      // remove from log so restored items disappear
      await supabase.from("finance_entries_deleted_log").delete().eq("id", r.id);
      toast({ title: "Obnoveno", description: `${r.name} vráceno do ${formatMonth(r.month)}` });
      setRows(prev => prev.filter(x => x.id !== r.id));
      onRestored();
    }
    setBusy(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" title="Historie smazaných">
          <History className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nedávno smazané (30 dní)</DialogTitle>
        </DialogHeader>
        {rows.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Zatím nic smazaného.
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map(r => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{r.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {SECTION_LABEL[r.section] ?? r.section} · {formatMonth(r.month)}
                    {r.category && r.category !== "__budget__" && ` · ${r.category}`}
                    {" · plán "}{Math.round(Number(r.planned)).toLocaleString("cs-CZ")}
                    {" · skut. "}{Math.round(Number(r.actual)).toLocaleString("cs-CZ")}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    smazáno {new Date(r.deleted_at).toLocaleString("cs-CZ")}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => restore(r)}
                  disabled={busy === r.id}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Obnovit
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
