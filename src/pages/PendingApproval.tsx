import { Orbit, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function PendingApproval() {
  const { profile, signOut } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md glass-strong rounded-2xl p-8 space-y-6 text-center">
        <Orbit className="h-12 w-12 text-primary mx-auto animate-twinkle" />
        <div>
          <h1 className="text-2xl font-bold mb-2">Čeká na schválení</h1>
          <p className="text-muted-foreground text-sm">
            Ahoj {profile?.display_name}! Tvůj účet byl vytvořen a čeká na schválení adminem.
            Až ti přístup povolí, jednoduše se znovu přihlas.
          </p>
        </div>
        <Button variant="outline" onClick={signOut} className="w-full">
          <LogOut className="h-4 w-4 mr-2" /> Odhlásit se
        </Button>
      </div>
    </div>
  );
}
