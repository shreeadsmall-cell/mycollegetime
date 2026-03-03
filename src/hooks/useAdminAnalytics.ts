import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsData {
  totalUsers: number;
  activeToday: number;
  avgSessionDuration: number;
  topFeatures: { name: string; count: number }[];
  topPages: { name: string; count: number }[];
  userGrowth: { date: string; count: number }[];
  adStats: { ad_id: string; title: string; impressions: number; clicks: number; skips: number; completes: number }[];
  totalRevenue: number;
  monthlyRevenue: { month: string; amount: number }[];
}

export function useAdminAnalytics() {
  const [data, setData] = useState<AnalyticsData>({
    totalUsers: 0, activeToday: 0, avgSessionDuration: 0,
    topFeatures: [], topPages: [], userGrowth: [], adStats: [],
    totalRevenue: 0, monthlyRevenue: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // Total users
      const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true });

      // Active today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count: activeToday } = await supabase
        .from("user_sessions")
        .select("*", { count: "exact", head: true })
        .gte("started_at", todayStart.toISOString());

      // Avg session duration
      const { data: sessions } = await supabase
        .from("user_sessions")
        .select("duration_seconds")
        .gt("duration_seconds", 0)
        .order("started_at", { ascending: false })
        .limit(100);
      const avgDuration = sessions?.length
        ? Math.round(sessions.reduce((s, r) => s + (r.duration_seconds || 0), 0) / sessions.length)
        : 0;

      // Top features
      const { data: features } = await supabase
        .from("feature_usage")
        .select("feature_name")
        .order("used_at", { ascending: false })
        .limit(500);
      const featureCounts: Record<string, number> = {};
      features?.forEach((f) => { featureCounts[f.feature_name] = (featureCounts[f.feature_name] || 0) + 1; });
      const topFeatures = Object.entries(featureCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Top pages
      const { data: pages } = await supabase
        .from("page_visits")
        .select("page_name")
        .order("visited_at", { ascending: false })
        .limit(500);
      const pageCounts: Record<string, number> = {};
      pages?.forEach((p) => { pageCounts[p.page_name] = (pageCounts[p.page_name] || 0) + 1; });
      const topPages = Object.entries(pageCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // User growth (last 7 days)
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("created_at")
        .order("created_at", { ascending: true });
      const growthMap: Record<string, number> = {};
      profilesData?.forEach((p) => {
        const date = new Date(p.created_at).toLocaleDateString();
        growthMap[date] = (growthMap[date] || 0) + 1;
      });
      let cumulative = 0;
      const userGrowth = Object.entries(growthMap).map(([date, count]) => {
        cumulative += count;
        return { date, count: cumulative };
      });

      // Ad analytics
      const { data: adAnalytics } = await supabase.from("ad_analytics").select("ad_id, event_type");
      const { data: allAds } = await supabase.from("ads").select("id, title");
      const adMap: Record<string, { title: string; impressions: number; clicks: number; skips: number; completes: number }> = {};
      allAds?.forEach((a) => { adMap[a.id] = { title: a.title, impressions: 0, clicks: 0, skips: 0, completes: 0 }; });
      adAnalytics?.forEach((e) => {
        if (!adMap[e.ad_id]) return;
        if (e.event_type === "impression") adMap[e.ad_id].impressions++;
        else if (e.event_type === "click") adMap[e.ad_id].clicks++;
        else if (e.event_type === "skip") adMap[e.ad_id].skips++;
        else if (e.event_type === "complete") adMap[e.ad_id].completes++;
      });
      const adStats = Object.entries(adMap).map(([ad_id, stats]) => ({ ad_id, ...stats }));

      // Revenue
      const { data: revenue } = await supabase.from("revenue_records").select("amount, recorded_at");
      const totalRevenue = revenue?.reduce((s, r) => s + Number(r.amount), 0) || 0;
      const monthMap: Record<string, number> = {};
      revenue?.forEach((r) => {
        const m = new Date(r.recorded_at).toLocaleDateString("en-US", { month: "short", year: "numeric" });
        monthMap[m] = (monthMap[m] || 0) + Number(r.amount);
      });
      const monthlyRevenue = Object.entries(monthMap).map(([month, amount]) => ({ month, amount }));

      setData({
        totalUsers: totalUsers || 0,
        activeToday: activeToday || 0,
        avgSessionDuration: avgDuration,
        topFeatures,
        topPages,
        userGrowth,
        adStats,
        totalRevenue,
        monthlyRevenue,
      });
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { data, loading, refresh: fetchAll };
}
