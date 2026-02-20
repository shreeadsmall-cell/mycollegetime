import { useState } from "react";
import { useTimetable } from "@/hooks/useTimetable";
import { useAuth } from "@/hooks/useAuth";
import { TimetableSetup } from "@/components/TimetableSetup";
import { Dashboard } from "@/components/Dashboard";
import { WeeklyView } from "@/components/WeeklyView";
import { AddLectureForm } from "@/components/AddLectureForm";
import { ExportModal } from "@/components/ExportModal";
import { AuthScreen } from "@/components/AuthScreen";
import { AttendanceCalculator } from "@/components/AttendanceCalculator";
import { ThemeProvider } from "next-themes";
import { Loader2, Cloud, CloudOff, LogOut } from "lucide-react";

type Screen = "setup" | "dashboard" | "weekly" | "add" | "attendance";

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { hasSetup, addLecture, resetTimetable, syncing, synced, lectures } = useTimetable(user?.id);
  const [screen, setScreen] = useState<Screen>(hasSetup ? "dashboard" : "setup");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const handleReset = () => setShowResetConfirm(true);

  const confirmReset = () => {
    resetTimetable();
    setShowResetConfirm(false);
    setScreen("setup");
  };

  if (authLoading) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      </ThemeProvider>
    );
  }

  if (showAuth && !user) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <div className="max-w-md mx-auto relative">
          <AuthScreen />
          <button
            onClick={() => setShowAuth(false)}
            className="w-full py-3 text-sm text-muted-foreground"
          >
            ← Continue without account
          </button>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <div className="max-w-md mx-auto relative">
        {/* Sync status bar */}
        {user && (
          <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-1.5 bg-primary/10 border-b border-primary/20 max-w-md mx-auto">
            <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
              {syncing ? (
                <><Loader2 size={12} className="animate-spin" /> Syncing…</>
              ) : (
                <><Cloud size={12} /> {user.email}</>
              )}
            </div>
            <button onClick={() => { signOut(); }} className="text-xs text-muted-foreground flex items-center gap-1">
              <LogOut size={12} /> Sign out
            </button>
          </div>
        )}

        {/* Offline / no-account banner */}
        {!user && (
          <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-1.5 bg-muted border-b border-border max-w-md mx-auto">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CloudOff size={12} /> Local only — data stays on this device
            </div>
            <button
              onClick={() => setShowAuth(true)}
              className="text-xs text-primary font-semibold"
            >
              Sign in to sync
            </button>
          </div>
        )}

        {/* Top padding to account for status bar */}
        <div className="pt-8">
          {screen === "setup" && (
            <TimetableSetup onDone={() => setScreen("dashboard")} userId={user?.id} />
          )}
          {screen === "dashboard" && (
            <Dashboard
              onAddLecture={() => setShowAddModal(true)}
              onReset={handleReset}
              onViewWeekly={() => setScreen("weekly")}
              onExport={() => setShowExport(true)}
              onAttendance={() => setScreen("attendance")}
              userId={user?.id}
            />
          )}
          {screen === "weekly" && (
            <WeeklyView
              onAddLecture={() => setShowAddModal(true)}
              onBack={() => setScreen("dashboard")}
              onExport={() => setShowExport(true)}
              userId={user?.id}
            />
          )}
          {screen === "attendance" && (
            <AttendanceCalculator
              onBack={() => setScreen("dashboard")}
              timetableLectures={lectures}
            />
          )}
        </div>

        {/* Add Lecture Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-end bg-foreground/40 backdrop-blur-sm">
            <div className="w-full max-w-md mx-auto bg-card rounded-t-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
              <AddLectureForm
                onAdd={(lecture) => { addLecture(lecture); setShowAddModal(false); }}
                onClose={() => setShowAddModal(false)}
              />
            </div>
          </div>
        )}

        {/* Reset Confirm Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm px-4">
            <div className="w-full max-w-xs bg-card rounded-2xl p-6 shadow-2xl">
              <h2 className="text-lg font-bold text-foreground mb-1">Reset Timetable?</h2>
              <p className="text-sm text-muted-foreground mb-5">
                This will permanently delete all your saved lectures and breaks. This cannot be undone.
              </p>
              <div className="space-y-2">
                <button
                  onClick={confirmReset}
                  className="w-full h-11 rounded-lg bg-destructive text-destructive-foreground font-semibold text-sm"
                >
                  Yes, Reset Everything
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="w-full h-11 rounded-lg bg-secondary text-secondary-foreground font-semibold text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Export Modal */}
        {showExport && <ExportModal onClose={() => setShowExport(false)} userId={user?.id} />}
      </div>
    </ThemeProvider>
  );
};

export default Index;
