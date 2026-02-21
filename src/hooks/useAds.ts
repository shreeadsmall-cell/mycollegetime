import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Ad {
  id: string;
  title: string;
  media_type: string;
  media_url: string;
  click_url: string | null;
  delay_seconds: number;
  skip_after_seconds: number;
  duration_seconds: number;
  max_views_per_day: number;
  is_active: boolean;
  created_at: string;
}

const CACHE_KEY = "collegetime_ads_cache";
const VIEW_KEY = "collegetime_ad_views";

function getCached(): Ad[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function getTodayViews(): Record<string, number> {
  try {
    const raw = localStorage.getItem(VIEW_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const today = new Date().toDateString();
    if (parsed.date !== today) return {};
    return parsed.views || {};
  } catch { return {}; }
}

function recordView(adId: string) {
  const today = new Date().toDateString();
  const views = getTodayViews();
  views[adId] = (views[adId] || 0) + 1;
  localStorage.setItem(VIEW_KEY, JSON.stringify({ date: today, views }));
}

export function useAds() {
  const [ads, setAds] = useState<Ad[]>(getCached);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (!error && data) {
        setAds(data as Ad[]);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      }
    } catch {
      // use cached
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const getNextAd = useCallback((): Ad | null => {
    const views = getTodayViews();
    const eligible = ads.filter((ad) => (views[ad.id] || 0) < ad.max_views_per_day);
    if (eligible.length === 0) return null;
    return eligible[Math.floor(Math.random() * eligible.length)];
  }, [ads]);

  return { ads, loading, getNextAd, recordView, refresh: fetch };
}

// Admin hooks
export function useAdminAds() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("ads")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAds(data as Ad[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async (ad: Omit<Ad, "id" | "is_active" | "created_at">) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("ads").insert({ ...ad, created_by: user.id });
    fetchAll();
  };

  const toggle = async (id: string, is_active: boolean) => {
    await supabase.from("ads").update({ is_active }).eq("id", id);
    fetchAll();
  };

  const remove = async (id: string) => {
    await supabase.from("ads").delete().eq("id", id);
    fetchAll();
  };

  return { ads, loading, create, toggle, remove, refresh: fetchAll };
}
