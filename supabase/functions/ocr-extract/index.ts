import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const maxSize = 5 * 1024 * 1024; // OCR.space free limit ~5MB
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: "File too large for free OCR API (max 5MB). Fallback to client-side OCR.", fallback: true }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build form data for OCR.space
    const ocrForm = new FormData();
    ocrForm.append("file", file);
    ocrForm.append("language", "eng");
    ocrForm.append("isOverlayRequired", "false");
    ocrForm.append("detectOrientation", "true");
    ocrForm.append("scale", "true");
    ocrForm.append("OCREngine", "2");

    // PDF-specific
    if (file.type === "application/pdf") {
      ocrForm.append("isTable", "true");
    }

    const apiKey = Deno.env.get("OCR_SPACE_API_KEY") || "helloworld";

    const ocrRes = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: { apikey: apiKey },
      body: ocrForm,
    });

    if (!ocrRes.ok) {
      return new Response(
        JSON.stringify({ error: "OCR API request failed", fallback: true }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await ocrRes.json();

    if (result.IsErroredOnProcessing) {
      const errMsg = result.ErrorMessage?.[0] || "OCR processing error";
      return new Response(
        JSON.stringify({ error: errMsg, fallback: true }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract text from all pages
    const pages = result.ParsedResults || [];
    const extractedText = pages.map((p: any) => p.ParsedText || "").join("\n\n--- Page Break ---\n\n");

    return new Response(
      JSON.stringify({
        text: extractedText.trim(),
        pages: pages.length,
        exitCode: result.OCRExitCode,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("OCR error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", fallback: true }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
