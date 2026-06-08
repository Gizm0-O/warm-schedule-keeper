import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, MessageSquare, Pencil, Trash2, ExternalLink, Zap, Coins, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type Idea = {
  id: string;
  name: string;
  description: string | null;
  difficulty: number;
  cost: number;
  priority: "low" | "medium" | "high";
  status: "new" | "planned" | "in_progress" | "done" | "rejected";
  category: string | null;
  image_url: string | null;
  url: string | null;
  created_by: string;
  created_by_name: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<Idea["status"], string> = {
  new: "Nový",
  planned: "Plánované",
  in_progress: "Realizuje se",
  done: "Hotovo",
  rejected: "Zamítnuto",
};
const STATUS_CLR: Record<Idea["status"], string> = {
  new: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  planned: "bg-purple-500/15 text-purple-500 border-purple-500/30",
  in_progress: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  done: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  rejected: "bg-rose-500/15 text-rose-500 border-rose-500/30",
};
const PRIORITY_LABEL = { low: "Nízká", medium: "Střední", high: "Vysoká" } as const;
const PRIORITY_CLR = {
  low: "bg-muted text-muted-foreground border-border",
  medium: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  high: "bg-rose-500/15 text-rose-500 border-rose-500/30",
} as const;

function Scale({ value, max = 3, icon: Icon, color }: { value: number; max?: number; icon: any; color: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Icon key={i} className={cn("h-3.5 w-3.5", i < value ? color : "text-muted-foreground/30")} />
      ))}
    </div>
  );
}

interface Props {
  idea: Idea;
  onEdit: () => void;
  onChanged: () => void;
}

export default function IdeaCard({ idea, onEdit, onChanged }: Props) {
  const { user, profile, isAdmin } = useAuth();
  const canManage = isAdmin || user?.id === idea.created_by;

  const [votes, setVotes] = useState<{ user_id: string }[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [openComments, setOpenComments] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const loadVotes = async () => {
    const { data } = await supabase.from("idea_votes").select("user_id").eq("idea_id", idea.id);
    setVotes(data ?? []);
  };
  const loadComments = async () => {
    const { data } = await supabase
      .from("idea_comments")
      .select("*")
      .eq("idea_id", idea.id)
      .order("created_at", { ascending: true });
    setComments(data ?? []);
  };

  useEffect(() => {
    loadVotes();
    loadComments();
    // eslint-disable-next-line
  }, [idea.id]);

  const myVote = !!user && votes.some((v) => v.user_id === user.id);

  const toggleVote = async () => {
    if (!user) return;
    if (myVote) {
      await supabase.from("idea_votes").delete().eq("idea_id", idea.id).eq("user_id", user.id);
    } else {
      await supabase.from("idea_votes").insert({ idea_id: idea.id, user_id: user.id });
    }
    loadVotes();
  };

  const remove = async () => {
    if (!confirm("Smazat tento nápad?")) return;
    const { error } = await supabase.from("ideas").delete().eq("id", idea.id);
    if (error) toast.error(error.message);
    else onChanged();
  };

  const setStatus = async (status: Idea["status"]) => {
    const { error } = await supabase.from("ideas").update({ status }).eq("id", idea.id);
    if (error) toast.error(error.message);
    else onChanged();
  };

  const sendComment = async () => {
    if (!draft.trim() || !user) return;
    setSending(true);
    const { error } = await supabase.from("idea_comments").insert({
      idea_id: idea.id,
      user_id: user.id,
      author_name: profile?.display_name ?? null,
      body: draft.trim(),
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setDraft("");
    loadComments();
  };

  const removeComment = async (id: string) => {
    await supabase.from("idea_comments").delete().eq("id", id);
    loadComments();
  };

  return (
    <div className="glass rounded-2xl overflow-hidden flex flex-col">
      {idea.image_url && (
        <div className="aspect-video bg-muted overflow-hidden">
          <img src={idea.image_url} alt={idea.name} className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl font-bold leading-tight">{idea.name}</h3>
          {canManage && (
            <div className="flex gap-1 shrink-0">
              <button onClick={onEdit} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={remove} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <div className="flex items-center gap-1.5" title="Časová náročnost">
            <span className="text-muted-foreground">Čas</span>
            <Scale value={idea.difficulty} icon={Zap} color="text-amber-500" />
          </div>
          <div className="flex items-center gap-1.5" title="Finanční náročnost">
            <span className="text-muted-foreground">Cena</span>
            <Scale value={idea.cost} icon={Coins} color="text-emerald-500" />
          </div>
          <span className={cn("px-2 py-0.5 rounded-full border text-[10px] font-medium uppercase tracking-wide", PRIORITY_CLR[idea.priority])}>
            {PRIORITY_LABEL[idea.priority]}
          </span>
          {canManage ? (
            <select
              value={idea.status}
              onChange={(e) => setStatus(e.target.value as Idea["status"])}
              className={cn("px-2 py-0.5 rounded-full border text-[10px] font-medium uppercase tracking-wide bg-transparent cursor-pointer", STATUS_CLR[idea.status])}
            >
              {(Object.keys(STATUS_LABEL) as Idea["status"][]).map((s) => (
                <option key={s} value={s} className="bg-background text-foreground">{STATUS_LABEL[s]}</option>
              ))}
            </select>
          ) : (
            <span className={cn("px-2 py-0.5 rounded-full border text-[10px] font-medium uppercase tracking-wide", STATUS_CLR[idea.status])}>
              {STATUS_LABEL[idea.status]}
            </span>
          )}
          {idea.category && (
            <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px]">
              #{idea.category}
            </span>
          )}
        </div>

        {idea.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{idea.description}</p>
        )}

        {idea.url && (
          <a href={idea.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 w-fit">
            <ExternalLink className="h-3 w-3" /> Odkaz
          </a>
        )}

        <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <span>{idea.created_by_name ?? "—"}</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-7 px-2 gap-1", myVote && "text-primary")}
              onClick={toggleVote}
            >
              <ThumbsUp className={cn("h-3.5 w-3.5", myVote && "fill-current")} />
              {votes.length}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 gap-1"
              onClick={() => setOpenComments((o) => !o)}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {comments.length}
            </Button>
          </div>
        </div>

        {openComments && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            {comments.length === 0 && <div className="text-xs text-muted-foreground italic">Zatím žádné komentáře</div>}
            {comments.map((c) => (
              <div key={c.id} className="group flex items-start gap-2 text-sm">
                <div className="flex-1">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{c.author_name ?? "—"}</div>
                  <div className="whitespace-pre-wrap">{c.body}</div>
                </div>
                {(isAdmin || user?.id === c.user_id) && (
                  <button onClick={() => removeComment(c.id)} className="opacity-0 group-hover:opacity-100 p-1 text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <Textarea
                rows={1}
                placeholder="Komentář…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="min-h-[36px] text-sm"
              />
              <Button size="icon" onClick={sendComment} disabled={sending || !draft.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
