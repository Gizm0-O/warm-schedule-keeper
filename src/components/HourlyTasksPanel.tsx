import { useState } from "react";
import { Plus, Minus, Trash2, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useHourlyTasks, type HourlyTask } from "@/hooks/useHourlyTasks";

function HourlyTaskCard({ task, onAdjust, onDelete }: {
  task: HourlyTask;
  onAdjust: (delta: number) => void;
  onDelete: () => void;
}) {
  const totalEarned = task.hours_worked * task.rate_per_hour;
  const milestonesReached = Math.floor(task.hours_worked / task.milestone_hours);
  const totalBonus = milestonesReached * task.milestone_bonus_percent;
  const hoursToNext = task.milestone_hours - (task.hours_worked % task.milestone_hours);
  const isOnMilestone = task.hours_worked > 0 && task.hours_worked % task.milestone_hours === 0;

  return (
    <div
      className="rounded-xl glass p-4 flex flex-col gap-3 border"
      style={{ borderColor: task.color }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Clock className="h-4 w-4 shrink-0" style={{ color: task.color }} />
          <h3 className="font-semibold truncate">{task.name}</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={() => onAdjust(-1)}
          disabled={task.hours_worked <= 0}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="flex-1 text-center">
          <div className="text-3xl font-bold tabular-nums" style={{ color: task.color }}>
            {task.hours_worked}h
          </div>
          <div className="text-xs text-muted-foreground">odpracováno</div>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={() => onAdjust(1)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <div className="text-xs text-muted-foreground">Vyděláno</div>
          <div className="font-semibold tabular-nums">{totalEarned.toLocaleString("cs-CZ")} Kč</div>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <div className="text-xs text-muted-foreground">Bonus</div>
          <div className="font-semibold tabular-nums text-success">+{totalBonus}%</div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {isOnMilestone ? (
          <span className="flex items-center gap-1 text-success font-medium">
            <Sparkles className="h-3 w-3" />
            Milník dosažen! +{task.milestone_bonus_percent}%
          </span>
        ) : (
          <span>
            Do dalšího bonusu: <strong className="text-foreground">{hoursToNext}h</strong>
            {" "}(+{task.milestone_bonus_percent}%)
          </span>
        )}
      </div>
    </div>
  );
}

function NewHourlyTaskDialog({ onCreate }: {
  onCreate: (input: { name: string; rate_per_hour: number; milestone_hours: number; milestone_bonus_percent: number; color: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [rate, setRate] = useState(250);
  const [milestone, setMilestone] = useState(5);
  const [bonus, setBonus] = useState(0.5);
  const [color, setColor] = useState("#3b82f6");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      rate_per_hour: rate,
      milestone_hours: milestone,
      milestone_bonus_percent: bonus,
      color,
    });
    setName("");
    setRate(250);
    setMilestone(5);
    setBonus(0.5);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          Hodinový úkol
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nový hodinový úkol</DialogTitle>
          <DialogDescription>
            Speciální úkol bez deadlinu. Za každou hodinu dostaneš odměnu, za každý milník bonus %.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="ht-name">Název</Label>
            <Input id="ht-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Např. Klientská práce" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ht-rate">Sazba / hodina (Kč)</Label>
              <Input id="ht-rate" type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="ht-color">Barva</Label>
              <Input id="ht-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 p-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ht-milestone">Milník (hodiny)</Label>
              <Input id="ht-milestone" type="number" value={milestone} onChange={(e) => setMilestone(Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="ht-bonus">Bonus za milník (%)</Label>
              <Input id="ht-bonus" type="number" step="0.1" value={bonus} onChange={(e) => setBonus(Number(e.target.value))} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!name.trim()}>Vytvořit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function HourlyTasksPanel() {
  const { tasks, createTask, deleteTask, adjustHours } = useHourlyTasks();

  return (
    <div className="rounded-2xl glass-strong p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Hodinové úkoly</h2>
          <span className="text-xs text-muted-foreground">(reset každý měsíc)</span>
        </div>
        <NewHourlyTaskDialog
          onCreate={(input) => createTask(input)}
        />
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Žádné hodinové úkoly. Vytvoř první kliknutím na tlačítko výše.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tasks.map((task) => (
            <HourlyTaskCard
              key={task.id}
              task={task}
              onAdjust={(delta) => adjustHours(task, delta)}
              onDelete={() => {
                if (confirm(`Smazat úkol "${task.name}"? Vymaže i všechny související odměny.`)) {
                  // Smaž earnings i task
                  import('@/integrations/supabase/client').then(({ supabase }) => {
                    supabase.from('task_earnings').delete().like('todo_id', `hourly:${task.id}:%`).then(() => {
                      window.dispatchEvent(new CustomEvent('task-earnings-changed'));
                    });
                  });
                  deleteTask(task.id);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
