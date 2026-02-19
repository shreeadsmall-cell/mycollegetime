import { useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications, ScheduleOptions } from "@capacitor/local-notifications";
import { Lecture } from "@/hooks/useTimetable";

const REMINDER_OFFSETS_MINUTES = [15, 5]; // minutes before lecture starts

function timeToTodayDate(timeStr: string, dayOffset = 0): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, h, m, 0, 0);
  return d;
}

function dayIndexOf(day: string): number {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days.indexOf(day);
}

/** Returns how many days from today to reach the target weekday (0..6) */
function daysUntilWeekday(targetWeekday: number): number {
  const todayWeekday = new Date().getDay();
  const diff = (targetWeekday - todayWeekday + 7) % 7;
  return diff; // 0 = today
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
   * Cancels all previously scheduled lecture reminders and reschedules
   * reminders for the given list of lectures.
   */
  const scheduleReminders = useCallback(async (lectures: Lecture[]) => {
    if (!isNative) return;

    // Cancel all existing scheduled notifications
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }

    const notifications: ScheduleOptions["notifications"] = [];
    let idCounter = 1;

    for (const lecture of lectures) {
      if (lecture.type === "Break") continue; // skip breaks

      const targetWeekday = dayIndexOf(lecture.day);
      if (targetWeekday === -1) continue;

      // Schedule for the next 4 weeks so they appear every week
      for (let week = 0; week < 4; week++) {
        const daysUntil = daysUntilWeekday(targetWeekday) + week * 7;

        for (const offsetMin of REMINDER_OFFSETS_MINUTES) {
          const lectureDate = timeToTodayDate(lecture.startTime, daysUntil);
          const notifyDate = new Date(lectureDate.getTime() - offsetMin * 60 * 1000);

          // Skip if the notification time is in the past
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

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}
