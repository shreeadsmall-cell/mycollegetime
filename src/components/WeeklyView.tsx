import { useState } from "react";
import { useTimetable, DayOfWeek } from "@/hooks/useTimetable";
import { LectureCard } from "@/components/LectureCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChevronLeft, ChevronRight, Plus, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface WeeklyViewProps {
  onAddLecture: () => void;
  onBack: () => void;
  userId?: string | null;
}

export function WeeklyView({ onAddLecture, onBack, userId }: WeeklyViewProps) {
  const { getDaySchedule, updateLecture, deleteLecture } = useTimetable(userId);

  const todayIndex = (() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  })();

  const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex);
  const selectedDay = DAYS[selectedDayIndex];
  const schedule = getDaySchedule(selectedDay);

  const prev = () => setSelectedDayIndex((i) => (i - 1 + 7) % 7);
  const next = () => setSelectedDayIndex((i) => (i + 1) % 7);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      <div className="bg-primary text-primary-foreground px-4 pt-10 pb-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-lg bg-primary-foreground/10 text-primary-foreground">
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">Weekly Timetable</h1>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-between">
          <button onClick={prev} className="p-2 rounded-lg bg-primary-foreground/10 text-primary-foreground">
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <p className="text-lg font-bold">{selectedDay}</p>
            {selectedDayIndex === todayIndex && (
              <span className="text-xs bg-primary-foreground/20 px-2 py-0.5 rounded-full">Today</span>
            )}
          </div>
          <button onClick={next} className="p-2 rounded-lg bg-primary-foreground/10 text-primary-foreground">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="flex gap-1.5 px-4 py-3 overflow-x-auto bg-card border-b border-border no-scrollbar">
        {DAYS.map((day, i) => (
          <button
            key={day}
            onClick={() => setSelectedDayIndex(i)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              i === selectedDayIndex
                ? "bg-primary text-primary-foreground"
                : i === todayIndex
                ? "bg-accent/20 text-accent border border-accent"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="flex-1 px-4 py-4">
        {schedule.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <p className="text-base font-medium">No lectures on {selectedDay}</p>
            <p className="text-sm mt-1 opacity-70">Tap "Add Lecture" to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {schedule.map((entry) => (
              <LectureCard
                key={entry.id}
                entry={entry}
                variant={entry.isFree ? "free" : entry.type === "Break" ? "break" : "default"}
                onEdit={!entry.isFree ? (updates) => updateLecture(entry.id, updates) : undefined}
                onDelete={!entry.isFree ? () => deleteLecture(entry.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 flex gap-2">
        <Button onClick={onAddLecture} className="flex-1 h-12 gap-2 font-semibold text-base bg-primary text-primary-foreground">
          <Plus size={18} /> Add Lecture
        </Button>
        <Button onClick={onBack} variant="outline" className="h-12 px-4 text-foreground border-border">
          <LayoutDashboard size={18} />
        </Button>
      </div>
    </div>
  );
}
