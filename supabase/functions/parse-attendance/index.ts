import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mimeType = file.type;
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    let binary = "";
    for (let i = 0; i < uint8.byteLength; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    const base64Data = btoa(binary);

    const messages = [
      {
        role: "system",
        content: `You are an attendance report extraction assistant. Extract attendance data from the provided image or PDF.

Return ONLY a valid JSON array with objects following this exact structure:
[
  {
    "subject": "Mathematics",
    "totalLectures": 40,
    "attendedLectures": 32,
    "percentage": 80.0
  }
]

Rules:
- subject: The exact subject/course name as shown
- totalLectures: Total number of lectures/classes conducted (integer)
- attendedLectures: Number of lectures/classes attended (integer)
- percentage: Current attendance percentage (number with up to 1 decimal)
- If percentage is not shown, calculate it as (attendedLectures / totalLectures) * 100
- Include ALL subjects visible in the report
- Return ONLY the JSON array, no markdown, no explanation, no code blocks`,
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64Data}`,
            },
          },
          {
            type: "text",
            text: "Extract all attendance data from this report. Return only the JSON array.",
          },
        ],
      },
    ];

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages,
          max_tokens: 8000,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const rawContent = aiResult.choices?.[0]?.message?.content ?? "";

    let cleaned = rawContent
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/gi, "")
      .trim();

    const arrayStart = cleaned.indexOf("[");
    const arrayEnd = cleaned.lastIndexOf("]");
    if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
      cleaned = cleaned.slice(arrayStart, arrayEnd + 1);
    }

    let entries;
    try {
      entries = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI output:", cleaned.slice(0, 500));
      return new Response(
        JSON.stringify({ error: "Could not parse attendance data. Please ensure the image is clear." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Array.isArray(entries) || entries.length === 0) {
      return new Response(
        JSON.stringify({ error: "No attendance data found. Please upload a clear attendance report." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validEntries = entries.filter((e: unknown) => {
      if (typeof e !== "object" || e === null) return false;
      const entry = e as Record<string, unknown>;
      return (
        typeof entry.subject === "string" &&
        entry.subject.trim().length > 0 &&
        typeof entry.totalLectures === "number" &&
        entry.totalLectures > 0 &&
        typeof entry.attendedLectures === "number" &&
        entry.attendedLectures >= 0
      );
    }).map((e: Record<string, unknown>) => ({
      subject: String(e.subject).trim(),
      totalLectures: Number(e.totalLectures),
      attendedLectures: Number(e.attendedLectures),
      percentage: typeof e.percentage === "number"
        ? Math.round(e.percentage * 10) / 10
        : Math.round((Number(e.attendedLectures) / Number(e.totalLectures)) * 1000) / 10,
    }));

    if (validEntries.length === 0) {
      return new Response(
        JSON.stringify({ error: "Extracted data was not in a valid format. Please try a clearer image." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ subjects: validEntries, total: validEntries.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("parse-attendance error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
