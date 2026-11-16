import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink, Loader2, Plus, Sparkles, Trash2, Pencil, Gift, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import AvatarCropDialog from "@/components/AvatarCropDialog";
import { giftUrls, giftUrlPayload, MAX_GIFT_URLS } from "@/lib/giftUrls";

export interface GiftItem {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  urls?: string[];
  image_url: string | null;
}

interface Props {
  title: string;
  table: "gift_wishes" | "gift_ideas";
  /** column used as the "owner/recipient" filter */
  groupColumn: "owner" | "recipient";
  /** fixed value for groupColumn (e.g. "Barča"). If undefined → free-form (used in ideas list) */
  groupValue?: string;
  /** show recipient input in the form (for ideas) */
  showRecipientInput?: boolean;
  accent: string; // tailwind classes for accent (border / header)
  icon?: React.ReactNode;
}

interface FormState {
  id?: string;
  name: string;
  description: string;
  url: string; // Legacy field retained for compatibility.
  urls: string[];
  image_url: string;
  recipient: string;
}

const empty = (): FormState => ({ name: "", description: "", url: "", urls: [""], image_url: "", recipient: "" });

export default function GiftListPanel({ title, table, groupColumn, groupValue, showRecipientInput, accent, icon }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty());
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase.from(table as any).select("*").order("created_at", { ascending: false });
    if (groupValue) q = q.eq(groupColumn, groupValue);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    else setItems((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [table, groupValue]);

  const startNew = () => { setForm(empty()); setOpen(true); };
  const startEdit = (it: any) => {
    setForm({
      id: it.id,
      name: it.name,
      description: it.description ?? "",
      url: it.url ?? "",
      urls: giftUrls(it).length ? giftUrls(it) : [""],
      image_url: it.image_url ?? "",
      recipient: it.recipient ?? "",
    });
    setOpen(true);
  };

  const autoFetch = async () => {
    if (!(form.urls[0] ?? "").trim()) { toast.error("Nejprve vlož odkaz"); return; }
    setFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-og-image", { body: { url: (form.urls[0] ?? "").trim() } });
      if (error) throw error;
      const next = { ...form };
      if (data?.image) next.image_url = data.image;
      if (data?.title && !next.name.trim()) next.name = data.title;
      setForm(next);
      if (!data?.image) toast.warning("Obrázek se nepodařilo najít");
      else toast.success("Obrázek načten");
    } catch (e: any) {
      toast.error(e.message ?? "Načtení selhalo");
    } finally {
      setFetching(false);
    }
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Název je povinný"); return; }
    if (showRecipientInput && !form.recipient.trim()) { toast.error("Vyplň jméno osoby"); return; }
    let links;
    try { links = giftUrlPayload(form.urls); } catch (error) { toast.error(error instanceof Error ? error.message : "Neplatné odkazy"); return; }
    setSaving(true);
    const payload: any = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      ...links,
      image_url: form.image_url.trim() || null,
    };
    if (groupValue) payload[groupColumn] = groupValue;
    if (showRecipientInput) payload[groupColumn] = form.recipient.trim();

    const { error } = form.id
      ? await supabase.from(table as any).update(payload).eq("id", form.id)
      : await supabase.from(table as any).insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setOpen(false);
    setForm(empty());
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from(table as any).delete().eq("id", id);
    if (error) toast.error(error.message); else load();
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
    if (!user) { toast.error("Nejsi přihlášen"); return; }
    setUploading(true);
    const path = `${user.id}/gifts/${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
    if (upErr) { setUploading(false); toast.error(upErr.message); return; }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    setForm((f) => ({ ...f, image_url: pub.publicUrl }));
    setUploading(false);
    toast.success("Obrázek nahrán");
  };


  return (
    <div className={cn("glass rounded-2xl p-4 sm:p-5 border-t-4", accent)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {icon ?? <Gift className="h-4 w-4" />} {title}
        </h3>
        <Button size="sm" variant="ghost" onClick={startNew} className="h-8">
          <Plus className="h-4 w-4 mr-1" /> Přidat
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Načítám…</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-muted-foreground italic">Zatím nic. Přidej první dáreček ✨</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((it: any) => (
            <div key={it.id} className="glass-subtle rounded-xl overflow-hidden group relative flex flex-col">
              {it.image_url ? (
                <div className="aspect-video bg-muted overflow-hidden">
                  <img src={it.image_url} alt={it.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
              ) : (
                <div className="aspect-video bg-muted flex items-center justify-center text-muted-foreground">
                  <Gift className="h-8 w-8 opacity-40" />
                </div>
              )}
              <div className="p-3 flex-1 flex flex-col gap-1">
                {showRecipientInput && it.recipient && (
                  <div className="text-[10px] uppercase tracking-wide text-primary font-medium">{it.recipient}</div>
                )}
                <div className="font-medium text-sm">{it.name}</div>
                {it.description && <div className="text-xs text-muted-foreground line-clamp-2">{it.description}</div>}
                <div className="mt-auto pt-2 flex items-center justify-between">
                  <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1">
                    {giftUrls(it).map((url, index, urls) => (
                      <a key={`${index}-${url}`} href={url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> {urls.length === 1 ? "Odkaz" : `Odkaz ${index + 1}`}
                      </a>
                    ))}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(it)} className="p-1 rounded hover:bg-accent text-muted-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => remove(it.id)} className="p-1 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Upravit dáreček" : "Nový dáreček"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {showRecipientInput && (
              <Input placeholder="Komu (např. Máma)" value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} />
            )}
            <Input placeholder="Název *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Textarea placeholder="Popisek (nepovinné)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            <div className="space-y-2">
              {form.urls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input aria-label={`Odkaz ${index + 1}`} placeholder="Odkaz (URL)" value={url} onChange={event => setForm(current => ({ ...current, urls: current.urls.map((value, row) => row === index ? event.target.value : value) }))} />
                  {index === 0 && (
                    <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={autoFetch} disabled={fetching || !url.trim()} title="Načíst obrázek z odkazu" aria-label="Načíst obrázek z odkazu">
                      {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    </Button>
                  )}
                  <Button type="button" variant="ghost" size="icon" className="shrink-0 text-destructive" title="Odebrat odkaz" aria-label={`Odebrat odkaz ${index + 1}`} onClick={() => setForm(current => ({ ...current, urls: current.urls.filter((_, row) => row !== index) }))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {form.urls.length < MAX_GIFT_URLS && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setForm(current => ({ ...current, urls: [...current.urls, ""] }))}>
                  <Plus className="mr-1 h-4 w-4" /> Přidat odkaz
                </Button>
              )}
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
                  title="Upravit výřez"
                >
                  <Pencil className="h-3 w-3" /> Upravit
                </button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Zrušit</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Ukládám…" : "Uložit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
