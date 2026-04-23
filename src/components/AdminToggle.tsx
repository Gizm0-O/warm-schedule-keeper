import { useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAdminMode, enableAdminMode, disableAdminMode } from "@/hooks/useAdminMode";
import { cn } from "@/lib/utils";

const ADMIN_PIN = "2580";

export default function AdminToggle() {
  const isAdmin = useAdminMode();
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const submitPin = () => {
    if (pin === ADMIN_PIN) {
      enableAdminMode(30);
      setShowPin(false);
      setPin("");
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleClick = () => {
    if (isAdmin) {
      disableAdminMode();
    } else {
      setShowPin(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={isAdmin ? "Odhlásit admin" : "Přihlásit admin"}
        title={isAdmin ? "Odhlásit admin" : "Admin"}
        className={cn(
          "group flex h-7 w-7 items-center justify-center rounded-md transition-all duration-300",
          // Hidden by default; reveal on hover of header (parent has .group/header) or on focus
          isAdmin
            ? "opacity-60 hover:opacity-100"
            : "opacity-0 hover:opacity-100 focus-visible:opacity-100 group-hover/header:opacity-30"
        )}
      >
        {isAdmin ? (
          <Unlock className="h-3.5 w-3.5 text-primary" />
        ) : (
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      <Dialog open={showPin} onOpenChange={(o) => { setShowPin(o); if (!o) { setPin(""); setPinError(false); } }}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Admin přístup</DialogTitle>
          </DialogHeader>
          <Input
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => { setPin(e.target.value); setPinError(false); }}
            onKeyDown={(e) => e.key === "Enter" && submitPin()}
            placeholder="****"
            className={cn("text-center text-lg tracking-widest", pinError && "border-destructive")}
            autoFocus
          />
          {pinError && <p className="text-xs text-destructive text-center">Nesprávný PIN</p>}
          <p className="text-xs text-muted-foreground text-center">Zapamatuje se na 30 dní</p>
          <Button onClick={submitPin} className="w-full">Potvrdit</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
