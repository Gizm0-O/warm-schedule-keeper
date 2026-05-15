import { useEffect, useState } from "react";
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Check, Bug, Lightbulb, Sparkles, Clock, Wrench, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

const STATUS_ORDER: Status[] = ["pending", "in_progress", "planned", "done", "idea"];

export default function ChangelogPage() {
  const isAdmin = useAdminMode();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [showAdd, setShowAdd] = useState(false);

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

  const remove = async (id: string) => {
    if (!confirm("Opravdu smazat?")) return;
    await (supabase as any).from("changelog_entries").delete().eq("id", id);
    fetchEntries();
  };

  const groups = STATUS_ORDER.map((s) => ({
    status: s,
    items: entries.filter((e) => e.status === s),
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
            <GroupCard status="pending"  items={groups} isAdmin={isAdmin} onEdit={setEditing} onDelete={remove} onStatus={updateStatus} />
            <GroupCard status="planned"  items={groups} isAdmin={isAdmin} onEdit={setEditing} onDelete={remove} onStatus={updateStatus} />
            <GroupCard status="idea"     items={groups} isAdmin={isAdmin} onEdit={setEditing} onDelete={remove} onStatus={updateStatus} />
          </div>
          <div className="space-y-6">
            <GroupCard status="in_progress" items={groups} isAdmin={isAdmin} onEdit={setEditing} onDelete={remove} onStatus={updateStatus} />
            <GroupCard status="done"        items={groups} isAdmin={isAdmin} onEdit={setEditing} onDelete={remove} onStatus={updateStatus} />
          </div>
        </div>
      )}

      <EntryDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        isAdmin={isAdmin}
        onSaved={fetchEntries}
      />
      <EntryDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        entry={editing ?? undefined}
        isAdmin={isAdmin}
        onSaved={fetchEntries}
      />
    </div>
  );
}

function GroupCard({
  status,
  items: groups,
  isAdmin,
  onEdit,
  onDelete,
  onStatus,
}: {
  status: Status;
  items: { status: Status; items: Entry[] }[];
  isAdmin: boolean;
  onEdit: (e: Entry) => void;
  onDelete: (id: string) => void;
  onStatus: (id: string, s: Status) => void;
}) {
  const group = groups.find((g) => g.status === status);
  const items = group?.items ?? [];
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  if (items.length === 0 && status !== "pending") return null;
  return (
    <Card className="p-4 glass-subtle">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cn("h-5 w-5", meta.color)} />
        <h2 className="font-semibold">{meta.label}</h2>
        <Badge variant="secondary" className="ml-auto">{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Žádné položky.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((e) => (
            <EntryRow
              key={e.id}
              entry={e}
              isAdmin={isAdmin}
              onEdit={() => onEdit(e)}
              onDelete={() => onDelete(e.id)}
              onStatus={(s) => onStatus(e.id, s)}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}

function EntryRow({
  entry, isAdmin, onEdit, onDelete, onStatus,
}: {
  entry: Entry;
  isAdmin: boolean;
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<Kind>("change");
  const [status, setStatus] = useState<Status>("pending");
  const [submittedBy, setSubmittedBy] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(entry?.title ?? "");
      setDescription(entry?.description ?? "");
      setKind((entry?.kind as Kind) ?? "change");
      setStatus((entry?.status as Status) ?? "pending");
      setSubmittedBy(entry?.submitted_by ?? "");
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
      submitted_by: submittedBy.trim() || null,
    };
    if (entry) {
      await (supabase as any).from("changelog_entries").update(payload).eq("id", entry.id);
      toast.success("Uloženo");
    } else {
      await (supabase as any).from("changelog_entries").insert(payload);
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
          <div>
            <label className="text-xs font-medium">Kdo to píše (volitelné)</label>
            <Input value={submittedBy} onChange={(e) => setSubmittedBy(e.target.value)} placeholder="Jméno…" />
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
