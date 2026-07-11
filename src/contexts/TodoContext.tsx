import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { startOfDay, isBefore, addDays, addWeeks, addMonths, format, parseISO, getDay } from "date-fns";
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
  recurrenceDays?: number[];
  amount?: number;
  storyNumber?: number;
  storyMonth?: string;
  created_at?: string;
  completed_at?: string;
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

const getNextDeadline = (current: Date, recurrence: Recurrence, days?: number[]): Date => {
  switch (recurrence) {
    case "daily": return addDays(current, 1);
    case "every2days": return addDays(current, 2);
    case "every3days": return addDays(current, 3);
    case "weekly": return addWeeks(current, 1);
    case "biweekly": return addWeeks(current, 2);
    case "monthly": return addMonths(current, 1);
    case "weekdays": {
      if (!days || days.length === 0) return addWeeks(current, 1);
      let next = addDays(current, 1);
      for (let i = 0; i < 14; i++) {
        if (days.includes(getDay(next))) return next;
        next = addDays(next, 1);
      }
      return next;
    }
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
  recurrenceDays: row.recurrence_days ?? undefined,
  amount: row.amount ?? undefined,
  storyNumber: row.story_number ?? undefined,
  storyMonth: row.story_month ?? undefined,
  created_at: row.created_at ?? undefined,
  completed_at: row.completed_at ?? undefined,
});


export const TodoProvider = ({ children }: { children: ReactNode }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodos = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setTodos([]);
        setLoading(false);
        return;
      }
      const { data } = await supabase.from("todos").select("*").order("created_at");
      if (data) setTodos(data.map(rowToTodo));
      setLoading(false);
    };
    fetchTodos();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s?.user) setTimeout(() => fetchTodos(), 0);
      else setTodos([]);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const addTodo = useCallback(async (todo: Omit<Todo, "id">) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic: Todo = { ...todo, id: tempId };
    setTodos((prev) => [...prev, optimistic]);
    const row = {
      text: todo.text,
      completed: todo.completed,
      category: todo.category,
      person: todo.person,
      deadline: todo.deadline ? format(todo.deadline, "yyyy-MM-dd") : null,
      recurrence: todo.recurrence,
      recurrence_days: todo.recurrenceDays ?? null,
      amount: todo.amount ?? null,
    };
    const { data, error } = await supabase.from("todos").insert(row).select().single();
    if (error || !data) {
      console.error("[addTodo] failed, rolling back", error);
      setTodos((prev) => prev.filter((t) => t.id !== tempId));
      return;
    }
    setTodos((prev) => prev.map((t) => (t.id === tempId ? rowToTodo(data) : t)));
  }, []);

  const updateTodo = useCallback(async (id: string, updates: Partial<Omit<Todo, "id">>) => {
    let prevSnapshot: Todo | undefined;
    setTodos((prev) => {
      prevSnapshot = prev.find((t) => t.id === id);
      return prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
    });
    const row: any = { ...updates };
    if (updates.deadline !== undefined) {
      row.deadline = updates.deadline ? format(updates.deadline, "yyyy-MM-dd") : null;
    }
    if ("recurrenceDays" in updates) {
      row.recurrence_days = updates.recurrenceDays ?? null;
      delete row.recurrenceDays;
    }
    Object.keys(row).forEach((k) => row[k] === undefined && delete row[k]);
    delete row.id;
    const { error } = await supabase.from("todos").update(row).eq("id", id);
    if (error) {
      console.error("[updateTodo] failed, rolling back", error, { id, row });
      if (prevSnapshot) setTodos((prev) => prev.map((t) => (t.id === id ? prevSnapshot! : t)));
    }
  }, []);

  const toggleTodo = useCallback(async (id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    const nowIso = new Date().toISOString();

    if (!todo.completed && todo.recurrence !== "none") {
      const baseDate = todo.deadline ?? startOfDay(new Date());
      let nextDeadline = getNextDeadline(baseDate, todo.recurrence, todo.recurrenceDays);
      const today = startOfDay(new Date());
      while (isBefore(nextDeadline, today)) {
        nextDeadline = getNextDeadline(nextDeadline, todo.recurrence, todo.recurrenceDays);
      }
      const tempId = `temp-${Date.now()}`;
      const placeholder: Todo = {
        ...todo,
        id: tempId,
        completed: false,
        deadline: nextDeadline,
        completed_at: undefined,
      };
      setTodos((prev) => [
        ...prev.map((t) => (t.id === id ? { ...t, completed: true, completed_at: nowIso } : t)),
        placeholder,
      ]);

      const { error: updErr } = await supabase.from("todos").update({ completed: true }).eq("id", id);
      const newRow = {
        text: todo.text,
        completed: false,
        category: todo.category,
        person: todo.person,
        deadline: format(nextDeadline, "yyyy-MM-dd"),
        recurrence: todo.recurrence,
        recurrence_days: todo.recurrenceDays ?? null,
      };
      const { data: newData, error: insErr } = await supabase.from("todos").insert(newRow).select().single();

      if (updErr || insErr) {
        console.error("[toggleTodo recurrence] rollback", updErr || insErr);
        setTodos((prev) =>
          prev
            .filter((t) => t.id !== tempId)
            .map((t) => (t.id === id ? { ...t, completed: false, completed_at: undefined } : t))
        );
        return;
      }
      if (newData) {
        setTodos((prev) => prev.map((t) => (t.id === tempId ? rowToTodo(newData) : t)));
      }
    } else {
      const newCompleted = !todo.completed;
      setTodos((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, completed: newCompleted, completed_at: newCompleted ? nowIso : undefined }
            : t
        )
      );
      const { error } = await supabase.from("todos").update({ completed: newCompleted }).eq("id", id);
      if (error) {
        console.error("[toggleTodo] rollback", error);
        setTodos((prev) =>
          prev.map((t) =>
            t.id === id
              ? { ...t, completed: todo.completed, completed_at: todo.completed_at }
              : t
          )
        );
      }
    }
  }, [todos]);

  const removeTodo = useCallback(async (id: string) => {
    let removed: Todo | undefined;
    setTodos((prev) => {
      removed = prev.find((t) => t.id === id);
      return prev.filter((t) => t.id !== id);
    });
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error && removed) {
      console.error("[removeTodo] rollback", error);
      setTodos((prev) => [...prev, removed!]);
    }
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
      recurrence_days: todo.recurrenceDays ?? null,
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
