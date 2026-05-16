import { useEffect, useState } from "react";
import { Briefcase, Home, Coins, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { RECURRENCE_LABELS, WEEKDAY_SHORT, WEEKDAY_ORDER, type Todo, type Category, type Person, type Recurrence } from "@/data/todos";
import { useTodos } from "@/contexts/TodoContext";
import { useAdminMode } from "@/hooks/useAdminMode";
import { useTaskReady } from "@/hooks/useTaskReady";
import { useTaskBonus } from "@/hooks/useTaskBonus";
import { useCustomRewards } from "@/hooks/useCustomRewards";
import { useTaskXp } from "@/hooks/useTaskXp";
import { defaultXpFor } from "@/lib/xp";

interface TodoEditDialogProps {
  todo: Todo | null;
  onClose: () => void;
}

export function TodoEditDialog({ todo, onClose }: TodoEditDialogProps) {
  const isAdmin = useAdminMode();
  const { updateTodo } = useTodos();
  const { isReady, setReady } = useTaskReady();
  const { getBonusAmount, hasBonus, setBonusAmount } = useTaskBonus();
  const { getRewardsForTodo, setRewardsForTodo } = useCustomRewards();
  const { getXpOverride, setXp } = useTaskXp();

  const [editText, setEditText] = useState("");
  const [editCategory, setEditCategory] = useState<Category>("work");
  const [editPerson, setEditPerson] = useState<Person>("Tadeáš");
  const [editDeadline, setEditDeadline] = useState("");
  const [editRecurrence, setEditRecurrence] = useState<Recurrence>("none");
  const [editRecurrenceDays, setEditRecurrenceDays] = useState<number[]>([]);
  const [editAmount, setEditAmount] = useState("");
  const [editBonusEnabled, setEditBonusEnabled] = useState(false);
  const [editBonusAmount, setEditBonusAmount] = useState("");
  const [editXp, setEditXp] = useState("");
  const [editCustomRewards, setEditCustomRewards] = useState<{ label: string; repeat_on_recurring: boolean; is_token: boolean; expires_at: string | null }[]>([]);

  // Hydrate state when a todo is opened
  useEffect(() => {
    if (!todo) return;
    setEditText(todo.text);
    setEditCategory(todo.category);
    setEditPerson(todo.person);
    setEditDeadline(todo.deadline ? format(todo.deadline, "yyyy-MM-dd") : "");
    setEditRecurrence(todo.recurrence);
    setEditRecurrenceDays(todo.recurrenceDays ?? []);
    setEditAmount(todo.amount ? todo.amount.toString() : "");
    setEditBonusEnabled(hasBonus(todo.id));
    setEditBonusAmount(hasBonus(todo.id) ? getBonusAmount(todo.id).toString() : "");
    const xpOv = getXpOverride(todo.id);
    setEditXp(xpOv != null ? String(xpOv) : (defaultXpFor(todo.text) > 0 ? String(defaultXpFor(todo.text)) : ""));
    const existing = getRewardsForTodo(todo.id);
    setEditCustomRewards(existing.map(r => ({ label: r.label, repeat_on_recurring: r.repeat_on_recurring, is_token: r.is_token, expires_at: r.expires_at ?? null })));
  }, [todo, hasBonus, getBonusAmount, getRewardsForTodo, getXpOverride]);

  const saveEdit = async () => {
    if (!todo || !editText.trim()) return;
    await updateTodo(todo.id, {
      text: editText.trim(),
      category: editCategory,
      person: editPerson,
      deadline: editDeadline ? new Date(editDeadline) : undefined,
      recurrence: editRecurrence,
      recurrenceDays: editRecurrence === "weekdays" ? editRecurrenceDays : undefined,
      amount: editAmount ? parseInt(editAmount) : undefined,
    });
    const bonusVal = editBonusEnabled && editBonusAmount ? parseInt(editBonusAmount) : 0;
    await setBonusAmount(todo.id, bonusVal);
    if (isAdmin) {
      await setRewardsForTodo(todo.id, editCustomRewards);
      const xpVal = editXp.trim() === "" ? 0 : parseInt(editXp) || 0;
      const dft = defaultXpFor(editText);
      // Pokud je hodnota stejná jako default, smažeme override (uloží 0)
      await setXp(todo.id, xpVal === dft ? 0 : xpVal);
    }
    onClose();
  };

  const lockedForUser = !isAdmin && !!todo && todo.person === 'Barča' && todo.category === 'work' && isReady(todo.id);

  return (
    <Dialog open={!!todo} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upravit úkol</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {lockedForUser && (
            <div className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              🔒 Úkol byl schválen adminem – úpravy jsou uzamčené.
            </div>
          )}
          <Input
            placeholder="Název úkolu..."
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveEdit()}
            disabled={lockedForUser}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Kategorie</label>
              <Select value={editCategory} onValueChange={(v) => setEditCategory(v as Category)} disabled={lockedForUser}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="work">
                    <span className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" /> Práce</span>
                  </SelectItem>
                  <SelectItem value="home">
                    <span className="flex items-center gap-2"><Home className="h-3.5 w-3.5" /> Domácnost</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Osoba</label>
              <Select value={editPerson} onValueChange={(v) => setEditPerson(v as Person)} disabled={lockedForUser}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tadeáš">Tadeáš</SelectItem>
                  <SelectItem value="Barča">Barča</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Deadline (volitelné)
                {lockedForUser && (<span className="ml-1 text-[10px]">🔒 schváleno</span>)}
              </label>
              <Input
                type="date"
                value={editDeadline}
                onChange={(e) => setEditDeadline(e.target.value)}
                disabled={lockedForUser}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Opakování</label>
              <Select value={editRecurrence} onValueChange={(v) => setEditRecurrence(v as Recurrence)} disabled={lockedForUser}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {editRecurrence === "weekdays" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Dny v týdnu</label>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAY_ORDER.map((d) => {
                  const active = editRecurrenceDays.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      disabled={lockedForUser}
                      onClick={() => setEditRecurrenceDays((prev) =>
                        prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
                      )}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:bg-accent"
                      }`}
                    >
                      {WEEKDAY_SHORT[d]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {isAdmin && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Coins className="h-3.5 w-3.5" /> Částka (Kč) — pouze Barča
              </label>
              <Input
                type="number"
                placeholder="např. 6000"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                min={0}
              />
            </div>
          )}
          {isAdmin && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                ⚡ XP za splnění
                <span className="text-[10px] text-muted-foreground/70">
                  (default: {defaultXpFor(editText) || 0} XP)
                </span>
              </label>
              <Input
                type="number"
                placeholder={`např. ${defaultXpFor(editText) || 50}`}
                value={editXp}
                onChange={(e) => setEditXp(e.target.value)}
                min={0}
              />
            </div>
          )}
          {isAdmin && todo && todo.person === 'Barča' && todo.category === 'work' && (
            <div className="flex items-center gap-2 pt-2 border-t border-border/50">
              <Checkbox
                id="ready-checkbox"
                checked={isReady(todo.id)}
                onCheckedChange={(checked) => setReady(todo.id, !!checked)}
              />
              <label htmlFor="ready-checkbox" className="text-sm font-medium cursor-pointer select-none">
                ✅ Ready – úkol schválen, uživatel ho může dokončit
              </label>
            </div>
          )}
          {isAdmin && todo && todo.person === 'Barča' && todo.category === 'work' && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="bonus-checkbox"
                  checked={editBonusEnabled}
                  onCheckedChange={(checked) => {
                    const enabled = !!checked;
                    setEditBonusEnabled(enabled);
                    if (!enabled) setEditBonusAmount("");
                  }}
                />
                <label htmlFor="bonus-checkbox" className="text-sm font-medium cursor-pointer select-none">
                  🎁 Bonus – přidat extra odměnu k úkolu
                </label>
              </div>
              {editBonusEnabled && (
                <Input
                  type="number"
                  placeholder="Bonusová částka (Kč)"
                  value={editBonusAmount}
                  onChange={(e) => setEditBonusAmount(e.target.value)}
                  min={0}
                  className="ml-6 w-48"
                />
              )}
            </div>
          )}
          {isAdmin && todo && todo.person === 'Barča' && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium select-none">
                  🎟️ Poukázky (custom odměny)
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={() => setEditCustomRewards(prev => [...prev, { label: "", repeat_on_recurring: editRecurrence !== 'none', is_token: false, expires_at: null }])}
                >
                  <Plus className="h-3 w-3" /> Přidat
                </Button>
              </div>
              {editCustomRewards.length === 0 && (
                <p className="text-xs text-muted-foreground">Žádné poukázky. Přidej např. „Kino", „Snídaně do postele", „Výlet"…</p>
              )}
              {editCustomRewards.map((r, idx) => (
                <div key={idx} className="space-y-1 rounded-md border border-border/40 bg-muted/20 p-2">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder={r.is_token ? "Token (např. Bonus)" : "Název poukázky (např. Kino)"}
                      value={r.label}
                      onChange={(e) => setEditCustomRewards(prev => prev.map((x, i) => i === idx ? { ...x, label: e.target.value } : x))}
                      className="flex-1 h-8 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setEditCustomRewards(prev => prev.filter((_, i) => i !== idx))}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 pl-1">
                    <Checkbox
                      id={`token-reward-${idx}`}
                      checked={r.is_token}
                      onCheckedChange={(checked) => setEditCustomRewards(prev => prev.map((x, i) => i === idx ? { ...x, is_token: !!checked, label: !!checked && !x.label.trim() ? "🪙 Token" : x.label } : x))}
                    />
                    <label htmlFor={`token-reward-${idx}`} className="text-[11px] cursor-pointer select-none flex items-center gap-1 text-amber-600 dark:text-amber-300">
                      🪙 Udělit jako Token (místo poukázky)
                    </label>
                  </div>
                  {editRecurrence !== 'none' && (
                    <div className="flex items-center gap-2 pl-1">
                      <Checkbox
                        id={`repeat-reward-${idx}`}
                        checked={r.repeat_on_recurring}
                        onCheckedChange={(checked) => setEditCustomRewards(prev => prev.map((x, i) => i === idx ? { ...x, repeat_on_recurring: !!checked } : x))}
                      />
                      <label htmlFor={`repeat-reward-${idx}`} className="text-[11px] text-muted-foreground cursor-pointer select-none">
                        Udělit při každém opakování úkolu
                      </label>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pl-1 flex-wrap">
                    <Checkbox
                      id={`timed-reward-${idx}`}
                      checked={r.expires_at !== null}
                      onCheckedChange={(checked) => setEditCustomRewards(prev => prev.map((x, i) => {
                        if (i !== idx) return x;
                        if (!checked) return { ...x, expires_at: null };
                        // default: tomorrow 20:00
                        const d = new Date();
                        d.setDate(d.getDate() + 1);
                        d.setHours(20, 0, 0, 0);
                        return { ...x, expires_at: d.toISOString() };
                      }))}
                    />
                    <label htmlFor={`timed-reward-${idx}`} className="text-[11px] cursor-pointer select-none flex items-center gap-1 text-rose-600 dark:text-rose-300">
                      ⏰ Časovaná – platí jen do
                    </label>
                    {r.expires_at !== null && (
                      <Input
                        type="datetime-local"
                        value={(() => {
                          const d = new Date(r.expires_at!);
                          const pad = (n: number) => String(n).padStart(2, '0');
                          return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                        })()}
                        onChange={(e) => {
                          const v = e.target.value;
                          const iso = v ? new Date(v).toISOString() : null;
                          setEditCustomRewards(prev => prev.map((x, i) => i === idx ? { ...x, expires_at: iso } : x));
                        }}
                        className="h-7 text-xs w-auto"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Zrušit</Button>
          <Button
            onClick={saveEdit}
            disabled={!editText.trim() || lockedForUser}
          >
            Uložit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
