import { useState } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const TodoPage = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");

  const addTodo = () => {
    if (!newTodo.trim()) return;
    setTodos((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: newTodo.trim(), completed: false },
    ]);
    setNewTodo("");
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const removeTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const pending = todos.filter((t) => !t.completed);
  const completed = todos.filter((t) => t.completed);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Úkoly</h2>

      <div className="flex gap-2">
        <Input
          placeholder="Přidat nový úkol..."
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          className="flex-1"
        />
        <Button onClick={addTodo}>
          <Plus className="mr-1 h-4 w-4" /> Přidat
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm divide-y divide-border">
        {pending.length === 0 && completed.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Zatím žádné úkoly. Přidejte první!
          </p>
        )}
        {pending.map((todo) => (
          <div key={todo.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50">
            <button
              onClick={() => toggleTodo(todo.id)}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-primary/40 transition-colors hover:border-primary hover:bg-primary/10"
            >
            </button>
            <span className="flex-1 text-sm text-foreground">{todo.text}</span>
            <button onClick={() => removeTodo(todo.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {completed.length > 0 && (
          <>
            <div className="px-4 py-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Hotovo ({completed.length})
              </span>
            </div>
            {completed.map((todo) => (
              <div key={todo.id} className="flex items-center gap-3 px-4 py-3 opacity-60">
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <span className="flex-1 text-sm text-foreground line-through">{todo.text}</span>
                <button onClick={() => removeTodo(todo.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default TodoPage;
