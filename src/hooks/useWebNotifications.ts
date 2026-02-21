import { useState, useEffect, useCallback } from "react";
import { Lecture } from "@/hooks/useTimetable";

const PREFS_KEY = "collegetime_web_notif_prefs";
const REMINDERS_KEY = "collegetime_scheduled_reminders";

export interface WebNotifPrefs {
  enabled: boolean;
  offsets: number[]; // minutes before
}

function loadPrefs(): WebNotifPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { enabled: true, offsets: [15, 5] };
}

function savePrefs(prefs: WebNotifPrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

function dayIndexOf(day: string): number {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(day);
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function useWebNotifications() {
  const [prefs, setPrefs] = useState<WebNotifPrefs>(loadPrefs);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const [timers, setTimers] = useState<number[]>([]);

  const isSupported = typeof Notification !== "undefined";

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  }, [isSupported]);

  const updatePrefs = useCallback((updates: Partial<WebNotifPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...updates };
      savePrefs(next);
      return next;
    });
  }, []);

  const scheduleReminders = useCallback((lectures: Lecture[]) => {
    // Clear existing timers
    timers.forEach((id) => clearTimeout(id));

    if (!isSupported || permission !== "granted" || !prefs.enabled) {
      setTimers([]);
      return;
    }

    const now = Date.now();
    const newTimers: number[] = [];
    const todayWeekday = new Date().getDay();

    for (const lecture of lectures) {
      if (lecture.type === "Break") continue;
      const targetWeekday = dayIndexOf(lecture.day);
      if (targetWeekday === -1) continue;

      // Only schedule for today
      if (targetWeekday !== todayWeekday) continue;

      const [h, m] = lecture.startTime.split(":").map(Number);
      const lectureTime = new Date();
      lectureTime.setHours(h, m, 0, 0);

      for (const offset of prefs.offsets) {
        const notifyTime = lectureTime.getTime() - offset * 60 * 1000;
        const delay = notifyTime - now;
        if (delay <= 0) continue;

        const id = window.setTimeout(() => {
          new Notification(
            offset >= 15 ? "⏰ Lecture in 15 minutes" : "🔔 Lecture starting soon!",
            {
              body: `${lecture.name} starts at ${formatTime(lecture.startTime)}`,
              icon: "/favicon.ico",
              tag: `lecture-${lecture.id}-${offset}`,
            }
          );
        }, delay);
        newTimers.push(id);
      }
    }

    setTimers(newTimers);
    localStorage.setItem(REMINDERS_KEY, JSON.stringify({
      count: newTimers.length,
      scheduledAt: new Date().toISOString(),
    }));
  }, [isSupported, permission, prefs, timers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timers.forEach((id) => clearTimeout(id));
    };
  }, [timers]);

  return {
    isSupported,
    permission,
    prefs,
    requestPermission,
    updatePrefs,
    scheduleReminders,
  };
}
