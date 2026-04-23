import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Check, Briefcase, Home, User, CalendarDays, AlertCircle, Pencil, Repeat, ChevronDown, ChevronRight, Star, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, isBefore, isToday, startOfDay, differenceInDays } from "date-fns";
import { cs } from "date-fns/locale";
import { RECURRENCE_LABELS, type Todo, type Category, type Person, type Recurrence } from "@/data/todos";
import { useTodos } from "@/contexts/TodoContext";
import { supabase } from "@/integrations/supabase/client";
import { useRewards } from "@/hooks/useRewards";
import { useAdminMode } from "@/hooks/useAdminMode";
import { useTaskEarnings } from "@/hooks/useTaskEarnings";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useTaskReady } from "@/hooks/useTaskReady";
import { useTaskBonus } from "@/hooks/useTaskBonus";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const MAX_COMPLETED = 20;

const TodoPage = () => {
  const { getTaskBonus, setTaskBonus, config: rewardsConfig } = useRewards();
  const isAdmin = useAdminMode();
  const { todos, setTodos, toggleTodo: rawToggleTodo, removeTodo, addTodo: addTodoToDb, updateTodo, loading } = useTodos();
  const { addEarning, removeEarning } = useTaskEarnings();
  const { pushAction } = useUndoRedo();
  const { isReady, setReady } = useTaskReady();
  const { getBonusAmount, hasBonus, setBonusAmount } = useTaskBonus();
  const [activeTab, setActiveTab] = useState<"all" | Person>("all");
  const [showDialog, setShowDialog] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showAllActive, setShowAllActive] = useState(false);
  const [custPctId, setCustPctId] = useState<string | null>(null);
  const [custPctVal, setCustPctVal] = useState('');
  const [customBonuses, setCustomBonuses] = useState<Record<string, number>>({});

  // New todo form state
  const [newText, setNewText] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("work");
  const [newPerson, setNewPerson] = useState<Person>("Tadeáš");
  const [newDeadline, setNewDeadline] = useState("");
  const [newRecurrence, setNewRecurrence] = useState<Recurrence>("none");
  const [newAmount, setNewAmount] = useState("");

  // Edit todo state
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editText, setEditText] = useState("");
  const [editCategory, setEditCategory] = useState<Category>("work");
  const [editPerson, setEditPerson] = useState<Person>("Tadeáš");
  const [editDeadline, setEditDeadline] = useState("");
  const [editRecurrence, setEditRecurrence] = useState<Recurrence>("none");
  const [editAmount, setEditAmount] = useState("");
  const [editBonusEnabled, setEditBonusEnabled] = useState(false);
  const [editBonusAmount, setEditBonusAmount] = useState("");

  // Reset "show more" when switching tabs
  useEffect(() => {
    setShowAllActive(false);
    setShowCompleted(false);
  }, [activeTab]);

  // Auto-delete oldest completed todos beyond MAX_COMPLETED
  useEffect(() => {
    const completed = todos.filter((t) => t.completed);
    if (completed.length <= MAX_COMPLETED) return;
    const sorted = [...completed].sort((a, b) => a.id.localeCompare(b.id));
    const toDelete = sorted.slice(0, completed.length - MAX_COMPLETED);
    const ids = toDelete.map((t) => t.id);
    setTodos((prev) => prev.filter((t) => !ids.includes(t.id)));
    ids.forEach((id) => supabase.from("todos").delete().eq("id", id));
  }, [todos, setTodos]);

  // Wrapped toggleTodo: for Barča work tasks with amount+bonus, record earning
  const toggleTodo = useCallback(async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    // Block completing for non-admin users if not approved (Ready) - only for Barča work tasks
    if (!isAdmin && !todo.completed && todo.person === 'Barča' && todo.category === 'work' && !isReady(id)) {
      toast.error("Tvůj boss úkol ještě neschválil.", {
        position: "top-center",
        duration: 4000,
        className: "!bg-destructive !text-destructive-foreground !border-destructive !text-lg !font-semibold !py-5 !px-6 !shadow-2xl",
      });
      return;
    }

    // Block completing if previous story in series is not done (applies to everyone, admin too)
    if (!todo.completed) {
      const { getBlockingPrevStory } = await import("@/lib/storyBlock");
      const blocker = getBlockingPrevStory(todo, todos);
      if (blocker) {
        toast.error("Musíš nejdříve odevzdat předchozí příběh", {
          position: "top-center",
          duration: 4000,
          className: "!bg-destructive !text-destructive-foreground !border-destructive !text-lg !font-semibold !py-5 !px-6 !shadow-2xl",
        });
        return;
      }
    }


    // If completing a Barča work task with amount set
    const isBarCaWork = todo.person === 'Barča' && todo.category === 'work';
    const hasAmount = todo.amount && todo.amount > 0;
    const shouldRecordEarning = !todo.completed && isBarCaWork && hasAmount;
    const wasCompleted = todo.completed;

    // Auto-determine bonus from deadline if not set
    let bonus = getTaskBonus(id);
    if (shouldRecordEarning && bonus === 'pending') {
      const today = startOfDay(new Date());
      const deadline = todo.deadline ? startOfDay(todo.deadline) : today;
      const daysLate = differenceInDays(today, deadline);
      bonus = daysLate > 7 ? 'missed' : daysLate > 0 ? 'late' : 'on_time';
      await setTaskBonus(id, bonus);
    }

    await rawToggleTodo(id);

    if (shouldRecordEarning) {
      const bonusPercent =
        bonus === 'on_time' ? rewardsConfig.bonusPerTask :
        bonus === 'late' ? rewardsConfig.bonusLate : 0;
      const earning = await addEarning({
        todo_id: id,
        todo_text: todo.text,
        amount: todo.amount!,
        bonus_type: bonus === 'pending' ? null : bonus,
        bonus_percent: bonusPercent,
        deadline: todo.deadline ? format(todo.deadline, "yyyy-MM-dd") : null,
        completed_at: new Date().toISOString(),
      });

      // Bonus záznam (samostatný), pokud je bonus přiřazen k úkolu
      const bonusAmt = getBonusAmount(id);
      if (bonusAmt > 0) {
        await addEarning({
          todo_id: `${id}__bonus`,
          todo_text: `🎁 Bonus: ${todo.text}`,
          amount: bonusAmt,
          bonus_type: 'bonus',
          bonus_percent: null,
          deadline: null,
          completed_at: new Date().toISOString(),
        });
      }

      if (earning) {
        pushAction({
          undo: async () => {
            await supabase.from("todos").update({ completed: false }).eq("id", id);
            setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: false } : t));
            await removeEarning(earning.id);
          },
          redo: async () => {
            await supabase.from("todos").update({ completed: true }).eq("id", id);
            setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: true } : t));
            await addEarning({
              todo_id: id,
              todo_text: todo.text,
              amount: todo.amount!,
              bonus_type: bonus === 'pending' ? null : bonus,
              bonus_percent: bonusPercent,
              deadline: todo.deadline ? format(todo.deadline, "yyyy-MM-dd") : null,
              completed_at: new Date().toISOString(),
            });
          },
        });
      }
    } else {
      // Generic undo for plain toggle (no earning)
      const newCompleted = !wasCompleted;
      pushAction({
        undo: async () => {
          await supabase.from("todos").update({ completed: wasCompleted }).eq("id", id);
          setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: wasCompleted } : t));
        },
        redo: async () => {
          await supabase.from("todos").update({ completed: newCompleted }).eq("id", id);
          setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: newCompleted } : t));
        },
      });
    }
  }, [todos, rawToggleTodo, getTaskBonus, setTaskBonus, rewardsConfig, addEarning, removeEarning, pushAction, setTodos, isAdmin, isReady, getBonusAmount]);

  const addTodo = async () => {
    if (!newText.trim()) return;
    await addTodoToDb({
      text: newText.trim(),
      completed: false,
      category: newCategory,
      person: newPerson,
      deadline: newDeadline ? new Date(newDeadline) : undefined,
      recurrence: newRecurrence,
      amount: newAmount ? parseInt(newAmount) : undefined,
    });
    setNewText("");
    setNewDeadline("");
    setNewRecurrence("none");
    setNewAmount("");
    setShowDialog(false);
  };

  const openEditDialog = (todo: Todo) => {
    setEditingTodo(todo);
    setEditText(todo.text);
    setEditCategory(todo.category);
    setEditPerson(todo.person);
    setEditDeadline(todo.deadline ? format(todo.deadline, "yyyy-MM-dd") : "");
    setEditRecurrence(todo.recurrence);
    setEditAmount(todo.amount ? todo.amount.toString() : "");
    setEditBonusEnabled(hasBonus(todo.id));
    setEditBonusAmount(hasBonus(todo.id) ? getBonusAmount(todo.id).toString() : "");
  };

  const saveEdit = async () => {
    if (!editingTodo || !editText.trim()) return;
    await updateTodo(editingTodo.id, {
      text: editText.trim(),
      category: editCategory,
      person: editPerson,
      deadline: editDeadline ? new Date(editDeadline) : undefined,
      recurrence: editRecurrence,
      amount: editAmount ? parseInt(editAmount) : undefined,
    });
    // Persist bonus
    const bonusVal = editBonusEnabled && editBonusAmount ? parseInt(editBonusAmount) : 0;
    await setBonusAmount(editingTodo.id, bonusVal);
    setEditingTodo(null);
  };

  const sortByDeadline = (a: Todo, b: Todo) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return a.deadline.getTime() - b.deadline.getTime();
  };

  const filtered = activeTab === "all" ? todos : todos.filter((t) => t.person === activeTab);
  const workPending = filtered.filter((t) => t.category === "work" && !t.completed).sort(sortByDeadline);
  const homePending = filtered.filter((t) => t.category === "home" && !t.completed).sort(sortByDeadline);
  const completed = filtered.filter((t) => t.completed);

  const activeLimit = activeTab === "all" ? 5 : 10;

  const getDeadlineInfo = (d?: Date) => {
    if (!d) return { label: null, isToday: false, isOverdue: false, daysLate: 0 };
    const today = startOfDay(new Date());
    const target = startOfDay(d);
    const overdue = isBefore(target, today);
    const todayMatch = isToday(d);
    const daysLate = overdue ? differenceInDays(today, target) : 0;
    return { isToday: todayMatch, isOverdue: overdue, daysLate };
  };

  const deadlineLabel = (d?: Date) => {
    if (!d) return null;
    const { isToday: todayMatch, isOverdue, daysLate } = getDeadlineInfo(d);
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs",
          isOverdue && "text-destructive font-medium",
          todayMatch && "font-medium text-orange-700 dark:text-orange-300",
          !isOverdue && !todayMatch && "text-muted-foreground"
        )}
      >
        {isOverdue && <AlertCircle className="h-3 w-3" />}
        <CalendarDays className="h-3 w-3" />
        {todayMatch ? "Dnes" : format(d, "d.M.", { locale: cs })}
        {isOverdue && (
          <span className="text-destructive font-semibold ml-0.5">
            ({daysLate} {daysLate === 1 ? "den" : daysLate < 5 ? "dny" : "dní"} zpoždění)
          </span>
        )}
      </span>
    );
  };

  const personBadge = (person: Person) => (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] px-1.5 py-0 h-4",
        person === "Tadeáš"
          ? "border-shift-office/40 bg-shift-office/10 text-shift-office"
          : "border-shift-partner/40 bg-shift-partner/10 text-shift-partner"
      )}
    >
      {person}
    </Badge>
  );

  const TodoItem = ({ todo }: { todo: Todo }) => {
    const info = getDeadlineInfo(todo.deadline);
    const currentBonus = getTaskBonus(todo.id);
    // Only show bonus buttons for Barča work tasks (not Tadeáš)
    const showBonusBtns = todo.person === 'Barča' && todo.category === 'work' && !todo.completed;
    const btnBase = 'text-[11px] px-1.5 py-0.5 rounded border transition-all';
    return (
      <div
        onClick={() => !todo.completed && openEditDialog(todo)}
        className={cn(
          "flex items-center gap-2 px-4 py-3 transition-colors cursor-pointer",
          todo.completed && "opacity-50 cursor-default",
          !todo.completed && info.isToday && "bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 dark:from-orange-950/60 dark:via-amber-950/30 dark:to-orange-950/60",
          !todo.completed && info.isOverdue && "shadow-[inset_4px_0_0_0_hsl(var(--destructive))] bg-destructive/5",
          !todo.completed && !info.isToday && !info.isOverdue && "hover:bg-accent/50"
        )}
      >
        <button
          onClick={(e) => { e.stopPropagation(); toggleTodo(todo.id); }}
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            todo.completed
              ? "bg-primary border-primary text-primary-foreground"
              : "border-primary/40 hover:border-primary hover:bg-primary/10"
          )}
        >
          {todo.completed && <Check className="h-3.5 w-3.5" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("text-sm text-foreground", todo.completed && "line-through")}>
              {todo.text}
            </span>
            {todo.person === 'Barča' && todo.amount && todo.amount > 0 && isAdmin && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 font-medium">
                <Coins className="h-3 w-3" />
                {todo.amount.toLocaleString('cs')} Kč
              </span>
            )}
            {todo.person === 'Barča' && hasBonus(todo.id) && isAdmin && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium">
                🎁 {getBonusAmount(todo.id).toLocaleString('cs')} Kč
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {personBadge(todo.person)}
            {todo.recurrence !== "none" && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Repeat className="h-3 w-3" />
                {RECURRENCE_LABELS[todo.recurrence]}
              </span>
            )}
            {deadlineLabel(todo.deadline)}
          </div>
        </div>
        {showBonusBtns && isAdmin && (
          <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
            <button onClick={() => setTaskBonus(todo.id, 'on_time')} title={`${rewardsConfig.bonusPerTask}% včas`}
              className={`${btnBase} bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-400 ${currentBonus === 'on_time' ? 'opacity-100 ring-1 ring-emerald-500 scale-110' : 'opacity-40 hover:opacity-90'}`}>
              ⭐ {rewardsConfig.bonusPerTask}%
            </button>
            <button onClick={() => setTaskBonus(todo.id, 'late')} title={`${rewardsConfig.bonusLate}% pozdě`}
              className={`${btnBase} bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-400 ${currentBonus === 'late' ? 'opacity-100 ring-1 ring-amber-500 scale-110' : 'opacity-40 hover:opacity-90'}`}>
              ⏳ {rewardsConfig.bonusLate}%
            </button>
            <button onClick={() => setTaskBonus(todo.id, 'missed')} title="0% nesplněno"
              className={`${btnBase} bg-red-100 text-red-600 border-red-300 dark:bg-red-900/40 dark:text-red-400 ${currentBonus === 'missed' ? 'opacity-100 ring-1 ring-red-400 scale-110' : 'opacity-40 hover:opacity-90'}`}>
              ✕ 0%
            </button>
            {custPctId === todo.id ? (
              <input autoFocus type="number" min="0" max="100" step="0.1"
                value={custPctVal}
                onChange={e => setCustPctVal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && custPctVal !== '') {
                    setCustomBonuses(prev => ({ ...prev, [todo.id]: parseFloat(custPctVal) }));
                    setCustPctId(null); setCustPctVal('');
                  }
                  if (e.key === 'Escape') { setCustPctId(null); setCustPctVal(''); }
                }}
                onBlur={() => { setCustPctId(null); setCustPctVal(''); }}
                className="w-14 text-xs text-center border rounded px-1 py-0.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="%"
              />
            ) : (
              <button onClick={() => setCustPctId(todo.id)} title="Vlastní %"
                className={`${btnBase} border-dashed border-muted-foreground/40 text-muted-foreground ${customBonuses[todo.id] != null ? 'opacity-100 bg-purple-100 text-purple-700 border-purple-300' : 'opacity-40 hover:opacity-90'}`}>
                ✎ {customBonuses[todo.id] != null ? `${customBonuses[todo.id]}%` : '%'}
              </button>
            )}
          </div>
        )}
        {showBonusBtns && !isAdmin && (() => {
          const customPct = customBonuses[todo.id];
          let pct: number | null = null;
          let cls = "bg-muted text-muted-foreground border-border";
          let icon = "";
          if (customPct != null) {
            pct = customPct;
            cls = "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-400";
            icon = "✎";
          } else if (currentBonus === 'on_time') {
            pct = rewardsConfig.bonusPerTask;
            cls = "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-400";
            icon = "⭐";
          } else if (currentBonus === 'late') {
            pct = rewardsConfig.bonusLate;
            cls = "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-400";
            icon = "⏳";
          } else if (currentBonus === 'missed') {
            pct = 0;
            cls = "bg-red-100 text-red-600 border-red-300 dark:bg-red-900/40 dark:text-red-400";
            icon = "✕";
          }
          if (pct == null) return null;
          return (
            <>
              <span className={`${btnBase} ${cls} shrink-0 cursor-default`} title="Nastavený bonus">
                {icon} {pct}%
              </span>
              {todo.amount != null && todo.amount > 0 && (
                <span className={`${btnBase} bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50 shrink-0 cursor-default`} title="Částka za úkol">
                  💰 {todo.amount.toLocaleString('cs')} Kč
                </span>
              )}
              {hasBonus(todo.id) && (
                <span className={`${btnBase} bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800/50 shrink-0 cursor-default`} title="Bonusová částka">
                  🎁 {getBonusAmount(todo.id).toLocaleString('cs')} Kč
                </span>
              )}
            </>
          );
        })()}
        <button
          onClick={(e) => { e.stopPropagation(); removeTodo(todo.id); }}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  };

  const Section = ({
    icon: Icon,
    label,
    items,
  }: {
    icon: React.ElementType;
    label: string;
    items: Todo[];
  }) => {
    if (items.length === 0) return null;
    const visible = showAllActive ? items : items.slice(0, activeLimit);
    const hasMore = items.length > activeLimit && !showAllActive;
    return (
      <div className="relative">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {label} ({items.length})
          </span>
        </div>
        <div className="divide-y divide-border">
          {visible.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </div>
        <div className="text-center absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10">
          {hasMore && (
            <button
              onClick={() => setShowAllActive(true)}
              className="px-4 py-2 text-xs font-medium text-primary border border-current rounded-md hover:bg-background/90 transition-colors bg-background/80 backdrop-blur-md shadow-lg"
            >
              Zobrazit více ({items.length - activeLimit} dalších)
            </button>
          )}
          {showAllActive && items.length > activeLimit && (
            <button
              onClick={() => setShowAllActive(false)}
              className="px-4 py-2 text-xs font-medium text-primary border border-current rounded-md hover:bg-background/90 transition-colors bg-background/80 backdrop-blur-md shadow-lg"
            >
              Skrýt
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Úkoly</h2>
        <Button onClick={() => setShowDialog(true)} size="sm">
          <Plus className="mr-1 h-4 w-4" /> Nový úkol
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">
            <User className="h-4 w-4 mr-1" /> Všichni
          </TabsTrigger>
          <TabsTrigger value="Tadeáš" className="flex-1">Tadeáš</TabsTrigger>
          <TabsTrigger value="Barča" className="flex-1">Barča</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="glass rounded-2xl shadow-sm overflow-hidden animate-slide-up">
        {workPending.length === 0 && homePending.length === 0 && completed.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Žádné úkoly. Přidejte první!
          </p>
        )}
        <Section icon={Briefcase} label="Práce" items={workPending} />
        <Section icon={Home} label="Domácnost" items={homePending} />
        {completed.length > 0 && (
          <div>
            <button
              onClick={() => setShowCompleted((v) => !v)}
              className="flex w-full items-center gap-1.5 px-4 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              {showCompleted ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
              <Check className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Hotové úkoly ({completed.length})
              </span>
            </button>
            {showCompleted && (
              <div className="divide-y divide-border">
                {completed.map((todo) => (
                  <TodoItem key={todo.id} todo={todo} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Todo Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nový úkol</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder="Název úkolu..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Kategorie</label>
                <Select value={newCategory} onValueChange={(v) => setNewCategory(v as Category)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work">
                      <span className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" /> Práce</span>
                    </SelectItem>
                    <SelectItem value="home">
                      <span className="flex items-center gap-2"><Home className="h-3.5 w-3.5" /> Domácnost</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Osoba</label>
                <Select value={newPerson} onValueChange={(v) => setNewPerson(v as Person)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tadeáš">Tadeáš</SelectItem>
                    <SelectItem value="Barča">Barča</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Deadline (volitelné)</label>
                <Input type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Opakování</label>
                <Select value={newRecurrence} onValueChange={(v) => setNewRecurrence(v as Recurrence)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Amount field - only visible in admin mode */}
            {isAdmin && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5" /> Částka (Kč) — pouze Barča
                </label>
                <Input
                  type="number"
                  placeholder="např. 6000"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  min={0}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Zrušit</Button>
            <Button onClick={addTodo} disabled={!newText.trim()}>Přidat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Todo Dialog */}
      <Dialog open={!!editingTodo} onOpenChange={(open) => !open && setEditingTodo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upravit úkol</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder="Název úkolu..."
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveEdit()}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Kategorie</label>
                <Select value={editCategory} onValueChange={(v) => setEditCategory(v as Category)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work">
                      <span className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" /> Práce</span>
                    </SelectItem>
                    <SelectItem value="home">
                      <span className="flex items-center gap-2"><Home className="h-3.5 w-3.5" /> Domácnost</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Osoba</label>
                <Select value={editPerson} onValueChange={(v) => setEditPerson(v as Person)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tadeáš">Tadeáš</SelectItem>
                    <SelectItem value="Barča">Barča</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Deadline (volitelné)
                  {!isAdmin && editingTodo && editingTodo.person === 'Barča' && editingTodo.category === 'work' && isReady(editingTodo.id) && (
                    <span className="ml-1 text-[10px]">🔒 schváleno</span>
                  )}
                </label>
                <Input
                  type="date"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  disabled={!isAdmin && editingTodo?.person === 'Barča' && editingTodo?.category === 'work' && isReady(editingTodo.id)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Opakování</label>
                <Select value={editRecurrence} onValueChange={(v) => setEditRecurrence(v as Recurrence)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Amount field - only visible in admin mode */}
            {isAdmin && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5" /> Částka (Kč) — pouze Barča
                </label>
                <Input
                  type="number"
                  placeholder="např. 6000"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  min={0}
                />
              </div>
            )}
            {/* Ready checkbox - admin only */}
            {isAdmin && editingTodo && editingTodo.person === 'Barča' && editingTodo.category === 'work' && (
              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <Checkbox
                  id="ready-checkbox"
                  checked={isReady(editingTodo.id)}
                  onCheckedChange={(checked) => setReady(editingTodo.id, !!checked)}
                />
                <label
                  htmlFor="ready-checkbox"
                  className="text-sm font-medium cursor-pointer select-none"
                >
                  ✅ Ready – úkol schválen, uživatel ho může dokončit
                </label>
              </div>
            )}
            {/* Bonus checkbox + amount - admin only, Barča work tasks */}
            {isAdmin && editingTodo && editingTodo.person === 'Barča' && editingTodo.category === 'work' && (
              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="bonus-checkbox"
                    checked={editBonusEnabled}
                    onCheckedChange={(checked) => {
                      const enabled = !!checked;
                      setEditBonusEnabled(enabled);
                      if (!enabled) setEditBonusAmount("");
                    }}
                  />
                  <label
                    htmlFor="bonus-checkbox"
                    className="text-sm font-medium cursor-pointer select-none"
                  >
                    🎁 Bonus – přidat extra odměnu k úkolu
                  </label>
                </div>
                {editBonusEnabled && (
                  <Input
                    type="number"
                    placeholder="Bonusová částka (Kč)"
                    value={editBonusAmount}
                    onChange={(e) => setEditBonusAmount(e.target.value)}
                    min={0}
                    className="ml-6 w-48"
                  />
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTodo(null)}>Zrušit</Button>
            <Button onClick={saveEdit} disabled={!editText.trim()}>Uložit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TodoPage;
