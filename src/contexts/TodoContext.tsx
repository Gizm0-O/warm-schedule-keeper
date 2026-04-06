import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { startOfDay, isBefore, addDays, addWeeks, addMonths } from "date-fns";
import { INITIAL_TODOS, type Todo, type Recurrence } from "@/data/todos";

interface TodoContextType {
  todos: Todo[];
  setTodos: React.Dispatch<React.SetStateAction<Todo[]>>;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
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

export const TodoProvider = ({ children }: { children: ReactNode }) => {
  const [todos, setTodos] = useState<Todo[]>(INITIAL_TODOS);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) => {
      const todo = prev.find((t) => t.id === id);
      if (!todo) return prev;

      if (!todo.completed && todo.recurrence !== "none") {
        const baseDate = todo.deadline ?? startOfDay(new Date());
        let nextDeadline = getNextDeadline(baseDate, todo.recurrence);
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
  }, []);

  const removeTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <TodoContext.Provider value={{ todos, setTodos, toggleTodo, removeTodo }}>
      {children}
    </TodoContext.Provider>
  );
};

export const useTodos = () => {
  const ctx = useContext(TodoContext);
  if (!ctx) throw new Error("useTodos must be used within TodoProvider");
  return ctx;
};
