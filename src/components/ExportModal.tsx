import { useState } from "react";
import { useTimetable, DayOfWeek } from "@/hooks/useTimetable";
import { X, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function getDuration(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

interface ExportModalProps {
  onClose: () => void;
}

export function ExportModal({ onClose }: ExportModalProps) {
  const { lectures } = useTimetable();

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

  const handleDownloadPNG = async () => {
    // Use html2canvas-like approach via a hidden iframe + print to PDF
    // We'll generate HTML and prompt to save as PDF via print dialog
    handlePrint();
  };

  const generatePrintHTML = (lectures: ReturnType<typeof useTimetable>["lectures"]) => {
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
          <h2 className="text-lg font-bold text-foreground">Export Timetable</h2>
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

        <div className="space-y-2">
          <Button
            onClick={handlePrint}
            className="w-full h-12 gap-2 font-semibold text-base bg-primary text-primary-foreground"
          >
            <Printer size={18} /> Print / Save as PDF
          </Button>
          <p className="text-center text-xs text-muted-foreground px-4">
            Opens a print dialog — choose "Save as PDF" to export as a file, or print directly.
          </p>
        </div>

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
