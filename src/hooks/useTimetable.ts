import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

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

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function fetchFromDB(userId: string): Promise<Lecture[]> {
  const { data, error } = await supabase
    .from("timetable_entries")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    day: row.day as DayOfWeek,
    name: row.name,
    startTime: row.start_time,
    endTime: row.end_time,
    type: row.type as "Lecture" | "Break",
  }));
}

async function insertToDB(userId: string, lecture: Omit<Lecture, "id">): Promise<string> {
  const { data, error } = await supabase
    .from("timetable_entries")
    .insert({
      user_id: userId,
      day: lecture.day,
      name: lecture.name,
      start_time: lecture.startTime,
      end_time: lecture.endTime,
      type: lecture.type,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

async function updateInDB(userId: string, id: string, updates: Partial<Omit<Lecture, "id">>) {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.day !== undefined) dbUpdates.day = updates.day;
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
  if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
  if (updates.type !== undefined) dbUpdates.type = updates.type;

  const { error } = await supabase
    .from("timetable_entries")
    .update(dbUpdates)
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

async function deleteFromDB(userId: string, id: string) {
  const { error } = await supabase
    .from("timetable_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

async function clearAllFromDB(userId: string) {
  const { error } = await supabase
    .from("timetable_entries")
    .delete()
    .eq("user_id", userId);

  if (error) throw error;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTimetable(userId?: string | null) {
  const [lectures, setLectures] = useState<Lecture[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const hasSyncedRef = useRef(false);

  // When user logs in, load from DB and merge with localStorage
  useEffect(() => {
    if (!userId || hasSyncedRef.current) return;

    const sync = async () => {
      setSyncing(true);
      try {
        const dbLectures = await fetchFromDB(userId);

        // If DB has data, use it (DB is source of truth)
        if (dbLectures.length > 0) {
          setLectures(dbLectures);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dbLectures));
        } else {
          // If DB empty but localStorage has data, push it to DB
          const local: Lecture[] = (() => {
            try {
              const s = localStorage.getItem(STORAGE_KEY);
              return s ? JSON.parse(s) : [];
            } catch { return []; }
          })();

          if (local.length > 0) {
            // Upload local data to DB, getting new DB IDs
            const uploaded: Lecture[] = [];
            for (const l of local) {
              const newId = await insertToDB(userId, l);
              uploaded.push({ ...l, id: newId });
            }
            setLectures(uploaded);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(uploaded));
          }
        }
        hasSyncedRef.current = true;
        setSynced(true);
      } catch (err) {
        console.error("Sync error:", err);
      } finally {
        setSyncing(false);
      }
    };

    sync();
  }, [userId]);

  // Persist to localStorage whenever lectures change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lectures));
  }, [lectures]);

  // Reset sync state when user logs out
  useEffect(() => {
    if (!userId) {
      hasSyncedRef.current = false;
      setSynced(false);
    }
  }, [userId]);

  const addLecture = useCallback(async (lecture: Omit<Lecture, "id">) => {
    const tempId = crypto.randomUUID();
    const newLecture: Lecture = { ...lecture, id: tempId };
    setLectures((prev) => [...prev, newLecture]);

    if (userId) {
      try {
        const dbId = await insertToDB(userId, lecture);
        setLectures((prev) => prev.map((l) => l.id === tempId ? { ...l, id: dbId } : l));
      } catch (err) {
        console.error("DB insert error:", err);
      }
    }
  }, [userId]);

  const updateLecture = useCallback(async (id: string, updates: Partial<Omit<Lecture, "id">>) => {
    setLectures((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));

    if (userId) {
      try {
        await updateInDB(userId, id, updates);
      } catch (err) {
        console.error("DB update error:", err);
      }
    }
  }, [userId]);

  const deleteLecture = useCallback(async (id: string) => {
    setLectures((prev) => prev.filter((l) => l.id !== id));

    if (userId) {
      try {
        await deleteFromDB(userId, id);
      } catch (err) {
        console.error("DB delete error:", err);
      }
    }
  }, [userId]);

  const resetTimetable = useCallback(async () => {
    setLectures([]);
    localStorage.removeItem(STORAGE_KEY);

    if (userId) {
      try {
        await clearAllFromDB(userId);
      } catch (err) {
        console.error("DB clear error:", err);
      }
    }
  }, [userId]);

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
    syncing,
    synced,
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
