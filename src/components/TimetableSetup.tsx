import { useState } from "react";
import { useTimetable, DayOfWeek } from "@/hooks/useTimetable";
import { AddLectureForm } from "@/components/AddLectureForm";
import { LectureCard } from "@/components/LectureCard";
import { BookOpen, Plus, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface TimetableSetupProps {
  onDone: () => void;
}

export function TimetableSetup({ onDone }: TimetableSetupProps) {
  const { lectures, addLecture, deleteLecture, updateLecture } = useTimetable();
  const [showForm, setShowForm] = useState(false);
  const [activeDay, setActiveDay] = useState<DayOfWeek>("Monday");

  const dayLectures = lectures
    .filter((l) => l.day === activeDay)
    .sort((a, b) => {
      const toMins = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
      return toMins(a.startTime) - toMins(b.startTime);
    });

  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      {/* Hero */}
      <div className="bg-primary text-primary-foreground px-4 pt-12 pb-8">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={22} />
          <span className="font-bold text-lg tracking-tight">CollegeTime</span>
        </div>
        <h1 className="text-2xl font-bold leading-tight mt-2">Set up your<br />weekly timetable</h1>
        <p className="text-sm opacity-75 mt-2">Add your lectures, breaks, and free periods for each day.</p>
      </div>

      {/* Stats */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {lectures.length} {lectures.length === 1 ? "entry" : "entries"} added
        </span>
        {lectures.length > 0 && (
          <button
            onClick={onDone}
            className="flex items-center gap-1 text-sm font-semibold text-primary"
          >
            View Dashboard <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* Day tabs */}
      <div className="flex gap-1.5 px-4 py-3 overflow-x-auto no-scrollbar bg-background border-b border-border">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => { setActiveDay(day); setShowForm(false); }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              day === activeDay
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-3">
        {/* Form */}
        {showForm && (
          <div className="bg-card border rounded-xl p-4 shadow-sm">
            <AddLectureForm
              onAdd={(lecture) => { addLecture(lecture); setShowForm(false); }}
              onClose={() => setShowForm(false)}
              defaultDay={activeDay}
            />
          </div>
        )}

        {/* Lectures for day */}
        {dayLectures.length === 0 && !showForm && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Sparkles size={32} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No entries for {activeDay}</p>
            <p className="text-xs opacity-60 mt-1">Tap "Add Entry" below to begin</p>
          </div>
        )}

        {dayLectures.map((lecture) => (
          <LectureCard
            key={lecture.id}
            entry={lecture}
            variant={lecture.type === "Break" ? "break" : "default"}
            onEdit={(updates) => updateLecture(lecture.id, updates)}
            onDelete={() => deleteLecture(lecture.id)}
          />
        ))}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 space-y-2">
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="w-full h-12 gap-2 font-semibold text-base bg-primary text-primary-foreground"
          >
            <Plus size={18} /> Add Entry for {activeDay}
          </Button>
        )}
        {lectures.length > 0 && (
          <Button
            onClick={onDone}
            variant="outline"
            className="w-full h-12 gap-2 font-semibold text-base text-foreground border-border"
          >
            Go to Dashboard <ArrowRight size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}
