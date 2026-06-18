import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Lock, Plus, Trash2, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useFinance, FinanceEntry, FinanceSection,
  formatMonth, currentMonth, shiftMonth,
} from "@/hooks/useFinance";
import { useAdminMode } from "@/hooks/useAdminMode";
import { cn } from "@/lib/utils";

const SECTION_LABELS: Record<FinanceSection, string> = {
  income: "Příjmy",
  subscription: "Předplatné",
  fixed: "Fixní náklady",
  daily: "Každodenní výdaje",
  food: "Jídlo & Domácnost",
};

const fmt = (n: number) => `${Math.round(n).toLocaleString("cs-CZ")} Kč`;

export default function FinancePage() {
  const [month, setMonth] = useState(currentMonth());
  const [revealedMonths, setRevealedMonths] = useState<Set<string>>(new Set());
  const isAdmin = useAdminMode();
  const { entries, loading, add, update, remove } = useFinance(month);

  const isPastMonth = month < currentMonth();
  const isLocked = isPastMonth && !isAdmin;
  const isRevealed = revealedMonths.has(month);
  const showOverlay = isLocked && !isRevealed;
  const readOnly = isLocked; // even after reveal, non-admins can't edit


  const bySection = useMemo(() => {
    const map: Record<FinanceSection, FinanceEntry[]> = {
      income: [], subscription: [], fixed: [], daily: [], food: [],
    };
    entries.forEach(e => map[e.section]?.push(e));
    return map;
  }, [entries]);

  const foodBudget = useMemo(
    () => bySection.food.find(e => e.category === "__budget__") ?? null,
    [bySection.food]
  );
  const foodExtras = useMemo(
    () => bySection.food.filter(e => e.category !== "__budget__"),
    [bySection.food]
  );

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

  const FOOD_BUDGET = 15000;
  const toggleFoodBudget = async () => {
    if (foodBudget) {
      const paid = Number(foodBudget.actual) > 0;
      await update(foodBudget.id, { actual: paid ? 0 : Number(foodBudget.planned) || FOOD_BUDGET });
    } else {
      await add("food", "Budget jídlo", FOOD_BUDGET, FOOD_BUDGET, "__budget__");
    }
  };
  const updateFoodBudgetAmount = async (v: number) => {
    if (foodBudget) {
      const paid = Number(foodBudget.actual) > 0;
      await update(foodBudget.id, { planned: v, ...(paid ? { actual: v } : {}) });
    } else {
      await add("food", "Budget jídlo", v, 0, "__budget__");
    }
  };

  const DAILY_CATEGORIES = ["Sebík", "3D tisk", "Tade", "Baru", "Benzín", "Domácnost", "Ostatní"];
  const FOOD_CATEGORIES = ["Potraviny", "Sebík", "Kočky", "Restaurace", "Dobrůtky"];

  const quickAdd = (section: FinanceSection) =>

    add(section, "Nová položka", 0, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Finance</h1>
        </div>
        <div className="flex items-center justify-center gap-3 mx-auto">
          <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => setMonth(m => shiftMonth(m, -1))}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="min-w-[200px] text-center text-xl font-bold tracking-tight">
            {formatMonth(month)}
          </div>
          <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => setMonth(m => shiftMonth(m, 1))}>
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
        <div className="w-[100px]" /> {/* spacer to keep month centered */}
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
        <div className="relative">
          <div className={cn("space-y-4 transition-all", showOverlay && "blur-md pointer-events-none select-none")}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <SectionCard title={SECTION_LABELS.income} items={bySection.income} onUpdate={update} onRemove={remove} onAdd={() => quickAdd("income")} positive readOnly={readOnly} />
              <SectionCard title={SECTION_LABELS.subscription} items={bySection.subscription} onUpdate={update} onRemove={remove} onAdd={() => quickAdd("subscription")} paidToggle readOnly={readOnly} />
              <SectionCard title={SECTION_LABELS.fixed} items={bySection.fixed} onUpdate={update} onRemove={remove} onAdd={() => quickAdd("fixed")} showDue paidCheck readOnly={readOnly} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SectionCard
                title={SECTION_LABELS.food}
                items={foodExtras}
                onUpdate={update}
                onRemove={remove}
                onAdd={() => quickAdd("food")}
                readOnly={readOnly}
                showCategory
                categoryOptions={FOOD_CATEGORIES}
                hidePlan
                headerExtra={
                  <FoodBudgetChip
                    entry={foodBudget}
                    defaultValue={FOOD_BUDGET}
                    onToggle={toggleFoodBudget}
                    onChangeAmount={updateFoodBudgetAmount}
                    readOnly={readOnly}
                  />
                }
                emptyText="Žádné extra výdaje mimo budget"
              />
              <SectionCard title={SECTION_LABELS.daily} items={bySection.daily} onUpdate={update} onRemove={remove} onAdd={() => quickAdd("daily")} showCategory categoryOptions={DAILY_CATEGORIES} hidePlan readOnly={readOnly} />
            </div>

          </div>
          {showOverlay && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-2xl glass-subtle border px-6 py-5 flex flex-col items-center gap-3 shadow-lg">
                <div className="flex items-center gap-2 text-base font-semibold">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Měsíc {formatMonth(month)} byl již uzavřen
                </div>
                <Button onClick={() => setRevealedMonths(s => new Set(s).add(month))}>
                  Zobrazit
                </Button>
              </div>
            </div>
          )}
          {isLocked && isRevealed && (
            <div className="mt-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <Lock className="h-3 w-3" /> Uzavřený měsíc – pouze pro čtení
            </div>
          )}
        </div>
      )}
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
  title, items, onUpdate, onRemove, onAdd, positive, showDue, showCategory, paidToggle, paidCheck, readOnly,
  headerExtra, emptyText, categoryOptions, hidePlan,
}: {
  title: string;
  items: FinanceEntry[];
  onUpdate: (id: string, patch: Partial<FinanceEntry>) => Promise<boolean>;
  onRemove: (id: string) => void;
  onAdd: () => void;
  positive?: boolean;
  showDue?: boolean;
  showCategory?: boolean;
  paidToggle?: boolean;
  paidCheck?: boolean;
  readOnly?: boolean;
  headerExtra?: React.ReactNode;
  emptyText?: string;
  categoryOptions?: string[];
  hidePlan?: boolean;
}) {
  const totalP = items.reduce((s, e) => s + Number(e.planned || 0), 0);
  const totalA = items.reduce((s, e) => s + Number(e.actual || 0), 0);
  return (
    <div className="rounded-2xl glass-subtle border overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <h3 className="font-semibold">{title}</h3>
          {headerExtra}
        </div>
        <div className="text-sm text-muted-foreground">
          <span className={cn("font-semibold", positive ? "text-green-500" : "text-foreground")}>
            {fmt(totalA)}
          </span>
          <span className="text-xs ml-2">/ {fmt(totalP)}</span>
        </div>
      </div>
      <div className="px-4 py-1.5 border-b border-border/50 text-xs text-muted-foreground flex items-center gap-2 select-none">
        {(paidToggle || paidCheck) && <div className="h-5 w-5 shrink-0" />}
        {showCategory && <div className="min-w-[100px] shrink-0 text-center">Kategorie</div>}
        <div className="flex-1 min-w-0">Položka</div>
        {showDue && <div className="w-14 text-center shrink-0">Datum</div>}
        {!paidToggle && !hidePlan && <div className="w-20 text-center shrink-0">Plán</div>}
        <div className="w-24 text-center shrink-0">Částka</div>
        <div className="w-6 shrink-0" />
      </div>
      <div className="max-h-[420px] overflow-y-auto divide-y divide-border/50">
        {items.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">{emptyText ?? "Žádné položky"}</div>
        )}
        {items.map(e => (
          <Row key={e.id} entry={e} onUpdate={onUpdate} onRemove={onRemove}
               showDue={showDue} showCategory={showCategory} positive={positive}
               paidToggle={paidToggle} paidCheck={paidCheck} hidePlan={hidePlan}
               categoryOptions={categoryOptions} readOnly={readOnly} />

        ))}
      </div>
      {!readOnly && (
        <button
          onClick={onAdd}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs text-muted-foreground hover:text-primary hover:bg-secondary/40 border-t border-border/50 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Přidat řádek
        </button>
      )}
    </div>
  );
}


