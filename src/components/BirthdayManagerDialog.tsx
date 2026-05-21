import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus, Check, X, Cake } from "lucide-react";
import type { Birthday } from "@/hooks/useBirthdays";
import { toast } from "sonner";

const MONTH_NAMES = ["Leden","Únor","Březen","Duben","Květen","Červen","Červenec","Srpen","Září","Říjen","Listopad","Prosinec"];
const daysInMonth = (m: number) => new Date(2024, m, 0).getDate();

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  birthdays: Birthday[];
  onAdd: (b: Omit<Birthday, "id">) => Promise<void>;
  onUpdate: (id: string, updates: Partial<Omit<Birthday, "id">>) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

export function BirthdayManagerDialog({ open, onOpenChange, birthdays, onAdd, onUpdate, onRemove }: Props) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDay, setEditDay] = useState(1);
  const [editMonth, setEditMonth] = useState(1);
  const [newName, setNewName] = useState("");
  const [newDay, setNewDay] = useState<number>(1);
  const [newMonth, setNewMonth] = useState<number>(1);
  const [confirmDelete, setConfirmDelete] = useState<Birthday | null>(null);

  const startEdit = (b: Birthday) => {
    setEditId(b.id);
    setEditName(b.name);
    setEditDay(b.day);
    setEditMonth(b.month);
  };

  const saveEdit = async () => {
    if (!editId) return;
    const name = editName.trim();
    if (!name) return;
    const maxD = daysInMonth(editMonth);
    const day = Math.max(1, Math.min(maxD, editDay));
    await onUpdate(editId, { name, day, month: editMonth });
    setEditId(null);
    toast.success("Narozeniny upraveny");
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error("Zadej jméno");
      return;
    }
    const maxD = daysInMonth(newMonth);
    const day = Math.max(1, Math.min(maxD, newDay));
    await onAdd({ name, day, month: newMonth });
    setNewName("");
    setNewDay(1);
    setNewMonth(1);
    toast.success("Narozeniny přidány");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cake className="h-5 w-5 text-amber-600" />
              Správa narozenin
            </DialogTitle>
          </DialogHeader>

          {/* Add new */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Přidat narozeniny</div>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                max={31}
                value={newDay}
                onChange={(e) => setNewDay(Number(e.target.value) || 1)}
                placeholder="Den"
                className="w-16"
              />
              <select
                value={newMonth}
                onChange={(e) => setNewMonth(Number(e.target.value))}
                className="rounded-md border border-input bg-background px-2 text-sm"
              >
                {MONTH_NAMES.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Jméno"
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <Button size="icon" onClick={handleAdd}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="space-y-1.5">
            {birthdays.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Žádné narozeniny</p>
            )}
            {birthdays.map((b) => (
              <div key={b.id} className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5">
                {editId === b.id ? (
                  <>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={editDay}
                      onChange={(e) => setEditDay(Number(e.target.value) || 1)}
                      className="w-14 h-8"
                    />
                    <select
                      value={editMonth}
                      onChange={(e) => setEditMonth(Number(e.target.value))}
                      className="rounded-md border border-input bg-background px-2 h-8 text-sm"
                    >
                      {MONTH_NAMES.map((m, i) => (
                        <option key={m} value={i + 1}>{m}</option>
                      ))}
                    </select>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 h-8"
                      onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit}>
                      <Check className="h-4 w-4 text-success" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="text-sm w-20 tabular-nums text-muted-foreground">
                      {b.day}. {b.month}.
                    </span>
                    <span className="text-sm flex-1 font-medium">{b.name}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(b)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => setConfirmDelete(b)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat narozeniny?</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chceš smazat narozeniny <strong>{confirmDelete?.name}</strong> ({confirmDelete?.day}.{confirmDelete?.month}.)?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (confirmDelete) {
                  await onRemove(confirmDelete.id);
                  toast.success("Smazáno");
                }
                setConfirmDelete(null);
              }}
            >
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
