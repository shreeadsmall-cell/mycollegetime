import { useState, useRef } from "react";
import { useTimetable, DayOfWeek, Lecture } from "@/hooks/useTimetable";
import { X, Printer, Download, Upload, FileJson, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

interface ExportModalProps {
  onClose: () => void;
  userId?: string | null;
}

export function ExportModal({ onClose, userId }: ExportModalProps) {
  const { lectures, addLecture } = useTimetable(userId);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePrint = () => {
    const printContent = generatePrintHTML(lectures);
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(printContent);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 500);
  };

  // Export timetable as a JSON file
  const handleExportJSON = () => {
    const data = JSON.stringify({ version: 1, lectures }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `collegetime-timetable-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import timetable from a JSON file
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError("");
    setImportSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        const entries: Lecture[] = parsed.lectures ?? parsed;
        if (!Array.isArray(entries) || entries.length === 0) throw new Error("No entries found");
        for (const entry of entries) {
          await addLecture({
            day: entry.day,
            name: entry.name,
            startTime: entry.startTime,
            endTime: entry.endTime,
            type: entry.type,
          });
        }
        setImportSuccess(true);
        setTimeout(() => onClose(), 1500);
      } catch {
        setImportError("Invalid file. Please use a CollegeTime export file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const generatePrintHTML = (lectures: Lecture[]) => {
    const dayRows = DAYS.map((day) => {
      const dayLectures = lectures
        .filter((l) => l.day === day)
        .sort((a, b) => {
          const toM = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
          return toM(a.startTime) - toM(b.startTime);
        });

      const rows = dayLectures.length === 0
        ? `<tr><td colspan="4" style="color:#999;font-style:italic;text-align:center;padding:10px 8px;">No classes</td></tr>`
        : dayLectures.map((l) => `
          <tr>
            <td style="padding:8px 10px;font-weight:600;color:${l.type === "Break" ? "#d97706" : "#1d4ed8"}">${l.name}</td>
            <td style="padding:8px 10px;color:#555">${formatTime(l.startTime)}</td>
            <td style="padding:8px 10px;color:#555">${formatTime(l.endTime)}</td>
            <td style="padding:8px 10px;">
              <span style="display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700;
                background:${l.type === "Break" ? "#fef3c7" : "#dbeafe"};
                color:${l.type === "Break" ? "#d97706" : "#1d4ed8"}">
                ${l.type}
              </span>
            </td>
          </tr>`).join("");

      return `
        <tr style="background:#f1f5f9">
          <td colspan="4" style="padding:8px 10px;font-weight:800;font-size:14px;color:#0f172a;border-top:2px solid #e2e8f0">${day}</td>
        </tr>
        ${rows}`;
    }).join("");

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>My Weekly Timetable</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; background: #fff; }
    .header { background: #1e3a8a; color: #fff; padding: 24px 32px; }
    .header h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { font-size: 13px; opacity: 0.75; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1e3a8a; color: #fff; padding: 10px; text-align: left; font-size: 13px; }
    td { border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    tr:last-child td { border-bottom: none; }
    .footer { text-align: center; padding: 16px; font-size: 11px; color: #94a3b8; margin-top: 16px; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📚 My Weekly Timetable</h1>
    <p>Generated on ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Subject / Name</th>
        <th>Start Time</th>
        <th>End Time</th>
        <th>Type</th>
      </tr>
    </thead>
    <tbody>
      ${dayRows}
    </tbody>
  </table>
  <div class="footer">CollegeTime — Your Weekly Timetable</div>
</body>
</html>`;
  };

  const totalLectures = lectures.filter((l) => l.type === "Lecture").length;
  const totalBreaks = lectures.filter((l) => l.type === "Break").length;
  const activeDays = [...new Set(lectures.map((l) => l.day))].length;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-foreground/40 backdrop-blur-sm">
      <div className="w-full max-w-md mx-auto bg-card rounded-t-2xl p-5 shadow-2xl">
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Export / Import</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: "Lectures", value: totalLectures },
            { label: "Breaks", value: totalBreaks },
            { label: "Days", value: activeDays },
          ].map(({ label, value }) => (
            <div key={label} className="bg-secondary rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {importSuccess ? (
          <div className="flex flex-col items-center py-4 gap-2 text-[hsl(var(--current))]">
            <CheckCircle size={36} />
            <p className="font-semibold text-sm">Timetable imported successfully!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Print PDF */}
            <Button
              onClick={handlePrint}
              className="w-full h-12 gap-2 font-semibold text-base bg-primary text-primary-foreground"
            >
              <Printer size={18} /> Print / Save as PDF
            </Button>

            {/* Export JSON */}
            <Button
              onClick={handleExportJSON}
              variant="outline"
              className="w-full h-12 gap-2 font-semibold text-base border-border text-foreground"
            >
              <Download size={18} /> Export as File (.json)
            </Button>

            {/* Import JSON */}
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportJSON}
              className="hidden"
            />
            <Button
              onClick={() => fileRef.current?.click()}
              variant="outline"
              className="w-full h-12 gap-2 font-semibold text-base border-border text-foreground"
            >
              <Upload size={18} /> Import from File
            </Button>

            {importError && (
              <p className="text-xs text-destructive text-center">{importError}</p>
            )}

            <p className="text-center text-xs text-muted-foreground px-2 pt-1">
              Export your timetable as a file, then import it on another device to sync.
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-3 h-10 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
