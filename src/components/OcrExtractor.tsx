import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Upload, FileText, FileImage, X, Copy, Download, Trash2,
  Loader2, CheckCircle, AlertCircle, ArrowLeft, ScanText
} from "lucide-react";
import { toast } from "sonner";

interface OcrExtractorProps {
  onBack: () => void;
}

type ProcessingState = "idle" | "uploading" | "processing-server" | "processing-client" | "done" | "error";

export function OcrExtractor({ onBack }: OcrExtractorProps) {
  const [state, setState] = useState<ProcessingState>("idle");
  const [extractedText, setExtractedText] = useState("");
  const [fileName, setFileName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf"];

  const processWithTesseract = useCallback(async (file: File) => {
    setState("processing-client");
    setProgress(10);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: (m: any) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(10 + m.progress * 85));
          }
        },
      });
      const { data } = await worker.recognize(file);
      await worker.terminate();

      if (!data.text.trim()) {
        throw new Error("No text could be extracted from this file.");
      }

      setExtractedText(data.text);
      setPageCount(1);
      setProgress(100);
      setState("done");
      toast.success("Text extracted using browser OCR");
    } catch (err) {
      console.error("Tesseract error:", err);
      setErrorMsg(err instanceof Error ? err.message : "Client-side OCR failed.");
      setState("error");
    }
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Unsupported file type. Please upload JPG, PNG, or PDF.");
      setState("error");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg("File is too large. Maximum 20MB allowed.");
      setState("error");
      return;
    }

    setFileName(file.name);
    setExtractedText("");
    setErrorMsg("");
    setProgress(0);
    setState("uploading");

    // Try server-side OCR.space first
    const form = new FormData();
    form.append("file", file);

    try {
      setState("processing-server");
      setProgress(30);

      const res = await fetch(`${SUPABASE_URL}/functions/v1/ocr-extract`, {
        method: "POST",
        headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: form,
      });

      const data = await res.json();

      if (!res.ok || data.fallback) {
        // Fallback to Tesseract.js
        if (file.type === "application/pdf") {
          setErrorMsg("Free OCR API limit reached for PDFs. Please try an image instead, or try again later.");
          setState("error");
          return;
        }
        await processWithTesseract(file);
        return;
      }

      setExtractedText(data.text);
      setPageCount(data.pages || 1);
      setProgress(100);
      setState("done");
      toast.success(`Text extracted from ${data.pages || 1} page(s)`);
    } catch {
      // Network error → fallback
      if (file.type === "application/pdf") {
        setErrorMsg("Cannot process PDF offline. Please use an image file instead.");
        setState("error");
        return;
      }
      await processWithTesseract(file);
    }
  }, [SUPABASE_URL, SUPABASE_ANON_KEY, processWithTesseract]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const copyText = () => {
    navigator.clipboard.writeText(extractedText);
    toast.success("Copied to clipboard");
  };

  const downloadText = () => {
    const blob = new Blob([extractedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName.replace(/\.[^.]+$/, "")}_extracted.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded as .txt file");
  };

  const clearAll = () => {
    setState("idle");
    setExtractedText("");
    setFileName("");
    setErrorMsg("");
    setProgress(0);
    setPageCount(0);
  };

  const isPdf = fileName.endsWith(".pdf");

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onBack} className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <ScanText size={20} />
              Text Extractor
            </h1>
            <p className="text-xs opacity-80 mt-0.5">Free PDF & Image OCR</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 -mt-4 space-y-4">
        {/* Upload Card */}
        {state === "idle" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Upload File</CardTitle>
              <CardDescription>JPG, PNG, or PDF — up to 20MB</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-primary bg-primary/10"
                    : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload size={36} className={`mx-auto mb-3 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                <p className="text-sm font-semibold text-foreground mb-1">
                  {isDragging ? "Drop it here!" : "Tap to upload or drag & drop"}
                </p>
                <p className="text-xs text-muted-foreground">Supports JPG, PNG, PDF</p>
                <div className="flex justify-center gap-2 mt-4">
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-background border border-border text-xs text-muted-foreground">
                    <FileImage size={12} /> Image
                  </span>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-background border border-border text-xs text-muted-foreground">
                    <FileText size={12} /> PDF
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-3">
                Powered by Free OCR API • No files stored
              </p>
            </CardContent>
          </Card>
        )}

        {/* Processing State */}
        {(state === "uploading" || state === "processing-server" || state === "processing-client") && (
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                {isPdf ? <FileText size={20} className="text-primary" /> : <FileImage size={20} className="text-primary" />}
                <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{fileName}</span>
              </div>
              <Loader2 size={32} className="mx-auto animate-spin text-primary" />
              <p className="text-sm font-semibold text-foreground">
                {state === "uploading" && "Uploading file…"}
                {state === "processing-server" && "Extracting text with OCR API…"}
                {state === "processing-client" && "Processing with browser OCR…"}
              </p>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {state === "processing-client" ? "This may take 15–30 seconds" : "This takes 5–15 seconds"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {state === "done" && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-primary" />
                    <CardTitle className="text-base">Extracted Text</CardTitle>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {pageCount} {pageCount === 1 ? "page" : "pages"}
                  </span>
                </div>
                <CardDescription className="text-xs">{fileName}</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] w-full rounded-lg border border-border bg-muted/30 p-3">
                  <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                    {extractedText}
                  </pre>
                </ScrollArea>

                <div className="flex gap-2 mt-4">
                  <Button onClick={copyText} variant="outline" size="sm" className="flex-1 gap-1.5">
                    <Copy size={14} /> Copy
                  </Button>
                  <Button onClick={downloadText} variant="outline" size="sm" className="flex-1 gap-1.5">
                    <Download size={14} /> Download .txt
                  </Button>
                  <Button onClick={clearAll} variant="outline" size="sm" className="gap-1.5 text-destructive border-destructive/30">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-card border rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-foreground">{extractedText.split(/\s+/).filter(Boolean).length}</p>
                <p className="text-[10px] text-muted-foreground">Words</p>
              </div>
              <div className="bg-card border rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-foreground">{extractedText.length}</p>
                <p className="text-[10px] text-muted-foreground">Characters</p>
              </div>
              <div className="bg-card border rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-foreground">{extractedText.split("\n").filter(Boolean).length}</p>
                <p className="text-[10px] text-muted-foreground">Lines</p>
              </div>
            </div>

            <Button onClick={clearAll} className="w-full gap-2" variant="secondary">
              <Upload size={16} /> Extract Another File
            </Button>
          </>
        )}

        {/* Error */}
        {state === "error" && (
          <Card className="border-destructive/40">
            <CardContent className="pt-6 text-center space-y-3">
              <AlertCircle size={32} className="mx-auto text-destructive" />
              <p className="text-sm font-semibold text-foreground">Extraction Failed</p>
              <p className="text-xs text-muted-foreground">{errorMsg}</p>
              <Button onClick={clearAll} variant="outline" size="sm" className="border-destructive/50 text-destructive">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        {state === "idle" && (
          <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 space-y-1.5">
            <p className="text-xs font-semibold text-foreground">Tips for best results:</p>
            <ul className="space-y-1">
              {[
                "Use clear, high-resolution images",
                "Ensure text is well-lit and not blurry",
                "PDF files work best for multi-page documents",
                "Supported languages: English (primary)",
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
    </div>
  );
}
