import type { Todo } from "@/data/todos";

/**
 * Returns the previous unfinished story in the same month series, or null if user can complete this todo.
 * Blocks completion of story N if any earlier story (1..N-1) in the same month is not completed.
 */
export function getBlockingPrevStory(todo: Todo, allTodos: Todo[]): Todo | null {
  if (!todo.storyNumber || !todo.storyMonth) return null;
  const previous = allTodos
    .filter(t => t.storyMonth === todo.storyMonth && t.storyNumber && t.storyNumber < todo.storyNumber)
    .sort((a, b) => (a.storyNumber ?? 0) - (b.storyNumber ?? 0));
  const blocker = previous.find(t => !t.completed);
  return blocker ?? null;
}
