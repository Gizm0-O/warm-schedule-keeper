import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ArrowLeft, Upload, Trash2 } from "lucide-react";
import AvatarCropDialog from "@/components/AvatarCropDialog";

export default function ProfilePage() {
  const { user, profile, refresh, signOut } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || profile.display_name || "");
      setEmail(profile.email || "");
    }
  }, [profile]);

  if (!user) return null;
  const initials = (username || email || "?").slice(0, 2).toUpperCase();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const uploadCropped = async (blob: Blob) => {
    setUploading(true);
    const path = `${user.id}/avatar-${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
    if (upErr) { setUploading(false); return toast.error(upErr.message); }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: updErr } = await supabase.from("profiles").update({ avatar_url: pub.publicUrl }).eq("user_id", user.id);
    setUploading(false);
    if (updErr) return toast.error(updErr.message);
    await refresh();
    toast.success("Fotka aktualizována");
  };

  const saveAll = async () => {
    if (!username.trim()) return toast.error("Uživatelské jméno nesmí být prázdné");
    if (newPass && newPass.length < 6) return toast.error("Heslo musí mít alespoň 6 znaků");
    const token = user ? (await supabase.auth.getSession()).data.session?.access_token : null;
    if (!token) return toast.error("Relace vypršela. Přihlas se prosím znovu.");
    setBusy(true);
    try {
      const normalizedEmail = email.trim();
      const needsCredentialUpdate = normalizedEmail !== (profile?.email || "") || !!newPass;
      if (needsCredentialUpdate) {
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-user-credentials`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({
              username: username.trim(),
              email: normalizedEmail || undefined,
              password: newPass || undefined,
            }),
          }
        );
        const text = await resp.text();
        if (!resp.ok) throw new Error(text || `HTTP ${resp.status}`);
      } else {
        const { error: pErr } = await supabase
          .from("profiles")
          .update({ username: username.trim(), display_name: username.trim() })
          .eq("user_id", user.id);
        if (pErr) throw pErr;
      }

      setNewPass("");
      await refresh();
      toast.success("Změny uloženy");
    } catch (e: any) {
      console.error("[saveAll] error", e);
      toast.error(e?.message || "Chyba při ukládání");
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    setBusy(true);
    const { error } = await supabase.functions.invoke("delete-account");
    if (error) { setBusy(false); return toast.error(error.message); }
    toast.success("Účet smazán");
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Zpět
      </Button>

      <div className="glass-strong rounded-2xl p-6 space-y-6">
        <h1 className="text-2xl font-bold">Profil</h1>

        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-lg bg-primary/20 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload className="h-4 w-4 mr-2" /> {uploading ? "Nahrávám…" : "Změnit fotku"}
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Uživatelské jméno</Label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="např. tadeas" />
          <p className="text-xs text-muted-foreground">Lze používat pro přihlášení (spolu s heslem) místo e-mailu.</p>
        </div>

        <div className="space-y-2">
          <Label>E-mail</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Nové heslo</Label>
          <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Nech prázdné pro zachování" />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button onClick={saveAll} disabled={busy}>Uložit změny</Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={busy}>
                <Trash2 className="h-4 w-4 mr-2" /> Smazat účet
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Opravdu smazat účet?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tato akce je nevratná. Tvůj účet bude trvale odstraněn.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Zrušit</AlertDialogCancel>
                <AlertDialogAction onClick={deleteAccount}>Smazat</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {cropSrc && (
        <AvatarCropDialog
          src={cropSrc}
          open={!!cropSrc}
          onClose={() => setCropSrc(null)}
          onCropped={uploadCropped}
        />
      )}
    </div>
  );
}
