import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Announcement {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  is_active: boolean;
  created_at: string;
}

const CACHE_KEY = "collegetime_announcements_cache";

function getCached(): Announcement[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(getCached);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20);
      if (!error && data) {
        setAnnouncements(data as Announcement[]);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      }
    } catch {
      // use cached
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { announcements, loading, refresh: fetch };
}

// Admin-only hooks
export function useAdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAnnouncements(data as Announcement[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async (ann: { title: string; content?: string; image_url?: string; video_url?: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("announcements").insert({ ...ann, created_by: user.id });
    fetchAll();
  };

  const toggle = async (id: string, is_active: boolean) => {
    await supabase.from("announcements").update({ is_active }).eq("id", id);
    fetchAll();
  };

  const remove = async (id: string) => {
    await supabase.from("announcements").delete().eq("id", id);
    fetchAll();
  };

  return { announcements, loading, create, toggle, remove, refresh: fetchAll };
}
