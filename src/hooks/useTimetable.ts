import { useState, useEffect, useCallback } from "react";

export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface Lecture {
  id: string;
  day: DayOfWeek;
  name: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  type: "Lecture" | "Break";
}

export interface ScheduleEntry extends Lecture {
  isFree?: boolean;
}

const STORAGE_KEY = "collegetime_timetable";

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function getCurrentDay(): DayOfWeek {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
  return days[new Date().getDay()] as DayOfWeek;
}

function getCurrentTimeMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function buildDaySchedule(lectures: Lecture[], day: DayOfWeek): ScheduleEntry[] {
  const dayLectures = lectures
    .filter((l) => l.day === day)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const result: ScheduleEntry[] = [];

  for (let i = 0; i < dayLectures.length; i++) {
    const current = dayLectures[i];
    const prev = dayLectures[i - 1];

    if (prev) {
      const gapStart = timeToMinutes(prev.endTime);
      const gapEnd = timeToMinutes(current.startTime);
      if (gapEnd - gapStart >= 5) {
        result.push({
          id: `free-${day}-${gapStart}`,
          day,
          name: "Free Lecture",
          startTime: minutesToTime(gapStart),
          endTime: minutesToTime(gapEnd),
          type: "Lecture",
          isFree: true,
        });
      }
    }

    result.push(current);
  }

  return result;
}

export function useTimetable() {
  const [lectures, setLectures] = useState<Lecture[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lectures));
  }, [lectures]);

  const addLecture = useCallback((lecture: Omit<Lecture, "id">) => {
    const newLecture: Lecture = { ...lecture, id: crypto.randomUUID() };
    setLectures((prev) => [...prev, newLecture]);
  }, []);

  const updateLecture = useCallback((id: string, updates: Partial<Omit<Lecture, "id">>) => {
    setLectures((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  }, []);

  const deleteLecture = useCallback((id: string) => {
    setLectures((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const resetTimetable = useCallback(() => {
    setLectures([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const getTodaySchedule = useCallback((): ScheduleEntry[] => {
    return buildDaySchedule(lectures, getCurrentDay());
  }, [lectures]);

  const getDaySchedule = useCallback((day: DayOfWeek): ScheduleEntry[] => {
    return buildDaySchedule(lectures, day);
  }, [lectures]);

  const getCurrentLecture = useCallback((): ScheduleEntry | null => {
    const now = getCurrentTimeMinutes();
    const schedule = buildDaySchedule(lectures, getCurrentDay());
    return schedule.find((l) => timeToMinutes(l.startTime) <= now && now < timeToMinutes(l.endTime)) ?? null;
  }, [lectures]);

  const getUpcomingLectures = useCallback((): ScheduleEntry[] => {
    const now = getCurrentTimeMinutes();
    const schedule = buildDaySchedule(lectures, getCurrentDay());
    return schedule.filter((l) => timeToMinutes(l.startTime) > now);
  }, [lectures]);

  const hasSetup = lectures.length > 0;

  return {
    lectures,
    hasSetup,
    addLecture,
    updateLecture,
    deleteLecture,
    resetTimetable,
    getTodaySchedule,
    getDaySchedule,
    getCurrentLecture,
    getUpcomingLectures,
    DAYS,
    timeToMinutes,
    getCurrentDay,
  };
}
