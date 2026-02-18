import { useState } from "react";
import { Lecture, DayOfWeek } from "@/hooks/useTimetable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")); // 01–12
const MINUTES = ["00", "15", "30", "45"];

interface AddLectureFormProps {
  onAdd: (lecture: Omit<Lecture, "id">) => void;
  onClose?: () => void;
  defaultDay?: DayOfWeek;
  initial?: Lecture;
  onUpdate?: (updates: Partial<Omit<Lecture, "id">>) => void;
}

/** Convert "HH:mm" 24h to { hour12, minute, ampm } */
function from24(time24: string): { hour: string; minute: string; ampm: "AM" | "PM" } {
  const [h, m] = time24.split(":").map(Number);
  const ampm: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return { hour: String(hour12).padStart(2, "0"), minute: String(m).padStart(2, "0"), ampm };
}

/** Convert { hour12, minute, ampm } to "HH:mm" 24h */
function to24(hour: string, minute: string, ampm: "AM" | "PM"): string {
  let h = parseInt(hour);
  if (ampm === "AM" && h === 12) h = 0;
  if (ampm === "PM" && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:${minute}`;
}

function TimeSelector({
  label,
  id,
  value,
  onChange,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const parsed = from24(value);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [ampm, setAmpm] = useState<"AM" | "PM">(parsed.ampm);

  const update = (h: string, m: string, ap: "AM" | "PM") => {
    onChange(to24(h, m, ap));
  };

  return (
    <div>
      <Label htmlFor={id} className="text-sm font-medium text-foreground mb-1 block">{label}</Label>
      <div className="flex gap-1.5">
        {/* Hour */}
        <Select
          value={hour}
          onValueChange={(v) => { setHour(v); update(v, minute, ampm); }}
        >
          <SelectTrigger className="h-12 flex-1 text-base bg-background border-border">
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent>
            {HOURS.map((h) => (
              <SelectItem key={h} value={h}>{h}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="flex items-center text-foreground font-bold text-lg">:</span>

        {/* Minute */}
        <Select
          value={minute}
          onValueChange={(v) => { setMinute(v); update(hour, v, ampm); }}
        >
          <SelectTrigger className="h-12 flex-1 text-base bg-background border-border">
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent>
            {MINUTES.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* AM/PM */}
        <div className="flex rounded-lg overflow-hidden border border-border h-12">
          {(["AM", "PM"] as const).map((ap) => (
            <button
              key={ap}
              type="button"
              onClick={() => { setAmpm(ap); update(hour, minute, ap); }}
              className={`flex-1 px-3 text-sm font-bold transition-colors ${
                ampm === ap
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {ap}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AddLectureForm({ onAdd, onClose, defaultDay, initial, onUpdate }: AddLectureFormProps) {
  const [day, setDay] = useState<DayOfWeek>(initial?.day ?? defaultDay ?? "Monday");
  const [name, setName] = useState(initial?.name ?? "");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "10:00");
  const [type, setType] = useState<"Lecture" | "Break">(initial?.type ?? "Lecture");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Please enter a lecture name."); return; }
    if (!startTime || !endTime) { setError("Please enter start and end times."); return; }
    if (startTime >= endTime) { setError("End time must be after start time."); return; }

    if (initial && onUpdate) {
      onUpdate({ day, name: name.trim(), startTime, endTime, type });
    } else {
      onAdd({ day, name: name.trim(), startTime, endTime, type });
    }
    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-foreground">
          {initial ? "Edit Entry" : "Add to Timetable"}
        </h2>
        {onClose && (
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
            <X size={20} />
          </button>
        )}
      </div>

      <div>
        <Label htmlFor="day" className="text-sm font-medium text-foreground mb-1 block">Day</Label>
        <Select value={day} onValueChange={(v) => setDay(v as DayOfWeek)}>
          <SelectTrigger className="h-12 text-base bg-background border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="name" className="text-sm font-medium text-foreground mb-1 block">
          {type === "Break" ? "Break Label" : "Lecture / Subject Name"}
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={type === "Break" ? "e.g. Lunch Break" : "e.g. Mathematics"}
          className="h-12 text-base bg-background border-border"
        />
      </div>

      <TimeSelector label="Start Time" id="start" value={startTime} onChange={setStartTime} />
      <TimeSelector label="End Time" id="end" value={endTime} onChange={setEndTime} />

      <div>
        <Label className="text-sm font-medium text-foreground mb-1 block">Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["Lecture", "Break"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`h-12 rounded-lg border-2 text-base font-medium transition-colors ${
                type === t
                  ? t === "Lecture"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-[hsl(var(--break))] bg-[hsl(var(--break-bg))] text-[hsl(var(--break))]"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground">
        {initial ? "Save Changes" : "Add to Timetable"}
      </Button>
    </form>
  );
}
