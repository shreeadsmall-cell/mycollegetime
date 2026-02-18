import { useState, useEffect } from "react";
import { useTimetable, ScheduleEntry } from "@/hooks/useTimetable";
import { LectureCard } from "@/components/LectureCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Clock, CalendarDays, Plus, RotateCcw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardProps {
  onAddLecture: () => void;
  onReset: () => void;
  onViewWeekly: () => void;
  onExport: () => void;
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function Dashboard({ onAddLecture, onReset, onViewWeekly, onExport }: DashboardProps) {
  const { getTodaySchedule, getCurrentLecture, getUpcomingLectures, updateLecture, deleteLecture } = useTimetable();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const current = getCurrentLecture();
  const upcoming = getUpcomingLectures();
  const todaySchedule = getTodaySchedule();

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = days[now.getDay()];
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const getVariant = (entry: ScheduleEntry): "current" | "upcoming" | "break" | "free" | "default" => {
    if (entry.isFree) return "free";
    if (entry.type === "Break") return "break";
    return "default";
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-10 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm opacity-80">{getGreeting()} 👋</p>
            <h1 className="text-2xl font-bold mt-0.5">Your Schedule</h1>
            <div className="flex items-center gap-2 mt-2 opacity-80">
              <Clock size={14} />
              <span className="text-sm">{todayName} • {timeStr}</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="flex-1 px-4 -mt-4 space-y-4">
        {/* Current Lecture */}
        <div>
          {current ? (
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 mt-5">
                Happening Now
              </p>
              <LectureCard
                entry={current}
                variant={current.isFree ? "free" : current.type === "Break" ? "break" : "current"}
                onEdit={!current.isFree ? (updates) => updateLecture(current.id, updates) : undefined}
                onDelete={!current.isFree ? () => deleteLecture(current.id) : undefined}
              />
            </div>
          ) : (
            <div className="mt-5 bg-card border rounded-xl p-4 text-center text-muted-foreground">
              <Clock size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No lecture right now</p>
              <p className="text-xs mt-1 opacity-70">Enjoy your free time!</p>
            </div>
          )}
        </div>

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
              Coming Up
            </p>
            <div className="space-y-2">
              {upcoming.slice(0, 3).map((entry) => (
                <LectureCard
                  key={entry.id}
                  entry={entry}
                  variant={entry.isFree ? "free" : entry.type === "Break" ? "break" : "upcoming"}
                  onEdit={!entry.isFree ? (updates) => updateLecture(entry.id, updates) : undefined}
                  onDelete={!entry.isFree ? () => deleteLecture(entry.id) : undefined}
                  compact
                />
              ))}
            </div>
          </div>
        )}

        {/* Today's full schedule */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Today's Full Schedule
          </p>
          {todaySchedule.length === 0 ? (
            <div className="bg-card border rounded-xl p-6 text-center text-muted-foreground">
              <CalendarDays size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No classes today</p>
              <p className="text-xs mt-1 opacity-70">Add lectures to see your schedule</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todaySchedule.map((entry) => (
                <LectureCard
                  key={entry.id}
                  entry={entry}
                  variant={getVariant(entry)}
                  onEdit={!entry.isFree ? (updates) => updateLecture(entry.id, updates) : undefined}
                  onDelete={!entry.isFree ? () => deleteLecture(entry.id) : undefined}
                  compact
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 flex gap-2">
        <Button
          onClick={onAddLecture}
          className="flex-1 h-12 gap-2 font-semibold text-base bg-primary text-primary-foreground"
        >
          <Plus size={18} /> Add Lecture
        </Button>
        <Button onClick={onViewWeekly} variant="outline" className="h-12 px-4 text-foreground border-border">
          <CalendarDays size={18} />
        </Button>
        <Button onClick={onExport} variant="outline" className="h-12 px-4 text-foreground border-border">
          <Download size={18} />
        </Button>
        <Button onClick={onReset} variant="outline" className="h-12 px-4 text-destructive border-border">
          <RotateCcw size={18} />
        </Button>
      </div>
    </div>
  );
}
