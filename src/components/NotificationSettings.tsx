import { useState, useEffect } from "react";
import { Bell, BellOff, CheckCircle, Smartphone, X, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications, loadNotifPrefs, saveNotifPrefs, NotifPrefs, REMINDER_OFFSETS_MINUTES } from "@/hooks/useNotifications";
import { Lecture } from "@/hooks/useTimetable";

interface NotificationSettingsProps {
  lectures: Lecture[];
  onClose: () => void;
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function NotificationSettings({ lectures, onClose }: NotificationSettingsProps) {
  const { isNative, requestPermission, checkPermission, scheduleReminders, cancelAllReminders } = useNotifications();
  const [permGranted, setPermGranted] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState<NotifPrefs>(() => loadNotifPrefs());

  useEffect(() => {
    checkPermission().then(setPermGranted);
  }, [checkPermission]);

  const lecturesToNotify = lectures.filter((l) => l.type === "Lecture");

  const updatePrefs = (updated: NotifPrefs) => {
    setPrefs(updated);
    saveNotifPrefs(updated);
  };

  const toggleGlobal = () => {
    updatePrefs({ ...prefs, globalEnabled: !prefs.globalEnabled });
  };

  const toggleLecture = (id: string) => {
    const current = prefs.perLecture[id] !== false; // default enabled
    updatePrefs({
      ...prefs,
      perLecture: { ...prefs.perLecture, [id]: !current },
    });
  };

  const handleEnable = async () => {
    setLoading(true);
    const granted = await requestPermission();
    setPermGranted(granted);
    if (granted) {
      await scheduleReminders(lectures, prefs);
      setScheduled(true);
    }
    setLoading(false);
  };

  const handleReschedule = async () => {
    setLoading(true);
    await scheduleReminders(lectures, prefs);
    setScheduled(true);
    setLoading(false);
  };

  const handleDisable = async () => {
    setLoading(true);
    await cancelAllReminders();
    updatePrefs({ ...prefs, globalEnabled: false });
    setScheduled(false);
    setLoading(false);
  };

  /* ── Web / non-native fallback ── */
  if (!isNative) {
    return (
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-muted">
              <Smartphone size={20} className="text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Notifications</h3>
              <p className="text-xs text-muted-foreground">Android app only</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground flex items-center gap-2">📱 Install the Android App</p>
          <p>After building with Android Studio, you'll receive lecture reminders:</p>
          <div className="flex flex-col gap-1.5 pt-1">
            {REMINDER_OFFSETS_MINUTES.map((m) => (
              <span key={m} className="flex items-center gap-2 text-foreground text-xs">
                <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                  {m}
                </span>
                {m} minutes before each lecture
              </span>
            ))}
          </div>
        </div>

        {/* Per-lecture preview */}
        {lecturesToNotify.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Lectures that will be notified
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {lecturesToNotify.map((l) => (
                <div key={l.id} className="flex items-center gap-3 bg-secondary/50 rounded-lg px-3 py-2">
                  <Bell size={14} className="text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{l.name}</p>
                    <p className="text-xs text-muted-foreground">{l.day} · {formatTime(l.startTime)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button onClick={onClose} className="w-full">Got it</Button>
      </div>
    );
  }

  /* ── Native Android UI ── */
  return (
    <div className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Bell size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Lecture Reminders</h3>
            <p className="text-xs text-muted-foreground">Notified 15 min & 5 min before</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
          <X size={18} />
        </button>
      </div>

      {/* Global toggle */}
      <div className="flex items-center justify-between bg-secondary/60 rounded-xl px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">All reminders</p>
          <p className="text-xs text-muted-foreground">Master on/off switch</p>
        </div>
        <button onClick={toggleGlobal} className="text-primary">
          {prefs.globalEnabled
            ? <ToggleRight size={32} className="text-primary" />
            : <ToggleLeft size={32} className="text-muted-foreground" />
          }
        </button>
      </div>

      {/* Per-lecture controls */}
      {lecturesToNotify.length > 0 && prefs.globalEnabled && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Per-lecture control
          </p>
          <div className="space-y-1.5">
            {lecturesToNotify.map((l) => {
              const enabled = prefs.perLecture[l.id] !== false;
              return (
                <div
                  key={l.id}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-all ${
                    enabled
                      ? "bg-card border-border"
                      : "bg-secondary/40 border-transparent opacity-60"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    enabled ? "bg-primary/10" : "bg-muted"
                  }`}>
                    <Bell size={14} className={enabled ? "text-primary" : "text-muted-foreground"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{l.name}</p>
                    <p className="text-xs text-muted-foreground">{l.day} · {formatTime(l.startTime)}</p>
                  </div>
                  <button onClick={() => toggleLecture(l.id)} className="shrink-0">
                    {enabled
                      ? <ToggleRight size={26} className="text-primary" />
                      : <ToggleLeft size={26} className="text-muted-foreground" />
                    }
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Offset info */}
      <div className="bg-muted/50 rounded-xl px-4 py-3 space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reminder times</p>
        {REMINDER_OFFSETS_MINUTES.map((m) => (
          <div key={m} className="flex items-center gap-2 text-sm text-foreground">
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{m}</span>
            {m} minutes before lecture
          </div>
        ))}
        <p className="text-xs text-muted-foreground pt-1">
          Scheduled for the next 4 weeks. Re-schedule after adding lectures.
        </p>
      </div>

      {/* Scheduled success */}
      {scheduled && (
        <div className="flex items-center gap-2 text-sm text-current font-medium">
          <CheckCircle size={16} />
          Reminders scheduled successfully!
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2 pb-2">
        {!permGranted ? (
          <Button onClick={handleEnable} disabled={loading} className="w-full h-12 gap-2 font-semibold">
            <Bell size={16} />
            {loading ? "Requesting…" : "Enable Reminders"}
          </Button>
        ) : (
          <>
            <Button onClick={handleReschedule} disabled={loading} className="w-full h-12 gap-2 font-semibold">
              <Bell size={16} />
              {loading ? "Scheduling…" : "Apply & Schedule Reminders"}
            </Button>
            <Button
              onClick={handleDisable}
              disabled={loading}
              variant="outline"
              className="w-full h-12 gap-2 font-semibold text-destructive border-border"
            >
              <BellOff size={16} />
              {loading ? "Cancelling…" : "Cancel All Reminders"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
