import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Promotion {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  media_url: string;
  media_type: string;
  duration_days: number;
  budget: number;
  status: string;
  admin_notes: string | null;
  cost_per_day: number;
  cost_per_1000_impressions: number;
  is_featured: boolean;
  approved_at: string | null;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export function usePromotions(userId?: string | null) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMine = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("promotions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (data) setPromotions(data as Promotion[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchMine(); }, [fetchMine]);

  const submit = async (promo: {
    title: string; description?: string; media_url: string; media_type: string;
    duration_days: number; budget: number; is_featured?: boolean;
  }) => {
    if (!userId) return;
    await supabase.from("promotions").insert({ ...promo, user_id: userId });
    fetchMine();
  };

  return { promotions, loading, submit, refresh: fetchMine };
}

export function useAdminPromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("promotions")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPromotions(data as Promotion[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateStatus = async (id: string, status: string, notes?: string) => {
    const updates: Record<string, unknown> = { status };
    if (notes) updates.admin_notes = notes;
    if (status === "approved") {
      updates.approved_at = new Date().toISOString();
      const promo = promotions.find((p) => p.id === id);
      if (promo) {
        updates.starts_at = new Date().toISOString();
        const exp = new Date();
        exp.setDate(exp.getDate() + promo.duration_days);
        updates.expires_at = exp.toISOString();
      }
    }
    await supabase.from("promotions").update(updates).eq("id", id);
    fetchAll();
  };

  const remove = async (id: string) => {
    await supabase.from("promotions").delete().eq("id", id);
    fetchAll();
  };

  return { promotions, loading, updateStatus, remove, refresh: fetchAll };
}
