import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
  differenceInDays,
  getDay,
} from "date-fns";
import { cs } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, X, CalendarDays, CalendarRange, Briefcase, Home, ArrowLeftRight, Pencil, AlertCircle, Repeat, Check, Trash2 } from "lucide-react";
import { useCalendarEvents, type CalendarEvent } from "@/hooks/useCalendarEvents";
import { useShiftOverrides } from "@/hooks/useShiftOverrides";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RECURRENCE_LABELS, type Todo } from "@/data/todos";
import { useTodos } from "@/contexts/TodoContext";
import ItalySavingsBanner from "@/components/ItalySavingsBanner";


const FAMILY_NAMES = new Set([
  "Tadeáš","Barbora","Sebastian","Luděk","Ludmila","Jitka","Stanislava","Anna","Lenka","Andrea",
  "Aleš","Adéla","Jan","Ema","Ester","Rudolf","Markéta","Damián","Marie","Jiří","Kateřina",
  "Eva","Robin","Radek","Tereza","Martin"
]);

const NAME_DAYS: Record<string, string> = {
  "01-01":"Nový rok","01-02":"Karina","01-03":"Radmila","01-04":"Diana","01-05":"Dalimil",
  "01-06":"Kašpar","01-07":"Vilma","01-08":"Čestmír","01-09":"Vladan","01-10":"Břetislav",
  "01-11":"Bohdana","01-12":"Pravoslav","01-13":"Edita","01-14":"Radovan","01-15":"Alice",
  "01-16":"Ctirad","01-17":"Drahoslav","01-18":"Vladislav","01-19":"Doubravka","01-20":"Ilona",
  "01-21":"Běla","01-22":"Slavomír","01-23":"Zdeněk","01-24":"Milena","01-25":"Miloš",
  "01-26":"Zora","01-27":"Ingrid","01-28":"Otýlie","01-29":"Zdislava","01-30":"Robin","01-31":"Marika",
  "02-01":"Hynek","02-02":"Nela","02-03":"Blažej","02-04":"Jarmila","02-05":"Dobromila",
  "02-06":"Vanda","02-07":"Veronika","02-08":"Milada","02-09":"Apolena","02-10":"Mojmír",
  "02-11":"Božena","02-12":"Slavěna","02-13":"Věnceslav","02-14":"Valentýn","02-15":"Jiřina",
  "02-16":"Ljuba","02-17":"Miloslava","02-18":"Gizela","02-19":"Patrik","02-20":"Oldřich",
  "02-21":"Lenka","02-22":"Petr","02-23":"Svatopluk","02-24":"Matěj","02-25":"Liliana",
  "02-26":"Dorota","02-27":"Alexandr","02-28":"Lumír","02-29":"Horymír",
  "03-01":"Bedřich","03-02":"Anežka","03-03":"Kamil","03-04":"Stela","03-05":"Kazimír",
  "03-06":"Miroslav","03-07":"Tomáš","03-08":"Gabriela","03-09":"Františka","03-10":"Viktorie",
  "03-11":"Anděla","03-12":"Řehoř","03-13":"Růžena","03-14":"Rút","03-15":"Ida",
  "03-16":"Elena","03-17":"Josef","03-18":"Eduard","03-19":"Josef","03-20":"Světlana",
  "03-21":"Radek","03-22":"Leona","03-23":"Ivona","03-24":"Gabriel","03-25":"Marián",
  "03-26":"Emanuel","03-27":"Dita","03-28":"Soňa","03-29":"Taťána","03-30":"Arnošt","03-31":"Kvído",
  "04-01":"Hugo","04-02":"Erika","04-03":"Richard","04-04":"Ivana","04-05":"Miroslava",
  "04-06":"Vendula","04-07":"Heřman","04-08":"Ema","04-09":"Dušan","04-10":"Darja",
  "04-11":"Izabela","04-12":"Julius","04-13":"Aleš","04-14":"Vincenc","04-15":"Anastázie",
  "04-16":"Irena","04-17":"Rudolf","04-18":"Valerie","04-19":"Rostislava","04-20":"Marcela",
  "04-21":"Alexandra","04-22":"Evženie","04-23":"Vojtěch","04-24":"Jiří","04-25":"Marek",
  "04-26":"Oto","04-27":"Jaroslav","04-28":"Vlastislav","04-29":"Robert","04-30":"Blahoslav",
  "05-01":"Svátek práce","05-02":"Zikmund","05-03":"Alexej","05-04":"Květoslav","05-05":"Klaudie",
  "05-06":"Radoslav","05-07":"Stanislav","05-08":"Den vítězství","05-09":"Ctibor","05-10":"Blažena",
  "05-11":"Svatava","05-12":"Pankrác","05-13":"Servác","05-14":"Bonifác","05-15":"Žofie",
  "05-16":"Přemysl","05-17":"Aneta","05-18":"Nataša","05-19":"Ivo","05-20":"Zbyšek",
  "05-21":"Monika","05-22":"Emil","05-23":"Vladimír","05-24":"Jana","05-25":"Viola",
  "05-26":"Filip","05-27":"Valdemar","05-28":"Vilém","05-29":"Maxmilián","05-30":"Ferdinand","05-31":"Kamila",
  "06-01":"Laura","06-02":"Jarmil","06-03":"Tamara","06-04":"Dalibor","06-05":"Dobroslav",
  "06-06":"Norbert","06-07":"Iveta","06-08":"Medard","06-09":"Stanislava","06-10":"Gita",
  "06-11":"Bruno","06-12":"Antonie","06-13":"Antonín","06-14":"Roland","06-15":"Vít",
  "06-16":"Zbyněk","06-17":"Adolf","06-18":"Milan","06-19":"Leoš","06-20":"Květa",
  "06-21":"Alois","06-22":"Pavla","06-23":"Zdeňka","06-24":"Jan","06-25":"Ivan",
  "06-26":"Adriana","06-27":"Ladislav","06-28":"Lubomír","06-29":"Petr a Pavel","06-30":"Šárka",
  "07-01":"Jaroslava","07-02":"Patricie","07-03":"Radomír","07-04":"Prokop","07-05":"Cyril a Metoděj",
  "07-06":"Jan Hus","07-07":"Bohuslava","07-08":"Nora","07-09":"Drahoslava","07-10":"Libuše",
  "07-11":"Olga","07-12":"Bořek","07-13":"Markéta","07-14":"Karolína","07-15":"Jindřich",
  "07-16":"Luboš","07-17":"Martina","07-18":"Drahomíra","07-19":"Čeněk","07-20":"Ilja",
  "07-21":"Vítězslav","07-22":"Magdaléna","07-23":"Libor","07-24":"Kristýna","07-25":"Jakub",
  "07-26":"Anna","07-27":"Věroslav","07-28":"Viktor","07-29":"Marta","07-30":"Bořivoj","07-31":"Ignác",
  "08-01":"Oskar","08-02":"Gustav","08-03":"Miluše","08-04":"Dominik","08-05":"Kristián",
  "08-06":"Oldřiška","08-07":"Lada","08-08":"Soběslav","08-09":"Roman","08-10":"Vavřinec",
  "08-11":"Zuzana","08-12":"Klára","08-13":"Alžběta","08-14":"Arnošt","08-15":"Hana",
  "08-16":"Jáchym","08-17":"Petra","08-18":"Helena","08-19":"Ludvík","08-20":"Bernard",
  "08-21":"Johana","08-22":"Bohuslav","08-23":"Sandra","08-24":"Bartoloměj","08-25":"Radim",
  "08-26":"Luděk","08-27":"Otakar","08-28":"Augustýn","08-29":"Ola","08-30":"Vladěna","08-31":"Pavlína",
  "09-01":"Linda","09-02":"Adéla","09-03":"Bronislav","09-04":"Jindřiška","09-05":"Boris",
  "09-06":"Boleslav","09-07":"Regína","09-08":"Mariana","09-09":"Daniela","09-10":"Irma",
  "09-11":"Denisa","09-12":"Marie","09-13":"Lubor","09-14":"Radka","09-15":"Jolana",
  "09-16":"Ludmila","09-17":"Naděžda","09-18":"Kryštof","09-19":"Zita","09-20":"Oleg",
  "09-21":"Matouš","09-22":"Darina","09-23":"Bořislav","09-24":"Jaromír","09-25":"Zlata",
  "09-26":"Andrea","09-27":"Jonáš","09-28":"Václav","09-29":"Michal","09-30":"Jeroným",
  "10-01":"Igor","10-02":"Olivie","10-03":"Bohumil","10-04":"František","10-05":"Eliška",
  "10-06":"Hanuš","10-07":"Justýna","10-08":"Věra","10-09":"Štefan","10-10":"Marina",
  "10-11":"Andrej","10-12":"Marcel","10-13":"Renáta","10-14":"Agáta","10-15":"Tereza",
  "10-16":"Havel","10-17":"Hedvika","10-18":"Lukáš","10-19":"Michaela","10-20":"Vendelín",
  "10-21":"Brigita","10-22":"Sabina","10-23":"Teodor","10-24":"Nina","10-25":"Beáta",
  "10-26":"Erik","10-27":"Šarlota","10-28":"Den vzniku ČSR","10-29":"Silvie","10-30":"Tadeáš","10-31":"Štěpánka",
  "11-01":"Felix","11-02":"Dušičky","11-03":"Hubert","11-04":"Karel","11-05":"Miriam",
  "11-06":"Liběna","11-07":"Saskie","11-08":"Bohumír","11-09":"Bohdan","11-10":"Evžen",
  "11-11":"Martin","11-12":"Benedikt","11-13":"Tibor","11-14":"Sáva","11-15":"Leopold",
  "11-16":"Otmar","11-17":"Den boje za svobodu","11-18":"Romana","11-19":"Alžběta","11-20":"Nikola",
  "11-21":"Albert","11-22":"Cecílie","11-23":"Klement","11-24":"Emílie","11-25":"Kateřina",
  "11-26":"Artur","11-27":"Xenie","11-28":"René","11-29":"Zina","11-30":"Ondřej",
  "12-01":"Iva","12-02":"Blanka","12-03":"Františka","12-04":"Barbora","12-05":"Jitka",
  "12-06":"Mikuláš","12-07":"Ambróž","12-08":"Květoslava","12-09":"Dagmar","12-10":"Julie",
  "12-11":"Dana","12-12":"Simona","12-13":"Lucie","12-14":"Lýdie","12-15":"Radana",
  "12-16":"Albína","12-17":"Daniel","12-18":"Miloslav","12-19":"Ester","12-20":"Dagmar",
  "12-21":"Natálie","12-22":"Šimon","12-23":"Vlasta","12-24":"Štědrý den","12-25":"1. svátek vánoční",
  "12-26":"2. svátek vánoční","12-27":"Žaneta","12-28":"Bohumila","12-29":"Judita","12-30":"David","12-31":"Silvestr",
};


