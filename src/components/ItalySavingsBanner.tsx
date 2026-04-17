import { useState, useRef, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { useItalySavings } from "@/hooks/useItalySavings";
import { useAdminMode } from "@/hooks/useAdminMode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function getMotivation(pct: number) {
  if (pct >= 100) return "JEDEME DO ITÁLIE! 🎉🥂";
  if (pct >= 90) return "Ještě malý krůček! 🇮🇹";
  if (pct >= 75) return "Už jsme skoro tam! Cítíš tu vůni pizzy?";
  if (pct >= 50) return "Více než polovina! Nepřestávej!";
  if (pct >= 20) return "Skvělý pokrok! Už máme na benzín!";
  return "Začínáme! Makej, vydělávej, šetři, Itálie čeká!";
}

export default function ItalySavingsBanner() {
  const { entries, total, percentage, goal, addDeposit, removeDeposit } = useItalySavings();
  const isAdmin = useAdminMode();
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
      clickTimer.current = setTimeout(() => { clickCount.current = 0; }, 1500);
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
      sessionStorage.setItem("adminMode", "1");
      window.dispatchEvent(new Event("adminModeChanged"));
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
  const depAmountRef = useRef<HTMLInputElement | null>(null);
  const depNoteRef = useRef<HTMLInputElement | null>(null);
  const depDateRef = useRef<HTMLInputElement | null>(null);

  const handleAddDeposit = async () => {
    const rawAmount = depAmountRef.current?.value?.trim() ?? depAmount.trim();
    const rawNote = depNoteRef.current?.value ?? depNote;
    const rawDate = depDateRef.current?.value || depDate;
    const amt = parseInt(rawAmount, 10);
    if (!amt || amt <= 0) {
      console.warn("[italy] invalid amount:", rawAmount);
      return;
    }
    const dateStr = rawDate || format(new Date(), "yyyy-MM-dd");
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) {
      console.warn("[italy] invalid date:", rawDate);
      return;
    }
    const ok = await addDeposit(amt, rawNote, dateObj.toISOString());
    if (ok) {
      setDepAmount("");
      setDepNote("");
      setDepDate(format(new Date(), "yyyy-MM-dd"));
      if (depAmountRef.current) depAmountRef.current.value = "";
      if (depNoteRef.current) depNoteRef.current.value = "";
      if (depDateRef.current) depDateRef.current.value = format(new Date(), "yyyy-MM-dd");
    } else {
      console.error("[italy] addDeposit failed");
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
      <div
        className="relative overflow-hidden rounded-2xl p-4 sm:p-6"
        style={{
          background: "linear-gradient(135deg, hsl(25 60% 92%), hsl(38 70% 88%), hsl(25 50% 90%))",
        }}
      >
        {/* Title row */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-2xl cursor-default select-none hidden md:inline"
            onClick={handleTitleClick}
          >
            🇮🇹
          </span>
          <h3
            className="text-lg sm:text-xl font-bold select-none"
            style={{ color: "hsl(25 40% 30%)" }}
            onClick={handleTitleClick}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchEnd}
          >
            Itálie
          </h3>
          {isAdmin && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-md cursor-pointer"
              style={{ background: "hsl(38 50% 80%)", color: "hsl(25 40% 30%)" }}
              onClick={() => setShowAdmin(!showAdmin)}
            >
              ✏️ Admin
            </span>
          )}
          <div className="ml-auto text-right">
            <span className="text-sm font-semibold" style={{ color: "hsl(25 40% 30%)" }}>
              {total.toLocaleString("cs-CZ")} / {goal.toLocaleString("cs-CZ")} Kč
            </span>
            <span className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: "hsl(38 60% 75%)", color: "hsl(25 50% 25%)" }}>
              {percentage}%
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 rounded-full overflow-hidden mb-2" style={{ background: "hsl(25 30% 82%)" }}>
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${animPct}%`,
              background: "linear-gradient(90deg, hsl(38 80% 55%), hsl(15 70% 50%))",
            }}
          />
        </div>

        {/* Motivation */}
        <p className="text-xs sm:text-sm italic" style={{ color: "hsl(25 30% 40%)" }}>
          {getMotivation(percentage)}
        </p>

        {/* Admin panel */}
        {isAdmin && showAdmin && (
          <div
            className="mt-4 pt-4 space-y-3 animate-fade-in"
            style={{ borderTop: "1px solid hsl(25 30% 80%)" }}
          >
            {/* Add deposit */}
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[100px]">
                <label className="text-xs font-medium" style={{ color: "hsl(25 40% 30%)" }}>Částka (Kč)</label>
                <Input
                  ref={depAmountRef}
                  type="number"
                  value={depAmount}
                  onChange={(e) => setDepAmount(e.target.value)}
                  onInput={(e) => setDepAmount((e.target as HTMLInputElement).value)}
                  placeholder="1000"
                  className="h-8 text-sm bg-white/60 border-orange-200"
                />
              </div>
              <div className="flex-1 min-w-[100px]">
                <label className="text-xs font-medium" style={{ color: "hsl(25 40% 30%)" }}>Poznámka</label>
                <Input
                  ref={depNoteRef}
                  value={depNote}
                  onChange={(e) => setDepNote(e.target.value)}
                  placeholder="Výplata..."
                  className="h-8 text-sm bg-white/60 border-orange-200"
                />
              </div>
              <div className="min-w-[130px]">
                <label className="text-xs font-medium" style={{ color: "hsl(25 40% 30%)" }}>Datum</label>
                <Input
                  ref={depDateRef}
                  type="date"
                  value={depDate}
                  onChange={(e) => setDepDate(e.target.value)}
                  className="h-8 text-sm bg-white/60 border-orange-200"
                />
              </div>
              <Button
                type="button"
                size="sm"
                className="h-8"
                style={{ background: "hsl(25 50% 45%)", color: "white" }}
                onClick={handleAddDeposit}
              >
                Přidat
              </Button>
            </div>

            {/* Deposit list */}
            {entries.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {entries.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between text-xs px-2 py-1 rounded-md"
                    style={{ background: "hsl(38 40% 88%)" }}
                  >
                    <span style={{ color: "hsl(25 30% 35%)" }}>
                      {format(new Date(e.created_at), "d.M.yyyy", { locale: cs })}
                    </span>
                    <span className="font-semibold" style={{ color: "hsl(25 40% 30%)" }}>
                      +{e.amount.toLocaleString("cs-CZ")} Kč
                    </span>
                    {e.note && (
                      <span className="flex-1 mx-2 truncate" style={{ color: "hsl(25 20% 50%)" }}>
                        {e.note}
                      </span>
                    )}
                    <button
                      onClick={() => removeDeposit(e.id)}
                      className="p-1 rounded hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* PIN dialog */}
      <Dialog open={showPin} onOpenChange={setShowPin}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Zadejte PIN</DialogTitle>
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
          <Button onClick={submitPin} className="w-full">Potvrdit</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
