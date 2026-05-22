import { Lock, Unlock } from "lucide-react";
import { useAdminMode, enableAdminMode, disableAdminMode, useHasAdminRole } from "@/hooks/useAdminMode";
import { cn } from "@/lib/utils";

export default function AdminToggle() {
  const hasRole = useHasAdminRole();
  const isAdminMode = useAdminMode();

  if (!hasRole) return null;

  const handleClick = () => {
    if (isAdminMode) disableAdminMode();
    else enableAdminMode(30);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isAdminMode ? "Vypnout admin režim" : "Zapnout admin režim"}
      title={isAdminMode ? "Vypnout admin režim" : "Zapnout admin režim"}
      className={cn(
        "group flex h-7 w-7 items-center justify-center rounded-md transition-all duration-300",
        isAdminMode ? "opacity-80 hover:opacity-100" : "opacity-40 hover:opacity-100"
      )}
    >
      {isAdminMode ? (
        <Unlock className="h-3.5 w-3.5 text-primary" />
      ) : (
        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </button>
  );
}
