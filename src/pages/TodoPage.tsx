import { useState } from "react";
import { Plus, Trash2, Check, Briefcase, Home, User, CalendarDays, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { format, isBefore, isToday, startOfDay } from "date-fns";
import { cs } from "date-fns/locale";

type Category = "work" | "home";
type Person = "Já" | "Barča";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  category: Category;
  person: Person;
  deadline?: Date;
}

const INITIAL_TODOS: Todo[] = [
  // Work - Já
  { id: "1", text: "Dokončit video", completed: false, category: "work", person: "Já", deadline: new Date(2026, 3, 4) },
  { id: "2", text: "Postnout Stories", completed: false, category: "work", person: "Já", deadline: new Date(2026, 3, 5) },
  { id: "3", text: "Udělat Reel", completed: false, category: "work", person: "Já", deadline: new Date(2026, 3, 6) },
  // Home - Já
  { id: "4", text: "Vysát", completed: false, category: "home", person: "Já", deadline: new Date(2026, 3, 5) },
  { id: "5", text: "Vytřít", completed: false, category: "home", person: "Já", deadline: new Date(2026, 3, 7) },
  { id: "6", text: "Nakrmit kočky", completed: false, category: "home", person: "Já", deadline: undefined },
  // Work - Barča
  { id: "7", text: "Napsat příběh 1", completed: false, category: "work", person: "Barča", deadline: new Date(2026, 3, 3) },
  { id: "8", text: "Práce pro Vyhraj", completed: false, category: "work", person: "Barča", deadline: new Date(2026, 3, 3) },
  { id: "9", text: "Napsat příběh 2", completed: false, category: "work", person: "Barča", deadline: new Date(2026, 3, 10) },
  // Home - Barča
  { id: "10", text: "Uvařit oběd", completed: false, category: "home", person: "Barča", deadline: new Date(2026, 3, 6) },
  { id: "11", text: "Snídaně", completed: false, category: "home", person: "Barča", deadline: new Date(2026, 3, 7) },
  { id: "12", text: "Večeře", completed: false, category: "home", person: "Barča", deadline: new Date(2026, 3, 8) },
];

const TodoPage = () => {
  const [todos, setTodos] = useState<Todo[]>(INITIAL_TODOS);
  const [activeTab, setActiveTab] = useState<"all" | Person>("all");
  const [showDialog, setShowDialog] = useState(false);

  // New todo form state
  const [newText, setNewText] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("work");
  const [newPerson, setNewPerson] = useState<Person>("Já");
  const [newDeadline, setNewDeadline] = useState("");

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
      },
    ]);
    setNewText("");
    setNewDeadline("");
    setShowDialog(false);
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const removeTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const filtered = activeTab === "all" ? todos : todos.filter((t) => t.person === activeTab);
  const workPending = filtered.filter((t) => t.category === "work" && !t.completed);
  const homePending = filtered.filter((t) => t.category === "home" && !t.completed);
  const completed = filtered.filter((t) => t.completed);

  const deadlineLabel = (d?: Date) => {
    if (!d) return null;
    const today = startOfDay(new Date());
    const target = startOfDay(d);
    const overdue = isBefore(target, today);
    const todayMatch = isToday(d);
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs",
          overdue && "text-destructive font-medium",
          todayMatch && "text-primary font-medium",
          !overdue && !todayMatch && "text-muted-foreground"
        )}
      >
        {overdue && <AlertCircle className="h-3 w-3" />}
        <CalendarDays className="h-3 w-3" />
        {format(d, "d.M.", { locale: cs })}
      </span>
    );
  };

  const TodoItem = ({ todo }: { todo: Todo }) => (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50",
        todo.completed && "opacity-50"
      )}
    >
      <button
        onClick={() => toggleTodo(todo.id)}
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
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-4 border-border text-muted-foreground"
          >
            {todo.person}
          </Badge>
          {deadlineLabel(todo.deadline)}
          {!todo.deadline && (
            <span className="text-[10px] text-muted-foreground italic">denně</span>
          )}
        </div>
      </div>
      <button
        onClick={() => removeTodo(todo.id)}
        className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

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
          <TabsTrigger value="Já" className="flex-1">Já</TabsTrigger>
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Já">Já</SelectItem>
                    <SelectItem value="Barča">Barča</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Deadline (volitelné)</label>
              <Input
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Zrušit</Button>
            <Button onClick={addTodo} disabled={!newText.trim()}>Přidat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TodoPage;
