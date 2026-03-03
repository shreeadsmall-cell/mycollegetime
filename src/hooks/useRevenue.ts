import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RevenueRecord {
  id: string;
  promotion_id: string | null;
  ad_id: string | null;
  amount: number;
  type: string;
  description: string | null;
  recorded_at: string;
}

export function useRevenue() {
  const [records, setRecords] = useState<RevenueRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("revenue_records")
      .select("*")
      .order("recorded_at", { ascending: false });
    if (data) setRecords(data as RevenueRecord[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addRecord = async (record: {
    amount: number; type: string; description?: string;
    promotion_id?: string; ad_id?: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("revenue_records").insert({ ...record, created_by: user.id });
    fetchAll();
  };

  const totalRevenue = records.reduce((s, r) => s + Number(r.amount), 0);

  return { records, loading, addRecord, totalRevenue, refresh: fetchAll };
}
