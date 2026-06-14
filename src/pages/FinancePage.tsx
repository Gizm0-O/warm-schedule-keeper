import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  useFinance, FinanceEntry, FinanceSection,
  formatMonth, currentMonth, shiftMonth,
} from "@/hooks/useFinance";
import { cn } from "@/lib/utils";

const SECTION_LABELS: Record<FinanceSection, string> = {
  income: "Příjmy",
  subscription: "Předplatné",
  fixed: "Fixní náklady",
  daily: "Každodenní výdaje",
  food: "Jídlo",
};

const fmt = (n: number) => `${Math.round(n).toLocaleString("cs-CZ")} Kč`;

export default function FinancePage() {
  const [month, setMonth] = useState(currentMonth());
  const { entries, loading, add, update, remove } = useFinance(month);
  const [addOpen, setAddOpen] = useState(false);

  const bySection = useMemo(() => {
    const map: Record<FinanceSection, FinanceEntry[]> = {
      income: [], subscription: [], fixed: [], daily: [], food: [],
    };
    entries.forEach(e => map[e.section]?.push(e));
    return map;
  }, [entries]);

  const sum = (arr: FinanceEntry[], key: "planned" | "actual") =>
    arr.reduce((s, e) => s + Number(e[key] || 0), 0);

  const totalIncomePlan = sum(bySection.income, "planned");
  const totalIncomeAct = sum(bySection.income, "actual");
  const totalExpensesPlan =
    sum(bySection.subscription, "planned") + sum(bySection.fixed, "planned") +
    sum(bySection.daily, "planned") + sum(bySection.food, "planned");
  const totalExpensesAct =
    sum(bySection.subscription, "actual") + sum(bySection.fixed, "actual") +
    sum(bySection.daily, "actual") + sum(bySection.food, "actual");
  const balance = totalIncomeAct - totalExpensesAct;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Finance</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setMonth(m => shiftMonth(m, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[140px] text-center font-semibold">{formatMonth(month)}</div>
          <Button variant="ghost" size="icon" onClick={() => setMonth(m => shiftMonth(m, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={() => setAddOpen(true)} className="ml-2">
            <Plus className="h-4 w-4 mr-1" /> Přidat
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          icon={<TrendingUp className="h-5 w-5 text-green-500" />}
          label="Příjmy"
          actual={totalIncomeAct}
          planned={totalIncomePlan}
        />
        <SummaryCard
          icon={<TrendingDown className="h-5 w-5 text-red-500" />}
          label="Výdaje"
          actual={totalExpensesAct}
          planned={totalExpensesPlan}
          overBad
        />
        <div className={cn(
          "rounded-2xl p-4 glass-subtle border",
          balance >= 0 ? "border-green-500/30" : "border-red-500/30"
        )}>
          <div className="text-sm text-muted-foreground">Zůstatek</div>
          <div className={cn("text-2xl font-bold mt-1", balance >= 0 ? "text-green-500" : "text-red-500")}>
            {fmt(balance)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Plán: {fmt(totalIncomePlan - totalExpensesPlan)}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Načítám…</div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SectionCard title={SECTION_LABELS.income} items={bySection.income} section="income" onUpdate={update} onRemove={remove} positive />
            <SectionCard title={SECTION_LABELS.subscription} items={bySection.subscription} section="subscription" onUpdate={update} onRemove={remove} paidToggle />
            <SectionCard title={SECTION_LABELS.fixed} items={bySection.fixed} section="fixed" onUpdate={update} onRemove={remove} showDue />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title={SECTION_LABELS.food} items={bySection.food} section="food" onUpdate={update} onRemove={remove} />
            <SectionCard title={SECTION_LABELS.daily} items={bySection.daily} section="daily" onUpdate={update} onRemove={remove} showCategory />
          </div>
        </div>
      )}

      <AddDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={async (sec, name, planned, actual, cat, due) => {
          const ok = await add(sec, name, planned, actual, cat, due);
          if (ok) setAddOpen(false);
        }}
      />
    </div>
  );
}

function SummaryCard({
  icon, label, actual, planned, overBad,
}: { icon: React.ReactNode; label: string; actual: number; planned: number; overBad?: boolean }) {
  const diff = actual - planned;
  const diffColor = overBad
    ? diff > 0 ? "text-red-500" : "text-green-500"
    : diff >= 0 ? "text-green-500" : "text-red-500";
  return (
    <div className="rounded-2xl p-4 glass-subtle border">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">{icon}{label}</div>
      <div className="text-2xl font-bold mt-1">{fmt(actual)}</div>
      <div className="text-xs text-muted-foreground mt-1">
        Plán: {fmt(planned)} <span className={cn("ml-2 font-medium", diffColor)}>
          {diff >= 0 ? "+" : ""}{fmt(diff)}
        </span>
      </div>
    </div>
  );
}

function SectionCard({
  title, items, section, onUpdate, onRemove, positive, showDue, showCategory, paidToggle,
}: {
  title: string;
  items: FinanceEntry[];
  section: FinanceSection;
  onUpdate: (id: string, patch: Partial<FinanceEntry>) => Promise<boolean>;
  onRemove: (id: string) => void;
  positive?: boolean;
  showDue?: boolean;
  showCategory?: boolean;
  paidToggle?: boolean;
}) {
  const totalP = items.reduce((s, e) => s + Number(e.planned || 0), 0);
  const totalA = items.reduce((s, e) => s + Number(e.actual || 0), 0);
  return (
    <div className="rounded-2xl glass-subtle border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold">{title}</h3>
        <div className="text-sm text-muted-foreground">
          <span className={cn("font-semibold", positive ? "text-green-500" : "text-foreground")}>
            {fmt(totalA)}
          </span>
          <span className="text-xs ml-2">/ {fmt(totalP)}</span>
        </div>
      </div>
      <div className="px-4 py-1.5 border-b border-border/50 text-xs text-muted-foreground flex items-center gap-2 select-none">
        {paidToggle && <div className="h-5 w-5 shrink-0" />}
        {showCategory && <div className="min-w-[80px] shrink-0 text-center" />}
        <div className="flex-1 min-w-0">Položka</div>
        {showDue && <div className="w-12 text-center shrink-0">Datum</div>}
        <div className="w-20 text-right shrink-0">Plán</div>
        <div className={cn("text-right shrink-0", paidToggle ? "w-20" : "w-24")}>Částka</div>
        <div className="w-6 shrink-0" />
      </div>
      <div className="max-h-[420px] overflow-y-auto divide-y divide-border/50">
        {items.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">Žádné položky</div>
        )}
        {items.map(e => (
          <Row key={e.id} entry={e} onUpdate={onUpdate} onRemove={onRemove}
               showDue={showDue} showCategory={showCategory} positive={positive} paidToggle={paidToggle} />
        ))}
      </div>
    </div>
  );
}

function Row({
  entry, onUpdate, onRemove, showDue, showCategory, positive, paidToggle,
}: {
  entry: FinanceEntry;
  onUpdate: (id: string, patch: Partial<FinanceEntry>) => Promise<boolean>;
  onRemove: (id: string) => void;
  showDue?: boolean; showCategory?: boolean; positive?: boolean; paidToggle?: boolean;
}) {
  const diff = Number(entry.actual) - Number(entry.planned);
  const over = !positive && diff > 0 && Number(entry.planned) > 0;
  const paid = paidToggle && Number(entry.actual) > 0;
  return (
    <div className="px-4 py-2 flex items-center gap-2 hover:bg-secondary/30 group">
      {paidToggle && (
        <button
          onClick={() => onUpdate(entry.id, { actual: paid ? 0 : Number(entry.planned) })}
          className={cn(
            "h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors",
            paid ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground/40 hover:border-green-500"
          )}
          aria-label={paid ? "Zaplaceno" : "Označit jako zaplaceno"}
        >
          {paid && <span className="text-xs leading-none">✓</span>}
        </button>
      )}
      {showCategory && (
        <span className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary shrink-0 min-w-[80px] text-center">
          {entry.category || "—"}
        </span>
      )}
      <input
        defaultValue={entry.name}
        onBlur={(e) => e.target.value !== entry.name && onUpdate(entry.id, { name: e.target.value })}
        className={cn(
          "flex-1 bg-transparent text-sm outline-none focus:bg-secondary/50 rounded px-1 min-w-0",
          paid && "text-muted-foreground line-through"
        )}
      />
      {showDue && (
        <input
          defaultValue={entry.due_day ?? ""}
          placeholder="—"
          onBlur={(e) => e.target.value !== (entry.due_day ?? "") && onUpdate(entry.id, { due_day: e.target.value || null })}
          className="w-12 bg-transparent text-xs text-muted-foreground outline-none focus:bg-secondary/50 rounded px-1 text-center"
        />
      )}
      <input
        type="number"
        defaultValue={entry.planned}
        onBlur={(e) => Number(e.target.value) !== Number(entry.planned) && onUpdate(entry.id, { planned: Number(e.target.value) || 0 })}
        className="w-20 bg-transparent text-xs text-right text-muted-foreground outline-none focus:bg-secondary/50 rounded px-1"
      />
      {!paidToggle && (
        <input
          type="number"
          defaultValue={entry.actual}
          onBlur={(e) => Number(e.target.value) !== Number(entry.actual) && onUpdate(entry.id, { actual: Number(e.target.value) || 0 })}
          className={cn(
            "w-24 bg-transparent text-sm text-right font-semibold outline-none focus:bg-secondary/50 rounded px-1",
            positive && "text-green-500",
            over && "text-red-500",
          )}
        />
      )}
      <button
        onClick={() => onRemove(entry.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/20"
        aria-label="Smazat"
      >
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </button>
    </div>
  );
}

function AddDialog({
  open, onOpenChange, onAdd,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onAdd: (sec: FinanceSection, name: string, planned: number, actual: number, cat?: string, due?: string) => void;
}) {
  const [section, setSection] = useState<FinanceSection>("daily");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [due, setDue] = useState("");
  const [planned, setPlanned] = useState("");
  const [actual, setActual] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onAdd(section, name.trim(), Number(planned) || 0, Number(actual) || 0,
      section === "daily" ? category.trim() || undefined : undefined,
      section === "fixed" ? due.trim() || undefined : undefined);
    setName(""); setCategory(""); setDue(""); setPlanned(""); setActual("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Přidat položku</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Sekce</label>
            <Select value={section} onValueChange={(v) => setSection(v as FinanceSection)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(SECTION_LABELS) as FinanceSection[]).map(s => (
                  <SelectItem key={s} value={s}>{SECTION_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {section === "daily" && (
            <div>
              <label className="text-xs text-muted-foreground">Kategorie</label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Domácnost, Tádyn, Benzín…" />
            </div>
          )}
          <div>
            <label className="text-xs text-muted-foreground">Název</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Popis položky" />
          </div>
          {section === "fixed" && (
            <div>
              <label className="text-xs text-muted-foreground">Splatnost</label>
              <Input value={due} onChange={(e) => setDue(e.target.value)} placeholder="20." />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Plánovaný (Kč)</label>
              <Input type="number" value={planned} onChange={(e) => setPlanned(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Skutečný (Kč)</label>
              <Input type="number" value={actual} onChange={(e) => setActual(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Zrušit</Button>
          <Button onClick={submit}>Přidat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
