import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminMode } from "@/hooks/useAdminMode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Check, Bug, Lightbulb, Sparkles, Clock, Wrench, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type Kind = "change" | "bug" | "idea";
type Status = "pending" | "planned" | "in_progress" | "done" | "idea";

interface Entry {
  id: string;
  title: string;
  description: string | null;
  kind: Kind;
  status: Status;
  position: number;
  submitted_by: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_META: Record<Status, { label: string; icon: any; color: string }> = {
  pending:     { label: "Nové (k zaevidování)", icon: Inbox,    color: "text-amber-500" },
  in_progress: { label: "Pracuje se na tom",    icon: Wrench,   color: "text-blue-500" },
  planned:     { label: "Brzy se začne dělat",  icon: Clock,    color: "text-violet-500" },
  done:        { label: "Hotové změny",         icon: Check,    color: "text-emerald-500" },
  idea:        { label: "Nápady do budoucna",   icon: Lightbulb,color: "text-yellow-500" },
};

const KIND_META: Record<Kind, { label: string; icon: any; cls: string }> = {
  change: { label: "změna", icon: Sparkles, cls: "bg-primary/15 text-primary" },
  bug:    { label: "bug",   icon: Bug,      cls: "bg-destructive/15 text-destructive" },
  idea:   { label: "nápad", icon: Lightbulb,cls: "bg-yellow-500/15 text-yellow-600" },
};

const EMPTY_MESSAGES: Record<Status, string> = {
  pending:     "Schránka je prázdná — nikdo si zatím na nic nestěžoval. 🎉",
  in_progress: "Zrovna se na žádném úkolu nepracuje. Pauza na kafe? ☕",
  planned:     "Zatím nic naplánováno. Klid před bouří. 🌤️",
  done:        "Ještě nic hotového — ale brzy to přijde! 💪",
  idea:        "Žádné nápady. Múza si dala volno. 💡",
};

const PANEL_BG: Record<Status, string> = {
  pending: "!bg-white/90",
  in_progress: "!bg-[#2aaaf4]/[0.21]",
  planned: "!bg-[#f4c86a]/[0.34]",
  done: "!bg-muted/70",
  idea: "!bg-[#d3ceee]/[0.61]",
};

const STATUS_ORDER: Status[] = ["pending", "in_progress", "planned", "done", "idea"];

const MY_SUBMISSIONS_KEY = "changelogMySubmissions";
function readMySubs(): string[] {
  try { return JSON.parse(localStorage.getItem(MY_SUBMISSIONS_KEY) || "[]"); } catch { return []; }
}
function addMySub(id: string) {
  const list = readMySubs();
  if (!list.includes(id)) {
    list.push(id);
    localStorage.setItem(MY_SUBMISSIONS_KEY, JSON.stringify(list));
  }
}

const DONE_INITIAL = 10;

export default function ChangelogPage() {
  const isAdmin = useAdminMode();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [mySubs, setMySubs] = useState<string[]>(() => readMySubs());
  const [showAllDone, setShowAllDone] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const refreshMySubs = () => setMySubs(readMySubs());

  const fetchEntries = async () => {
    const { data } = await (supabase as any)
      .from("changelog_entries")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: false });
    if (data) setEntries(data as Entry[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
    const channel = supabase
      .channel("changelog_entries_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "changelog_entries" }, fetchEntries)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (id: string, status: Status) => {
    await (supabase as any).from("changelog_entries").update({ status }).eq("id", id);
    fetchEntries();
  };

  const remove = (id: string) => setConfirmDeleteId(id);

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    await (supabase as any).from("changelog_entries").delete().eq("id", confirmDeleteId);
    setConfirmDeleteId(null);
    fetchEntries();
  };

  const groups = STATUS_ORDER.map((s) => ({
    status: s,
    items: entries
      .filter((e) => e.status === s)
      .sort((a, b) => {
        if (s === "done") {
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Přehled změn</h1>
          <p className="text-sm text-muted-foreground">
            Co je hotové, co se chystá, a místo na bugy a nápady.
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Přidat
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Načítám…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-6">
            <GroupCard status="pending"  items={groups} isAdmin={isAdmin} mySubs={mySubs} onEdit={setEditing} onDelete={remove} onStatus={updateStatus} />
            <GroupCard status="planned"  items={groups} isAdmin={isAdmin} mySubs={mySubs} onEdit={setEditing} onDelete={remove} onStatus={updateStatus} />
            <GroupCard status="idea"     items={groups} isAdmin={isAdmin} mySubs={mySubs} onEdit={setEditing} onDelete={remove} onStatus={updateStatus} />
          </div>
          <div className="space-y-6">
            <GroupCard status="in_progress" items={groups} isAdmin={isAdmin} mySubs={mySubs} onEdit={setEditing} onDelete={remove} onStatus={updateStatus} />
            <GroupCard status="done"        items={groups} isAdmin={isAdmin} mySubs={mySubs} onEdit={setEditing} onDelete={remove} onStatus={updateStatus} showAllDone={showAllDone} onToggleShowAllDone={() => setShowAllDone((v) => !v)} />
          </div>
        </div>
      )}

      <EntryDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        isAdmin={isAdmin}
        onSaved={() => { fetchEntries(); refreshMySubs(); }}
      />
      <EntryDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        entry={editing ?? undefined}
        isAdmin={isAdmin}
        onSaved={() => { fetchEntries(); refreshMySubs(); }}
      />
      <AlertDialog open={!!confirmDeleteId} onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Opravdu smazat?</AlertDialogTitle>
            <AlertDialogDescription>
              Tato akce je nevratná. Záznam bude trvale odstraněn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function GroupCard({
  status,
  items: groups,
  isAdmin,
  mySubs,
  onEdit,
  onDelete,
  onStatus,
  showAllDone,
  onToggleShowAllDone,
}: {
  status: Status;
  items: { status: Status; items: Entry[] }[];
  isAdmin: boolean;
  mySubs: string[];
  onEdit: (e: Entry) => void;
  onDelete: (id: string) => void;
  onStatus: (id: string, s: Status) => void;
  showAllDone?: boolean;
  onToggleShowAllDone?: () => void;
}) {
  const group = groups.find((g) => g.status === status);
  const allItems = group?.items ?? [];
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  const isDone = status === "done";
  const hiddenCount = isDone && !showAllDone ? Math.max(0, allItems.length - DONE_INITIAL) : 0;
  const items = isDone && !showAllDone ? allItems.slice(0, DONE_INITIAL) : allItems;
  return (
    <Card className={cn("p-4 glass-subtle", PANEL_BG[status])}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cn("h-5 w-5", meta.color)} />
        <h2 className="font-semibold">{meta.label}</h2>
        <Badge variant="secondary" className="ml-auto">{allItems.length}</Badge>
      </div>
      {allItems.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">{EMPTY_MESSAGES[status]}</p>
      ) : (
        <>
          <ul className="space-y-2">
            {items.map((e) => (
              <EntryRow
                key={e.id}
                entry={e}
                isAdmin={isAdmin}
                canEditOwn={status === "pending" && mySubs.includes(e.id)}
                onEdit={() => onEdit(e)}
                onDelete={() => onDelete(e.id)}
                onStatus={(s) => onStatus(e.id, s)}
              />
            ))}
          </ul>
          {isDone && allItems.length > DONE_INITIAL && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 w-full text-xs"
              onClick={onToggleShowAllDone}
            >
              {showAllDone ? "Sbalit" : `Zobrazit další (${hiddenCount})`}
            </Button>
          )}
        </>
      )}
    </Card>
  );
}

function EntryRow({
  entry, isAdmin, canEditOwn, onEdit, onDelete, onStatus,
}: {
  entry: Entry;
  isAdmin: boolean;
  canEditOwn?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStatus: (s: Status) => void;
}) {
  const k = KIND_META[entry.kind];
  const KIcon = k.icon;
  return (
    <li className="rounded-lg border border-border/50 bg-background/60 p-3">
      <div className="flex items-start gap-2">
        <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase", k.cls)}>
          <KIcon className="h-3 w-3" /> {k.label}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">{entry.title}</p>
          {entry.description && (
            <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{entry.description}</p>
          )}
          {entry.submitted_by && (
            <p className="text-[10px] text-muted-foreground mt-1">— {entry.submitted_by}</p>
          )}
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1 shrink-0">
            {entry.status === "in_progress" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                onClick={() => onStatus("done")}
                title="Označit jako hotové"
              >
                <Check className="h-3.5 w-3.5" /> Hotovo
              </Button>
            )}
            <Select value={entry.status} onValueChange={(v) => onStatus(v as Status)}>
              <SelectTrigger className="h-7 w-[140px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">{STATUS_META[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        {!isAdmin && canEditOwn && (
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} title="Upravit můj návrh">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete} title="Smazat můj návrh">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}

function EntryDialog({
  open, onOpenChange, entry, isAdmin, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  entry?: Entry;
  isAdmin: boolean;
  onSaved: () => void;
}) {
  const { profile } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<Kind>("change");
  const [status, setStatus] = useState<Status>("pending");

  useEffect(() => {
    if (open) {
      setTitle(entry?.title ?? "");
      setDescription(entry?.description ?? "");
      setKind((entry?.kind as Kind) ?? "change");
      setStatus((entry?.status as Status) ?? "pending");
    }
  }, [open, entry]);

  const save = async () => {
    if (!title.trim()) {
      toast.error("Vyplň nadpis");
      return;
    }
    const payload: any = {
      title: title.trim(),
      description: description.trim() || null,
      kind,
      status: isAdmin ? status : (entry?.status ?? "pending"),
      submitted_by: entry ? entry.submitted_by : (profile?.display_name ?? null),
    };
    if (entry) {
      await (supabase as any).from("changelog_entries").update(payload).eq("id", entry.id);
      toast.success("Uloženo");
    } else {
      const { data: inserted } = await (supabase as any)
        .from("changelog_entries")
        .insert(payload)
        .select()
        .single();
      if (inserted?.id) addMySub(inserted.id);
      toast.success(isAdmin ? "Přidáno" : "Odesláno k zaevidování");
    }
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entry ? "Upravit záznam" : "Nový záznam"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium">Nadpis</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Co je třeba…" />
          </div>
          <div>
            <label className="text-xs font-medium">Popis (volitelné)</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium">Typ</label>
              <Select value={kind} onValueChange={(v) => setKind(v as Kind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="change">Změna</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="idea">Nápad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isAdmin && (
              <div>
                <label className="text-xs font-medium">Stav</label>
                <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {!isAdmin && !entry && (
            <p className="text-xs text-muted-foreground">
              Návrh bude označen jako <strong>nový</strong> a admin ho zaeviduje.
            </p>
          )}
          <Button onClick={save} className="w-full">Uložit</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
