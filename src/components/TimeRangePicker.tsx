import { useState } from "react";
import { Clock, ArrowRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const floatToTime = (t: number) => {
  const total = Math.round(t * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6..23
const MINUTES = [0, 15, 30, 45];
const DURATIONS = [
  { label: "15 min", value: 0.25 },
  { label: "30 min", value: 0.5 },
  { label: "1 h", value: 1 },
  { label: "1,5 h", value: 1.5 },
  { label: "2 h", value: 2 },
  { label: "3 h", value: 3 },
];

interface TimeButtonProps {
  value: number;
  onChange: (v: number) => void;
  label: string;
  className?: string;
}

function TimeButton({ value, onChange, label, className }: TimeButtonProps) {
  const [open, setOpen] = useState(false);
  const hour = Math.floor(value);
  const minute = Math.round((value - hour) * 60);

  const setHour = (h: number) => onChange(h + minute / 60);
  const setMinute = (m: number) => onChange(hour + m / 60);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex flex-col items-start gap-0.5 rounded-xl border-2 border-input bg-background px-3 py-2 transition-all hover:border-primary/50 hover:bg-accent/30",
            open && "border-primary ring-2 ring-primary/20",
            className
          )}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
          <span className="flex items-center gap-1.5 text-lg font-bold tabular-nums text-foreground">
            <Clock className="h-4 w-4 text-primary" />
            {floatToTime(value)}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Hodina</p>
            <div className="grid grid-cols-6 gap-1">
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHour(h)}
                  className={cn(
                    "h-8 rounded-md text-xs font-semibold tabular-nums transition-colors",
                    h === hour
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-foreground hover:bg-accent"
                  )}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Minuty</p>
            <div className="grid grid-cols-4 gap-1">
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMinute(m); setOpen(false); }}
                  className={cn(
                    "h-8 rounded-md text-xs font-semibold tabular-nums transition-colors",
                    m === minute
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-foreground hover:bg-accent"
                  )}
                >
                  :{String(m).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface TimeRangePickerProps {
  start: number;
  end: number;
  onStartChange: (v: number) => void;
  onEndChange: (v: number) => void;
  showDurations?: boolean;
}

export function TimeRangePicker({ start, end, onStartChange, onEndChange, showDurations = true }: TimeRangePickerProps) {
  const duration = end - start;

  const handleStartChange = (v: number) => {
    onStartChange(v);
    if (end <= v) onEndChange(Math.min(v + Math.max(duration, 1), 24));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <TimeButton value={start} onChange={handleStartChange} label="Od" className="flex-1" />
        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
        <TimeButton value={end} onChange={onEndChange} label="Do" className="flex-1" />
      </div>
      {showDurations && (
        <div className="flex flex-wrap gap-1">
          {DURATIONS.map((d) => {
            const active = Math.abs(duration - d.value) < 0.01;
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => onEndChange(Math.min(start + d.value, 24))}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
