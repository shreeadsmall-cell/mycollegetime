import { useState, useEffect } from "react";
import { Bell, BellOff, CheckCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { Lecture } from "@/hooks/useTimetable";

interface NotificationSettingsProps {
  lectures: Lecture[];
  onClose: () => void;
}

export function NotificationSettings({ lectures, onClose }: NotificationSettingsProps) {
  const { isNative, requestPermission, checkPermission, scheduleReminders, cancelAllReminders } =
    useNotifications();
  const [permGranted, setPermGranted] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkPermission().then(setPermGranted);
  }, [checkPermission]);

  const handleEnable = async () => {
    setLoading(true);
    const granted = await requestPermission();
    setPermGranted(granted);
    if (granted) {
      await scheduleReminders(lectures);
      setScheduled(true);
    }
    setLoading(false);
  };

  const handleReschedule = async () => {
    setLoading(true);
    await scheduleReminders(lectures);
    setScheduled(true);
    setLoading(false);
  };

  const handleDisable = async () => {
    setLoading(true);
    await cancelAllReminders();
    setScheduled(false);
    setLoading(false);
  };

  if (!isNative) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-full bg-muted">
            <Smartphone size={20} className="text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <p className="text-xs text-muted-foreground">Only available in the Android app</p>
          </div>
        </div>
        <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">📱 Install the Android App</p>
          <p>To receive lecture reminders (15 min & 5 min before), install the CollegeTime Android app using Android Studio.</p>
        </div>
        <Button onClick={onClose} className="w-full">Got it</Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-full bg-primary/10">
          <Bell size={20} className="text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Lecture Reminders</h3>
          <p className="text-xs text-muted-foreground">Get notified before each lecture</p>
        </div>
      </div>

      {/* Reminder times info */}
      <div className="bg-muted/50 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">You'll be notified</p>
        <div className="flex items-center gap-2 text-sm text-foreground">
          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">1</span>
          <span>15 minutes before each lecture</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-foreground">
          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">2</span>
          <span>5 minutes before each lecture</span>
        </div>
        <p className="text-xs text-muted-foreground pt-1">
          Reminders are scheduled for the next 4 weeks. Re-schedule after adding new lectures.
        </p>
      </div>

      {/* Status */}
      {scheduled && (
        <div className="flex items-center gap-2 text-sm text-primary font-medium">
          <CheckCircle size={16} />
          Reminders scheduled successfully!
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {!permGranted ? (
          <Button onClick={handleEnable} disabled={loading} className="w-full h-12 gap-2 font-semibold">
            <Bell size={16} />
            {loading ? "Requesting…" : "Enable Reminders"}
          </Button>
        ) : (
          <>
            <Button onClick={handleReschedule} disabled={loading} className="w-full h-12 gap-2 font-semibold">
              <Bell size={16} />
              {loading ? "Scheduling…" : "Schedule Reminders"}
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
        <Button onClick={onClose} variant="ghost" className="w-full h-10 text-muted-foreground">
          Close
        </Button>
      </div>
    </div>
  );
}
