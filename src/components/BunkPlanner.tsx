import { useState, useMemo } from "react";
import { useAttendance, SubjectAttendance } from "@/hooks/useAttendance";
import { useTimetable, DayOfWeek, Lecture } from "@/hooks/useTimetable";
import { ArrowLeft, CalendarClock, Check, X, AlertTriangle, TrendingUp, Shield, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BunkPlannerProps {
  onBack: () => void;
  userId?: string | null;
}

const DAYS_ORDER: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getDayIndex(day: DayOfWeek): number {
  return DAYS_ORDER.indexOf(day);
}

function getUpcomingDays(): DayOfWeek[] {
  const today = new Date().getDay(); // 0=Sun
  const todayIdx = today === 0 ? 6 : today - 1; // convert to Mon=0
  const result: DayOfWeek[] = [];
  for (let i = 0; i < 7; i++) {
    result.push(DAYS_ORDER[(todayIdx + i) % 7]);
  }
  return result;
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

interface SimLecture {
  id: string;
  day: DayOfWeek;
  name: string;
  startTime: string;
  endTime: string;
  decision: "attend" | "bunk" | null;
}

export function BunkPlanner({ onBack, userId }: BunkPlannerProps) {
  const { data, hasData, getAnalysis } = useAttendance();
  const { lectures } = useTimetable(userId);
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  // Get unique lecture subjects from timetable that match attendance subjects
  const subjectNames = useMemo(() => {
    const timetableNames = [...new Set(lectures.filter(l => l.type === "Lecture").map(l => l.name))];
    const attendanceNames = data.subjects.map(s => s.subject);
    // Show all timetable subjects, highlight ones with attendance data
    return timetableNames.length > 0 ? timetableNames : attendanceNames;
  }, [lectures, data.subjects]);

  // Auto-select first subject
  const activeSubject = selectedSubject || subjectNames[0] || "";

  // Get upcoming lectures for selected subject
  const upcomingLectures = useMemo((): SimLecture[] => {
    if (!activeSubject) return [];
    const days = getUpcomingDays();
    const result: SimLecture[] = [];
    for (const day of days) {
      const dayLectures = lectures
        .filter(l => l.type === "Lecture" && l.name === activeSubject && l.day === day)
        .sort((a, b) => {
          const toM = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
          return toM(a.startTime) - toM(b.startTime);
        });
      for (const l of dayLectures) {
        result.push({ id: l.id, day: l.day, name: l.name, startTime: l.startTime, endTime: l.endTime, decision: null });
      }
    }
    return result;
  }, [activeSubject, lectures]);

  const [decisions, setDecisions] = useState<Record<string, "attend" | "bunk">>({});

  const toggleDecision = (id: string, val: "attend" | "bunk") => {
    setDecisions(prev => {
      if (prev[id] === val) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: val };
    });
  };

  // Find attendance data for active subject
  const subjectAttendance = useMemo((): SubjectAttendance | null => {
    return data.subjects.find(s => s.subject === activeSubject) || null;
  }, [activeSubject, data.subjects]);

  // Calculate predicted attendance
  const prediction = useMemo(() => {
    if (!subjectAttendance) return null;
    let attended = subjectAttendance.attendedLectures;
    let total = subjectAttendance.totalLectures;
    const required = data.requiredPercentage;

    // Apply all decisions
    for (const lec of upcomingLectures) {
      const d = decisions[lec.id];
      if (d === "attend") {
        attended += 1;
        total += 1;
      } else if (d === "bunk") {
        total += 1;
      }
    }

    const percentage = total > 0 ? Math.round((attended / total) * 1000) / 10 : 0;
    const status: "safe" | "risk" | "critical" =
      percentage >= required ? "safe" : percentage >= required - 5 ? "risk" : "critical";

    return { attended, total, percentage, status, required };
  }, [subjectAttendance, decisions, upcomingLectures, data.requiredPercentage]);

  // Smart summary messages
  const smartMessages = useMemo(() => {
    if (!subjectAttendance) return [];
    const msgs: string[] = [];
    const required = data.requiredPercentage;
    const { attendedLectures, totalLectures, subject } = subjectAttendance;

    // Calculate how many can be bunked
    let canBunk = 0;
    while (canBunk < 20) {
      if ((attendedLectures / (totalLectures + canBunk + 1)) * 100 < required) break;
      canBunk++;
    }

    if (canBunk > 0) {
      msgs.push(`You can safely bunk ${canBunk} more ${subject} lecture${canBunk > 1 ? "s" : ""}.`);
    } else {
      // How many must attend
      let mustAttend = 0;
      while (mustAttend < 100) {
        mustAttend++;
        if (((attendedLectures + mustAttend) / (totalLectures + mustAttend)) * 100 >= required) break;
      }
      msgs.push(`Attend the next ${mustAttend} ${subject} lecture${mustAttend > 1 ? "s" : ""} to reach safe attendance.`);
    }

    // Projection if bunk next
    const projectedBunk = totalLectures > 0
      ? Math.round((attendedLectures / (totalLectures + 1)) * 1000) / 10
      : 0;
    if (projectedBunk < required) {
      msgs.push(`If you bunk the next ${subject} lecture, attendance will drop to ${projectedBunk}%.`);
    }

    return msgs;
  }, [subjectAttendance, data.requiredPercentage]);

  // Dashboard summary: safe bunks for today
  const safeBunksToday = useMemo(() => {
    let count = 0;
    const todayIdx = new Date().getDay();
    const todayName = todayIdx === 0 ? "Sunday" : DAYS_ORDER[todayIdx - 1];
    
    for (const subj of data.subjects) {
      const todayLectures = lectures.filter(l => l.type === "Lecture" && l.name === subj.subject && l.day === todayName);
      if (todayLectures.length === 0) continue;
      let canBunk = 0;
      while (canBunk < todayLectures.length) {
        if ((subj.attendedLectures / (subj.totalLectures + canBunk + 1)) * 100 < data.requiredPercentage) break;
        canBunk++;
      }
      count += canBunk;
    }
    return count;
  }, [data, lectures]);

  const statusConfig = {
    safe: { color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: Shield, label: "Safe" },
    risk: { color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: AlertTriangle, label: "At Risk" },
    critical: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: Zap, label: "Critical" },
  };

  if (!hasData) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-24">
        <div className="bg-primary text-primary-foreground px-4 pt-10 pb-6">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <CalendarClock size={20} /> Bunk Planner
              </h1>
              <p className="text-xs opacity-80 mt-0.5">Simulate safe bunks</p>
            </div>
          </div>
        </div>
        <div className="flex-1 px-4 mt-4">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle size={32} className="mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-sm font-medium text-foreground">No attendance data</p>
              <p className="text-xs text-muted-foreground mt-1">Add your attendance data first to use the Bunk Planner.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-10 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <CalendarClock size={20} /> Bunk Planner
            </h1>
            <p className="text-xs opacity-80 mt-0.5">Simulate attendance before you skip</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 -mt-4 space-y-4">
        {/* Subject selector */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {subjectNames.map(name => (
            <button
              key={name}
              onClick={() => { setSelectedSubject(name); setDecisions({}); }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                name === activeSubject
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Smart summary */}
        {smartMessages.length > 0 && (
          <Card>
            <CardContent className="p-3 space-y-1.5">
              {smartMessages.map((msg, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <TrendingUp size={14} className="text-primary mt-0.5 shrink-0" />
                  <span className="text-foreground">{msg}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Prediction badge */}
        {prediction && (
          <div className={`flex items-center justify-between p-3 rounded-xl border ${statusConfig[prediction.status].color}`}>
            <div className="flex items-center gap-2">
              {(() => { const Icon = statusConfig[prediction.status].icon; return <Icon size={18} />; })()}
              <div>
                <p className="text-sm font-bold">{prediction.percentage}%</p>
                <p className="text-[10px] opacity-80">
                  {prediction.attended}/{prediction.total} lectures
                </p>
              </div>
            </div>
            <Badge variant="outline" className={statusConfig[prediction.status].color}>
              {statusConfig[prediction.status].label}
            </Badge>
          </div>
        )}

        {/* Upcoming lectures */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Upcoming {activeSubject} Lectures
          </p>
          {upcomingLectures.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                No upcoming lectures found for this subject in your timetable.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {upcomingLectures.map(lec => {
                const decision = decisions[lec.id];
                return (
                  <Card key={lec.id + lec.day}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">{lec.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {lec.day} • {formatTime(lec.startTime)} – {formatTime(lec.endTime)}
                          </p>
                        </div>
                        <div className="flex gap-1.5 ml-2">
                          <button
                            onClick={() => toggleDecision(lec.id + lec.day, "attend")}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              decision === "attend"
                                ? "bg-emerald-500 text-white shadow-sm"
                                : "bg-secondary text-secondary-foreground hover:bg-emerald-500/10"
                            }`}
                          >
                            <Check size={12} /> Attend
                          </button>
                          <button
                            onClick={() => toggleDecision(lec.id + lec.day, "bunk")}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              decision === "bunk"
                                ? "bg-destructive text-destructive-foreground shadow-sm"
                                : "bg-secondary text-secondary-foreground hover:bg-destructive/10"
                            }`}
                          >
                            <X size={12} /> Bunk
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export for dashboard use
export function useBunkInsight(subjects: SubjectAttendance[], lectures: Lecture[], requiredPct: number) {
  return useMemo(() => {
    const todayIdx = new Date().getDay();
    const todayName = todayIdx === 0 ? "Sunday" : DAYS_ORDER[todayIdx - 1];
    let count = 0;
    for (const subj of subjects) {
      const todayLectures = lectures.filter(l => l.type === "Lecture" && l.name === subj.subject && l.day === todayName);
      if (todayLectures.length === 0) continue;
      let canBunk = 0;
      while (canBunk < todayLectures.length) {
        if ((subj.attendedLectures / (subj.totalLectures + canBunk + 1)) * 100 < requiredPct) break;
        canBunk++;
      }
      count += canBunk;
    }
    return count;
  }, [subjects, lectures, requiredPct]);
}
