import { useState, useMemo } from "react";
import { useAttendance, SubjectAttendance } from "@/hooks/useAttendance";
import { useTimetable, DayOfWeek, Lecture } from "@/hooks/useTimetable";
import {
  ArrowLeft, CalendarClock, Check, X, AlertTriangle,
  Shield, Info, RotateCcw, Clock, BookOpen, TrendingDown
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

function getTodayName(): DayOfWeek {
  const d = new Date().getDay();
  return d === 0 ? "Sunday" : DAYS_ORDER[d - 1];
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

interface TodayLecture {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  attendance: SubjectAttendance | null;
  canBunk: number;
  status: "safe" | "risk" | "must-attend";
  projectedIfBunk: number;
  isNext: boolean;
}

export function BunkPlanner({ onBack, userId }: BunkPlannerProps) {
  const { data, hasData } = useAttendance();
  const { lectures } = useTimetable(userId);
  const [decisions, setDecisions] = useState<Record<string, "attend" | "bunk">>({});

  const todayName = getTodayName();
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();

  const todayLectures = useMemo((): TodayLecture[] => {
    const dayLecs = lectures
      .filter(l => l.type === "Lecture" && l.day === todayName)
      .sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime));

    let foundNext = false;
    return dayLecs.map(l => {
      const subj = data.subjects.find(s => s.subject === l.name) || null;
      let canBunk = 0;
      let status: "safe" | "risk" | "must-attend" = "must-attend";
      let projectedIfBunk = 0;

      if (subj) {
        const { attendedLectures: att, totalLectures: tot } = subj;
        const req = data.requiredPercentage;
        projectedIfBunk = tot > 0 ? Math.round((att / (tot + 1)) * 1000) / 10 : 0;

        // Calculate how many can be bunked
        let c = 0;
        while (c < 50) {
          if ((att / (tot + c + 1)) * 100 < req) break;
          c++;
        }
        canBunk = c;

        if (canBunk >= 3) status = "safe";
        else if (canBunk >= 1) status = "risk";
        else status = "must-attend";
      }

      const isNext = !foundNext && timeToMin(l.startTime) > nowMin;
      if (isNext) foundNext = true;

      return {
        id: l.id,
        name: l.name,
        startTime: l.startTime,
        endTime: l.endTime,
        attendance: subj,
        canBunk,
        status,
        projectedIfBunk,
        isNext,
      };
    });
  }, [lectures, data, todayName, nowMin]);

  // Compute overall summary
  const summary = useMemo(() => {
    const totalSafeBunks = todayLectures.reduce((sum, l) => sum + (l.status === "safe" ? 1 : 0), 0);
    const mustAttendCount = todayLectures.filter(l => l.status === "must-attend").length;
    const riskyCount = todayLectures.filter(l => l.status === "risk").length;

    // Recalculate with decisions
    let decisionsApplied = 0;
    const subjectImpact: Record<string, { attended: number; total: number }> = {};
    for (const l of todayLectures) {
      const d = decisions[l.id];
      if (!d || !l.attendance) continue;
      decisionsApplied++;
      const key = l.name;
      if (!subjectImpact[key]) {
        subjectImpact[key] = { attended: l.attendance.attendedLectures, total: l.attendance.totalLectures };
      }
      if (d === "attend") { subjectImpact[key].attended += 1; subjectImpact[key].total += 1; }
      else { subjectImpact[key].total += 1; }
    }

    return { totalSafeBunks, mustAttendCount, riskyCount, decisionsApplied, subjectImpact };
  }, [todayLectures, decisions]);

  // Subject-level overview cards
  const subjectOverview = useMemo(() => {
    const subjects = [...new Set(todayLectures.map(l => l.name))];
    return subjects.map(name => {
      const subj = data.subjects.find(s => s.subject === name);
      if (!subj) return { name, percentage: 0, canBunk: 0, mustAttend: 0, status: "must-attend" as const };

      const { attendedLectures: att, totalLectures: tot } = subj;
      const req = data.requiredPercentage;
      let canBunk = 0;
      while (canBunk < 50) {
        if ((att / (tot + canBunk + 1)) * 100 < req) break;
        canBunk++;
      }
      let mustAttend = 0;
      if ((att / tot) * 100 < req) {
        while (mustAttend < 100) {
          mustAttend++;
          if (((att + mustAttend) / (tot + mustAttend)) * 100 >= req) break;
        }
      }
      const status: "safe" | "risk" | "must-attend" = canBunk >= 3 ? "safe" : canBunk >= 1 ? "risk" : "must-attend";
      return { name, percentage: subj.percentage, canBunk, mustAttend, status };
    });
  }, [todayLectures, data]);

  const toggleDecision = (id: string, val: "attend" | "bunk") => {
    setDecisions(prev => prev[id] === val ? (() => { const n = { ...prev }; delete n[id]; return n; })() : { ...prev, [id]: val });
  };

  const statusColors = {
    "safe": { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-600", dot: "bg-emerald-500" },
    "risk": { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-600", dot: "bg-yellow-500" },
    "must-attend": { bg: "bg-destructive/10", border: "border-destructive/30", text: "text-destructive", dot: "bg-destructive" },
  };

  const statusLabels = { "safe": "Safe to Bunk", "risk": "Risky", "must-attend": "Must Attend" };

  if (!hasData) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-24">
        <div className="bg-primary text-primary-foreground px-4 pt-10 pb-6">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-full bg-primary-foreground/10"><ArrowLeft size={18} /></button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2"><CalendarClock size={20} /> Bunk Planner</h1>
              <p className="text-xs opacity-80 mt-0.5">Smart attendance assistant</p>
            </div>
          </div>
        </div>
        <div className="flex-1 px-4 mt-6">
          <Card><CardContent className="py-12 text-center">
            <Info size={40} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-base font-semibold text-foreground">No Attendance Data</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-[250px] mx-auto">
              Add your attendance in the Attendance Calculator first.
            </p>
            <Button onClick={onBack} variant="outline" className="mt-4"><ArrowLeft size={14} /> Go Back</Button>
          </CardContent></Card>
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
            <button onClick={onBack} className="p-2 rounded-full bg-primary-foreground/10"><ArrowLeft size={18} /></button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2"><CalendarClock size={20} /> Bunk Planner</h1>
              <p className="text-xs opacity-80 mt-0.5">{todayName} • {todayLectures.length} lecture{todayLectures.length !== 1 ? "s" : ""} today</p>
            </div>
          </div>
          {Object.keys(decisions).length > 0 && (
            <button onClick={() => setDecisions({})} className="p-2 rounded-full bg-primary-foreground/10"><RotateCcw size={16} /></button>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 -mt-3 space-y-4">
        {/* Today's Summary */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Today's Summary</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-emerald-500/10 rounded-xl p-3">
                <p className="text-xl font-bold text-emerald-600">{summary.totalSafeBunks}</p>
                <p className="text-[10px] text-emerald-600/80 font-medium">Safe to Bunk</p>
              </div>
              <div className="bg-yellow-500/10 rounded-xl p-3">
                <p className="text-xl font-bold text-yellow-600">{summary.riskyCount}</p>
                <p className="text-[10px] text-yellow-600/80 font-medium">Risky</p>
              </div>
              <div className="bg-destructive/10 rounded-xl p-3">
                <p className="text-xl font-bold text-destructive">{summary.mustAttendCount}</p>
                <p className="text-[10px] text-destructive/80 font-medium">Must Attend</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subject Overview */}
        {subjectOverview.length > 0 && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Subject Overview</p>
            <div className="space-y-2">
              {subjectOverview.map(s => {
                const colors = statusColors[s.status];
                // Check if decisions changed the projected percentage
                const impact = summary.subjectImpact[s.name];
                const projected = impact ? Math.round((impact.attended / impact.total) * 1000) / 10 : null;

                return (
                  <Card key={s.name} className={`${colors.border} border`}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-2 h-2 rounded-full ${colors.dot} shrink-0`} />
                          <p className="text-sm font-semibold text-foreground truncate">{s.name}</p>
                        </div>
                        <Badge variant="outline" className={`${colors.bg} ${colors.text} ${colors.border} text-[10px] shrink-0`}>
                          {statusLabels[s.status]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Progress value={Math.min(100, s.percentage)} className="h-1.5" />
                        </div>
                        <span className="text-xs font-bold text-foreground shrink-0">{s.percentage}%</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[11px] text-muted-foreground">
                          {s.canBunk > 0
                            ? <span className="text-emerald-600 font-medium">Can bunk {s.canBunk} more</span>
                            : <span className="text-destructive font-medium">Attend next {s.mustAttend} to recover</span>
                          }
                        </p>
                        {projected !== null && (
                          <span className={`text-[11px] font-semibold ${projected >= data.requiredPercentage ? "text-emerald-600" : "text-destructive"}`}>
                            → {projected}%
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Today's Lectures Timeline */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Today's Lectures</p>
            {Object.keys(decisions).length > 0 && (
              <button onClick={() => setDecisions({})} className="text-xs text-primary font-medium flex items-center gap-1">
                <RotateCcw size={10} /> Reset
              </button>
            )}
          </div>

          {todayLectures.length === 0 ? (
            <Card><CardContent className="py-10 text-center">
              <BookOpen size={32} className="mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm font-medium text-foreground">No lectures today</p>
              <p className="text-xs text-muted-foreground mt-1">Enjoy your day off! 🎉</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {todayLectures.map((lec) => {
                const decision = decisions[lec.id];
                const colors = statusColors[lec.status];
                const isPast = timeToMin(lec.endTime) <= nowMin;
                const isCurrent = timeToMin(lec.startTime) <= nowMin && nowMin < timeToMin(lec.endTime);

                return (
                  <Card
                    key={lec.id}
                    className={`transition-all ${
                      decision === "attend" ? "border-emerald-500/40 bg-emerald-500/5"
                      : decision === "bunk" ? "border-destructive/40 bg-destructive/5"
                      : lec.isNext ? "border-primary/40 bg-primary/5"
                      : isCurrent ? "border-primary/60 bg-primary/10"
                      : isPast ? "opacity-50" : ""
                    }`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        {/* Time + Status dot */}
                        <div className="flex flex-col items-center shrink-0 w-14">
                          <div className={`w-2.5 h-2.5 rounded-full mb-1 ${
                            decision === "attend" ? "bg-emerald-500"
                            : decision === "bunk" ? "bg-destructive"
                            : isCurrent ? "bg-primary animate-pulse"
                            : lec.isNext ? "bg-primary"
                            : colors.dot
                          }`} />
                          <p className="text-[11px] font-bold text-foreground">{formatTime(lec.startTime)}</p>
                          <p className="text-[9px] text-muted-foreground">{formatTime(lec.endTime)}</p>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground truncate">{lec.name}</p>
                            {lec.isNext && !isCurrent && (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[9px] shrink-0">Next</Badge>
                            )}
                            {isCurrent && (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[9px] shrink-0">Now</Badge>
                            )}
                          </div>
                          {lec.attendance && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] text-muted-foreground">
                                {lec.attendance.percentage}% ({lec.attendance.attendedLectures}/{lec.attendance.totalLectures})
                              </span>
                              <Badge variant="outline" className={`${colors.bg} ${colors.text} ${colors.border} text-[9px]`}>
                                {statusLabels[lec.status]}
                              </Badge>
                            </div>
                          )}
                          {lec.attendance && lec.status !== "safe" && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                              <TrendingDown size={9} /> If bunked: {lec.projectedIfBunk}%
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        {!isPast && (
                          <div className="flex flex-col gap-1 shrink-0">
                            <button
                              onClick={() => toggleDecision(lec.id, "attend")}
                              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                                decision === "attend"
                                  ? "bg-emerald-500 text-white shadow-sm"
                                  : "bg-secondary text-secondary-foreground active:scale-95"
                              }`}
                            >
                              <Check size={11} /> Attend
                            </button>
                            <button
                              onClick={() => toggleDecision(lec.id, "bunk")}
                              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                                decision === "bunk"
                                  ? "bg-destructive text-destructive-foreground shadow-sm"
                                  : "bg-secondary text-secondary-foreground active:scale-95"
                              }`}
                            >
                              <X size={11} /> Bunk
                            </button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Info footer */}
        <div className="flex items-start gap-2 px-1 pb-4">
          <Info size={12} className="text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-[10px] text-muted-foreground">
            This is a simulation only. No attendance data is modified. Tap Attend or Bunk to see projected impact.
          </p>
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
