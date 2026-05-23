import { useEffect, useState } from "react";
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

export default function ProfilePage() {
  const { user, profile, refresh, signOut } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setUsername(profile.username || "");
      setEmail(profile.email || "");
    }
  }, [profile]);

  if (!user) return null;
  const initials = (displayName || email || "?").slice(0, 2).toUpperCase();

  const saveProfile = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim(), username: username.trim() || null })
      .eq("user_id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    await refresh();
    toast.success("Profil uložen");
  };

  const changeEmail = async () => {
    if (!email || email === profile?.email) return;
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ email });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Pro potvrzení změny e-mailu zkontroluj schránku.");
  };

  const changePassword = async () => {
    if (newPass.length < 6) return toast.error("Heslo musí mít alespoň 6 znaků");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setBusy(false);
    if (error) return toast.error(error.message);
    setNewPass("");
    toast.success("Heslo změněno");
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { setUploading(false); return toast.error(upErr.message); }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: updErr } = await supabase.from("profiles").update({ avatar_url: pub.publicUrl }).eq("user_id", user.id);
    setUploading(false);
    if (updErr) return toast.error(updErr.message);
    await refresh();
    toast.success("Fotka aktualizována");
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
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} disabled={uploading} />
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg glass-subtle text-sm hover:bg-accent">
              <Upload className="h-4 w-4" /> {uploading ? "Nahrávám…" : "Změnit fotku"}
            </span>
          </label>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Jméno</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Uživatelské jméno (pro přihlášení)</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="např. tadeas" />
          </div>
          <Button onClick={saveProfile} disabled={busy}>Uložit profil</Button>
        </div>

        <div className="space-y-3 pt-4 border-t border-border">
          <Label>E-mail</Label>
          <div className="flex gap-2">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button onClick={changeEmail} disabled={busy || email === profile?.email}>Změnit</Button>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-border">
          <Label>Nové heslo</Label>
          <div className="flex gap-2">
            <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Min. 6 znaků" />
            <Button onClick={changePassword} disabled={busy || !newPass}>Změnit</Button>
          </div>
        </div>

        <div className="pt-4 border-t border-destructive/30">
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
    </div>
  );
}
