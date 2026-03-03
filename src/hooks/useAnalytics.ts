import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "collegetime_session_id";

export function useAnalytics(userId?: string | null) {
  const sessionId = useRef<string | null>(null);
  const startTime = useRef(Date.now());

  // Start session
  useEffect(() => {
    if (!userId) return;

    const startSession = async () => {
      const { data } = await supabase
        .from("user_sessions")
        .insert({ user_id: userId })
        .select("id")
        .single();
      if (data) {
        sessionId.current = data.id;
        localStorage.setItem(SESSION_KEY, data.id);
      }
    };

    startSession();
    startTime.current = Date.now();

    // End session on unload
    const endSession = () => {
      if (!sessionId.current) return;
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      // Use sendBeacon for reliability
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_sessions?id=eq.${sessionId.current}`;
      const body = JSON.stringify({ ended_at: new Date().toISOString(), duration_seconds: duration });
      navigator.sendBeacon?.(url, new Blob([body], { type: "application/json" }));
    };

    window.addEventListener("beforeunload", endSession);
    return () => {
      endSession();
      window.removeEventListener("beforeunload", endSession);
    };
  }, [userId]);

  const trackFeature = useCallback(async (featureName: string) => {
    if (!userId) return;
    await supabase.from("feature_usage").insert({ user_id: userId, feature_name: featureName });
  }, [userId]);

  const trackPage = useCallback(async (pageName: string) => {
    if (!userId) return;
    await supabase.from("page_visits").insert({ user_id: userId, page_name: pageName });
  }, [userId]);

  const trackAdEvent = useCallback(async (adId: string, eventType: string, durationSeconds = 0) => {
    if (!userId) return;
    await supabase.from("ad_analytics").insert({
      ad_id: adId,
      user_id: userId,
      event_type: eventType,
      view_duration_seconds: durationSeconds,
    });
  }, [userId]);

  return { trackFeature, trackPage, trackAdEvent };
}
