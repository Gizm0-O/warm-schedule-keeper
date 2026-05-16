export type Category = "work" | "home";
export type Person = "Tadeáš" | "Barča";
export type Recurrence = "none" | "daily" | "every2days" | "every3days" | "weekly" | "biweekly" | "monthly" | "weekdays";

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  none: "Bez opakování",
  daily: "Denně",
  every2days: "Každé 2 dny",
  every3days: "Každé 3 dny",
  weekly: "Týdně",
  biweekly: "Každé 2 týdny",
  monthly: "Měsíčně",
  weekdays: "Vybrané dny v týdnu",
};

// 0 = Neděle, 1 = Pondělí, ... 6 = Sobota (kompatibilní s date-fns getDay)
export const WEEKDAY_SHORT: Record<number, string> = {
  1: "Po", 2: "Út", 3: "St", 4: "Čt", 5: "Pá", 6: "So", 0: "Ne",
};
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

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

export const INITIAL_TODOS: Todo[] = [
  { id: "1", text: "Dokončit video", completed: false, category: "work", person: "Tadeáš", deadline: new Date(2026, 3, 4), recurrence: "none" },
  { id: "2", text: "Postnout Stories", completed: false, category: "work", person: "Tadeáš", deadline: new Date(2026, 3, 5), recurrence: "none" },
  { id: "3", text: "Udělat Reel", completed: false, category: "work", person: "Tadeáš", deadline: new Date(2026, 3, 6), recurrence: "none" },
  { id: "4", text: "Vysát", completed: false, category: "home", person: "Tadeáš", deadline: new Date(2026, 3, 5), recurrence: "weekly" },
  { id: "5", text: "Vytřít", completed: false, category: "home", person: "Tadeáš", deadline: new Date(2026, 3, 7), recurrence: "weekly" },
  { id: "6", text: "Nakrmit kočky", completed: false, category: "home", person: "Tadeáš", deadline: new Date(2026, 3, 5), recurrence: "daily" },
  { id: "7", text: "Napsat příběh 1", completed: false, category: "work", person: "Barča", deadline: new Date(2026, 3, 3), recurrence: "none" },
  { id: "8", text: "Práce pro Vyhraj", completed: false, category: "work", person: "Barča", deadline: new Date(2026, 3, 3), recurrence: "none" },
  { id: "9", text: "Napsat příběh 2", completed: false, category: "work", person: "Barča", deadline: new Date(2026, 3, 10), recurrence: "none" },
  { id: "10", text: "Uvařit oběd", completed: false, category: "home", person: "Barča", deadline: new Date(2026, 3, 6), recurrence: "none" },
  { id: "11", text: "Snídaně", completed: false, category: "home", person: "Barča", deadline: new Date(2026, 3, 7), recurrence: "daily" },
  { id: "12", text: "Večeře", completed: false, category: "home", person: "Barča", deadline: new Date(2026, 3, 8), recurrence: "daily" },
];
