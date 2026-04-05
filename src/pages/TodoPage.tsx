import { useState } from "react";
import { Plus, Trash2, Check, Briefcase, Home, User, CalendarDays, AlertCircle, Pencil, Repeat } from "lucide-react";
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
import { format, isBefore, isToday, startOfDay, differenceInDays, addDays, addWeeks, addMonths } from "date-fns";
import { cs } from "date-fns/locale";
import { INITIAL_TODOS, RECURRENCE_LABELS, type Todo, type Category, type Person, type Recurrence } from "@/data/todos";

const TodoPage = () => {
  const [todos, setTodos] = useState<Todo[]>(INITIAL_TODOS);
  const [activeTab, setActiveTab] = useState<"all" | Person>("all");
  const [showDialog, setShowDialog] = useState(false);

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

  const addTodo = () => {
    if (!newText.trim()) return;
    setTodos((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text: newText.trim(),
        completed: false,
        category: newCategory,
        person: newPerson,
        deadline: newDeadline ? new Date(newDeadline) : undefined,
        recurrence: newRecurrence,
      },
    ]);
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

  const saveEdit = () => {
    if (!editingTodo || !editText.trim()) return;
    setTodos((prev) =>
      prev.map((t) =>
        t.id === editingTodo.id
          ? {
              ...t,
              text: editText.trim(),
              category: editCategory,
              person: editPerson,
              deadline: editDeadline ? new Date(editDeadline) : undefined,
              recurrence: editRecurrence,
            }
          : t
      )
    );
    setEditingTodo(null);
  };

  const getNextDeadline = (current: Date, recurrence: Recurrence): Date => {
    switch (recurrence) {
      case "daily": return addDays(current, 1);
      case "every2days": return addDays(current, 2);
      case "every3days": return addDays(current, 3);
      case "weekly": return addWeeks(current, 1);
      case "biweekly": return addWeeks(current, 2);
      case "monthly": return addMonths(current, 1);
      default: return current;
    }
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) => {
      const todo = prev.find((t) => t.id === id);
      if (!todo) return prev;

      // If completing a recurring task, create next occurrence
      if (!todo.completed && todo.recurrence !== "none") {
        const baseDate = todo.deadline ?? startOfDay(new Date());
        let nextDeadline = getNextDeadline(baseDate, todo.recurrence);
        // If next deadline is still in the past, jump forward to today or beyond
        const today = startOfDay(new Date());
        while (isBefore(nextDeadline, today)) {
          nextDeadline = getNextDeadline(nextDeadline, todo.recurrence);
        }
        const newTodo: Todo = {
          id: crypto.randomUUID(),
          text: todo.text,
          completed: false,
          category: todo.category,
          person: todo.person,
          deadline: nextDeadline,
          recurrence: todo.recurrence,
        };
        return [
          ...prev.map((t) => (t.id === id ? { ...t, completed: true } : t)),
          newTodo,
        ];
      }

      return prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    });
  };

  const removeTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
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
          ? "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700"
          : "border-red-400 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 dark:border-red-700"
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
    return (
      <div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {label} ({items.length})
          </span>
        </div>
        <div className="divide-y divide-border">
          {items.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
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

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {workPending.length === 0 && homePending.length === 0 && completed.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Žádné úkoly. Přidejte první!
          </p>
        )}
        <Section icon={Briefcase} label="Práce" items={workPending} />
        <Section icon={Home} label="Domácnost" items={homePending} />
        {completed.length > 0 && (
          <div>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30">
              <Check className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Hotovo ({completed.length})
              </span>
            </div>
            <div className="divide-y divide-border">
              {completed.map((todo) => (
                <TodoItem key={todo.id} todo={todo} />
              ))}
            </div>
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
  );
};

export default TodoPage;
