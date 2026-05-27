import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Orbit } from "lucide-react";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // When user clicks the recovery link, Supabase sets a temporary session.
    // Listen for PASSWORD_RECOVERY event or check session.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pass.length < 6) { toast.error("Heslo musí mít alespoň 6 znaků"); return; }
    if (pass !== pass2) { toast.error("Hesla se neshodují"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pass });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Heslo bylo změněno");
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md glass-strong rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 justify-center">
          <Orbit className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[hsl(280,90%,65%)] via-[hsl(265,80%,65%)] to-[hsl(200,90%,55%)] bg-clip-text text-transparent">
            Nastavit nové heslo
          </h1>
        </div>
        {!ready ? (
          <p className="text-sm text-muted-foreground text-center">
            Otevři odkaz z e-mailu pro obnovu hesla.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nové heslo</Label>
              <Input type="password" required minLength={6} value={pass} onChange={(e) => setPass(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Heslo znovu</Label>
              <Input type="password" required minLength={6} value={pass2} onChange={(e) => setPass2(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>Uložit nové heslo</Button>
          </form>
        )}
      </div>
    </div>
  );
}
