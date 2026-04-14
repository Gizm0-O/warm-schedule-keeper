import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Check, Briefcase, Home, User, CalendarDays, AlertCircle, Pencil, Repeat, ChevronDown, ChevronRight , Star } from "lucide-react";
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

const MAX_COMPLETED = 20;

const TodoPage = () => {
  const { getTaskBonus, setTaskBonus, config: rewardsConfig } = useRewards();
  const { todos, setTodos, toggleTodo, removeTodo, addTodo: addTodoToDb, updateTodo, loading } = useTodos();
  const [activeTab, setActiveTab] = useState<"all" | Person>("all");
  const [showDialog, setShowDialog] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showAllActive, setShowAllActive] = useState(false);

  // New todo form state
  const [newText, setNewText] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("work");
  const [newPerson, setNewPerson] = useState<Person>("Tadeáš");
  const [newDeadline, setNewDeadline] = useState("");
  const [newRecurrence, setNewRecurrence] = useState<Recurrence>("none");

  // Edit todo state
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editText, setEditText] = useState("");
  const [editCategory, setEditCategory] = useState<Category>("work");
  const [editPerson, setEditPerson] = useState<Person>("Tadeáš");
  const [editDeadline, setEditDeadline] = useState("");
  const [editRecurrence, setEditRecurrence] = useState<Recurrence>("none");

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

  const addTodo = async () => {
    if (!newText.trim()) return;
    await addTodoToDb({
      text: newText.trim(),
      completed: false,
      category: newCategory,
      person: newPerson,
      deadline: newDeadline ? new Date(newDeadline) : undefined,
      recurrence: newRecurrence,
    });
    setNewText("");
    setNewDeadline("");
    setNewRecurrence("none");
    setShowDialog(false);
  };

  const openEditDialog = (todo: Todo) => {
    setEditingTodo(todo);
    setEditText(todo.text);
    setEditCategory(todo.category);
    setEditPerson(todo.person);
    setEditDeadline(todo.deadline ? format(todo.deadline, "yyyy-MM-dd") : "");
    setEditRecurrence(todo.recurrence);
  };

  const saveEdit = async () => {
    if (!editingTodo || !editText.trim()) return;
    await updateTodo(editingTodo.id, {
      text: editText.trim(),
      category: editCategory,
      person: editPerson,
      deadline: editDeadline ? new Date(editDeadline) : undefined,
      recurrence: editRecurrence,
    });
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
    return (
      <div
        onClick={() => !todo.completed && openEditDialog(todo)}
        className={cn(
          "flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer",
          todo.completed && "opacity-50 cursor-default",
          !todo.completed && info.isToday && "bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 dark:from-orange-950/60 dark:via-amber-950/30 dark:to-orange-950/60",
          !todo.completed && info.isOverdue && "shadow-[inset_4px_0_0_0_hsl(var(--destructive))] bg-destructive/5",
          !todo.completed && !info.isToday && !info.isOverdue && "hover:bg-accent/50"
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleTodo(todo.id);
          }}
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
          <span className={cn("text-sm text-foreground", todo.completed && "line-through")}>
            {todo.text}
          </span>
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
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeTodo(todo.id);
          }}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
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
                <div key={todo.id} className="relative group/todo">
                  <TodoItem todo={todo} />
                  {todo.category === 'work' && (
                    <div className="flex items-center gap-1 px-3 pb-1.5" onClick={e => e.stopPropagation()}>
                      {(['on_time', 'late', 'missed'] as const).map((status) => {
                        const labels = { on_time: `+${rewardsConfig.bonusPerTask}% včas`, late: `+${rewardsConfig.bonusLate}% pozdě`, missed: '0% nespln.' };
                        const colors = { on_time: 'bg-emerald-100 text-emerald-700 border-emerald-300', late: 'bg-amber-100 text-amber-700 border-amber-300', missed: 'bg-red-100 text-red-600 border-red-300' };
                        const isActive = getTaskBonus(todo.id) === status;
                        return (
                          <button
                            key={status}
                            onClick={() => handleBonusBadgeClick(todo.id, status)}
                            className={`text-9px font-semibold px-1.5 py-0.5 rounded border transition-all ${colors[status]} ${isActive ? 'opacity-100 ring-1 ring-offset-0 ring-current font-bold' : 'opacity-0 group-hover/todo:opacity-60 hover:!opacity-100'}`}
                            title={labels[status]}
                          >
                            {status === 'on_time' ? '⭐' : status === 'late' ? '⏳' : '✕'} {labels[status]}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
        </div>
        <div className="text-center absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10">
          {hasMore && (
            <button
              onClick={() => setShowAllActive(true)}
              className="px-4 py-2 text-xs font-medium text-primary border border-current rounded-md hover:bg-accent/30 transition-colors bg-primary/10 shadow-lg"
            >
              Zobrazit více ({items.length - activeLimit} dalších)
            </button>
          )}
          {showAllActive && items.length > activeLimit && (
            <button
              onClick={() => setShowAllActive(false)}
              className="px-4 py-2 text-xs font-medium text-primary border border-current rounded-md hover:bg-accent/30 transition-colors bg-primary/10 shadow-lg"
            >
              Skrýt
            </button>
          )}
        </div>
      </div>
    );
  };


  // Bonus badge pro work ukoly (admin)
  const BONUS_ADMIN_PIN = '1234';
  const [bonusPinOpen, setBonusPinOpen] = useState<string | null>(null); // todoId
  const [bonusPinInput, setBonusPinInput] = useState('');
  const [bonusPinError, setBonusPinError] = useState(false);
  const [pendingBonusTodoId, setPendingBonusTodoId] = useState<string | null>(null);
  const [pendingBonusStatus, setPendingBonusStatus] = useState<'on_time' | 'late' | 'missed' | null>(null);

  const handleBonusBadgeClick = (todoId: string, status: 'on_time' | 'late' | 'missed') => {
    setPendingBonusTodoId(todoId);
    setPendingBonusStatus(status);
    setBonusPinOpen(todoId);
    setBonusPinInput('');
    setBonusPinError(false);
  };

  const submitBonusPin = () => {
    if (bonusPinInput === BONUS_ADMIN_PIN) {
      if (pendingBonusTodoId && pendingBonusStatus) {
        setTaskBonus(pendingBonusTodoId, pendingBonusStatus);
      }
      setBonusPinOpen(null);
      setBonusPinInput('');
    } else {
      setBonusPinError(true);
    }
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
                <label className="text-xs font-medium text-muted-foreground">Deadline (volitelné)</label>
                <Input type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTodo(null)}>Zrušit</Button>
            <Button onClick={saveEdit} disabled={!editText.trim()}>Uložit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

      {/* Bonus admin PIN dialog */}
      {bonusPinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setBonusPinOpen(null)}>
          <div className="bg-background rounded-2xl p-6 shadow-xl w-72 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-bold">Bonus PIN</h3>
            </div>
            <p className="text-sm text-muted-foreground">Zadejte PIN pro přidělení bonusu.</p>
            <input
              type="password"
              maxLength={4}
              value={bonusPinInput}
              onChange={e => { setBonusPinInput(e.target.value); setBonusPinError(false); }}
              onKeyDown={e => e.key === 'Enter' && submitBonusPin()}
              placeholder="••••"
              autoFocus
              className={`w-full text-center text-xl tracking-widest border rounded-xl px-3 py-2 bg-background focus:outline-none ${bonusPinError ? 'border-destructive' : 'border-input'}`}
            />
            {bonusPinError && <p className="text-xs text-destructive text-center">Nesprávný PIN</p>}
            <button onClick={submitBonusPin} className="w-full bg-primary text-primary-foreground rounded-xl py-2 font-semibold">Potvrdit</button>
          </div>
        </div>
      )}

  );
};

export default TodoPage;
