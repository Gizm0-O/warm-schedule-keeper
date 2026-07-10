import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineIndicator() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 rounded-full bg-destructive text-destructive-foreground px-3 py-1.5 text-xs font-medium shadow-lg"
    >
      <WifiOff className="h-3.5 w-3.5" />
      Offline – změny se neuloží
    </div>
  );
}
