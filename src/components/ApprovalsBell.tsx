import { useEffect, useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface PendingProfile {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  status: string;
  created_at: string;
}

export default function ApprovalsBell() {
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [profiles, setProfiles] = useState<PendingProfile[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id,user_id,display_name,email,status,created_at")
      .order("created_at", { ascending: false });
    setProfiles((data as any) ?? []);
  };

  useEffect(() => {
    if (!isAdmin) return;
    load();
    const ch = supabase.channel("profiles-watch")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin]);

  if (!isAdmin) return null;

  const pending = profiles.filter((p) => p.status === "pending");

  const setStatus = async (user_id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("profiles").update({ status }).eq("user_id", user_id);
    if (error) { toast.error(error.message); return; }
    if (status === "approved") {
      await supabase.from("user_roles").upsert({ user_id, role: "user" } as any, { onConflict: "user_id,role" });
    }
    toast.success(status === "approved" ? "Schváleno" : "Zamítnuto");
    load();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-xl hover:glass-subtle">
          <Bell className="h-4 w-4" />
          {pending.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {pending.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Uživatelé</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {pending.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Čekající na schválení ({pending.length})
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
            <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Všichni uživatelé</div>
            <div className="space-y-1">
              {profiles.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg text-sm">
                  <div>
                    <span className="font-medium">{p.display_name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{p.email}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    p.status === "approved" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : p.status === "rejected" ? "bg-destructive/15 text-destructive"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  }`}>
                    {p.status === "approved" ? "schválen" : p.status === "rejected" ? "zamítnut" : "čeká"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
