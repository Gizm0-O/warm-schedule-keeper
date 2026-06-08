import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Zap, Coins, Upload, Loader2, Sparkles, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import AvatarCropDialog from "@/components/AvatarCropDialog";
import type { Idea } from "./IdeaCard";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  idea: Idea | null;
  onSaved: () => void;
}

const empty = () => ({
  name: "",
  description: "",
  difficulty: 1,
  cost: 1,
  priority: "medium" as Idea["priority"],
  status: "new" as Idea["status"],
  category: "",
  image_url: "",
  url: "",
});

export default function IdeaFormDialog({ open, onOpenChange, idea, onSaved }: Props) {
  const { user, profile } = useAuth();
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (idea) {
      setForm({
        name: idea.name,
        description: idea.description ?? "",
        difficulty: idea.difficulty,
        cost: idea.cost,
        priority: idea.priority,
        status: idea.status,
        category: idea.category ?? "",
        image_url: idea.image_url ?? "",
        url: idea.url ?? "",
      });
    } else {
      setForm(empty());
    }
  }, [idea, open]);

  const save = async () => {
    if (!user) return;
    if (!form.name.trim()) { toast.error("Název je povinný"); return; }
    setSaving(true);
    const payload: any = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      difficulty: form.difficulty,
      cost: form.cost,
      priority: form.priority,
      status: form.status,
      category: form.category.trim() || null,
      image_url: form.image_url.trim() || null,
      url: form.url.trim() || null,
    };
    let error;
    if (idea) {
      ({ error } = await supabase.from("ideas").update(payload).eq("id", idea.id));
    } else {
      payload.created_by = user.id;
      payload.created_by_name = profile?.display_name ?? null;
      ({ error } = await supabase.from("ideas").insert(payload));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    onSaved();
    onOpenChange(false);
  };

  const autoFetch = async () => {
    if (!form.url.trim()) return;
    setFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-og-image", { body: { url: form.url.trim() } });
      if (error) throw error;
      const next = { ...form };
      if (data?.image) next.image_url = data.image;
      if (data?.title && !next.name.trim()) next.name = data.title;
      setForm(next);
    } catch (e: any) {
      toast.error(e.message ?? "Načtení selhalo");
    } finally {
      setFetching(false);
    }
  };

  const onFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const uploadCropped = async (blob: Blob) => {
    if (!user) return;
    setUploading(true);
    const path = `${user.id}/ideas/${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
    if (upErr) { setUploading(false); toast.error(upErr.message); return; }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    setForm((f) => ({ ...f, image_url: pub.publicUrl }));
    setUploading(false);
  };

  const Scale = ({ value, onChange, icon: Icon, color }: any) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={cn(
            "p-1.5 rounded-md transition-all hover:scale-110",
            n <= value ? color : "text-muted-foreground/30"
          )}
        >
          <Icon className="h-5 w-5" />
        </button>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{idea ? "Upravit nápad" : "Nový nápad"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Název nápadu *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="text-lg font-semibold h-12"
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Časová náročnost</label>
              <Scale value={form.difficulty} onChange={(n: number) => setForm({ ...form, difficulty: n })} icon={Zap} color="text-amber-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Finanční náročnost</label>
              <Scale value={form.cost} onChange={(n: number) => setForm({ ...form, cost: n })} icon={Coins} color="text-emerald-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Priorita</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as Idea["priority"] })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="low">Nízká</option>
                <option value="medium">Střední</option>
                <option value="high">Vysoká</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Stav</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Idea["status"] })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="new">Nový</option>
                <option value="planned">Plánované</option>
                <option value="in_progress">Realizuje se</option>
                <option value="done">Hotovo</option>
                <option value="rejected">Zamítnuto</option>
              </select>
            </div>
          </div>

          <Input
            placeholder="Kategorie (např. Dům, Cestování)"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />

          <Textarea
            placeholder="Popisek nápadu"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
          />

          <div className="flex gap-2">
            <Input placeholder="Odkaz (URL)" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            <Button type="button" variant="outline" size="icon" onClick={autoFetch} disabled={fetching || !form.url.trim()} title="Načíst obrázek z odkazu">
              {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex gap-2">
            <Input placeholder="URL obrázku" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFilePick} />
            <Button type="button" variant="outline" size="icon" onClick={() => fileRef.current?.click()} disabled={uploading} title="Nahrát z počítače">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            </Button>
          </div>
          {form.image_url && (
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              <img src={form.image_url} alt="preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setCropSrc(form.image_url)}
                className="absolute top-2 right-2 px-2 py-1 text-xs rounded-md bg-background/80 hover:bg-background border border-border backdrop-blur flex items-center gap-1"
              >
                <Pencil className="h-3 w-3" /> Upravit
              </button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Zrušit</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Ukládám…" : "Uložit"}</Button>
        </DialogFooter>

        {cropSrc && (
          <AvatarCropDialog
            src={cropSrc}
            open={!!cropSrc}
            onClose={() => setCropSrc(null)}
            onCropped={uploadCropped}
            aspect={16 / 9}
            cropShape="rect"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
