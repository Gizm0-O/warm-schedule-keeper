import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Orbit } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const { session, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  // login (username OR email)
  const [loginId, setLoginId] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // register
  const [username, setUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");

  // forgot password
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotBusy, setForgotBusy] = useState(false);

  if (loading) return null;
  if (session) return <Navigate to="/" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const id = loginId.trim();
      let email = id;
      if (!id.includes("@")) {
        const { data, error } = await supabase.rpc("get_email_by_username", { _username: id });
        if (error) { toast.error("Chyba při ověřování uživatele"); return; }
        if (!data) { toast.error("Uživatel nenalezen"); return; }
        email = data as string;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password: loginPass });
      if (error) toast.error(error.message);
      else toast.success("Přihlášeno");
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPass.length < 6) { toast.error("Heslo musí mít alespoň 6 znaků"); return; }
    setBusy(true);
    const uname = username.trim();
    const { data, error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPass,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: uname },
      },
    });
    if (!error && data.user && uname) {
      await supabase.from("profiles").update({ username: uname, display_name: uname }).eq("user_id", data.user.id);
    }
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Účet vytvořen. Čeká na schválení adminem.");
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = forgotEmail.trim();
    if (!email) return;
    setForgotBusy(true);
    try {
      // Check if account exists for this email via SECURITY DEFINER RPC (bypasses RLS for anon users)
      const { data: exists, error: rpcErr } = await supabase
        .rpc("email_has_account", { _email: email });
      if (rpcErr) {
        toast.error("Chyba při ověřování e-mailu");
        return;
      }
      if (!exists) {
        toast.error("Na tento e-mail nebyl založen žádný účet");
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Poslali jsme ti e-mail s odkazem na změnu hesla");
      setForgotOpen(false);
      setForgotEmail("");
    } finally {
      setForgotBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md glass-strong rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 justify-center">
          <Orbit className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[hsl(280,90%,65%)] via-[hsl(265,80%,65%)] to-[hsl(200,90%,55%)] bg-clip-text text-transparent">
            Bambuls Universe
          </h1>
        </div>
        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Přihlášení</TabsTrigger>
            <TabsTrigger value="register">Registrace</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" required value={loginId} onChange={(e) => setLoginId(e.target.value)} autoComplete="email" />
              </div>
              <div className="space-y-2">
                <Label>Heslo</Label>
                <Input type="password" required value={loginPass} onChange={(e) => setLoginPass(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>Přihlásit se</Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
                >
                  Zapomněl jsem heslo
                </button>
              </div>
            </form>
          </TabsContent>
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Uživatelské jméno</Label>
                <Input required value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Heslo</Label>
                <Input type="password" required value={regPass} onChange={(e) => setRegPass(e.target.value)} minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>Vytvořit účet</Button>
              <p className="text-xs text-muted-foreground text-center">
                Po registraci musí admin schválit přístup.
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Obnova hesla</DialogTitle>
            <DialogDescription>
              Zadej svůj e-mail. Pokud na něj existuje účet, pošleme ti odkaz pro nastavení nového hesla.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setForgotOpen(false)}>Zrušit</Button>
              <Button type="submit" disabled={forgotBusy}>Odeslat</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