type ViewMode = "month" | "week";

// CalendarEvent type imported from hook

const EVENT_COLORS = [
  { label: "Zelená", value: "bg-primary/20 text-primary border-primary/30" },
  { label: "Červená", value: "bg-destructive/20 text-destructive border-destructive/30" },
  { label: "Zelená tmavá", value: "bg-success/20 text-success border-success/30" },
  { label: "Oranžová", value: "bg-warning/20 text-warning border-warning/30" },
];

const WEEKDAYS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

const BIRTHDAY_DATES = new Set(["04-16", "05-15", "11-06"]);
const isBirthday = (date: Date) => BIRTHDAY_DATES.has(format(date, "MM-dd"));
const BIRTHDAY_NAMES: Record<string, string> = {
  "04-16": "Barča",
  "05-15": "Tadeáš",
  "11-06": "Sebastián",
};
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const NIGHT_HOURS = new Set([0, 1, 2, 3, 4, 5]);
const getHourHeight = (hour: number) => NIGHT_HOURS.has(hour) ? 14 : 36;

// Shift definitions
interface Shift {
  person: string;
  location: string;
  startHour: number;
  endHour: number;
  bgClass: string;
  textClass: string;
  borderClass: string;
  icon: "office" | "home";
}

interface DisplayShift extends Shift {
  shiftKey: string;
  dayKey: string;
  sourceDayKey: string;
  sourceIndex: number;
}

// day of week (1=Mon..5=Fri) -> shifts
const SHIFT_SCHEDULE: Record<number, Shift[]> = {
  1: [
    { person: "Tadeáš", location: "Kancelář", startHour: 7, endHour: 14, bgClass: "bg-shift-office/15", textClass: "text-shift-office", borderClass: "border-shift-office/40", icon: "office" },
    { person: "Barča", location: "Z domu", startHour: 14, endHour: 21, bgClass: "bg-shift-partner/15", textClass: "text-shift-partner", borderClass: "border-shift-partner/40", icon: "home" },
  ],
  2: [
    { person: "Barča", location: "Z domu", startHour: 7, endHour: 14, bgClass: "bg-shift-partner/15", textClass: "text-shift-partner", borderClass: "border-shift-partner/40", icon: "home" },
    { person: "Tadeáš", location: "Z domu", startHour: 14, endHour: 21, bgClass: "bg-shift-home/15", textClass: "text-shift-home", borderClass: "border-shift-home/40", icon: "home" },
  ],
  3: [
    { person: "Tadeáš", location: "Kancelář", startHour: 7, endHour: 14, bgClass: "bg-shift-office/15", textClass: "text-shift-office", borderClass: "border-shift-office/40", icon: "office" },
    { person: "Barča", location: "Z domu", startHour: 14, endHour: 21, bgClass: "bg-shift-partner/15", textClass: "text-shift-partner", borderClass: "border-shift-partner/40", icon: "home" },
  ],
  4: [
    { person: "Barča", location: "Z domu", startHour: 7, endHour: 14, bgClass: "bg-shift-partner/15", textClass: "text-shift-partner", borderClass: "border-shift-partner/40", icon: "home" },
    { person: "Tadeáš", location: "Z domu", startHour: 14, endHour: 21, bgClass: "bg-shift-home/15", textClass: "text-shift-home", borderClass: "border-shift-home/40", icon: "home" },
  ],
  5: [
    { person: "Tadeáš", location: "Kancelář", startHour: 7, endHour: 14, bgClass: "bg-shift-office/15", textClass: "text-shift-office", borderClass: "border-shift-office/40", icon: "office" },
    { person: "Barča", location: "Z domu", startHour: 14, endHour: 21, bgClass: "bg-shift-partner/15", textClass: "text-shift-partner", borderClass: "border-shift-partner/40", icon: "home" },
  ],
};

const getDefaultShiftsForDay = (day: Date): Shift[] => {
  const dow = getDay(day);
  const isoDay = dow === 0 ? 7 : dow;
  return SHIFT_SCHEDULE[isoDay] || [];
};

const swapShifts = (shifts: Shift[]): Shift[] => {
  if (shifts.length !== 2) return shifts;
  const [morning, afternoon] = shifts;
  return [
    { ...afternoon, startHour: 7, endHour: 14 },
    { ...morning, startHour: 14, endHour: 21 },
  ];
};

