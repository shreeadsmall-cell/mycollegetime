import { useState, useEffect, useCallback } from "react";

export interface SubjectAttendance {
  id: string;
  subject: string;
  totalLectures: number;
  attendedLectures: number;
  percentage: number;
}

export interface AttendanceData {
  subjects: SubjectAttendance[];
  requiredPercentage: number;
  updatedAt: string;
}

export type RiskLevel = "safe" | "borderline" | "critical";

export interface SubjectAnalysis {
  subject: SubjectAttendance;
  currentPercentage: number;
  riskLevel: RiskLevel;
  lecturesMustAttend: number; // consecutive lectures to attend to reach required %
  lecturesCanMiss: number;   // lectures can skip while staying above required %
  projectedIfMissNext: number; // % if student misses next 3 lectures
}

const STORAGE_KEY = "collegetime_attendance";

function getDefaultData(): AttendanceData {
  return { subjects: [], requiredPercentage: 75, updatedAt: "" };
}

function calcLecturesMustAttend(attended: number, total: number, required: number): number {
  if (total === 0) return 0;
  if ((attended / total) * 100 >= required) return 0;
  let x = 0;
  while (x < 1000) {
    x++;
    if (((attended + x) / (total + x)) * 100 >= required) return x;
  }
  return x;
}

function calcLecturesCanMiss(attended: number, total: number, required: number): number {
  if (total === 0) return 0;
  let x = 0;
  while (x < 1000) {
    if ((attended / (total + x + 1)) * 100 < required) return x;
    x++;
  }
  return x;
}

function getRiskLevel(percentage: number, required: number): RiskLevel {
  if (percentage >= required) return "safe";
  if (percentage >= required - 5) return "borderline";
  return "critical";
}

export function useAttendance() {
  const [data, setData] = useState<AttendanceData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : getDefaultData();
    } catch {
      return getDefaultData();
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const setSubjects = useCallback((subjects: Omit<SubjectAttendance, "id">[]) => {
    setData((prev) => ({
      ...prev,
      subjects: subjects.map((s) => ({
        ...s,
        id: crypto.randomUUID(),
        percentage: s.totalLectures > 0
          ? Math.round((s.attendedLectures / s.totalLectures) * 1000) / 10
          : 0,
      })),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateSubject = useCallback((id: string, updates: Partial<Omit<SubjectAttendance, "id">>) => {
    setData((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, ...updates };
        updated.percentage = updated.totalLectures > 0
          ? Math.round((updated.attendedLectures / updated.totalLectures) * 1000) / 10
          : 0;
        return updated;
      }),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const addSubject = useCallback((subject: Omit<SubjectAttendance, "id" | "percentage">) => {
    const newSubject: SubjectAttendance = {
      ...subject,
      id: crypto.randomUUID(),
      percentage: subject.totalLectures > 0
        ? Math.round((subject.attendedLectures / subject.totalLectures) * 1000) / 10
        : 0,
    };
    setData((prev) => ({
      ...prev,
      subjects: [...prev.subjects, newSubject],
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const removeSubject = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s.id !== id),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const setRequiredPercentage = useCallback((pct: number) => {
    setData((prev) => ({ ...prev, requiredPercentage: pct }));
  }, []);

  const clearAll = useCallback(() => {
    setData(getDefaultData());
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const getAnalysis = useCallback((): SubjectAnalysis[] => {
    return data.subjects.map((subject) => {
      const currentPercentage = subject.percentage;
      const riskLevel = getRiskLevel(currentPercentage, data.requiredPercentage);
      const lecturesMustAttend = calcLecturesMustAttend(
        subject.attendedLectures, subject.totalLectures, data.requiredPercentage
      );
      const lecturesCanMiss = calcLecturesCanMiss(
        subject.attendedLectures, subject.totalLectures, data.requiredPercentage
      );
      const projectedIfMissNext = subject.totalLectures > 0
        ? Math.round((subject.attendedLectures / (subject.totalLectures + 3)) * 1000) / 10
        : 0;

      return {
        subject,
        currentPercentage,
        riskLevel,
        lecturesMustAttend,
        lecturesCanMiss,
        projectedIfMissNext,
      };
    });
  }, [data]);

  const getOverallStats = useCallback(() => {
    if (data.subjects.length === 0) return { average: 0, dangerCount: 0, safeCount: 0, borderlineCount: 0 };
    const analysis = getAnalysis();
    const avg = Math.round(
      (data.subjects.reduce((sum, s) => sum + s.percentage, 0) / data.subjects.length) * 10
    ) / 10;
    return {
      average: avg,
      dangerCount: analysis.filter((a) => a.riskLevel === "critical").length,
      safeCount: analysis.filter((a) => a.riskLevel === "safe").length,
      borderlineCount: analysis.filter((a) => a.riskLevel === "borderline").length,
    };
  }, [data, getAnalysis]);

  return {
    data,
    hasData: data.subjects.length > 0,
    setSubjects,
    updateSubject,
    addSubject,
    removeSubject,
    setRequiredPercentage,
    clearAll,
    getAnalysis,
    getOverallStats,
  };
}
