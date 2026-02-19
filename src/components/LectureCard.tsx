import { useState } from "react";
import { ScheduleEntry } from "@/hooks/useTimetable";
import { Clock, BookOpen, Coffee, Zap, Pencil, Trash2, Sunrise } from "lucide-react";
import { AddLectureForm } from "@/components/AddLectureForm";
import { Lecture } from "@/hooks/useTimetable";

interface LectureCardProps {
  entry: ScheduleEntry;
  variant: "current" | "upcoming" | "break" | "free" | "default";
  onEdit?: (updates: Partial<Omit<Lecture, "id">>) => void;
  onDelete?: () => void;
  compact?: boolean;
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function getDuration(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function LectureCard({ entry, variant, onEdit, onDelete, compact }: LectureCardProps) {
  const [editing, setEditing] = useState(false);

  const cardClass = {
    current: "card-current border-2",
    upcoming: "card-upcoming border",
    break: "card-break border",
    free: "card-free border border-dashed",
    default: "bg-card border",
  }[variant];

  const Icon =
    entry.isFree ? Sunrise :
    entry.type === "Break" ? Coffee :
    BookOpen;

  const iconColor = {
    current: "text-current",
    upcoming: "text-primary",
    break: "text-break-color",
    free: "text-free",
    default: "text-muted-foreground",
  }[variant];

  const labelColor = {
    current: "text-current",
    upcoming: "text-primary",
    break: "text-break-color",
    free: "text-free",
    default: "text-muted-foreground",
  }[variant];

  const label = {
    current: "NOW",
    upcoming: "UPCOMING",
    break: "☕ BREAK",
    free: "✦ FREE PERIOD",
    default: "",
  }[variant];

  if (editing && onEdit) {
    return (
      <div className="bg-card border-2 border-primary rounded-xl p-4 shadow-sm">
        <AddLectureForm
          onAdd={() => {}}
          onClose={() => setEditing(false)}
          defaultDay={entry.day}
          initial={entry}
          onUpdate={(updates) => { onEdit(updates); setEditing(false); }}
        />
      </div>
    );
  }

  /* ── Break card ── */
  if (variant === "break") {
    return (
      <div className="card-break border rounded-xl px-4 py-3 shadow-sm flex items-center gap-3">
        <div className="shrink-0">
          <div className="w-9 h-9 rounded-full bg-[hsl(var(--break))]/15 flex items-center justify-center">
            <Coffee size={18} className="text-break-color" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold tracking-widest text-break-color block mb-0.5">☕ BREAK</span>
          <p className={`font-semibold text-foreground ${compact ? "text-sm" : "text-base"} truncate`}>
            {entry.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatTime(entry.startTime)} – {formatTime(entry.endTime)}
            <span className="ml-2 opacity-70">({getDuration(entry.startTime, entry.endTime)})</span>
          </p>
        </div>
        {(onEdit || onDelete) && (
          <div className="flex gap-1 shrink-0">
            {onEdit && (
              <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground" aria-label="Edit">
                <Pencil size={14} />
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive" aria-label="Delete">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ── Free period card ── */
  if (variant === "free") {
    return (
      <div className="card-free border border-dashed rounded-xl px-4 py-3 shadow-sm flex items-center gap-3">
        <div className="shrink-0">
          <div className="w-9 h-9 rounded-full bg-[hsl(var(--free))]/15 flex items-center justify-center">
            <Sunrise size={18} className="text-free" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold tracking-widest text-free block mb-0.5">✦ FREE PERIOD</span>
          <p className={`font-medium text-muted-foreground ${compact ? "text-sm" : "text-base"} truncate`}>
            {getDuration(entry.startTime, entry.endTime)} gap
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatTime(entry.startTime)} – {formatTime(entry.endTime)}
          </p>
        </div>
      </div>
    );
  }

  /* ── Default / current / upcoming card ── */
  return (
    <div className={`${cardClass} rounded-xl p-4 shadow-sm`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`mt-0.5 ${iconColor}`}>
            <Icon size={18} />
          </div>
          <div className="flex-1 min-w-0">
            {label && (
              <span className={`text-xs font-bold tracking-widest ${labelColor} block mb-0.5`}>
                {label}
              </span>
            )}
            <p className={`font-semibold text-foreground ${compact ? "text-sm" : "text-base"} truncate`}>
              {entry.name}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {formatTime(entry.startTime)} – {formatTime(entry.endTime)}
              <span className="ml-2 text-xs">({getDuration(entry.startTime, entry.endTime)})</span>
            </p>
          </div>
        </div>

        {!entry.isFree && (onEdit || onDelete) && (
          <div className="flex gap-1 shrink-0">
            {onEdit && (
              <button
                onClick={() => setEditing(true)}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
                aria-label="Edit"
              >
                <Pencil size={15} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
                aria-label="Delete"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        )}
      </div>

      {variant === "current" && !compact && (
        <div className="mt-3">
          <div className="h-1.5 bg-card rounded-full overflow-hidden">
            <div
              className="h-full bg-[hsl(var(--current))] rounded-full transition-all"
              style={{
                width: `${Math.min(100, Math.max(0,
                  ((new Date().getHours() * 60 + new Date().getMinutes()) -
                    (parseInt(entry.startTime) * 60 + parseInt(entry.startTime.split(":")[1]))) /
                  ((parseInt(entry.endTime) * 60 + parseInt(entry.endTime.split(":")[1])) -
                    (parseInt(entry.startTime) * 60 + parseInt(entry.startTime.split(":")[1]))) * 100
                ))}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