const Index = () => {
  const { events, setEvents, addEvent: addEventToDb, updateEvent: updateEventInDb, removeEvent: removeEventFromDb } = useCalendarEvents();
  const { todos, toggleTodo } = useTodos();
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventHour, setNewEventHour] = useState<number>(9);
  const [newEventEndHour, setNewEventEndHour] = useState<number>(10);
  const [newEventColor, setNewEventColor] = useState(EVENT_COLORS[0].value);
  const [newEventAllDay, setNewEventAllDay] = useState(false);
  const [newEventDate, setNewEventDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [showNewEventDialog, setShowNewEventDialog] = useState(false);
  const [now, setNow] = useState(new Date());
  const {
    swappedDays, locationOverrides, shiftTimeOverrides, shiftDayOverrides, hiddenShifts,
    toggleSwapDay, toggleLocation, setShiftTime, setShiftDay,
    setShiftTimeOverrides, setShiftDayOverrides, saveDragResult, deleteShiftOverrides,
    hideShift, unhideShift,
  } = useShiftOverrides();
  const { pushAction } = useUndoRedo();

  // Edit event dialog
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editHour, setEditHour] = useState(9);
  const [editEndHour, setEditEndHour] = useState(10);
  const [editColor, setEditColor] = useState(EVENT_COLORS[0].value);

  // Edit shift dialog
  const [editingShift, setEditingShift] = useState<DisplayShift | null>(null);
  const [editShiftStart, setEditShiftStart] = useState(7);
  const [editShiftEnd, setEditShiftEnd] = useState(14);

  // Drag state
  const DRAG_THRESHOLD = 5; // px before drag starts
  const wasDragging = useRef(false);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{
    type: "event" | "shift";
    id: string;
    mode: "resize-top" | "resize-bottom" | "move";
    origHour: number;
    origEndHour: number;
    origDayIdx: number;
    offsetHour: number; // offset from cursor to block start (for natural move)
  } | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const hourFromY = useCallback((clientY: number) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const headerEl = timelineRef.current.querySelector(".sticky") as HTMLElement | null;
    const headerHeight = headerEl ? headerEl.offsetHeight : 0;
    const y = clientY - rect.top + timelineRef.current.scrollTop - headerHeight;
    let acc = 0;
    for (const h of HOURS) {
      const hh = getHourHeight(h);
      if (y < acc + hh) return h;
      acc += hh;
    }
    return 23;
  }, []);

  const dayIdxFromX = useCallback((clientX: number) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left - 60;
    const colW = (rect.width - 60) / 7;
    return Math.max(0, Math.min(6, Math.floor(x / colW)));
  }, []);

  const onEventDragStart = useCallback((e: React.MouseEvent, ev: CalendarEvent, mode: "resize-top" | "resize-bottom" | "move", dayIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const startH = ev.hour ?? 0;
    const endH = ev.endHour ?? startH + 1;
    const cursorHour = hourFromY(e.clientY);
    const offsetHour = cursorHour - startH;
    wasDragging.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragRef.current = { type: "event", id: ev.id, mode, origHour: startH, origEndHour: endH, origDayIdx: dayIdx, offsetHour };

    const onMove = (me: MouseEvent) => {
      if (!dragRef.current || dragRef.current.type !== "event") return;
      // Check threshold
      if (!wasDragging.current && dragStartPos.current) {
        const dx = me.clientX - dragStartPos.current.x;
        const dy = me.clientY - dragStartPos.current.y;
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      }
      wasDragging.current = true;
      const newHour = hourFromY(me.clientY);
      const newDayIdx = dayIdxFromX(me.clientX);

      setEvents((prev) =>
        prev.map((e) => {
          if (!dragRef.current || e.id !== dragRef.current.id) return e;
          if (dragRef.current.mode === "resize-bottom") {
            const end = Math.max(newHour + 1, (e.hour ?? 0) + 1);
            return { ...e, endHour: Math.min(end, 24) };
          } else if (dragRef.current.mode === "resize-top") {
            const start = Math.min(newHour, (e.endHour ?? 1) - 1);
            return { ...e, hour: Math.max(start, 0) };
          } else {
            const duration = dragRef.current.origEndHour - dragRef.current.origHour;
            const newStart = Math.max(0, Math.min(newHour - dragRef.current.offsetHour, 24 - duration));
            const wEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
            const wd = eachDayOfInterval({ start: currentWeekStart, end: wEnd });
            const targetDay = wd[newDayIdx];
            return { ...e, hour: newStart, endHour: newStart + duration, date: format(targetDay, "yyyy-MM-dd") };
          }
        })
      );
    };

    const origEventData = { hour: ev.hour, endHour: ev.endHour, date: ev.date };

    const onUp = () => {
      const dragId = dragRef.current?.id;
      const wasDrag = wasDragging.current;
      dragRef.current = null;
      dragStartPos.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      // Save updated event to DB after drag + push undo
      if (wasDrag && dragId) {
        setTimeout(() => {
          setEvents((prev) => {
            const evNow = prev.find((e) => e.id === dragId);
            if (evNow) {
              const newData = { hour: evNow.hour, endHour: evNow.endHour, date: evNow.date };
              updateEventInDb(evNow.id, newData);
              pushAction({
                undo: () => {
                  updateEventInDb(dragId, origEventData);
                },
                redo: () => {
                  updateEventInDb(dragId, newData);
                },
              });
            }
            return prev;
          });
        }, 0);
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [hourFromY, dayIdxFromX, currentWeekStart, updateEventInDb, pushAction]);

  const onShiftDragStart = useCallback((e: React.MouseEvent, sourceDayKey: string, shiftIndex: number, shift: Shift, mode: "resize-top" | "resize-bottom" | "move", dayIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const id = `${sourceDayKey}:${shiftIndex}`;
    const cursorHour = hourFromY(e.clientY);
    const offsetHour = cursorHour - shift.startHour;
    wasDragging.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragRef.current = { type: "shift", id, mode, origHour: shift.startHour, origEndHour: shift.endHour, origDayIdx: dayIdx, offsetHour };

    // Capture original overrides for undo
    const origTimeOverride = shiftTimeOverrides[id] ? { ...shiftTimeOverrides[id] } : null;
    const origDayOverride = shiftDayOverrides[id] ?? null;

    const onMove = (me: MouseEvent) => {
      if (!dragRef.current || dragRef.current.type !== "shift") return;
      if (!wasDragging.current && dragStartPos.current) {
        const dx = me.clientX - dragStartPos.current.x;
        const dy = me.clientY - dragStartPos.current.y;
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      }
      wasDragging.current = true;
      const newHour = hourFromY(me.clientY);
      const newDayIdx = dayIdxFromX(me.clientX);
      const key = dragRef.current.id;

      if (dragRef.current.mode === "move") {
        const duration = dragRef.current.origEndHour - dragRef.current.origHour;
        const newStart = Math.max(0, Math.min(newHour - dragRef.current.offsetHour, 24 - duration));
        const wEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
        const wd = eachDayOfInterval({ start: currentWeekStart, end: wEnd });
        const targetDayKey = format(wd[newDayIdx], "yyyy-MM-dd");

        setShiftDayOverrides((prev) => {
          if (targetDayKey === sourceDayKey) {
            if (!(key in prev)) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
          }
          return { ...prev, [key]: targetDayKey };
        });

        setShiftTimeOverrides((prev) => ({
          ...prev,
          [key]: { startHour: newStart, endHour: newStart + duration },
        }));
        return;
      }

      setShiftTimeOverrides((prev) => {
        if (!dragRef.current) return prev;
        const existing = prev[key] ?? { startHour: dragRef.current.origHour, endHour: dragRef.current.origEndHour };
        if (dragRef.current.mode === "resize-bottom") {
          const end = Math.max(newHour + 1, existing.startHour + 1);
          return { ...prev, [key]: { ...existing, endHour: Math.min(end, 24) } };
        }

        const start = Math.min(newHour, existing.endHour - 1);
        return { ...prev, [key]: { ...existing, startHour: Math.max(start, 0) } };
      });
    };

    const onUp = () => {
      const dragId = dragRef.current?.id;
      const wasDrag = wasDragging.current;
      dragRef.current = null;
      dragStartPos.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (wasDrag && dragId) {
        const [srcDay] = dragId.split(":");
        // Read current overrides via setState callback to get fresh values
        let capturedTime: { startHour: number; endHour: number } | null = null;
        let capturedDay: string | null = null;
        setShiftTimeOverrides((prev) => {
          capturedTime = prev[dragId] ? { ...prev[dragId] } : null;
          return prev;
        });
        setShiftDayOverrides((prev) => {
          capturedDay = prev[dragId] ?? null;
          return prev;
        });

        saveDragResult(dragId, srcDay);

        // Use setTimeout to ensure capturedTime/capturedDay are set
        setTimeout(() => {
          pushAction({
            undo: () => {
              if (origTimeOverride) {
                setShiftTime(dragId, origTimeOverride.startHour, origTimeOverride.endHour);
              } else {
                deleteShiftOverrides(dragId);
              }
              setShiftDay(dragId, origDayOverride);
            },
            redo: () => {
              if (capturedTime) {
                setShiftTime(dragId, capturedTime.startHour, capturedTime.endHour);
              }
              setShiftDay(dragId, capturedDay);
              saveDragResult(dragId, srcDay);
            },
          });
        }, 0);
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [hourFromY, dayIdxFromX, currentWeekStart, shiftTimeOverrides, shiftDayOverrides, saveDragResult, setShiftTime, setShiftDay, deleteShiftOverrides, pushAction]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedDate) {
      setNewEventDate(format(selectedDate, "yyyy-MM-dd"));
    }
  }, [selectedDate]);

  const days = useMemo(() => {
    if (viewMode === "week") {
      const end = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: currentWeekStart, end });
    }
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth, currentWeekStart, viewMode]);

  const weekDays = useMemo(() => {
    const end = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: currentWeekStart, end });
  }, [currentWeekStart]);

  const goBack = () => {
    if (viewMode === "month") setCurrentMonth(subMonths(currentMonth, 1));
    else setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const goForward = () => {
    if (viewMode === "month") setCurrentMonth(addMonths(currentMonth, 1));
    else setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const goToday = () => {
    setCurrentMonth(new Date());
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const todayButtonLabel = useMemo(() => {
    if (viewMode === "month") {
      const label = format(currentMonth, "LLLL", { locale: cs });
      return label.charAt(0).toUpperCase() + label.slice(1);
    }
    const we = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return `${format(currentWeekStart, "d.M.")}–${format(we, "d.M.")}`;
  }, [viewMode, currentMonth, currentWeekStart]);

  const headerLabel =
    viewMode === "month"
      ? format(currentMonth, "LLLL yyyy", { locale: cs })
      : `${format(currentWeekStart, "d. MMM", { locale: cs })} – ${format(
          endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
          "d. MMM yyyy",
          { locale: cs }
        )}`;

  const addEvent = async () => {
    if (!newEventTitle.trim()) return;
    const dateStr = newEventDate || (selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
    const evData = {
      date: dateStr,
      title: newEventTitle.trim(),
      color: newEventColor,
      hour: newEventAllDay ? undefined : newEventHour,
      endHour: newEventAllDay ? undefined : newEventEndHour,
      allDay: newEventAllDay,
    };
    const added = await addEventToDb(evData);
    if (added) {
      pushAction({
        undo: () => removeEventFromDb(added.id),
        redo: () => addEventToDb({ ...evData, id: added.id }),
      });
    }
    setNewEventTitle("");
    setShowNewEventDialog(false);
  };

  const openNewEventDialog = () => {
    setNewEventTitle("");
    setNewEventHour(9);
    setNewEventEndHour(10);
    setNewEventColor(EVENT_COLORS[0].value);
    setNewEventDate(selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
    setShowNewEventDialog(true);
  };

  const removeEvent = async (id: string) => {
    const ev = events.find((e) => e.id === id);
    await removeEventFromDb(id);
    if (ev) {
      pushAction({
        undo: () => addEventToDb({ id: ev.id, date: ev.date, title: ev.title, color: ev.color, hour: ev.hour ?? undefined, endHour: ev.endHour ?? undefined }),
        redo: () => removeEventFromDb(ev.id),
      });
    }
  };

  const openEditEvent = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    setEditTitle(ev.title);
    setEditHour(ev.hour ?? 9);
    setEditEndHour(ev.endHour ?? (ev.hour !== undefined ? ev.hour + 1 : 10));
    setEditColor(ev.color);
  };

  const saveEditEvent = async () => {
    if (!editingEvent) return;
    const prevData = { title: editingEvent.title, hour: editingEvent.hour, endHour: editingEvent.endHour, color: editingEvent.color };
    const newData = { title: editTitle, hour: editHour, endHour: editEndHour, color: editColor };
    const evId = editingEvent.id;
    await updateEventInDb(evId, newData);
    pushAction({
      undo: () => updateEventInDb(evId, prevData),
      redo: () => updateEventInDb(evId, newData),
    });
    setEditingEvent(null);
  };

  const openEditShift = (shift: DisplayShift) => {
    setEditingShift(shift);
    const override = shiftTimeOverrides[shift.shiftKey];
    setEditShiftStart(override?.startHour ?? shift.startHour);
    setEditShiftEnd(override?.endHour ?? shift.endHour);
  };

  const saveEditShift = async () => {
    if (!editingShift) return;
    await setShiftTime(editingShift.shiftKey, editShiftStart, editShiftEnd);
    setEditingShift(null);
  };

  const getEventsForDate = (date: Date) =>
    events.filter((e) => e.date === format(date, "yyyy-MM-dd"));

  const getEventsForDateAndHour = (date: Date, hour: number) =>
    events.filter((e) => e.date === format(date, "yyyy-MM-dd") && e.hour === hour);

  const getHourTop = (hour: number) =>
    HOURS.slice(0, hour).reduce((sum, h) => sum + getHourHeight(h), 0);
  const totalGridHeight = HOURS.reduce((sum, h) => sum + getHourHeight(h), 0);

  const currentHour = now.getHours();
  const currentTimeTop = getHourTop(currentHour) + (now.getMinutes() / 60) * getHourHeight(currentHour);
  const isCurrentWeek = weekDays.some((d) => isSameDay(d, now));
  const currentDayIndex = weekDays.findIndex((d) => isSameDay(d, now));

  const resolveShiftFromKey = (shiftKey: string, dayKey: string): DisplayShift | null => {
    const [sourceDayKey, sourceIndexRaw] = shiftKey.split(":");
    const sourceIndex = Number(sourceIndexRaw);
    const [year, month, day] = sourceDayKey.split("-").map(Number);
    const defaults = getDefaultShiftsForDay(new Date(year, month - 1, day));
    const base = swappedDays.has(sourceDayKey) ? swapShifts(defaults) : defaults;
    const baseShift = base[sourceIndex];

    if (!baseShift) return null;

    let result: Shift = baseShift;
    const timeOverride = shiftTimeOverrides[shiftKey];
    if (timeOverride) {
      result = { ...result, startHour: timeOverride.startHour, endHour: timeOverride.endHour };
    }

    if (locationOverrides[shiftKey]) {
      const isHome = result.location === "Z domu";
      result = {
        ...result,
        location: isHome ? "Kancelář" : "Z domu",
        icon: isHome ? "office" as const : "home" as const,
        bgClass: result.person === "Tadeáš"
          ? (isHome ? "bg-shift-office/15" : "bg-shift-home/15")
          : result.bgClass,
        textClass: result.person === "Tadeáš"
          ? (isHome ? "text-shift-office" : "text-shift-home")
          : result.textClass,
        borderClass: result.person === "Tadeáš"
          ? (isHome ? "border-shift-office/40" : "border-shift-home/40")
          : result.borderClass,
      };
    }

    return {
      ...result,
      shiftKey,
      dayKey,
      sourceDayKey,
      sourceIndex,
    };
  };

  const getShiftsForDay = (day: Date): DisplayShift[] => {
    const dayKey = format(day, "yyyy-MM-dd");
    const defaults = getDefaultShiftsForDay(day);
    const localKeys = defaults
      .map((_, index) => `${dayKey}:${index}`)
      .filter((shiftKey) => (shiftDayOverrides[shiftKey] ?? dayKey) === dayKey && !hiddenShifts.has(shiftKey));

    const incomingKeys = Object.entries(shiftDayOverrides)
      .filter(([shiftKey, targetDayKey]) => targetDayKey === dayKey && !shiftKey.startsWith(`${dayKey}:`) && !hiddenShifts.has(shiftKey))
      .map(([shiftKey]) => shiftKey);

    return [...localKeys, ...incomingKeys]
      .map((shiftKey) => resolveShiftFromKey(shiftKey, dayKey))
      .filter((shift): shift is DisplayShift => shift !== null)
      .sort((a, b) => a.startHour - b.startHour || a.sourceDayKey.localeCompare(b.sourceDayKey) || a.sourceIndex - b.sourceIndex);
  };

  const toggleShiftLocation = (shiftKey: string) => {
    toggleLocation(shiftKey);
  };

  const handleSwapShift = () => {
    if (!selectedDate) return;
    const key = format(selectedDate, "yyyy-MM-dd");
    toggleSwapDay(key);
  };

  // Event spans multiple hours in weekly view
  const getEventBlocksForDay = (day: Date) => {
    const dayEvents = events.filter((e) => e.date === format(day, "yyyy-MM-dd") && e.hour !== undefined);
    return dayEvents;
  };

  const MONTH_GENITIVE = ["ledna","února","března","dubna","května","června","července","srpna","září","října","listopadu","prosince"];
  const todayLabel = useMemo(() => {
    const dayName = format(now, "EEEE", { locale: cs });
    return `Dnes je ${dayName}, ${format(now, "d")}. ${MONTH_GENITIVE[now.getMonth()]}`;
  }, [now]);

  return (
    <div className="space-y-6" onClick={() => setSelectedDate(null)}>
      {/* Italy Savings Banner */}
      <ItalySavingsBanner />
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">{todayLabel}</h2>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground capitalize">
            {headerLabel}
          </p>
        <div className="flex gap-1 items-center">
          <Button
            variant="default"
            size="sm"
            className="h-8 px-3 gap-1.5 mr-2"
            onClick={openNewEventDialog}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Událost</span>
          </Button>
          <div className="flex rounded-lg border border-border bg-muted p-0.5 mr-2">
            <Button
              variant={viewMode === "month" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3 gap-1.5"
              onClick={() => setViewMode("month")}
            >
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Měsíc</span>
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3 gap-1.5"
              onClick={() => setViewMode("week")}
            >
              <CalendarRange className="h-4 w-4" />
              <span className="hidden sm:inline">Týden</span>
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToday} className="text-xs">
            {todayButtonLabel}
          </Button>
          <Button variant="ghost" size="icon" onClick={goForward}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] 2xl:grid-cols-[1fr_476px]">
        {/* Calendar */}
        {viewMode === "month" ? (
          <div className="glass rounded-2xl p-4 animate-fade-in">
            <div className="mb-2 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((day) => (
                <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const dayEvents = getEventsForDate(day);
                const dayShifts = getShiftsForDay(day);
                const selected = selectedDate && isSameDay(day, selectedDate);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={(e) => { e.stopPropagation(); setSelectedDate(day); }}
                    className={cn(
                      "relative flex min-h-[80px] flex-col items-start rounded-xl p-2 text-sm transition-all hover:bg-accent",
                      !isSameMonth(day, currentMonth) && "opacity-30",
                      selected && "ring-2 ring-primary bg-accent",
                      isToday(day) && "bg-primary/5",
                isBirthday(day) && !selected && "bg-gradient-to-br from-amber-200 to-pink-200 ring-2 ring-amber-400 shadow-md"
                    )}
                  >
                    <span
                      className={cn(
                        "mb-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium",
                        isToday(day) && "bg-primary text-primary-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {isBirthday(day) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-1 -translate-y-[5%]">
                <span className="text-2xl leading-none">🎂</span>
                <span className="text-2xl text-amber-700 leading-tight"  style={{fontFamily: "'Dancing Script', cursive"}}>{BIRTHDAY_NAMES[format(day, "MM-dd")]}</span>
              </div>
            )}
{!isBirthday(day) && NAME_DAYS[format(day, "MM-dd")] && (
                      <span className={cn(
                        "text-[9px] leading-none mb-0.5 truncate w-full",
                        FAMILY_NAMES.has(NAME_DAYS[format(day, "MM-dd")])
                          ? "text-primary font-semibold"
                          : "text-muted-foreground/70"
                      )}>
                        {NAME_DAYS[format(day, "MM-dd")]}
                      </span>
                    )}
                    {dayShifts.length > 0 && (
                      <div className="flex flex-col gap-0.5 w-full">
                        {dayShifts.map((shift, si) => (
                          <div key={si} className={cn("flex items-center gap-1 rounded px-1 py-0.5", shift.bgClass)}>
                            <span className={cn("text-[10px] font-bold leading-none", shift.textClass)}>
                              {shift.person.charAt(0)}
                            </span>
                            {shift.icon === "office"
                              ? <Briefcase className={cn("h-2.5 w-2.5", shift.textClass)} />
                              : <Home className={cn("h-2.5 w-2.5", shift.textClass)} />}
                            <span className={cn("text-[9px] opacity-60 leading-none", shift.textClass)}>
                              {shift.startHour}–{shift.endHour}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex w-full flex-col gap-0.5 mt-0.5">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div key={ev.id} className={cn("truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium", ev.color)}>
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 2}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Weekly timeline view */
          <div className="glass rounded-2xl overflow-hidden animate-fade-in">
            <div className="overflow-y-auto scrollbar-hidden max-h-[600px] 2xl:max-h-[900px] relative" ref={timelineRef}>
            <div className="grid border-b border-border sticky top-0 z-20 bg-background/80 backdrop-blur-md" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
              <div className="border-r border-border" />
              {weekDays.map((day) => (
                <button
                  key={day.toISOString()}
                  onClick={(e) => { e.stopPropagation(); setSelectedDate(day); }}
                  className={cn(
                    "flex flex-col items-center py-3 transition-colors hover:bg-accent",
                    selectedDate && isSameDay(day, selectedDate) && "bg-accent",
                    isToday(day) && "bg-primary/5",
              isBirthday(day) && "bg-gradient-to-b from-amber-100 to-pink-100 ring-1 ring-amber-200"
                  )}
                >
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                    {format(day, "EEEEEE", { locale: cs })}
                  </span>
                  <span
                    className={cn(
                      "mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                      isToday(day) && "bg-primary text-primary-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {NAME_DAYS[format(day, "MM-dd")] && (
                    <span className={cn(
                      "text-[9px] leading-none mt-0.5 truncate max-w-full px-1",
                      FAMILY_NAMES.has(NAME_DAYS[format(day, "MM-dd")])
                        ? "text-primary font-semibold"
                        : "text-muted-foreground/60"
                    )}>
                      {NAME_DAYS[format(day, "MM-dd")]}
                    </span>
                  )}
                </button>
              ))}
            </div>
              <div className="relative" style={{ height: totalGridHeight }}>
                {/* Celodenní události – plovoucí nad kalendářem */}
                {weekDays.map((day, dayIdx) => {
                  const allDayEvs = events.filter(e => e.date === format(day, "yyyy-MM-dd") && e.allDay);
                  if (allDayEvs.length === 0) return null;
                  return allDayEvs.map((ev, evIdx) => {
                    const borderColor = ev.color.split(" ").find(c => c.startsWith("border-"))?.replace(/\/\d+$/, "") || "border-primary";
                    const textColor = ev.color.split(" ").find(c => c.startsWith("text-")) || "text-foreground";
                    return (
                      <div
                        key={ev.id}
                        className="absolute z-30"
                        style={{
                          top: 4 + evIdx * 22,
                          left: `calc(60px + ${dayIdx} * ((100% - 60px) / 7) + 2px)`,
                          width: `calc((100% - 60px) / 7 - 4px)`,
                        }}
                      >
                        <div
                          className={cn(
                            "flex items-center rounded-md px-1.5 py-0.5 cursor-pointer hover:opacity-90 transition-opacity",
                            "bg-card/90 backdrop-blur-sm border-l-[3px] shadow-sm",
                            borderColor
                          )}
                          onClick={(e) => { e.stopPropagation(); openEditEvent(ev); }}
                        >
                          <span className={cn("text-[10px] font-semibold truncate", textColor)}>
                            {ev.title}
                          </span>
                        </div>
                      </div>
                    );
                  });
                })}
                
      {/* Birthday column overlay */}
      {weekDays.map((day, dayIdx) => {
        if (!isBirthday(day)) return null;
        const colWidth = `calc((100% - 60px) / 7)`;
        const left = `calc(60px + ${dayIdx} * ${colWidth})`;
        return (
          <div
            key={`birthday-overlay-${dayIdx}`}
            style={{
              position: "absolute",
              top: 0,
              left,
              width: colWidth,
              height: totalGridHeight,
              pointerEvents: "none",
              zIndex: 1,
              borderLeft: '1px solid rgba(251,191,36,0.4)',
              borderRight: '1px solid rgba(251,191,36,0.4)',
              borderRadius: '0',
            }}
          >
            {/* Pozadi s pruhlednosti */}
            <div style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "url('/birthday-pattern.jpg')",
              backgroundSize: "320px auto",
              backgroundRepeat: "repeat",
              backgroundPosition: "center top",
              opacity: 0.45,
              borderRadius: '4px',
            }} />
            {/* Text - plna opacita */}
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              zIndex: 2,
            }}>
              {(BIRTHDAY_NAMES[format(day, "MM-dd")] + "   Narozeniny").split("").map((letter, i) => (
                <span key={i} style={{
                  fontFamily: "'Dancing Script', cursive",
                  fontSize: letter === " " ? "8px" : "40px",
                  fontWeight: "bold",
                  color: "rgba(180, 83, 9, 1)",
                  textShadow: "0 0 4px rgba(255,255,255,1), 1px 1px 2px rgba(0,0,0,0.95)",
                  lineHeight: letter === " " ? 1.8 : 0.8,
                  display: "block",
                  textAlign: "center",
                }}>{letter === " " ? " " : letter}</span>
              ))}
            </div>
          </div>
        );
      })}
      {HOURS.map((hour) => {
                  const h = getHourHeight(hour);
                  const top = getHourTop(hour);
                  const isNight = NIGHT_HOURS.has(hour);
                  return (
                  <div
                    key={hour}
                    className="absolute w-full grid border-b border-border/50"
                    style={{
                      top,
                      height: h,
                      gridTemplateColumns: "60px repeat(7, 1fr)",
                    }}
                  >
                    <div className={cn(
                      "flex items-start justify-end pr-2 border-r border-border font-medium",
                      isNight ? "text-[9px] text-muted-foreground/50 pt-0.5" : "text-[11px] text-muted-foreground pt-1"
                    )}>
                      {hour.toString().padStart(2, "0")}:00
                    </div>
                    {weekDays.map((day) => (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "border-r border-border/30 px-0.5 cursor-pointer hover:bg-accent/50 transition-colors relative",
                          isToday(day) && "bg-primary/[0.02]"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(day);
                          setNewEventHour(hour);
                          setNewEventEndHour(Math.min(hour + 1, 23));
                          setNewEventDate(format(day, "yyyy-MM-dd"));
                          setShowNewEventDialog(true);
                        }}
                      />
                    ))}
                  </div>
                  );
                })}

                {/* Event blocks spanning hours */}
                {weekDays.map((day, dayIdx) => {
                  const dayEvents = getEventBlocksForDay(day);
                  const colWidth = `calc((100% - 60px) / 7)`;
                  return dayEvents.map((ev) => {
                    const startH = ev.hour!;
                    const endH = ev.endHour ?? startH + 1;
                    const top = getHourTop(startH);
                    const height = HOURS.slice(startH, endH).reduce((s, h) => s + getHourHeight(h), 0);
                    const left = `calc(60px + ${dayIdx} * ${colWidth})`;
                    return (
                      <div
                        key={ev.id}
                        className={cn(
                          "absolute rounded-md border-l-2 px-1.5 py-0.5 text-[10px] font-medium truncate z-10 cursor-grab group hover:opacity-80",
                          ev.color
                        )}
                        style={{ top: top + 2, height: Math.max(height - 4, 16), left, width: `calc(${colWidth} - 4px)`, marginLeft: 2 }}
                        onMouseDown={(e) => {
                          if ((e.target as HTMLElement).dataset.handle) return;
                          onEventDragStart(e, ev, "move", dayIdx);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (wasDragging.current) return;
                          openEditEvent(ev);
                        }}
                      >
                        {/* Top drag handle */}
                        <div
                          data-handle="top"
                          className="absolute top-0 left-0 right-0 h-2 cursor-n-resize opacity-0 group-hover:opacity-100 flex justify-center items-center"
                          onMouseDown={(e) => onEventDragStart(e, ev, "resize-top", dayIdx)}
                        >
                          <div className="w-6 h-0.5 rounded-full bg-foreground/40 pointer-events-none" />
                        </div>
                        <div className="truncate mt-1">{ev.title}</div>
                        {height > 24 && (
                          <div className="text-[9px] opacity-60">
                            {startH.toString().padStart(2, "0")}:00–{endH.toString().padStart(2, "0")}:00
                          </div>
                        )}
                        {/* Bottom drag handle */}
                        <div
                          data-handle="bottom"
                          className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize opacity-0 group-hover:opacity-100 flex justify-center items-center"
                          onMouseDown={(e) => onEventDragStart(e, ev, "resize-bottom", dayIdx)}
                        >
                          <div className="w-6 h-0.5 rounded-full bg-foreground/40 pointer-events-none" />
                        </div>
                      </div>
                    );
                  });
                })}

                {/* Shift blocks */}
                {weekDays.map((day, dayIdx) => {
                  const shifts = getShiftsForDay(day);
                  return shifts.map((shift) => {
                    const top = getHourTop(shift.startHour);
                    const height = HOURS.slice(shift.startHour, shift.endHour).reduce((s, h) => s + getHourHeight(h), 0);
                    const colWidth = `calc((100% - 60px) / 7)`;
                    const left = `calc(60px + ${dayIdx} * ${colWidth})`;
                    return (
                      <div
                        key={`shift-${shift.shiftKey}`}
                        className={cn(
                          "absolute rounded-lg border-l-3 pointer-events-auto z-[5] flex flex-col justify-start px-1.5 py-1 overflow-hidden cursor-grab group hover:opacity-80",
                          shift.bgClass, shift.borderClass
                        )}
                        style={{ top, height, left, width: colWidth }}
                        onMouseDown={(e) => {
                          if ((e.target as HTMLElement).dataset.handle) return;
                          onShiftDragStart(e, shift.sourceDayKey, shift.sourceIndex, shift, "move", dayIdx);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (wasDragging.current) return;
                          openEditShift(shift);
                        }}
                      >
                        {/* Top drag handle */}
                        <div
                          data-handle="top"
                          className="absolute top-0 left-0 right-0 h-2 cursor-n-resize opacity-0 group-hover:opacity-100 flex justify-center items-center z-10"
                          onMouseDown={(e) => onShiftDragStart(e, shift.sourceDayKey, shift.sourceIndex, shift, "resize-top", dayIdx)}
                        >
                          <div className="w-8 h-0.5 rounded-full bg-foreground/30 pointer-events-none" />
                        </div>
                        <div className={cn("flex items-center gap-1.5", shift.textClass)}>
                          {shift.icon === "office" ? <Briefcase className="h-3.5 w-3.5 shrink-0" /> : <Home className="h-3.5 w-3.5 shrink-0" />}
                          <span className="text-xs font-bold truncate">{shift.person}</span>
                        </div>
                        {shift.location && (
                          <span className={cn("text-[11px] font-medium opacity-70 mt-0.5", shift.textClass)}>
                            {shift.location}
                          </span>
                        )}
                        <span className={cn("text-[11px] opacity-50 mt-auto", shift.textClass)}>
                          {shift.startHour}:00–{shift.endHour}:00
                        </span>
                        {/* Bottom drag handle */}
                        <div
                          data-handle="bottom"
                          className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize opacity-0 group-hover:opacity-100 flex justify-center items-center z-10"
                          onMouseDown={(e) => onShiftDragStart(e, shift.sourceDayKey, shift.sourceIndex, shift, "resize-bottom", dayIdx)}
                        >
                          <div className="w-8 h-0.5 rounded-full bg-foreground/30 pointer-events-none" />
                        </div>
                      </div>
                    );
                  });
                })}

                {/* Current time indicator */}
                {isCurrentWeek && (
                  <div
                    className="absolute pointer-events-none z-20"
                    style={{
                      top: currentTimeTop,
                      left: 0,
                      right: 0,
                    }}
                  >
                    <div
                      className="absolute flex items-center -translate-y-1/2"
                      style={{ left: 0, width: "60px" }}
                    >
                      <div className="w-full flex justify-end pr-1.5">
                        <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm shadow-destructive/30">
                          {format(now, "HH:mm")}
                        </span>
                      </div>
                    </div>
                    <div
                      className="absolute h-[2px] bg-destructive/60 shadow-[0_0_6px_0] shadow-destructive/30"
                      style={{ left: "60px", right: 0 }}
                    />
                    {currentDayIndex >= 0 && (
                      <div
                        className="absolute w-3 h-3 rounded-full bg-destructive -translate-y-[5px] shadow-md shadow-destructive/40"
                        style={{
                          left: `calc(60px + ${currentDayIndex} * ((100% - 60px) / 7))`,
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Event sidebar */}
        <div className="glass rounded-2xl p-5 animate-slide-up" onClick={(e) => e.stopPropagation()}>
          {selectedDate ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                {format(selectedDate, "d. MMMM yyyy", { locale: cs })}
              </h3>

              {/* Shifts for selected day */}
              {viewMode === "week" && (() => {
                const dayShifts = getShiftsForDay(selectedDate);
                if (dayShifts.length === 0) return null;
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Směny</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs gap-1.5"
                        onClick={handleSwapShift}
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                        Přehodit
                      </Button>
                    </div>
                    {dayShifts.map((shift) => (
                      <div
                        key={shift.shiftKey}
                        className={cn(
                          "flex items-center justify-between rounded-lg border-l-3 px-3 py-2.5",
                          shift.bgClass, shift.borderClass
                        )}
                      >
                        <div
                          className="flex items-center gap-2 cursor-pointer flex-1"
                          onClick={() => openEditShift(shift)}
                        >
                          {shift.icon === "office" ? <Briefcase className={cn("h-4 w-4", shift.textClass)} /> : <Home className={cn("h-4 w-4", shift.textClass)} />}
                          <div className="flex flex-col">
                            <span className={cn("text-sm font-semibold", shift.textClass)}>{shift.person}</span>
                            <span className={cn("text-xs opacity-70", shift.textClass)}>
                              {shift.startHour}:00–{shift.endHour}:00 · {shift.location}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => toggleShiftLocation(shift.shiftKey)}
                        >
                          {shift.location === "Z domu" ? <Briefcase className="h-3.5 w-3.5" /> : <Home className="h-3.5 w-3.5" />}
                          {shift.location === "Z domu" ? "Kancelář" : "Z domu"}
                        </Button>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Add event form */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nová událost</h4>
                {viewMode === "week" && !newEventAllDay && (
                  <div className="flex gap-2">
                    <select
                      value={newEventHour}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setNewEventHour(v);
                        if (newEventEndHour <= v) setNewEventEndHour(Math.min(v + 1, 23));
                      }}
                      className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {HOURS.map((h) => (
                        <option key={h} value={h}>Od {h.toString().padStart(2, "0")}:00</option>
                      ))}
                    </select>
                    <select
                      value={newEventEndHour}
                      onChange={(e) => setNewEventEndHour(Number(e.target.value))}
                      className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {HOURS.filter((h) => h > newEventHour).map((h) => (
                        <option key={h} value={h}>Do {h.toString().padStart(2, "0")}:00</option>
                      ))}
                    </select>
                  </div>
                )}
                {/* Color picker */}
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={() => setNewEventAllDay(!newEventAllDay)}
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                      newEventAllDay ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transform transition-transform",
                      newEventAllDay ? "translate-x-4" : "translate-x-0"
                    )} />
                  </button>
                  <span className="text-xs text-muted-foreground">Celodenní</span>
                </div>
                <div className="flex gap-1.5">
                  {EVENT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setNewEventColor(c.value)}
                      className={cn(
                        "h-6 w-6 rounded-full border-2 transition-all",
                        c.value.split(" ")[0],
                        newEventColor === c.value ? "border-foreground scale-110" : "border-transparent"
                      )}
                      title={c.label}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nová událost..."
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addEvent()}
                    className="flex-1"
                  />
                  <Button size="icon" onClick={addEvent}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Event list */}
              <div className="space-y-2">
                {getEventsForDate(selectedDate).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Žádné události</p>
                ) : (
                  getEventsForDate(selectedDate).map((ev) => (
                    <div key={ev.id} className={cn("flex items-center justify-between rounded-lg px-3 py-2", ev.color)}>
                      <div
                        className="flex flex-col cursor-pointer flex-1"
                        onClick={() => openEditEvent(ev)}
                      >
                        <span className="text-sm font-medium">{ev.title}</span>
                        {ev.hour !== undefined && (
                          <span className="text-[10px] opacity-70">
                            {ev.hour.toString().padStart(2, "0")}:00
                            {ev.endHour !== undefined && `–${ev.endHour.toString().padStart(2, "0")}:00`}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditEvent(ev)} className="rounded-full p-0.5 hover:bg-foreground/10">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => removeEvent(ev.id)} className="rounded-full p-0.5 hover:bg-foreground/10">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            (() => {
              const today = startOfDay(new Date());
              const urgentTodos = todos.filter((t) => {
                if (t.completed || !t.deadline) return false;
                const target = startOfDay(t.deadline);
                return isBefore(target, today) || isSameDay(target, today);
              });
              const workTodos = urgentTodos.filter((t) => t.category === "work").sort((a, b) => a.deadline!.getTime() - b.deadline!.getTime());
              const homeTodos = urgentTodos.filter((t) => t.category === "home").sort((a, b) => a.deadline!.getTime() - b.deadline!.getTime());

              const TodoItem = ({ todo }: { todo: Todo }) => {
                const target = startOfDay(todo.deadline!);
                const isOverdue = isBefore(target, today);
                const isTodayTask = isSameDay(target, today);
                const daysLate = isOverdue ? differenceInDays(today, target) : 0;
                return (
                  <div className={cn(
                    "relative flex items-start gap-3 px-3 py-2 rounded-lg text-sm border",
                    todo.person === "Tadeáš"
                      ? "border-shift-office/30"
                      : "border-shift-partner/30",
                    isOverdue && "bg-destructive/5",
                    isTodayTask && !isOverdue && "bg-warning/10"
                  )}>
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors mt-0.5",
                        todo.person === "Tadeáš"
                          ? "border-shift-office/40 hover:border-shift-office hover:bg-shift-office/10"
                          : "border-shift-partner/40 hover:border-shift-partner hover:bg-shift-partner/10"
                      )}
                    >
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className="text-foreground inline-flex items-center gap-1.5">
                        {todo.text}
                        {todo.recurrence !== "none" && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground font-normal">
                            <Repeat className="h-3 w-3" />
                            {RECURRENCE_LABELS[todo.recurrence]}
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn(
                          "inline-flex items-center gap-1 text-xs",
                          isOverdue && "text-destructive font-medium",
                          isTodayTask && !isOverdue && "font-medium text-orange-700 dark:text-orange-300"
                        )}>
                          {isOverdue && <AlertCircle className="h-3 w-3" />}
                          <CalendarDays className="h-3 w-3" />
                          {isTodayTask ? "Dnes" : format(todo.deadline!, "d.M.", { locale: cs })}
                          {isOverdue && (
                            <span className="text-destructive font-semibold ml-0.5">
                              ({daysLate} {daysLate === 1 ? "den" : daysLate < 5 ? "dny" : "dní"} zpoždění)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn(
                      "absolute top-1.5 right-1.5 text-[10px] px-1.5 py-0 h-4",
                      todo.person === "Tadeáš"
                        ? "border-shift-office/40 bg-shift-office/10 text-shift-office"
                        : "border-shift-partner/40 bg-shift-partner/10 text-shift-partner"
                    )}>
                      {todo.person}
                    </Badge>
                  </div>
                );
              };

              if (workTodos.length === 0 && homeTodos.length === 0) {
                return <p className="text-sm text-muted-foreground">Žádné úkoly na dnes 🎉</p>;
              }

              return (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Dnešní úkoly</h3>
                  {workTodos.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Práce ({workTodos.length})</span>
                      </div>
                      <div className="space-y-1">
                        {workTodos.map((t) => <TodoItem key={t.id} todo={t} />)}
                      </div>
                    </div>
                  )}
                  {homeTodos.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Domácnost ({homeTodos.length})</span>
                      </div>
                      <div className="space-y-1">
                        {homeTodos.map((t) => <TodoItem key={t.id} todo={t} />)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      </div>

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upravit událost</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Název</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground">Od</label>
                <select
                  value={editHour}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setEditHour(v);
                    if (editEndHour <= v) setEditEndHour(Math.min(v + 1, 23));
                  }}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{h.toString().padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground">Do</label>
                <select
                  value={editEndHour}
                  onChange={(e) => setEditEndHour(Number(e.target.value))}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {HOURS.filter((h) => h > editHour).map((h) => (
                    <option key={h} value={h}>{h.toString().padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Barva</label>
              <div className="flex gap-2 mt-2">
                {EVENT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setEditColor(c.value)}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all",
                      c.value.split(" ")[0],
                      editColor === c.value ? "border-foreground scale-110" : "border-transparent"
                    )}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (editingEvent) {
                  removeEvent(editingEvent.id);
                  setEditingEvent(null);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Smazat
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingEvent(null)}>Zrušit</Button>
              <Button onClick={saveEditEvent}>Uložit</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Shift Dialog */}
      <Dialog open={!!editingShift} onOpenChange={(open) => !open && setEditingShift(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2 pr-6">
              <DialogTitle className="flex-1">Upravit směnu – {editingShift?.person}</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Přehodit směny"
                onClick={() => {
                  if (!editingShift) return;
                  toggleSwapDay(editingShift.dayKey);
                  setEditingShift(null);
                }}
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
              {editingShift?.person === "Tadeáš" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title={editingShift.icon === "office" ? "Změnit na Z domu" : "Změnit na Kancelář"}
                  onClick={() => {
                    if (!editingShift) return;
                    toggleShiftLocation(editingShift.shiftKey);
                    setEditingShift(null);
                  }}
                >
                  {editingShift.icon === "office" ? <Home className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground">Od</label>
                <select
                  value={editShiftStart}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setEditShiftStart(v);
                    if (editShiftEnd <= v) setEditShiftEnd(Math.min(v + 1, 23));
                  }}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{h.toString().padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground">Do</label>
                <select
                  value={editShiftEnd}
                  onChange={(e) => setEditShiftEnd(Number(e.target.value))}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {HOURS.filter((h) => h > editShiftStart).map((h) => (
                    <option key={h} value={h}>{h.toString().padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                if (editingShift) {
                  const key = editingShift.shiftKey;
                  await hideShift(key);
                  pushAction({
                    undo: () => unhideShift(key),
                    redo: () => hideShift(key),
                  });
                  setEditingShift(null);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Smazat
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingShift(null)}>Zrušit</Button>
              <Button onClick={saveEditShift}>Uložit</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* New Event Dialog */}
      <Dialog open={showNewEventDialog} onOpenChange={setShowNewEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nová událost</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Název</label>
              <Input
                placeholder="Název události..."
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addEvent()}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Datum</label>
              <Input
                type="date"
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setNewEventAllDay(!newEventAllDay)}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                  newEventAllDay ? "bg-primary" : "bg-muted-foreground/30"
                )}
              >
                <span className={cn(
                  "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transform transition-transform",
                  newEventAllDay ? "translate-x-4" : "translate-x-0"
                )} />
              </button>
              <span className="text-sm text-muted-foreground">Celodenní událost</span>
            </div>
            {!newEventAllDay && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground">Od</label>
                <select
                  value={newEventHour}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setNewEventHour(v);
                    if (newEventEndHour <= v) setNewEventEndHour(Math.min(v + 1, 23));
                  }}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{h.toString().padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground">Do</label>
                <select
                  value={newEventEndHour}
                  onChange={(e) => setNewEventEndHour(Number(e.target.value))}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {HOURS.filter((h) => h > newEventHour).map((h) => (
                    <option key={h} value={h}>{h.toString().padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
            </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground">Barva</label>
              <div className="flex gap-2 mt-2">
                {EVENT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setNewEventColor(c.value)}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all",
                      c.value.split(" ")[0],
                      newEventColor === c.value ? "border-foreground scale-110" : "border-transparent"
                    )}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewEventDialog(false)}>Zrušit</Button>
            <Button onClick={addEvent} disabled={!newEventTitle.trim()}>Vytvořit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