function Row({
  entry, onUpdate, onRemove, showDue, showCategory, positive, paidToggle, paidCheck, readOnly, categoryOptions, hidePlan,
}: {
  entry: FinanceEntry;
  onUpdate: (id: string, patch: Partial<FinanceEntry>) => Promise<boolean>;
  onRemove: (id: string) => void;
  showDue?: boolean; showCategory?: boolean; positive?: boolean;
  paidToggle?: boolean; paidCheck?: boolean; readOnly?: boolean;
  categoryOptions?: string[];
  hidePlan?: boolean;
}) {
  const diff = Number(entry.actual) - Number(entry.planned);
  const over = !positive && diff > 0 && Number(entry.planned) > 0;
  const paid = (paidToggle || paidCheck) && Number(entry.actual) > 0;
  const handleTogglePaid = () =>
    onUpdate(entry.id, { actual: paid ? 0 : Number(entry.planned) });
  return (
    <div className="px-4 py-2 flex items-center gap-2 hover:bg-secondary/30 group">
      {(paidToggle || paidCheck) && (
        <button
          disabled={readOnly}
          onClick={handleTogglePaid}
          className={cn(
            "h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors",
            paid ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground/40 hover:border-green-500",
            readOnly && "opacity-60 cursor-not-allowed",
          )}
          aria-label={paid ? "Zaplaceno" : "Označit jako zaplaceno"}
        >
          {paid && <span className="text-xs leading-none">✓</span>}
        </button>
      )}
      {showCategory && (
        categoryOptions ? (
          <select
            value={entry.category ?? ""}
            disabled={readOnly}
            onChange={(e) => onUpdate(entry.id, { category: e.target.value || null })}
            className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary shrink-0 min-w-[100px] outline-none cursor-pointer hover:bg-primary/20 disabled:cursor-not-allowed"
          >
            <option value="">—</option>
            {categoryOptions.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary shrink-0 min-w-[100px] text-center">
            {entry.category || "—"}
          </span>
        )
      )}
      <input
        defaultValue={entry.name}
        readOnly={readOnly}
        onBlur={(e) => !readOnly && e.target.value !== entry.name && onUpdate(entry.id, { name: e.target.value })}
        className={cn(
          "flex-1 bg-transparent text-sm outline-none focus:bg-secondary/50 rounded px-1 min-w-0",
          paid && paidToggle && "text-green-500",
        )}
      />
      {showDue && (
        <input
          defaultValue={entry.due_day ?? ""}
          placeholder="—"
          readOnly={readOnly}
          onBlur={(e) => !readOnly && e.target.value !== (entry.due_day ?? "") && onUpdate(entry.id, { due_day: e.target.value || null })}
          className="w-14 bg-transparent text-base font-medium outline-none focus:bg-secondary/50 rounded px-1 text-center"
        />
      )}
      {!paidToggle && !hidePlan && (
        <input
          type="number"
          defaultValue={entry.planned}
          readOnly={readOnly}
          onBlur={(e) => !readOnly && Number(e.target.value) !== Number(entry.planned) && onUpdate(entry.id, { planned: Number(e.target.value) || 0 })}
          className="w-20 bg-transparent text-xs text-center text-muted-foreground outline-none focus:bg-secondary/50 rounded px-1 tabular-nums"
        />
      )}
      {paidToggle ? (
        <input
          type="number"
          defaultValue={entry.planned}
          readOnly={readOnly}
          onBlur={(e) => {
            if (readOnly) return;
            const v = Number(e.target.value) || 0;
            if (v !== Number(entry.planned)) {
              onUpdate(entry.id, { planned: v, ...(paid ? { actual: v } : {}) });
            }
          }}
          className={cn(
            "w-24 bg-transparent text-center outline-none focus:bg-secondary/50 rounded px-1 tabular-nums transition-all",
            paid ? "text-green-500 font-bold text-base" : "text-sm text-muted-foreground"
          )}
        />
      ) : (
        <input
          type="number"
          defaultValue={entry.actual}
          readOnly={readOnly}
          onBlur={(e) => !readOnly && Number(e.target.value) !== Number(entry.actual) && onUpdate(entry.id, { actual: Number(e.target.value) || 0 })}
          className={cn(
            "w-24 bg-transparent text-sm text-center font-semibold outline-none focus:bg-secondary/50 rounded px-1 tabular-nums",
            positive && "text-green-500",
            paid && paidCheck && "text-green-500",
            over && !paid && "text-red-500",
          )}
        />
      )}
      {!readOnly && (
        <button
          onClick={() => onRemove(entry.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/20"
          aria-label="Smazat"
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </button>
      )}
      {readOnly && <div className="w-6 shrink-0" />}
    </div>
  );
}

function FoodBudgetChip({
  entry, defaultValue, onToggle, onChangeAmount, readOnly,
}: {
  entry: FinanceEntry | null;
  defaultValue: number;
  onToggle: () => void;
  onChangeAmount: (v: number) => void;
  readOnly?: boolean;
}) {
  const planned = entry ? Number(entry.planned) : defaultValue;
  const paid = entry ? Number(entry.actual) > 0 : false;
  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        disabled={readOnly}
        onClick={onToggle}
        className={cn(
          "h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors",
          paid ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground/40 hover:border-green-500",
          readOnly && "opacity-60 cursor-not-allowed",
        )}
        aria-label={paid ? "Budget odevzdán" : "Označit budget jako odevzdaný"}
      >
        {paid && <span className="text-xs leading-none">✓</span>}
      </button>
      <span className="text-xs text-muted-foreground">Budget</span>
      <input
        type="number"
        defaultValue={planned}
        key={planned}
        readOnly={readOnly}
        onBlur={(e) => {
          const v = Number(e.target.value) || 0;
          if (v !== planned) onChangeAmount(v);
        }}
        className={cn(
          "w-20 bg-transparent text-center outline-none focus:bg-secondary/50 rounded px-1 tabular-nums",
          paid ? "text-green-500 font-bold" : "text-foreground font-medium"
        )}
      />
      <span className="text-xs text-muted-foreground">Kč</span>
    </div>
  );
}


