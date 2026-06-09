import { useEffect, useState } from "react";
import { Bell, Check, Trash2, Send, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminMode } from "@/hooks/useAdminMode";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Notif {
  id: string;
  title: string;
  body: string | null;
  type: string;
  read_at: string | null;
  created_at: string;
  created_by?: string | null;
}

interface ProfileLite { user_id: string; display_name: string; email: string; status: string; created_at: string; id: string; }

export default function NotificationsBell() {
  const { user } = useAuth();
  const isAdmin = useAdminMode();
  const [items, setItems] = useState<Notif[]>([]);
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("notif");
  const [composeOpen, setComposeOpen] = useState(false);
  const [editing, setEditing] = useState<Notif | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications" as any)
      .select("id,title,body,type,read_at,created_at,created_by")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setItems(data as any);
  };

  const loadProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id,user_id,display_name,email,status,created_at")
      .order("created_at", { ascending: false });
    setProfiles((data as any) ?? []);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase
      .channel("notifications_rt_" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  useEffect(() => {
    if (!isAdmin) return;
    loadProfiles();
    const ch = supabase.channel("profiles-watch-bell")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, loadProfiles)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin]);

  const unread = items.filter((n) => !n.read_at).length;
  const pending = profiles.filter((p) => p.status === "pending");
  const totalBadge = unread + (isAdmin ? pending.length : 0);

  const markAllRead = async () => {
    if (!user || unread === 0) return;
    await supabase.from("notifications" as any).update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("notifications" as any).delete().eq("id", id);
    load();
  };

  const setStatus = async (uid: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("profiles").update({ status }).eq("user_id", uid);
    if (error) { toast.error(error.message); return; }
    if (status === "approved") {
      await supabase.from("user_roles").upsert({ user_id: uid, role: "user" } as any, { onConflict: "user_id,role" });
    }
    toast.success(status === "approved" ? "Schváleno" : "Zamítnuto");
    loadProfiles();
  };

  if (!user) return null;

  return (
    <>
      <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o && tab === "notif") setTimeout(markAllRead, 1500); }}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative rounded-xl">
            <Bell className="h-4 w-4" />
            {totalBadge > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center">
                {totalBadge}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-96 p-0">
          <Tabs value={tab} onValueChange={setTab}>
            <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b gap-2">
              <TabsList className="h-8">
                <TabsTrigger value="notif" className="text-xs h-7">
                  Notifikace {unread > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{unread}</Badge>}
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger value="users" className="text-xs h-7">
                    Uživatelé {pending.length > 0 && <Badge className="ml-1 h-4 px-1 text-[10px]">{pending.length}</Badge>}
                  </TabsTrigger>
                )}
              </TabsList>
              {tab === "notif" && (
                <div className="flex items-center gap-1">
                  {isAdmin && (
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={() => setComposeOpen(true)}>
                      <Send className="h-3 w-3" /> Poslat
                    </Button>
                  )}
                  {unread > 0 && (
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={markAllRead}>
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            <TabsContent value="notif" className="m-0">
              <div className="max-h-96 overflow-y-auto">
                {items.length === 0 ? (
                  <p className="p-4 text-xs text-muted-foreground text-center">Žádné notifikace</p>
                ) : (
                  <ul className="divide-y">
                    {items.map((n) => (
                      <li key={n.id} className={cn("p-3 group", !n.read_at && "bg-primary/5")}>
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-snug">{n.title}</p>
                            {n.body && <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">{n.body}</p>}
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(n.created_at).toLocaleString("cs-CZ")}
                            </p>
                          </div>
                          {isAdmin && (
                            <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => setEditing(n)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => remove(n.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </TabsContent>

            {isAdmin && (
              <TabsContent value="users" className="m-0">
                <div className="max-h-96 overflow-y-auto p-3 space-y-4">
                  {pending.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                        Čekající ({pending.length})
                      </div>
                      <div className="space-y-2">
                        {pending.map((p) => (
                          <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg border bg-card">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{p.display_name}</div>
                              <div className="text-xs text-muted-foreground truncate">{p.email}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {format(new Date(p.created_at), "d.M.yyyy HH:mm")}
                              </div>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => setStatus(p.user_id, "approved")} className="h-8 px-2 text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/10">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setStatus(p.user_id, "rejected")} className="h-8 px-2 text-destructive border-destructive/40 hover:bg-destructive/10">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Všichni</div>
                    <div className="space-y-1">
                      {profiles.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-2 rounded-lg text-sm">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{p.display_name}</div>
                            <div className="text-muted-foreground text-xs truncate">{p.email}</div>
                          </div>
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ml-2",
                            p.status === "approved" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : p.status === "rejected" ? "bg-destructive/15 text-destructive"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          )}>
                            {p.status === "approved" ? "schválen" : p.status === "rejected" ? "zamítnut" : "čeká"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </PopoverContent>
      </Popover>
      {isAdmin && <ComposeDialog open={composeOpen} onOpenChange={setComposeOpen} profiles={profiles} />}
      {isAdmin && <EditNotifDialog notif={editing} onClose={() => setEditing(null)} onSaved={load} />}
    </>
  );
}

function EditNotifDialog({ notif, onClose, onSaved }: { notif: Notif | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (notif) { setTitle(notif.title); setBody(notif.body ?? ""); }
  }, [notif?.id]);

  const save = async () => {
    if (!notif) return;
    if (!title.trim()) { toast.error("Vyplň nadpis"); return; }
    setSaving(true);
    // Update all rows in the same batch (same sender + same created_at + original title/body)
    let q = supabase.from("notifications" as any).update({ title: title.trim(), body: body.trim() || null })
      .eq("created_at", notif.created_at)
      .eq("title", notif.title);
    if (notif.created_by) q = q.eq("created_by", notif.created_by); else q = q.eq("id", notif.id);
    if (notif.body === null) q = q.is("body", null); else q = q.eq("body", notif.body);
    const { error } = await q;
    setSaving(false);
    if (error) { toast.error("Chyba: " + error.message); return; }
    toast.success("Upraveno");
    onSaved();
    onClose();
  };

  return (
    <Dialog open={!!notif} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Upravit notifikaci</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium">Nadpis</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium">Zpráva</label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
          </div>
          <p className="text-[10px] text-muted-foreground">Změna se promítne všem příjemcům této notifikace.</p>
          <Button onClick={save} disabled={saving} className="w-full">Uložit</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ComposeDialog({ open, onOpenChange, profiles }: { open: boolean; onOpenChange: (o: boolean) => void; profiles: ProfileLite[] }) {
  const [target, setTarget] = useState<string>("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const approved = profiles.filter((p) => p.status === "approved");

  useEffect(() => {
    if (!open) return;
    setTitle(""); setBody(""); setTarget("all");
  }, [open]);

  const send = async () => {
    if (!title.trim()) { toast.error("Vyplň nadpis"); return; }
    setSending(true);
    const recipients = target === "all" ? approved.map((u) => u.user_id) : [target];
    const rows = recipients.map((uid) => ({
      user_id: uid,
      title: title.trim(),
      body: body.trim() || null,
      type: "custom",
    }));
    const { error } = await supabase.from("notifications" as any).insert(rows);
    setSending(false);
    if (error) { toast.error("Chyba: " + error.message); return; }
    toast.success("Odesláno (" + rows.length + ")");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nová notifikace</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium">Příjemce</label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všichni uživatelé</SelectItem>
                {approved.map((u) => (
                  <SelectItem key={u.user_id} value={u.user_id}>{u.display_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium">Nadpis</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Co je nového…" />
          </div>
          <div>
            <label className="text-xs font-medium">Zpráva (volitelné)</label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
          </div>
          <Button onClick={send} disabled={sending} className="w-full">Odeslat</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
