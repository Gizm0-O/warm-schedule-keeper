import { useState, useRef, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { useItalySavings } from "@/hooks/useItalySavings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function getMotivation(pct: number) {
  if (pct >= 100) return "JEDEME DO ITÁLIE! 🎉🥂";
  if (pct >= 90) return "Ještě malý krůček! 🇮🇹";
  if (pct >= 75) return "Už jsme skoro tam! C­tíš tu vůni pizzy?";
  if (pct >= 50) return "Více než polovina! Nepřestávej!";
  if (pct >= 20) return "Skvělý pokrok! Už máme na benzín!";
  return "Začínáme! Makej, vydělávej, šetři, Itálie čeká!";
}

export default function ItalySavingsBanner() {
  // Clear admin mode on every page load - PIN must be re-entered after refresh
  useEffect(() => {
    sessionStorage.removeItem('adminMode');
  }, []);

  const { entries, total, percentage, goal, addDeposit, removeDeposit } = useItalySavings();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // Admin unlock - click counter for desktop
  const clickCount = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout>>();
  const handleTitleClick = useCallback(() => {
    clickCount.current++;
    if (clickTimer.current) clearTimeout(clickTimer.current);
    if (clickCount.current >= 5) {
      clickCount.current = 0;
      setShowPin(true);
    } else {
      clickTimer.current = setTimeout(() => {
        clickCount.current = 0;
      }, 1500);
    }
  }, []);

  // Long press for mobile
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();
  const onTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => setShowPin(true), 3000);
  }, []);
  const onTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const submitPin = () => {
    if (pin === "2580") {
      setIsAdmin(true);
      sessionStorage.setItem('adminMode', '1');
      window.dispatchEvent(new Event('adminModeChanged'));
      setShowPin(false);
      setPin("");
      setPinError(false);
      setShowAdmin(true);
    } else {
      setPinError(true);
    }
  };

  // Deposit form
  const [depAmount, setDepAmount] = useState("");
  const [depNote, setDepNote] = useState("");
  const [depDate, setDepDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const handleAddDeposit = async () => {
    const amt = parseInt(depAmount);
    if (!amt || amt <= 0) return;
    const ok = await addDeposit(amt, depNote, new Date(depDate).toISOString());
    if (ok) {
      setDepAmount("");
      setDepNote("");
      setDepDate(format(new Date(), "yyyy-MM-dd"));
    }
  };

  // Animated progress bar
  const [animPct, setAnimPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimPct(percentage), 300);
    return () => clearTimeout(t);
  }, [percentage]);

  return (
    <>
      <div className="rounded-2xl bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/30 dark:via-amber-950/20 dark:to-yellow-950/20 border border-orange-200/60 dark:border-orange-800/40 p-4 mb-4 shadow-sm">
        {/* Title row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="text-2xl cursor-pointer select-none"
              onClick={handleTitleClick}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              🇮🇹
            </span>
            <h3 className="font-semibold text-orange-800 dark:text-orange-200">Itálie</h3>
            {isAdmin && (
              <button
                className="text-xs px-2 py-0.5 rounded-full bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-200 hover:opacity-80 transition-opacity"
                onClick={() => setShowAdmin(!showAdmin)}
              >
                ✏️ Admin
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-orange-700 dark:text-orange-300">
              {total.toLocaleString("cs-CZ")} / {goal.toLocaleString("cs-CZ")} Kč
            </span>
            <span className="text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full font-semibold">
              {percentage}%
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-orange-100 dark:bg-orange-900/40 rounded-full h-3 mb-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(animPct, 100)}%` }}
          />
        </div>

        {/* Motivation */}
        <p className="text-xs text-orange-600 dark:text-orange-400 italic">{getMotivation(percentage)}</p>

        {/* Admin panel */}
        {isAdmin && showAdmin && (
          <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-800/60 space-y-2">
            {/* Add deposit */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-orange-700 dark:text-orange-300 font-medium">Částka (Kč)</label>
                <Input
                  type="number"
                  value={depAmount}
                  onChange={(e) => setDepAmount(e.target.value)}
                  placeholder="1000"
                  className="h-8 text-sm bg-white/60 border-orange-200"
                />
              </div>
              <div>
                <label className="text-xs text-orange-700 dark:text-orange-300 font-medium">Poznámka</label>
                <Input
                  value={depNote}
                  onChange={(e) => setDepNote(e.target.value)}
                  placeholder="Výplata..."
                  className="h-8 text-sm bg-white/60 border-orange-200"
                />
              </div>
              <div>
                <label className="text-xs text-orange-700 dark:text-orange-300 font-medium">Datum</label>
                <Input
                  type="date"
                  value={depDate}
                  onChange={(e) => setDepDate(e.target.value)}
                  className="h-8 text-sm bg-white/60 border-orange-200"
                />
              </div>
            </div>
            <Button size="sm" onClick={handleAddDeposit} className="bg-orange-500 hover:bg-orange-600 text-white h-8">
              Přidat
            </Button>

            {/* Deposit list */}
            {entries.length > 0 && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {entries.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-xs bg-white/50 dark:bg-orange-900/20 rounded px-2 py-1">
                    <span className="text-orange-600 dark:text-orange-400">
                      {format(new Date(e.created_at), "d.M.yyyy", { locale: cs })}
                    </span>
                    <span className="font-medium text-orange-700 dark:text-orange-300">
                      +{e.amount.toLocaleString("cs-CZ")} Kč
                    </span>
                    {e.note && (
                      <span className="text-muted-foreground truncate max-w-[100px]">{e.note}</span>
                    )}
                    <button
                      onClick={() => removeDeposit(e.id)}
                      className="p-1 rounded hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-3 w-3 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* PIN dialog */}
      <Dialog open={showPin} onOpenChange={(open) => { if (!open) { setShowPin(false); setPin(""); setPinError(false); } }}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Zadejte PIN</DialogTitle>
          </DialogHeader>
          <Input
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setPinError(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && submitPin()}
            placeholder="****"
            className={cn("text-center text-lg tracking-widest", pinError && "border-destructive")}
            autoFocus
          />
          {pinError && <p className="text-xs text-destructive text-center">Nesprávný PIN</p>}
          <Button onClick={submitPin} className="w-full">Potvrdit</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
