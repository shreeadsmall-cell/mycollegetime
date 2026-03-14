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

    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < uint8.byteLength; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    const base64Data = btoa(binary);

    const mimeType = file.type || "image/jpeg";

    const systemPrompt = `You are a timetable extraction assistant. Extract lecture schedule entries from the provided image or PDF.

Return ONLY a valid JSON array with objects following this exact structure:
[
  {
    "day": "Monday",
    "name": "Mathematics",
    "startTime": "09:00",
    "endTime": "10:00",
    "type": "Lecture"
  }
]

Rules:
- day must be one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
- startTime and endTime must be in 24-hour HH:mm format
- type must be either "Lecture" or "Break"
- name should be the subject or break label exactly as shown
- Include ALL entries visible: lectures, labs, tutorials, breaks, free periods
- Return ONLY the JSON array, no markdown, no explanation, no code blocks`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
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
                  text: "Extract all timetable entries from this image. Return only the JSON array.",
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const rawContent = aiResult.choices?.[0]?.message?.content ?? "";
    console.log("AI raw content length:", rawContent.length);

    let cleaned = rawContent.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

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
        JSON.stringify({ error: "Could not parse the timetable. Please ensure the image is clear." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Array.isArray(entries) || entries.length === 0) {
      return new Response(
        JSON.stringify({ error: "No timetable entries found. Please upload a clear timetable photo." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const validEntries = entries.filter((e: unknown) => {
      if (typeof e !== "object" || e === null) return false;
      const entry = e as Record<string, unknown>;
      return (
        typeof entry.day === "string" && DAYS.includes(entry.day) &&
        typeof entry.name === "string" && (entry.name as string).trim().length > 0 &&
        typeof entry.startTime === "string" && /^\d{2}:\d{2}$/.test(entry.startTime as string) &&
        typeof entry.endTime === "string" && /^\d{2}:\d{2}$/.test(entry.endTime as string) &&
        (entry.type === "Lecture" || entry.type === "Break")
      );
    });

    if (validEntries.length === 0) {
      return new Response(
        JSON.stringify({ error: "Extracted entries were not valid. Please try a clearer image." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ entries: validEntries, total: validEntries.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("parse-timetable error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
