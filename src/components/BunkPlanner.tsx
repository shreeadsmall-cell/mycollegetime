import { useState, useMemo } from "react";
import { useAttendance, SubjectAttendance } from "@/hooks/useAttendance";
import { useTimetable, DayOfWeek, Lecture } from "@/hooks/useTimetable";
import {
  ArrowLeft, CalendarClock, Check, X, AlertTriangle, TrendingUp,
  Shield, Zap, Info, ChevronRight, RotateCcw
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface BunkPlannerProps {
  onBack: () => void;
  userId?: string | null;
}

const DAYS_ORDER: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getUpcomingDays(): DayOfWeek[] {
  const today = new Date().getDay();
  const todayIdx = today === 0 ? 6 : today - 1;
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
}

export function BunkPlanner({ onBack, userId }: BunkPlannerProps) {
  const { data, hasData, getAnalysis } = useAttendance();
  const { lectures } = useTimetable(userId);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [decisions, setDecisions] = useState<Record<string, "attend" | "bunk">>({});

  const subjectNames = useMemo(() => {
    const timetableNames = [...new Set(lectures.filter(l => l.type === "Lecture").map(l => l.name))];
    const attendanceNames = data.subjects.map(s => s.subject);
    return timetableNames.length > 0 ? timetableNames : attendanceNames;
  }, [lectures, data.subjects]);

  const activeSubject = selectedSubject || subjectNames[0] || "";

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
        result.push({ id: `${l.id}-${l.day}`, day: l.day, name: l.name, startTime: l.startTime, endTime: l.endTime });
      }
    }
    return result;
  }, [activeSubject, lectures]);

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

  const resetDecisions = () => setDecisions({});

  const subjectAttendance = useMemo((): SubjectAttendance | null => {
    return data.subjects.find(s => s.subject === activeSubject) || null;
  }, [activeSubject, data.subjects]);

  const prediction = useMemo(() => {
    if (!subjectAttendance) return null;
    let attended = subjectAttendance.attendedLectures;
    let total = subjectAttendance.totalLectures;
    const required = data.requiredPercentage;

    let attendCount = 0;
    let bunkCount = 0;

    for (const lec of upcomingLectures) {
      const d = decisions[lec.id];
      if (d === "attend") { attended += 1; total += 1; attendCount++; }
      else if (d === "bunk") { total += 1; bunkCount++; }
    }

    const percentage = total > 0 ? Math.round((attended / total) * 1000) / 10 : 0;
    const status: "safe" | "risk" | "critical" =
      percentage >= required ? "safe" : percentage >= required - 5 ? "risk" : "critical";

    return { attended, total, percentage, status, required, attendCount, bunkCount };
  }, [subjectAttendance, decisions, upcomingLectures, data.requiredPercentage]);

  const currentPercentage = subjectAttendance
    ? (subjectAttendance.totalLectures > 0
      ? Math.round((subjectAttendance.attendedLectures / subjectAttendance.totalLectures) * 1000) / 10
      : 0)
    : 0;

  const smartMessages = useMemo(() => {
    if (!subjectAttendance) return [];
    const msgs: { text: string; type: "success" | "warning" | "danger" }[] = [];
    const required = data.requiredPercentage;
    const { attendedLectures, totalLectures, subject } = subjectAttendance;

    let canBunk = 0;
    while (canBunk < 20) {
      if ((attendedLectures / (totalLectures + canBunk + 1)) * 100 < required) break;
      canBunk++;
    }

    if (canBunk > 0) {
      msgs.push({ text: `You can safely bunk ${canBunk} more ${subject} lecture${canBunk > 1 ? "s" : ""}.`, type: "success" });
    } else {
      let mustAttend = 0;
      while (mustAttend < 100) {
        mustAttend++;
        if (((attendedLectures + mustAttend) / (totalLectures + mustAttend)) * 100 >= required) break;
      }
      msgs.push({ text: `Attend the next ${mustAttend} ${subject} lecture${mustAttend > 1 ? "s" : ""} to reach safe attendance.`, type: "danger" });
    }

    const projectedBunk = totalLectures > 0
      ? Math.round((attendedLectures / (totalLectures + 1)) * 1000) / 10
      : 0;
    if (projectedBunk < required) {
      msgs.push({ text: `If you bunk the next lecture, attendance drops to ${projectedBunk}%.`, type: "warning" });
    }

    return msgs;
  }, [subjectAttendance, data.requiredPercentage]);

  const decisionCount = Object.keys(decisions).length;

  const statusConfig = {
    safe: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-600", icon: Shield, label: "Safe" },
    risk: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-600", icon: AlertTriangle, label: "At Risk" },
    critical: { bg: "bg-destructive/10", border: "border-destructive/30", text: "text-destructive", icon: Zap, label: "Critical" },
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
        <div className="flex-1 px-4 mt-6">
          <Card>
            <CardContent className="py-12 text-center">
              <Info size={40} className="mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-base font-semibold text-foreground">No Attendance Data</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-[250px] mx-auto">
                Add your attendance data first in the Attendance Calculator to use Bunk Planner.
              </p>
              <Button onClick={onBack} variant="outline" className="mt-4">
                <ArrowLeft size={14} /> Go Back
              </Button>
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
        <div className="flex items-center justify-between">
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
          {decisionCount > 0 && (
            <button
              onClick={resetDecisions}
              className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20"
              title="Reset simulation"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 -mt-4 space-y-4">
        {/* How it works - collapsible hint */}
        <Card className="mt-1">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Select a subject, then tap <span className="font-semibold text-foreground">Attend</span> or <span className="font-semibold text-foreground">Bunk</span> on upcoming lectures to see how your attendance will change. This is a simulation only — no data is modified.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Subject selector */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Select Subject</p>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {subjectNames.map(name => {
              const isActive = name === activeSubject;
              const subj = data.subjects.find(s => s.subject === name);
              const pct = subj ? subj.percentage : null;
              return (
                <button
                  key={name}
                  onClick={() => { setSelectedSubject(name); setDecisions({}); }}
                  className={`shrink-0 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card text-foreground border-border hover:border-primary/50"
                  }`}
                >
                  <span className="block">{name}</span>
                  {pct !== null && (
                    <span className={`text-[10px] block mt-0.5 ${isActive ? "opacity-80" : "text-muted-foreground"}`}>
                      {pct}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current vs Predicted */}
        {prediction && subjectAttendance && (
          <Card className={`${statusConfig[prediction.status].border} border`}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Attendance Prediction</p>
                <Badge
                  variant="outline"
                  className={`${statusConfig[prediction.status].bg} ${statusConfig[prediction.status].text} ${statusConfig[prediction.status].border}`}
                >
                  {(() => { const Icon = statusConfig[prediction.status].icon; return <Icon size={12} className="mr-1" />; })()}
                  {statusConfig[prediction.status].label}
                </Badge>
              </div>

              {/* Current attendance */}
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Current</span>
                  <span className="font-semibold text-foreground">{currentPercentage}%</span>
                </div>
                <Progress
                  value={Math.min(100, currentPercentage)}
                  className="h-2"
                />
              </div>

              {/* Predicted attendance (shown only when there are decisions) */}
              {decisionCount > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Predicted</span>
                    <span className={`font-bold text-sm ${statusConfig[prediction.status].text}`}>
                      {prediction.percentage}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        prediction.status === "safe" ? "bg-emerald-500"
                        : prediction.status === "risk" ? "bg-yellow-500"
                        : "bg-destructive"
                      }`}
                      style={{ width: `${Math.min(100, prediction.percentage)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-muted-foreground">
                      {prediction.attended}/{prediction.total} lectures
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Required: {prediction.required}%
                    </span>
                  </div>
                </div>
              )}

              {/* Decision summary chips */}
              {decisionCount > 0 && (
                <div className="flex gap-2 pt-1">
                  {prediction.attendCount > 0 && (
                    <span className="flex items-center gap-1 text-xs font-medium bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-full">
                      <Check size={10} /> {prediction.attendCount} attending
                    </span>
                  )}
                  {prediction.bunkCount > 0 && (
                    <span className="flex items-center gap-1 text-xs font-medium bg-destructive/10 text-destructive px-2.5 py-1 rounded-full">
                      <X size={10} /> {prediction.bunkCount} bunking
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Smart summary */}
        {smartMessages.length > 0 && (
          <div className="space-y-2">
            {smartMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border ${
                  msg.type === "success"
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : msg.type === "warning"
                    ? "bg-yellow-500/5 border-yellow-500/20"
                    : "bg-destructive/5 border-destructive/20"
                }`}
              >
                <TrendingUp
                  size={14}
                  className={`mt-0.5 shrink-0 ${
                    msg.type === "success" ? "text-emerald-500"
                    : msg.type === "warning" ? "text-yellow-500"
                    : "text-destructive"
                  }`}
                />
                <p className="text-xs text-foreground leading-relaxed">{msg.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming lectures */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Upcoming Lectures
            </p>
            {decisionCount > 0 && (
              <button
                onClick={resetDecisions}
                className="text-xs text-primary font-medium flex items-center gap-1"
              >
                <RotateCcw size={10} /> Reset
              </button>
            )}
          </div>

          {upcomingLectures.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <CalendarClock size={32} className="mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-sm font-medium text-foreground">No upcoming lectures</p>
                <p className="text-xs text-muted-foreground mt-1">
                  No lectures found for <span className="font-semibold">{activeSubject}</span> in your timetable.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {upcomingLectures.map((lec, index) => {
                const decision = decisions[lec.id];
                const isToday = lec.day === DAYS_ORDER[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
                const showDayHeader = index === 0 || lec.day !== upcomingLectures[index - 1].day;

                return (
                  <div key={lec.id}>
                    {showDayHeader && (
                      <div className="flex items-center gap-2 mt-3 mb-1.5">
                        <span className={`text-xs font-bold ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                          {lec.day} {isToday && "· Today"}
                        </span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                    )}
                    <Card className={`transition-all ${
                      decision === "attend" ? "border-emerald-500/40 bg-emerald-500/5"
                      : decision === "bunk" ? "border-destructive/40 bg-destructive/5"
                      : ""
                    }`}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          {/* Time column */}
                          <div className="text-center shrink-0 w-14">
                            <p className="text-xs font-bold text-foreground">{formatTime(lec.startTime)}</p>
                            <p className="text-[10px] text-muted-foreground">{formatTime(lec.endTime)}</p>
                          </div>

                          {/* Divider */}
                          <div className={`w-0.5 h-8 rounded-full ${
                            decision === "attend" ? "bg-emerald-500"
                            : decision === "bunk" ? "bg-destructive"
                            : "bg-border"
                          }`} />

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{lec.name}</p>
                          </div>

                          {/* Toggle buttons */}
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() => toggleDecision(lec.id, "attend")}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                decision === "attend"
                                  ? "bg-emerald-500 text-white shadow-sm scale-105"
                                  : "bg-secondary text-secondary-foreground hover:bg-emerald-500/10 active:scale-95"
                              }`}
                            >
                              <Check size={12} />
                              <span className="hidden sm:inline">Attend</span>
                            </button>
                            <button
                              onClick={() => toggleDecision(lec.id, "bunk")}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                decision === "bunk"
                                  ? "bg-destructive text-destructive-foreground shadow-sm scale-105"
                                  : "bg-secondary text-secondary-foreground hover:bg-destructive/10 active:scale-95"
                              }`}
                            >
                              <X size={12} />
                              <span className="hidden sm:inline">Bunk</span>
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
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
