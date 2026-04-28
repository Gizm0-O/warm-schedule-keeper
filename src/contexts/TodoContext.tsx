import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { startOfDay, isBefore, addDays, addWeeks, addMonths, format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { Category, Person, Recurrence } from "@/data/todos";

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  category: Category;
  person: Person;
  deadline?: Date;
  recurrence: Recurrence;
  amount?: number;
  storyNumber?: number;
  storyMonth?: string;
}

interface TodoContextType {
  todos: Todo[];
  setTodos: React.Dispatch<React.SetStateAction<Todo[]>>;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  restoreTodo: (todo: Todo) => Promise<void>;
  addTodo: (todo: Omit<Todo, "id">) => void;
  updateTodo: (id: string, updates: Partial<Omit<Todo, "id">>) => void;
  loading: boolean;
}

const TodoContext = createContext<TodoContextType | null>(null);

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

const rowToTodo = (row: any): Todo => ({
  id: row.id,
  text: row.text,
  completed: row.completed,
  category: row.category as Category,
  person: row.person as Person,
  deadline: row.deadline ? parseISO(row.deadline) : undefined,
  recurrence: row.recurrence as Recurrence,
  amount: row.amount ?? undefined,
  storyNumber: row.story_number ?? undefined,
  storyMonth: row.story_month ?? undefined,
});

export const TodoProvider = ({ children }: { children: ReactNode }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodos = async () => {
      const { data } = await supabase.from("todos").select("*").order("created_at");
      if (data) setTodos(data.map(rowToTodo));
      setLoading(false);
    };
    fetchTodos();
  }, []);

  const addTodo = useCallback(async (todo: Omit<Todo, "id">) => {
    const row = {
      text: todo.text,
      completed: todo.completed,
      category: todo.category,
      person: todo.person,
      deadline: todo.deadline ? format(todo.deadline, "yyyy-MM-dd") : null,
      recurrence: todo.recurrence,
      amount: todo.amount ?? null,
    };
    const { data } = await supabase.from("todos").insert(row).select().single();
    if (data) setTodos((prev) => [...prev, rowToTodo(data)]);
  }, []);

  const updateTodo = useCallback(async (id: string, updates: Partial<Omit<Todo, "id">>) => {
    const row: any = { ...updates };
    if (updates.deadline !== undefined) {
      row.deadline = updates.deadline ? format(updates.deadline, "yyyy-MM-dd") : null;
    }
    delete row.id;
    await supabase.from("todos").update(row).eq("id", id);
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const toggleTodo = useCallback(async (id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    if (!todo.completed && todo.recurrence !== "none") {
      // Mark current as completed
      await supabase.from("todos").update({ completed: true }).eq("id", id);

      // Create next recurrence
      const baseDate = todo.deadline ?? startOfDay(new Date());
      let nextDeadline = getNextDeadline(baseDate, todo.recurrence);
      const today = startOfDay(new Date());
      while (isBefore(nextDeadline, today)) {
        nextDeadline = getNextDeadline(nextDeadline, todo.recurrence);
      }
      const newRow = {
        text: todo.text,
        completed: false,
        category: todo.category,
        person: todo.person,
        deadline: format(nextDeadline, "yyyy-MM-dd"),
        recurrence: todo.recurrence,
      };
      const { data: newData } = await supabase.from("todos").insert(newRow).select().single();

      setTodos((prev) => {
        const updated = prev.map((t) => (t.id === id ? { ...t, completed: true } : t));
        if (newData) updated.push(rowToTodo(newData));
        return updated;
      });
    } else {
      const newCompleted = !todo.completed;
      await supabase.from("todos").update({ completed: newCompleted }).eq("id", id);
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: newCompleted } : t)));
    }
  }, [todos]);

  const removeTodo = useCallback(async (id: string) => {
    await supabase.from("todos").delete().eq("id", id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const restoreTodo = useCallback(async (todo: Todo) => {
    const row = {
      id: todo.id,
      text: todo.text,
      completed: todo.completed,
      category: todo.category,
      person: todo.person,
      deadline: todo.deadline ? format(todo.deadline, "yyyy-MM-dd") : null,
      recurrence: todo.recurrence,
      amount: todo.amount ?? null,
      story_number: todo.storyNumber ?? null,
      story_month: todo.storyMonth ?? null,
    };
    const { data } = await supabase.from("todos").insert(row).select().single();
    if (data) setTodos((prev) => [...prev, rowToTodo(data)]);
  }, []);

  return (
    <TodoContext.Provider value={{ todos, setTodos, toggleTodo, removeTodo, restoreTodo, addTodo, updateTodo, loading }}>
      {children}
    </TodoContext.Provider>
  );
};

export const useTodos = () => {
  const ctx = useContext(TodoContext);
  if (!ctx) throw new Error("useTodos must be used within TodoProvider");
  return ctx;
};
