import { differenceInDays, startOfDay } from "date-fns";

export type BonusStatus = "pending" | "on_time" | "late" | "missed";

/**
 * Spočítá bonus status dynamicky podle deadline:
 * - on_time: deadline je dnes nebo v budoucnu
 * - late: zpoždění 1–7 dní
 * - missed: zpoždění >7 dní
 */
export function computeBonusFromDeadline(deadline?: Date | null): BonusStatus {
  if (!deadline) return "on_time";
  const today = startOfDay(new Date());
  const d = startOfDay(deadline);
  const daysLate = differenceInDays(today, d);
  if (daysLate <= 0) return "on_time";
  if (daysLate <= 7) return "late";
  return "missed";
}
