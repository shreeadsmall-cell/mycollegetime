import { useState, useRef } from "react";
import { useAttendance, SubjectAttendance, SubjectAnalysis } from "@/hooks/useAttendance";
import { Lecture } from "@/hooks/useTimetable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Upload, FileImage, FileText, Loader2, Sparkles, CheckCircle,
  AlertCircle, ShieldCheck, ShieldAlert, AlertTriangle, Plus, Trash2,
  Pencil, Check, X, TrendingDown, TrendingUp, BookOpen, RotateCcw, BarChart3
} from "lucide-react";

interface AttendanceCalculatorProps {
  onBack: () => void;
  timetableLectures?: Lecture[];
}

type Step = "upload" | "edit" | "results";

export function AttendanceCalculator({ onBack, timetableLectures = [] }: AttendanceCalculatorProps) {
  const {
    data, hasData, setSubjects, updateSubject, addSubject, removeSubject,
    setRequiredPercentage, clearAll, getAnalysis, getOverallStats
  } = useAttendance();

  const [step, setStep] = useState<Step>(hasData ? "results" : "upload");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<SubjectAttendance>>({});
  const [addingNew, setAddingNew] = useState(false);
  const [newSubject, setNewSubject] = useState({ subject: "", totalLectures: 0, attendedLectures: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const processFile = async (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a JPG, PNG, WEBP, or PDF file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum 10MB.");
      return;
    }

    setUploading(true);
    setError("");

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/parse-attendance`, {
        method: "POST",
        headers: { Authorization: `Bearer ${SUPABASE_KEY}` },
        body: form,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to parse attendance.");

      setSubjects(result.subjects);
      setStep("edit");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const startEdit = (subject: SubjectAttendance) => {
    setEditingId(subject.id);
    setEditValues({ subject: subject.subject, totalLectures: subject.totalLectures, attendedLectures: subject.attendedLectures });
  };

  const saveEdit = () => {
    if (editingId && editValues) {
      updateSubject(editingId, editValues);
      setEditingId(null);
      setEditValues({});
    }
  };

  const handleAddNew = () => {
    if (newSubject.subject.trim() && newSubject.totalLectures > 0) {
      addSubject(newSubject);
      setNewSubject({ subject: "", totalLectures: 0, attendedLectures: 0 });
      setAddingNew(false);
    }
  };

  const analysis = getAnalysis();
  const stats = getOverallStats();

  // Match timetable subjects to attendance subjects
  const getTimetableInsights = (subjectName: string): string | null => {
    if (!timetableLectures.length) return null;
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const tomorrow = days[(new Date().getDay() + 1) % 7];
    const matchingLectures = timetableLectures.filter(
      (l) => l.type === "Lecture" && l.name.toLowerCase().includes(subjectName.toLowerCase())
    );
    const tomorrowLectures = matchingLectures.filter((l) => l.day === tomorrow);
    if (tomorrowLectures.length > 0) {
      return `You have ${tomorrowLectures.length} ${subjectName} lecture${tomorrowLectures.length > 1 ? "s" : ""} tomorrow`;
    }
    return null;
  };

  const getRiskIcon = (level: string) => {
    if (level === "safe") return <ShieldCheck size={16} className="text-[hsl(var(--current))]" />;
    if (level === "borderline") return <AlertTriangle size={16} className="text-[hsl(var(--break))]" />;
    return <ShieldAlert size={16} className="text-destructive" />;
  };

  const getRiskLabel = (level: string) => {
    if (level === "safe") return "Safe";
    if (level === "borderline") return "At Risk";
    return "Critical";
  };

  const getRiskColors = (level: string) => {
    if (level === "safe") return { card: "border-[hsl(var(--current-border))] bg-[hsl(var(--current-bg))]", bar: "bg-[hsl(var(--current))]", badge: "bg-[hsl(var(--current))]/15 text-[hsl(var(--current))]" };
    if (level === "borderline") return { card: "border-[hsl(var(--break-border))] bg-[hsl(var(--break-bg))]", bar: "bg-[hsl(var(--break))]", badge: "bg-[hsl(var(--break))]/15 text-[hsl(var(--break))]" };
    return { card: "border-destructive/40 bg-destructive/5", bar: "bg-destructive", badge: "bg-destructive/15 text-destructive" };
  };

  // ── Upload Step ──
  if (step === "upload") {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-24">
        <div className="bg-primary text-primary-foreground px-4 pt-10 pb-6">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-primary-foreground/10">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold">Attendance Calculator</h1>
              <p className="text-sm opacity-80 mt-0.5">Upload your attendance report</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 -mt-4 space-y-4">
          {/* Upload zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all mt-5"
          >
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleFileChange} className="hidden" />
            {uploading ? (
              <>
                <Loader2 size={36} className="mx-auto mb-3 animate-spin text-primary" />
                <p className="text-sm font-semibold text-foreground">AI is reading your report…</p>
                <p className="text-xs text-muted-foreground mt-1">This takes 5–15 seconds</p>
              </>
            ) : (
              <>
                <Sparkles size={36} className="mx-auto mb-3 text-primary" />
                <p className="text-sm font-semibold text-foreground mb-1">Tap to upload attendance report</p>
                <p className="text-xs text-muted-foreground">Supports JPG, PNG, PDF — up to 10MB</p>
                <div className="flex justify-center gap-2 mt-4">
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-card border border-border text-xs text-muted-foreground">
                    <FileImage size={12} /> Image
                  </span>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-card border border-border text-xs text-muted-foreground">
                    <FileText size={12} /> PDF
                  </span>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="border border-destructive/40 rounded-xl p-4 bg-destructive/5 flex items-start gap-3">
              <AlertCircle size={18} className="text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">{error}</p>
                <button onClick={() => setError("")} className="text-xs text-primary font-semibold mt-1">Try again</button>
              </div>
            </div>
          )}

          {/* Manual entry option */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-2">Or add subjects manually</p>
            <Button variant="outline" size="sm" onClick={() => { setAddingNew(true); setStep("edit"); }}>
              <Plus size={14} /> Add Manually
            </Button>
          </div>

          {/* Resume if has data */}
          {hasData && (
            <div className="border border-border rounded-xl p-4 bg-card">
              <p className="text-sm font-medium text-foreground mb-2">You have saved attendance data</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setStep("results")} className="flex-1">
                  <BarChart3 size={14} /> View Results
                </Button>
                <Button size="sm" variant="outline" onClick={() => setStep("edit")}>
                  <Pencil size={14} /> Edit
                </Button>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 space-y-1.5">
            <p className="text-xs font-semibold text-foreground">Tips for best results:</p>
            <ul className="space-y-1">
              {[
                "Upload a screenshot of your attendance portal",
                "Ensure subject names and numbers are visible",
                "PDF exports from college ERP work great",
                "You can always edit values after extraction"
              ].map((tip) => (
                <li key={tip} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">•</span>{tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ── Edit Step ──
  if (step === "edit") {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-24">
        <div className="bg-primary text-primary-foreground px-4 pt-10 pb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setStep(hasData ? "results" : "upload")} className="p-2 -ml-2 rounded-lg hover:bg-primary-foreground/10">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold">Edit Attendance</h1>
              <p className="text-sm opacity-80 mt-0.5">Verify & correct extracted data</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 -mt-4 space-y-3">
          {/* Required % */}
          <div className="bg-card border rounded-xl p-4 mt-5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
              Required Attendance %
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={100}
                value={data.requiredPercentage}
                onChange={(e) => setRequiredPercentage(Number(e.target.value))}
                className="w-24 text-center font-bold text-lg"
              />
              <span className="text-sm text-muted-foreground">% minimum attendance required</span>
            </div>
          </div>

          {/* Subject list */}
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-4">
            Subjects ({data.subjects.length})
          </p>

          {data.subjects.map((subject) => (
            <div key={subject.id} className="bg-card border rounded-xl p-4">
              {editingId === subject.id ? (
                <div className="space-y-3">
                  <Input
                    value={editValues.subject || ""}
                    onChange={(e) => setEditValues({ ...editValues, subject: e.target.value })}
                    placeholder="Subject name"
                  />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">Total</label>
                      <Input
                        type="number"
                        min={0}
                        value={editValues.totalLectures || 0}
                        onChange={(e) => setEditValues({ ...editValues, totalLectures: Number(e.target.value) })}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">Attended</label>
                      <Input
                        type="number"
                        min={0}
                        value={editValues.attendedLectures || 0}
                        onChange={(e) => setEditValues({ ...editValues, attendedLectures: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit} className="flex-1"><Check size={14} /> Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}><X size={14} /></Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{subject.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {subject.attendedLectures}/{subject.totalLectures} lectures • {subject.percentage}%
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(subject)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => removeSubject(subject.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add new subject */}
          {addingNew ? (
            <div className="bg-card border-2 border-primary rounded-xl p-4 space-y-3">
              <Input
                value={newSubject.subject}
                onChange={(e) => setNewSubject({ ...newSubject, subject: e.target.value })}
                placeholder="Subject name"
                autoFocus
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">Total Lectures</label>
                  <Input
                    type="number"
                    min={0}
                    value={newSubject.totalLectures || ""}
                    onChange={(e) => setNewSubject({ ...newSubject, totalLectures: Number(e.target.value) })}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">Attended</label>
                  <Input
                    type="number"
                    min={0}
                    value={newSubject.attendedLectures || ""}
                    onChange={(e) => setNewSubject({ ...newSubject, attendedLectures: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddNew} className="flex-1"><Check size={14} /> Add</Button>
                <Button size="sm" variant="outline" onClick={() => setAddingNew(false)}><X size={14} /></Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingNew(true)}
              className="w-full border-2 border-dashed border-border rounded-xl p-3 text-sm font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add Subject
            </button>
          )}
        </div>

        {/* Bottom bar */}
        {data.subjects.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3">
            <Button onClick={() => setStep("results")} className="w-full h-12 font-semibold text-base">
              <BarChart3 size={18} /> View Analysis
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── Results Step ──
  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      <div className="bg-primary text-primary-foreground px-4 pt-10 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-primary-foreground/10">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold">Attendance Analysis</h1>
              <p className="text-sm opacity-80 mt-0.5">
                {data.subjects.length} subject{data.subjects.length !== 1 ? "s" : ""} • {data.requiredPercentage}% required
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setStep("edit")} className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20">
              <Pencil size={16} />
            </button>
            <button onClick={() => setStep("upload")} className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20">
              <Upload size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 -mt-4 space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2 mt-5">
          <div className="bg-card border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.average}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">Overall Avg</p>
          </div>
          <div className={`border rounded-xl p-3 text-center ${stats.dangerCount > 0 ? "bg-destructive/5 border-destructive/30" : "bg-[hsl(var(--current-bg))] border-[hsl(var(--current-border))]"}`}>
            <p className="text-2xl font-bold text-foreground">{stats.safeCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Safe</p>
          </div>
          <div className={`border rounded-xl p-3 text-center ${stats.dangerCount > 0 ? "bg-destructive/5 border-destructive/30" : "bg-card"}`}>
            <p className={`text-2xl font-bold ${stats.dangerCount > 0 ? "text-destructive" : "text-foreground"}`}>{stats.dangerCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">In Danger</p>
          </div>
        </div>

        {/* Overall attendance bar */}
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-foreground">Overall Attendance</span>
            <span className={`text-sm font-bold ${stats.average >= data.requiredPercentage ? "text-[hsl(var(--current))]" : "text-destructive"}`}>
              {stats.average}%
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${stats.average >= data.requiredPercentage ? "bg-[hsl(var(--current))]" : stats.average >= data.requiredPercentage - 5 ? "bg-[hsl(var(--break))]" : "bg-destructive"}`}
              style={{ width: `${Math.min(100, stats.average)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">0%</span>
            <span className="text-xs text-muted-foreground font-medium">{data.requiredPercentage}% required</span>
            <span className="text-xs text-muted-foreground">100%</span>
          </div>
        </div>

        {/* Subject-wise cards */}
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Subject-wise Analysis
        </p>

        {analysis.map((a) => {
          const colors = getRiskColors(a.riskLevel);
          const timetableInsight = getTimetableInsights(a.subject.subject);

          return (
            <div key={a.subject.id} className={`border rounded-xl p-4 ${colors.card} space-y-3`}>
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <BookOpen size={16} className="text-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{a.subject.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.subject.attendedLectures}/{a.subject.totalLectures} lectures
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${colors.badge}`}>
                  {getRiskIcon(a.riskLevel)} {getRiskLabel(a.riskLevel)}
                </span>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Attendance</span>
                  <span className="text-sm font-bold text-foreground">{a.currentPercentage}%</span>
                </div>
                <div className="h-2.5 bg-card rounded-full overflow-hidden border border-border/50">
                  <div className={`h-full rounded-full transition-all duration-500 ${colors.bar}`} style={{ width: `${Math.min(100, a.currentPercentage)}%` }} />
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-2">
                {a.riskLevel !== "safe" ? (
                  <div className="bg-card/60 rounded-lg p-2.5 border border-border/50">
                    <div className="flex items-center gap-1 mb-0.5">
                      <TrendingUp size={12} className="text-[hsl(var(--current))]" />
                      <span className="text-xs text-muted-foreground">Must attend</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{a.lecturesMustAttend}</p>
                    <p className="text-xs text-muted-foreground">consecutive lectures</p>
                  </div>
                ) : (
                  <div className="bg-card/60 rounded-lg p-2.5 border border-border/50">
                    <div className="flex items-center gap-1 mb-0.5">
                      <CheckCircle size={12} className="text-[hsl(var(--current))]" />
                      <span className="text-xs text-muted-foreground">Can miss</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{a.lecturesCanMiss}</p>
                    <p className="text-xs text-muted-foreground">lectures safely</p>
                  </div>
                )}
                <div className="bg-card/60 rounded-lg p-2.5 border border-border/50">
                  <div className="flex items-center gap-1 mb-0.5">
                    <TrendingDown size={12} className="text-destructive" />
                    <span className="text-xs text-muted-foreground">If miss next 3</span>
                  </div>
                  <p className={`text-lg font-bold ${a.projectedIfMissNext < data.requiredPercentage ? "text-destructive" : "text-foreground"}`}>
                    {a.projectedIfMissNext}%
                  </p>
                  <p className="text-xs text-muted-foreground">projected</p>
                </div>
              </div>

              {/* Timetable insight */}
              {timetableInsight && (
                <div className="bg-primary/10 rounded-lg px-3 py-2 flex items-start gap-2">
                  <Sparkles size={14} className="text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-primary font-medium">{timetableInsight}</p>
                </div>
              )}

              {/* Warning for critical */}
              {a.riskLevel === "critical" && (
                <div className="bg-destructive/10 rounded-lg px-3 py-2 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive font-medium">
                    Attendance is critically low! You must attend the next {a.lecturesMustAttend} lectures without missing any.
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {/* Prediction card */}
        {analysis.some((a) => a.riskLevel !== "safe") && (
          <div className="bg-card border rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={16} className="text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">Future Predictions</p>
            </div>
            {analysis
              .filter((a) => a.riskLevel !== "safe")
              .map((a) => (
                <p key={a.subject.id} className="text-xs text-muted-foreground">
                  If you miss next 3 <span className="font-semibold text-foreground">{a.subject.subject}</span> lectures, attendance drops to{" "}
                  <span className={`font-bold ${a.projectedIfMissNext < data.requiredPercentage ? "text-destructive" : "text-foreground"}`}>
                    {a.projectedIfMissNext}%
                  </span>
                </p>
              ))}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 flex gap-2">
        <Button onClick={() => setStep("upload")} className="flex-1 h-12 gap-2 font-semibold">
          <Upload size={18} /> Update Report
        </Button>
        <Button onClick={() => { clearAll(); setStep("upload"); }} variant="outline" className="h-12 px-4 text-destructive">
          <RotateCcw size={18} />
        </Button>
      </div>
    </div>
  );
}
