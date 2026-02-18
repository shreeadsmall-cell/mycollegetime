import { useState } from "react";
import { Lecture, DayOfWeek } from "@/hooks/useTimetable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface AddLectureFormProps {
  onAdd: (lecture: Omit<Lecture, "id">) => void;
  onClose?: () => void;
  defaultDay?: DayOfWeek;
  initial?: Lecture;
  onUpdate?: (updates: Partial<Omit<Lecture, "id">>) => void;
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="start" className="text-sm font-medium text-foreground mb-1 block">Start Time</Label>
          <Input
            id="start"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="h-12 text-base bg-background border-border"
          />
        </div>
        <div>
          <Label htmlFor="end" className="text-sm font-medium text-foreground mb-1 block">End Time</Label>
          <Input
            id="end"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="h-12 text-base bg-background border-border"
          />
        </div>
      </div>

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
