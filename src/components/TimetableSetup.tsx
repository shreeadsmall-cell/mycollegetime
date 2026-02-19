import { useState, useRef } from "react";
import { useTimetable, DayOfWeek, Lecture } from "@/hooks/useTimetable";
import { AddLectureForm } from "@/components/AddLectureForm";
import { LectureCard } from "@/components/LectureCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TimetableUpload } from "@/components/TimetableUpload";
import { BookOpen, Plus, ArrowRight, Sparkles, GripVertical, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface TimetableSetupProps {
  onDone: () => void;
  userId?: string | null;
}

export function TimetableSetup({ onDone, userId }: TimetableSetupProps) {
  const { lectures, addLecture, deleteLecture, updateLecture, resetTimetable } = useTimetable(userId);
  const [showForm, setShowForm] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [activeDay, setActiveDay] = useState<DayOfWeek>("Monday");

  // Drag state
  const dragIndex = useRef<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const dayLectures = lectures
    .filter((l) => l.day === activeDay)
    .sort((a, b) => {
      const toMins = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
      return toMins(a.startTime) - toMins(b.startTime);
    });

  const handleDragStart = (index: number) => {
    dragIndex.current = index;
    setDragActive(true);
  };

  const handleDragEnter = (index: number) => {
    dragOverIndex.current = index;
  };

  const handleDragEnd = () => {
    const from = dragIndex.current;
    const to = dragOverIndex.current;

    if (from !== null && to !== null && from !== to) {
      // Swap start/end times between the two lectures to "reorder" them
      const moved = dayLectures[from];
      const target = dayLectures[to];

      // Shift all times: simple swap of startTime/endTime between the two
      const movedDuration = calcDuration(moved);
      const targetDuration = calcDuration(target);

      // Assign the target's startTime to moved, recalc end; and vice versa
      const newMovedStart = target.startTime;
      const newMovedEnd = addMinutes(newMovedStart, movedDuration);
      const newTargetStart = newMovedEnd;
      const newTargetEnd = addMinutes(newTargetStart, targetDuration);

      updateLecture(moved.id, { startTime: newMovedStart, endTime: newMovedEnd });
      updateLecture(target.id, { startTime: newTargetStart, endTime: newTargetEnd });
    }

    dragIndex.current = null;
    dragOverIndex.current = null;
    setDragActive(false);
  };

  function calcDuration(l: Lecture): number {
    const [sh, sm] = l.startTime.split(":").map(Number);
    const [eh, em] = l.endTime.split(":").map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  }

  function addMinutes(time: string, mins: number): string {
    const [h, m] = time.split(":").map(Number);
    const total = h * 60 + m + mins;
    const rh = Math.floor(total / 60) % 24;
    const rm = total % 60;
    return `${String(rh).padStart(2, "0")}:${String(rm).padStart(2, "0")}`;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      {/* Hero */}
      <div className="bg-primary text-primary-foreground px-4 pt-12 pb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BookOpen size={22} />
            <span className="font-bold text-lg tracking-tight">CollegeTime</span>
          </div>
          <ThemeToggle />
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
        {/* Upload panel */}
        {showUpload && !showForm && (
          <div className="bg-card border rounded-xl p-4 shadow-sm">
            <TimetableUpload
              onImport={(entries) => {
                entries.forEach((e) => addLecture(e));
                setShowUpload(false);
              }}
              onClose={() => setShowUpload(false)}
            />
          </div>
        )}

        {/* Form */}
        {showForm && !showUpload && (
          <div className="bg-card border rounded-xl p-4 shadow-sm">
            <AddLectureForm
              onAdd={(lecture) => { addLecture(lecture); setShowForm(false); }}
              onClose={() => setShowForm(false)}
              defaultDay={activeDay}
            />
          </div>
        )}

        {/* Drag hint */}
        {dayLectures.length > 1 && !showForm && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <GripVertical size={12} /> Drag entries to reorder
          </p>
        )}

        {/* Lectures for day */}
        {dayLectures.length === 0 && !showForm && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Sparkles size={32} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No entries for {activeDay}</p>
            <p className="text-xs opacity-60 mt-1">Tap "Add Entry" below to begin</p>
          </div>
        )}

        {dayLectures.map((lecture, index) => (
          <div
            key={lecture.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={`flex items-stretch gap-2 transition-opacity ${
              dragActive && dragIndex.current === index ? "opacity-40" : "opacity-100"
            }`}
          >
            {/* Drag handle */}
            <div className="flex items-center px-1 cursor-grab active:cursor-grabbing text-muted-foreground touch-none">
              <GripVertical size={18} />
            </div>
            <div className="flex-1">
              <LectureCard
                entry={lecture}
                variant={lecture.type === "Break" ? "break" : "default"}
                onEdit={(updates) => updateLecture(lecture.id, updates)}
                onDelete={() => deleteLecture(lecture.id)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 space-y-2">
        {!showForm && !showUpload && (
          <>
            <Button
              onClick={() => setShowForm(true)}
              className="w-full h-12 gap-2 font-semibold text-base bg-primary text-primary-foreground"
            >
              <Plus size={18} /> Add Entry for {activeDay}
            </Button>
            <Button
              onClick={() => setShowUpload(true)}
              variant="outline"
              className="w-full h-12 gap-2 font-semibold text-base border-border text-foreground"
            >
              <Upload size={16} /> Import from Photo / PDF
            </Button>
          </>
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
