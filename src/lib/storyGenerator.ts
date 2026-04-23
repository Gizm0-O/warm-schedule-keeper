import { addDays, format, getDay } from "date-fns";

export interface DraftStory {
  storyNumber: number;
  text: string;
  deadline: string; // YYYY-MM-DD
  amount: number;
  bonusAmount: number;
  bonusPercent: "on_time" | "late" | "missed";
}

/**
 * Computes 6 deadlines: Wednesdays (3) and Sundays (0), starting from the first such day on/after the 5th of month.
 */
export function computeStoryDeadlines(monthYYYYMM: string): string[] {
  const [y, m] = monthYYYYMM.split("-").map(Number);
  let cursor = new Date(y, m - 1, 5);
  const deadlines: string[] = [];
  while (deadlines.length < 6) {
    const dow = getDay(cursor); // 0=Sun, 3=Wed
    if (dow === 0 || dow === 3) {
      deadlines.push(format(cursor, "yyyy-MM-dd"));
    }
    cursor = addDays(cursor, 1);
  }
  return deadlines;
}

export function buildDefaultDrafts(monthYYYYMM: string): DraftStory[] {
  const deadlines = computeStoryDeadlines(monthYYYYMM);
  return deadlines.map((d, i) => ({
    storyNumber: i + 1,
    text: `Napsat příběh ${i + 1}`,
    deadline: d,
    amount: 4500,
    bonusAmount: i === 5 ? 2000 : 0, // bonus 2000 Kč pro 6. příběh
    bonusPercent: "on_time",
  }));
}
