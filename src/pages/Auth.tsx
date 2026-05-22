import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Orbit } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const { session, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  // login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // register
  const [name, setName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");

  if (loading) return null;
  if (session) return <Navigate to="/" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPass });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Přihlášeno");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPass.length < 6) { toast.error("Heslo musí mít alespoň 6 znaků"); return; }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPass,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: name },
      },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Účet vytvořen. Čeká na schválení adminem.");
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
                <Label>Email</Label>
                <Input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Heslo</Label>
                <Input type="password" required value={loginPass} onChange={(e) => setLoginPass(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>Přihlásit se</Button>
            </form>
          </TabsContent>
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Jméno</Label>
                <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jak ti říkáme" />
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
    </div>
  );
}
