import { useEffect, useState } from "react";
import { Bell, Check, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminMode } from "@/hooks/useAdminMode";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Notif {
  id: string;
  title: string;
  body: string | null;
  type: string;
  read_at: string | null;
  created_at: string;
}

interface ProfileLite { user_id: string; display_name: string; }

export default function NotificationsBell() {
  const { user } = useAuth();
  const isAdmin = useAdminMode();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications" as any)
      .select("id,title,body,type,read_at,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setItems(data as any);
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

  const unread = items.filter((n) => !n.read_at).length;

  const markAllRead = async () => {
    if (!user || unread === 0) return;
    await supabase.from("notifications" as any).update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("notifications" as any).delete().eq("id", id);
    load();
  };

  if (!user) return null;

  return (
    <>
      <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setTimeout(markAllRead, 1500); }}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative rounded-xl">
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center">
                {unread}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <span className="text-sm font-semibold">Notifikace</span>
            <div className="flex items-center gap-1">
              {isAdmin && (
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={() => setComposeOpen(true)}>
                  <Send className="h-3 w-3" /> Poslat
                </Button>
              )}
              {unread > 0 && (
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={markAllRead}>
                  <Check className="h-3 w-3" /> Vše
                </Button>
              )}
            </div>
          </div>
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
                      <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => remove(n.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {isAdmin && <ComposeDialog open={composeOpen} onOpenChange={setComposeOpen} />}
    </>
  );
}

function ComposeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [target, setTarget] = useState<string>("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [users, setUsers] = useState<ProfileLite[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase.from("profiles").select("user_id,display_name").eq("status", "approved").then(({ data }) => {
      if (data) setUsers(data as any);
    });
    setTitle(""); setBody(""); setTarget("all");
  }, [open]);

  const send = async () => {
    if (!title.trim()) { toast.error("Vyplň nadpis"); return; }
    setSending(true);
    const recipients = target === "all" ? users.map((u) => u.user_id) : [target];
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
                {users.map((u) => (
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
