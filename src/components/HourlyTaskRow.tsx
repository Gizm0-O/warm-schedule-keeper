import { useState } from "react";
import { Plus, Minus, Trash2, Clock, Sparkles, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useHourlyTasks, type HourlyTask } from "@/hooks/useHourlyTasks";
import { useAdminMode } from "@/hooks/useAdminMode";

/**
 * Kompaktní řádek hodinového úkolu - používá se v seznamu úkolů
 * (v "Dnešní úkoly" sidebar i na TodoPage). Místo checkboxu má +/− tlačítka.
 */
export function HourlyTaskRow({ task, compact = false }: { task: HourlyTask; compact?: boolean }) {
  const { adjustHours, deleteTask } = useHourlyTasks();
  const isAdmin = useAdminMode();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const totalEarned = task.hours_worked * task.rate_per_hour;
  const milestonesReached = Math.floor(task.hours_worked / task.milestone_hours);
  const totalBonus = milestonesReached * task.milestone_bonus_percent;
  const hoursToNext = task.milestone_hours - (task.hours_worked % task.milestone_hours);
  const isOnMilestone = task.hours_worked > 0 && task.hours_worked % task.milestone_hours === 0;

  const borderClass = task.person === "Tadeáš" ? "border-shift-office/30" : "border-shift-partner/30";
  const personBadgeClass = task.person === "Tadeáš"
    ? "border-shift-office/40 bg-shift-office/35 text-shift-office"
    : "border-shift-partner/40 bg-shift-partner/35 text-shift-partner";

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 px-3 py-2 rounded-lg text-sm border-shift-partner/30 bg-blue-50 border-2 border-blue-800",
        task.person === "Tadeáš" && "border-shift-office/30"
      )}
      style={task.color && !task.color.startsWith("hsl(var") ? { borderColor: task.color } : undefined}
    >
      {/* +/- tlačítka místo checkboxu */}
      <div className="flex flex-col gap-1 shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); adjustHours(task, 1); }}
          className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-success/40 hover:border-success hover:bg-success/20 transition-colors"
          title="Přidat hodinu"
        >
          <Plus className="h-3 w-3 text-success" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); adjustHours(task, -1); }}
          disabled={task.hours_worked <= 0}
          className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-destructive/40 hover:border-destructive hover:bg-destructive/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Ubrat hodinu"
        >
          <Minus className="h-3 w-3 text-destructive" />
        </button>
      </div>

      <div className="flex-1 min-w-0 pr-16">
        <div className="text-foreground flex items-center gap-1.5 min-w-0">
          <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: task.color.startsWith("hsl") ? undefined : task.color }} />
          <span className="truncate font-medium">{task.name}</span>
          <span className="text-[10px] text-muted-foreground shrink-0">
            ({task.hours_worked}h odpracováno)
          </span>
        </div>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0 h-4 rounded border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50 whitespace-nowrap">
            💰 {totalEarned.toLocaleString("cs-CZ")} Kč
          </span>
          {totalBonus > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0 h-4 rounded border bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800/50 whitespace-nowrap">
              ⭐ +{totalBonus}%
            </span>
          )}
          {task.hours_worked > 0 && (task.xp_per_hour ?? 10) > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0 h-4 rounded border bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-800/50 whitespace-nowrap" title="Vydělané XP">
              ⚡ {Math.round(Number(task.hours_worked) * (task.xp_per_hour ?? 10))} XP
            </span>
          )}
          {isOnMilestone ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-success font-medium whitespace-nowrap">
              <Sparkles className="h-3 w-3" /> Milník!
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              do bonusu: <strong className="text-foreground">{hoursToNext}h</strong>
            </span>
          )}
        </div>
      </div>

      <Badge variant="outline" className={cn(
        "absolute top-2 right-2 text-[10px] px-1.5 py-0 h-4 whitespace-nowrap",
        personBadgeClass
      )}>
        {task.person}
      </Badge>

      {!compact && isAdmin && (
        <button
          onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
          className="absolute bottom-2 right-2 rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          title="Smazat"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat hodinový úkol?</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete smazat „{task.name}"? Vymažou se i všechny vydělané odměny.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Nechat</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTask(task.id)}
            >
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Tlačítko + dialog pro vytvoření nového hodinového úkolu.
 */
export function NewHourlyTaskButton({ size = "sm" }: { size?: "sm" | "default" }) {
  const { createTask } = useHourlyTasks();
  const isAdmin = useAdminMode();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [rate, setRate] = useState(250);
  const [milestone, setMilestone] = useState(5);
  const [bonus, setBonus] = useState(0.5);
  const [color, setColor] = useState("#10b981");
  const [person, setPerson] = useState<"Tadeáš" | "Barča">("Tadeáš");
  const [xpPerHour, setXpPerHour] = useState(10);

  if (!isAdmin) return null;

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await createTask({
      name: name.trim(),
      rate_per_hour: rate,
      milestone_hours: milestone,
      milestone_bonus_percent: bonus,
      color,
      person,
      xp_per_hour: xpPerHour,
    });
    setName("");
    setRate(250);
    setMilestone(5);
    setBonus(0.5);
    setXpPerHour(10);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size={size} className="gap-1">
          <Clock className="h-4 w-4" />
          Hodinový úkol
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nový hodinový úkol</DialogTitle>
          <DialogDescription>
            Speciální úkol bez deadlinu. Místo odkliknutí přidáváš/ubíráš odpracované hodiny tlačítky +/−.
            Resetuje se na konci měsíce.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="ht-name">Název</Label>
            <Input id="ht-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Např. Klientská práce" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ht-person">Osoba</Label>
              <Select value={person} onValueChange={(v) => setPerson(v as "Tadeáš" | "Barča")}>
                <SelectTrigger id="ht-person"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tadeáš">Tadeáš</SelectItem>
                  <SelectItem value="Barča">Barča</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ht-color">Barva</Label>
              <Input id="ht-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 p-1" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="ht-rate">Sazba/h (Kč)</Label>
              <Input id="ht-rate" type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="ht-milestone">Milník (h)</Label>
              <Input id="ht-milestone" type="number" value={milestone} onChange={(e) => setMilestone(Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="ht-bonus">Bonus (%)</Label>
              <Input id="ht-bonus" type="number" step="0.1" value={bonus} onChange={(e) => setBonus(Number(e.target.value))} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Příklad: Sazba 250 Kč/h, milník 5h, bonus 0.5% → každá hodina přidá 250 Kč k Vyděláno, každých 5h přidá +0.5% k bonusu.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!name.trim()}>Vytvořit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
