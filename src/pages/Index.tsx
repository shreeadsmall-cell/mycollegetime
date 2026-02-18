import { useState } from "react";
import { useTimetable } from "@/hooks/useTimetable";
import { TimetableSetup } from "@/components/TimetableSetup";
import { Dashboard } from "@/components/Dashboard";
import { WeeklyView } from "@/components/WeeklyView";
import { AddLectureForm } from "@/components/AddLectureForm";

type Screen = "setup" | "dashboard" | "weekly" | "add";

const Index = () => {
  const { hasSetup, addLecture, resetTimetable } = useTimetable();
  const [screen, setScreen] = useState<Screen>(hasSetup ? "dashboard" : "setup");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    resetTimetable();
    setShowResetConfirm(false);
    setScreen("setup");
  };

  return (
    <div className="max-w-md mx-auto relative">
      {/* Screens */}
      {screen === "setup" && (
        <TimetableSetup onDone={() => setScreen("dashboard")} />
      )}
      {screen === "dashboard" && (
        <Dashboard
          onAddLecture={() => setShowAddModal(true)}
          onReset={handleReset}
          onViewWeekly={() => setScreen("weekly")}
        />
      )}
      {screen === "weekly" && (
        <WeeklyView
          onAddLecture={() => setShowAddModal(true)}
          onBack={() => setScreen("dashboard")}
        />
      )}

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
    </div>
  );
};

export default Index;
