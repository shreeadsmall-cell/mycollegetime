import { useState, useRef } from "react";
import { Lecture } from "@/hooks/useTimetable";
import { Button } from "@/components/ui/button";
import { Upload, FileImage, FileText, X, CheckCircle, AlertCircle, Loader2, Sparkles } from "lucide-react";

interface TimetableUploadProps {
  onImport: (lectures: Omit<Lecture, "id">[]) => void;
  onClose: () => void;
}

type UploadState = "idle" | "loading" | "success" | "error";

export function TimetableUpload({ onImport, onClose }: TimetableUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [previewFile, setPreviewFile] = useState<{ name: string; type: string } | null>(null);
  const [extractedCount, setExtractedCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const processFile = async (file: File) => {
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      setErrorMessage("Please upload a JPG, PNG, WEBP, or PDF file.");
      setUploadState("error");
      return;
    }
    if (file.size > maxSize) {
      setErrorMessage("File is too large. Maximum size is 10MB.");
      setUploadState("error");
      return;
    }

    setPreviewFile({ name: file.name, type: file.type });
    setUploadState("loading");
    setErrorMessage("");

    // For PDF: convert first page to image via canvas isn't possible in browser,
    // so we send the PDF directly — the AI can handle it via base64.
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/parse-timetable`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to parse timetable.");
      }

      setExtractedCount(data.total);
      setUploadState("success");

      // Small delay so user sees success state
      setTimeout(() => {
        onImport(data.entries);
      }, 1200);
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setUploadState("error");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input value so same file can be re-selected
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const reset = () => {
    setUploadState("idle");
    setPreviewFile(null);
    setErrorMessage("");
    setExtractedCount(0);
  };

  const isPdf = previewFile?.type === "application/pdf";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            AI Timetable Import
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload a photo or PDF of your timetable
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
        >
          <X size={20} />
        </button>
      </div>

      {/* Drop zone */}
      {uploadState === "idle" && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <Upload
            size={36}
            className={`mx-auto mb-3 transition-colors ${
              isDragging ? "text-primary" : "text-muted-foreground"
            }`}
          />
          <p className="text-sm font-semibold text-foreground mb-1">
            {isDragging ? "Drop it here!" : "Tap to upload or drag & drop"}
          </p>
          <p className="text-xs text-muted-foreground">
            Supports JPG, PNG, WEBP, PDF — up to 10MB
          </p>

          {/* File type chips */}
          <div className="flex justify-center gap-2 mt-4">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-background border border-border text-xs text-muted-foreground">
              <FileImage size={12} /> Image
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-background border border-border text-xs text-muted-foreground">
              <FileText size={12} /> PDF
            </span>
          </div>
        </div>
      )}

      {/* Loading state */}
      {uploadState === "loading" && (
        <div className="border-2 border-primary/30 rounded-xl p-8 text-center bg-primary/5">
          <div className="flex items-center justify-center gap-2 mb-3">
            {isPdf ? <FileText size={22} className="text-primary" /> : <FileImage size={22} className="text-primary" />}
            <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
              {previewFile?.name}
            </span>
          </div>
          <Loader2 size={32} className="mx-auto mb-3 animate-spin text-primary" />
          <p className="text-sm font-semibold text-foreground">AI is reading your timetable…</p>
          <p className="text-xs text-muted-foreground mt-1">This takes 5–15 seconds</p>
        </div>
      )}

      {/* Success state */}
      {uploadState === "success" && (
        <div className="border-2 border-[hsl(var(--current))] rounded-xl p-8 text-center bg-[hsl(var(--current-bg))]">
          <CheckCircle size={40} className="mx-auto mb-3 text-[hsl(var(--current))]" />
          <p className="text-base font-bold text-foreground">
            {extractedCount} {extractedCount === 1 ? "entry" : "entries"} found!
          </p>
          <p className="text-xs text-muted-foreground mt-1">Adding to your timetable…</p>
        </div>
      )}

      {/* Error state */}
      {uploadState === "error" && (
        <div className="border-2 border-destructive/40 rounded-xl p-6 text-center bg-destructive/5">
          <AlertCircle size={32} className="mx-auto mb-2 text-destructive" />
          <p className="text-sm font-semibold text-foreground mb-1">Could not parse timetable</p>
          <p className="text-xs text-muted-foreground mb-4">{errorMessage}</p>
          <Button
            onClick={reset}
            variant="outline"
            size="sm"
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Tips */}
      {uploadState === "idle" && (
        <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 space-y-1.5">
          <p className="text-xs font-semibold text-foreground">Tips for best results:</p>
          <ul className="space-y-1">
            {[
              "Use a clear, well-lit photo of your timetable",
              "Ensure all days, times, and subjects are visible",
              "PDF exports from your college portal work great",
              "Avoid blurry or cropped images",
            ].map((tip) => (
              <li key={tip} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="text-primary mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
