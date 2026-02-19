import { useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications, ScheduleOptions } from "@capacitor/local-notifications";
import { Lecture } from "@/hooks/useTimetable";

export const REMINDER_OFFSETS_MINUTES = [15, 5];
const PREFS_KEY = "collegetime_notif_prefs";

export interface NotifPrefs {
  globalEnabled: boolean;
  perLecture: Record<string, boolean>; // lectureId -> enabled
  offsets: number[]; // minutes before
}

export function loadNotifPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { globalEnabled: true, perLecture: {}, offsets: REMINDER_OFFSETS_MINUTES };
}

export function saveNotifPrefs(prefs: NotifPrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

function timeToTodayDate(timeStr: string, dayOffset = 0): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, h, m, 0, 0);
}

function dayIndexOf(day: string): number {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days.indexOf(day);
}

function daysUntilWeekday(targetWeekday: number): number {
  const todayWeekday = new Date().getDay();
  return (targetWeekday - todayWeekday + 7) % 7;
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function useNotifications() {
  const isNative = Capacitor.isNativePlatform();

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isNative) return false;
    const { display } = await LocalNotifications.requestPermissions();
    return display === "granted";
  }, [isNative]);

  const checkPermission = useCallback(async (): Promise<boolean> => {
    if (!isNative) return false;
    const { display } = await LocalNotifications.checkPermissions();
    return display === "granted";
  }, [isNative]);

  /**
   * Cancels all previously scheduled reminders then re-schedules based on
   * per-lecture preferences and offset settings.
   */
  const scheduleReminders = useCallback(async (lectures: Lecture[], prefs?: NotifPrefs) => {
    if (!isNative) return;

    const p = prefs ?? loadNotifPrefs();

    // Cancel all existing
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }

    if (!p.globalEnabled) return;

    const offsets = p.offsets?.length ? p.offsets : REMINDER_OFFSETS_MINUTES;
    const notifications: ScheduleOptions["notifications"] = [];
    let idCounter = 1;

    for (const lecture of lectures) {
      if (lecture.type === "Break") continue;
      // Check per-lecture toggle (default: enabled)
      const lectureEnabled = p.perLecture[lecture.id] !== false;
      if (!lectureEnabled) continue;

      const targetWeekday = dayIndexOf(lecture.day);
      if (targetWeekday === -1) continue;

      // Schedule next 4 weeks
      for (let week = 0; week < 4; week++) {
        const daysUntil = daysUntilWeekday(targetWeekday) + week * 7;

        for (const offsetMin of offsets) {
          const lectureDate = timeToTodayDate(lecture.startTime, daysUntil);
          const notifyDate = new Date(lectureDate.getTime() - offsetMin * 60 * 1000);
          if (notifyDate <= new Date()) continue;

          notifications.push({
            id: idCounter++,
            title: offsetMin === 15 ? "⏰ Lecture in 15 minutes" : "🔔 Lecture starting soon!",
            body: `${lecture.name} starts at ${formatTime(lecture.startTime)}`,
            schedule: { at: notifyDate, allowWhileIdle: true },
            sound: undefined,
            actionTypeId: "",
            extra: { lectureId: lecture.id },
          });
        }
      }
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
    }
  }, [isNative]);

  const cancelAllReminders = useCallback(async () => {
    if (!isNative) return;
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
  }, [isNative]);

  return {
    isNative,
    requestPermission,
    checkPermission,
    scheduleReminders,
    cancelAllReminders,
  };
}
