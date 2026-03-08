import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useAdminAnnouncements } from "@/hooks/useAnnouncements";
import { useAdminAds, Ad } from "@/hooks/useAds";
import { useAdminAnalytics } from "@/hooks/useAdminAnalytics";
import { useAdminPromotions } from "@/hooks/usePromotions";
import { useRevenue } from "@/hooks/useRevenue";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Shield, Megaphone, Image as ImageIcon, Video, Plus,
  Trash2, ToggleLeft, ToggleRight, Loader2, Users, BarChart3,
  DollarSign, TrendingUp, Eye, Clock, CheckCircle,
  XCircle, Star, Sparkles, Link as LinkIcon, CalendarIcon, Pencil
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Tab = "analytics" | "announcements" | "ads" | "promotions" | "revenue" | "users";

function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return true;
  if (lower.match(/\.(mp4|webm|ogg|mov)(\?|$)/)) return true;
  return false;
}

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin(user?.id);
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("analytics");

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 text-center">
        <Shield size={48} className="text-destructive mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-sm text-muted-foreground mb-4">You don't have admin privileges.</p>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  const tabs = [
    { id: "analytics" as const, label: "Analytics", icon: BarChart3 },
    { id: "announcements" as const, label: "Announce", icon: Megaphone },
    { id: "ads" as const, label: "Ads", icon: ImageIcon },
    { id: "promotions" as const, label: "Promos", icon: Sparkles },
    { id: "revenue" as const, label: "Revenue", icon: DollarSign },
    { id: "users" as const, label: "Users", icon: Users },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-8">
      <div className="bg-primary text-primary-foreground px-4 pt-10 pb-5">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate("/")} className="p-2 -ml-2 rounded-lg hover:bg-primary-foreground/10">
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Shield size={18} />
              <h1 className="text-xl font-bold">Admin Panel</h1>
            </div>
            <p className="text-sm opacity-80 mt-0.5 truncate">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                tab === id ? "bg-primary-foreground text-primary" : "bg-primary-foreground/10 text-primary-foreground"
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-4 overflow-x-hidden">
        {tab === "analytics" && <AnalyticsTab />}
        {tab === "announcements" && <AnnouncementsTab />}
        {tab === "ads" && <AdsTab />}
        {tab === "promotions" && <PromotionsTab />}
        {tab === "revenue" && <RevenueTab />}
        {tab === "users" && <UsersTab />}
      </div>
    </div>
  );
}

/* ========== ANALYTICS TAB ========== */
function AnalyticsTab() {
  const { data, loading } = useAdminAnalytics();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateStats, setDateStats] = useState<{ activeUsers: number; sessions: number; avgSession: number; revenue: number } | null>(null);
  const [dateLoading, setDateLoading] = useState(false);

  const fetchDateStats = useCallback(async (date: Date) => {
    setDateLoading(true);
    try {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      // Active users on selected date
      const { data: sessions } = await supabase
        .from("user_sessions")
        .select("user_id, duration_seconds")
        .gte("started_at", dayStart.toISOString())
        .lte("started_at", dayEnd.toISOString());

      const uniqueUsers = new Set(sessions?.map(s => s.user_id) || []);
      const totalDuration = sessions?.reduce((s, r) => s + (r.duration_seconds || 0), 0) || 0;
      const avgSession = sessions?.length ? Math.round(totalDuration / sessions.length) : 0;

      // Revenue on selected date
      const { data: revenue } = await supabase
        .from("revenue_records")
        .select("amount")
        .gte("recorded_at", dayStart.toISOString())
        .lte("recorded_at", dayEnd.toISOString());
      const dayRevenue = revenue?.reduce((s, r) => s + Number(r.amount), 0) || 0;

      setDateStats({
        activeUsers: uniqueUsers.size,
        sessions: sessions?.length || 0,
        avgSession,
        revenue: dayRevenue,
      });
    } catch (err) {
      console.error("Date stats error:", err);
    } finally {
      setDateLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDateStats(selectedDate);
  }, [selectedDate, fetchDateStats]);

  if (loading) return <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto text-primary" /></div>;

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.round(seconds / 60)}m`;
  };

  return (
    <div className="space-y-4">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Total Users", value: data.totalUsers, icon: Users },
          { label: "Total Active", value: data.activeToday, icon: TrendingUp },
          { label: "Avg Session", value: formatDuration(data.avgSessionDuration), icon: Clock },
          { label: "Total Revenue", value: `₹${data.totalRevenue}`, icon: DollarSign },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-3 sm:p-4 text-center">
              <Icon size={18} className="mx-auto mb-1 text-primary" />
              <p className="text-xl sm:text-2xl font-bold text-foreground">{value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Date-wise Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Date-wise Stats</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-1.5 text-xs h-8", !selectedDate && "text-muted-foreground")}>
                  <CalendarIcon size={14} />
                  {format(selectedDate, "dd MMM yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {dateLoading ? (
            <div className="text-center py-4"><Loader2 size={20} className="animate-spin mx-auto text-primary" /></div>
          ) : dateStats ? (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Active Users", value: dateStats.activeUsers, icon: Users },
                { label: "Sessions", value: dateStats.sessions, icon: Eye },
                { label: "Avg Session", value: formatDuration(dateStats.avgSession), icon: Clock },
                { label: "Revenue", value: `₹${dateStats.revenue}`, icon: DollarSign },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-muted/50 rounded-lg p-3 text-center">
                  <Icon size={14} className="mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold text-foreground">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Daily Active Chart */}
      {data.dailyActive.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Daily Active Users (Last 7 Days)</p>
            <div className="flex items-end gap-1.5 h-28">
              {data.dailyActive.map((d, i) => {
                const max = Math.max(...data.dailyActive.map((g) => g.count));
                const height = max > 0 ? (d.count / max) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold text-foreground">{d.count}</span>
                    <div className="w-full bg-primary/80 rounded-t transition-all" style={{ height: `${Math.max(8, height)}%` }} />
                    <span className="text-[7px] sm:text-[8px] text-muted-foreground truncate w-full text-center">{d.date.split(",")[0]}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {data.topFeatures.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Top Features</p>
            <div className="space-y-2">
              {data.topFeatures.map((f) => (
                <div key={f.name} className="flex items-center gap-2">
                  <span className="text-sm text-foreground flex-1 truncate min-w-0">{f.name}</span>
                  <span className="text-xs font-mono text-muted-foreground shrink-0">{f.count}</span>
                  <Progress value={Math.min(100, (f.count / (data.topFeatures[0]?.count || 1)) * 100)} className="h-1.5 w-12 sm:w-16 shrink-0" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.adStats.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Ad Performance</p>
            <div className="space-y-3">
              {data.adStats.map((ad) => (
                <div key={ad.ad_id} className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-semibold text-foreground mb-2 truncate">{ad.title}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    {[
                      { val: ad.impressions, label: "Views" },
                      { val: ad.clicks, label: "Clicks" },
                      { val: ad.skips, label: "Skips" },
                      { val: ad.completes, label: "Complete" },
                    ].map(({ val, label }) => (
                      <div key={label}>
                        <p className="text-sm font-bold text-foreground">{val}</p>
                        <p className="text-[10px] text-muted-foreground">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.userGrowth.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">User Growth</p>
            <div className="flex items-end gap-1 h-24">
              {data.userGrowth.slice(-10).map((d, i) => {
                const max = Math.max(...data.userGrowth.map((g) => g.count));
                const height = max > 0 ? (d.count / max) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-primary/80 rounded-t" style={{ height: `${Math.max(4, height)}%` }} />
                    <span className="text-[7px] sm:text-[8px] text-muted-foreground truncate w-full text-center">{d.date.split("/")[0]}/{d.date.split("/")[1]}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ========== ANNOUNCEMENTS TAB ========== */
function AnnouncementsTab() {
  const { announcements, loading, create, update, toggle, remove } = useAdminAnnouncements();
  const [showForm, setShowForm] = useState(false);
  const [editingAnn, setEditingAnn] = useState<typeof announcements[0] | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const startEdit = (a: typeof announcements[0]) => {
    setEditingAnn(a);
    setTitle(a.title);
    setContent(a.content || "");
    setImageUrl(a.image_url || "");
    setVideoUrl(a.video_url || "");
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingAnn(null);
    setTitle(""); setContent(""); setImageUrl(""); setVideoUrl(""); setShowForm(false);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    if (editingAnn) {
      await update(editingAnn.id, {
        title,
        content: content || null,
        image_url: imageUrl || null,
        video_url: videoUrl || null,
      });
    } else {
      await create({
        title,
        content: content || undefined,
        image_url: imageUrl || undefined,
        video_url: videoUrl || undefined,
      });
    }
    resetForm();
  };

  const renderMediaPreview = () => {
    if (imageUrl) {
      return <img src={imageUrl} alt="" className="w-full max-h-32 rounded-lg object-cover" loading="lazy" />;
    }
    if (videoUrl) {
      const ytEmbed = getYouTubeEmbedUrl(videoUrl);
      if (ytEmbed) return <iframe src={ytEmbed} className="w-full aspect-video rounded-lg" allowFullScreen loading="lazy" />;
      return <video src={videoUrl} className="w-full max-h-32 rounded-lg" controls />;
    }
    return null;
  };

  return (
    <div className="space-y-3">
      {!showForm ? (
        <Button onClick={() => { setEditingAnn(null); setShowForm(true); }} className="w-full h-11 gap-2"><Plus size={16} /> New Announcement</Button>
      ) : (
        <Card><CardContent className="p-4 space-y-3">
          <p className="text-sm font-bold text-foreground">{editingAnn ? "Edit Announcement" : "New Announcement"}</p>
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          <textarea placeholder="Content (optional)" value={content} onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none" />
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Image URL (optional)</label>
            <Input placeholder="https://... image link" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} type="url" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Video URL (optional)</label>
            <Input placeholder="YouTube or video link" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} type="url" />
          </div>
          {renderMediaPreview()}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={resetForm} className="flex-1">Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!title.trim()} className="flex-1">{editingAnn ? "Save" : "Post"}</Button>
          </div>
        </CardContent></Card>
      )}
      {loading ? (
        <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto text-primary" /></div>
      ) : announcements.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No announcements yet</p>
      ) : (
        announcements.map((a) => (
          <Card key={a.id}><CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{a.title}</p>
                {a.content && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.content}</p>}
                {a.image_url && <img src={a.image_url} alt="" className="w-full max-h-20 rounded-lg object-cover mt-2" loading="lazy" />}
                {a.video_url && (() => {
                  const yt = getYouTubeEmbedUrl(a.video_url);
                  return yt
                    ? <iframe src={yt} className="w-full aspect-video rounded-lg mt-2" allowFullScreen loading="lazy" />
                    : <video src={a.video_url} className="w-full max-h-20 rounded-lg mt-2" controls />;
                })()}
                <p className="text-xs text-muted-foreground mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => startEdit(a)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
                  <Sparkles size={14} />
                </button>
                <button onClick={() => toggle(a.id, !a.is_active)} className="p-2 rounded-lg hover:bg-muted">
                  {a.is_active ? <ToggleRight size={16} className="text-primary" /> : <ToggleLeft size={16} className="text-muted-foreground" />}
                </button>
                <button onClick={() => remove(a.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 size={14} /></button>
              </div>
            </div>
          </CardContent></Card>
        ))
      )}
    </div>
  );
}

/* ========== ADS TAB ========== */
function AdsTab() {
  const { ads, loading, create, toggle, remove } = useAdminAds();
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [title, setTitle] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [clickUrl, setClickUrl] = useState("");
  const [delaySeconds, setDelaySeconds] = useState(3);
  const [skipAfterSeconds, setSkipAfterSeconds] = useState(5);
  const [durationSeconds, setDurationSeconds] = useState(10);
  const [maxViews, setMaxViews] = useState(3);

  const handleMediaUrl = (url: string) => {
    setMediaUrl(url);
    setMediaType(isVideoUrl(url) ? "video" : "image");
  };

  const resetForm = () => {
    setTitle(""); setMediaUrl(""); setClickUrl("");
    setDelaySeconds(3); setSkipAfterSeconds(5); setDurationSeconds(10); setMaxViews(3);
    setMediaType("image"); setEditingAd(null); setShowForm(false);
  };

  const startEdit = (ad: Ad) => {
    setEditingAd(ad);
    setTitle(ad.title);
    setMediaUrl(ad.media_url);
    setMediaType(ad.media_type as "image" | "video");
    setClickUrl(ad.click_url || "");
    setDelaySeconds(ad.delay_seconds);
    setSkipAfterSeconds(ad.skip_after_seconds);
    setDurationSeconds(ad.duration_seconds);
    setMaxViews(ad.max_views_per_day);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !mediaUrl) return;
    if (editingAd) {
      await supabase.from("ads").update({
        title, media_type: mediaType, media_url: mediaUrl, click_url: clickUrl || null,
        delay_seconds: delaySeconds, skip_after_seconds: skipAfterSeconds,
        duration_seconds: durationSeconds, max_views_per_day: maxViews,
      }).eq("id", editingAd.id);
      toast.success("Ad updated!");
    } else {
      await create({ title, media_type: mediaType, media_url: mediaUrl, click_url: clickUrl || null,
        delay_seconds: delaySeconds, skip_after_seconds: skipAfterSeconds,
        duration_seconds: durationSeconds, max_views_per_day: maxViews });
      toast.success("Ad created!");
    }
    resetForm();
  };

  const renderMediaPreview = () => {
    if (!mediaUrl) return null;
    const youtubeEmbed = getYouTubeEmbedUrl(mediaUrl);
    return (
      <div className="relative rounded-lg overflow-hidden border border-border">
        {mediaType === "video" ? (
          youtubeEmbed ? (
            <iframe src={youtubeEmbed} className="w-full aspect-video" allowFullScreen loading="lazy" />
          ) : (
            <video src={mediaUrl} className="w-full max-h-32 rounded-lg" controls />
          )
        ) : (
          <img src={mediaUrl} alt="" className="w-full max-h-32 rounded-lg object-cover" loading="lazy" />
        )}
        <button onClick={() => setMediaUrl("")} className="absolute top-1 right-1 p-1 rounded-full bg-foreground/60 text-background">
          <XCircle size={12} />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {!showForm ? (
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="w-full h-11 gap-2"><Plus size={16} /> New Ad</Button>
      ) : (
        <Card><CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">{editingAd ? "Edit Ad" : "New Ad"}</p>
          <Input placeholder="Ad title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />

          {mediaUrl ? renderMediaPreview() : (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Media URL (image or video link)</label>
              <Input placeholder="https://... image or video URL" value={mediaUrl} onChange={e => handleMediaUrl(e.target.value)} type="url" />
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                <LinkIcon size={9} /> Supports image URLs, YouTube links, and direct video URLs
              </p>
            </div>
          )}

          <Input placeholder="Click URL (optional)" value={clickUrl} onChange={(e) => setClickUrl(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-muted-foreground">Delay (s)</label><Input type="number" min={0} value={delaySeconds} onChange={(e) => setDelaySeconds(Number(e.target.value))} /></div>
            <div><label className="text-xs text-muted-foreground">Skip after (s)</label><Input type="number" min={1} value={skipAfterSeconds} onChange={(e) => setSkipAfterSeconds(Number(e.target.value))} /></div>
            <div><label className="text-xs text-muted-foreground">Duration (s)</label><Input type="number" min={5} value={durationSeconds} onChange={(e) => setDurationSeconds(Number(e.target.value))} /></div>
            <div><label className="text-xs text-muted-foreground">Max views/day</label><Input type="number" min={1} value={maxViews} onChange={(e) => setMaxViews(Number(e.target.value))} /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={resetForm} className="flex-1">Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!title.trim() || !mediaUrl} className="flex-1">{editingAd ? "Update" : "Create"}</Button>
          </div>
        </CardContent></Card>
      )}
      {loading ? (
        <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto text-primary" /></div>
      ) : ads.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No ads yet</p>
      ) : (
        ads.map((a) => (
          <Card key={a.id}><CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {a.media_type === "video" ? <Video size={14} className="text-primary shrink-0" /> : <ImageIcon size={14} className="text-primary shrink-0" />}
                  <p className="font-semibold text-foreground text-sm truncate">{a.title}</p>
                </div>
                <p className="text-xs text-muted-foreground">Skip: {a.skip_after_seconds}s • Duration: {a.duration_seconds}s • Max: {a.max_views_per_day}/day</p>
                {a.media_url && (
                  <div className="mt-2 rounded-lg overflow-hidden max-h-20">
                    {a.media_type === "video" ? (
                      getYouTubeEmbedUrl(a.media_url) ? (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1"><Video size={10} /> YouTube video</div>
                      ) : (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1"><Video size={10} /> Video file</div>
                      )
                    ) : (
                      <img src={a.media_url} alt="" className="w-full max-h-20 object-cover rounded-lg" loading="lazy" />
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={() => startEdit(a)} className="p-2 rounded-lg hover:bg-muted" title="Edit">
                  <Sparkles size={14} className="text-primary" />
                </button>
                <button onClick={() => toggle(a.id, !a.is_active)} className="p-2 rounded-lg hover:bg-muted">
                  {a.is_active ? <ToggleRight size={16} className="text-primary" /> : <ToggleLeft size={16} className="text-muted-foreground" />}
                </button>
                <button onClick={() => remove(a.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 size={14} /></button>
              </div>
            </div>
          </CardContent></Card>
        ))
      )}
    </div>
  );
}

/* ========== PROMOTIONS TAB ========== */
function PromotionsTab() {
  const { promotions, loading, updateStatus, remove } = useAdminPromotions();
  const [notes, setNotes] = useState<Record<string, string>>({});

  if (loading) return <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto text-primary" /></div>;

  const pending = promotions.filter((p) => p.status === "pending");
  const others = promotions.filter((p) => p.status !== "pending");

  const renderMedia = (p: { media_url: string; media_type: string }) => {
    if (!p.media_url) return null;
    const youtubeEmbed = getYouTubeEmbedUrl(p.media_url);
    if (p.media_type === "video") {
      return youtubeEmbed
        ? <iframe src={youtubeEmbed} className="w-full aspect-video rounded-lg" allowFullScreen loading="lazy" />
        : <video src={p.media_url} className="w-full max-h-24 rounded-lg" controls />;
    }
    return <img src={p.media_url} alt="" className="w-full max-h-24 rounded-lg object-cover" loading="lazy" />;
  };

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Pending Approval ({pending.length})
          </p>
          <div className="space-y-2">
            {pending.map((p) => (
              <Card key={p.id} className="border-yellow-500/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    {p.media_type === "video" ? <Video size={14} className="text-primary shrink-0" /> : <ImageIcon size={14} className="text-primary shrink-0" />}
                    <p className="font-semibold text-sm text-foreground truncate">{p.title}</p>
                    {p.is_featured && <Star size={12} className="text-yellow-500 shrink-0" />}
                  </div>
                  {p.description && <p className="text-xs text-muted-foreground break-words">{p.description}</p>}
                  <p className="text-xs text-muted-foreground">{p.duration_days} days • ₹{p.budget} budget</p>
                  {renderMedia(p)}
                  <Input
                    placeholder="Admin notes (optional)"
                    value={notes[p.id] || ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [p.id]: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateStatus(p.id, "approved", notes[p.id])} className="flex-1 gap-1">
                      <CheckCircle size={14} /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => updateStatus(p.id, "rejected", notes[p.id])} className="flex-1 gap-1">
                      <XCircle size={14} /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">All Promotions</p>
          <div className="space-y-2">
            {others.map((p) => (
              <Card key={p.id}><CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.duration_days} days • ₹{p.budget} • {p.status}</p>
                  </div>
                  <button onClick={() => remove(p.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive shrink-0"><Trash2 size={14} /></button>
                </div>
              </CardContent></Card>
            ))}
          </div>
        </div>
      )}

      {promotions.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No promotions submitted yet</p>}
    </div>
  );
}

/* ========== REVENUE TAB ========== */
function RevenueTab() {
  const { records, loading, addRecord, totalRevenue } = useRevenue();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState("promotion");
  const [description, setDescription] = useState("");

  const handleAdd = async () => {
    if (amount <= 0) return;
    await addRecord({ amount, type, description: description || undefined });
    setAmount(0); setDescription(""); setShowForm(false);
  };

  if (loading) return <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="space-y-4">
      <Card><CardContent className="p-6 text-center">
        <DollarSign size={24} className="mx-auto mb-2 text-primary" />
        <p className="text-3xl font-bold text-foreground">₹{totalRevenue.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground">Total Revenue</p>
      </CardContent></Card>

      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="w-full h-11 gap-2"><Plus size={16} /> Record Payment</Button>
      ) : (
        <Card><CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-muted-foreground">Amount (₹)</label><Input type="number" min={0} value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div>
            <div>
              <label className="text-xs text-muted-foreground">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="promotion">Promotion</option>
                <option value="ad_revenue">Ad Revenue</option>
              </select>
            </div>
          </div>
          <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
            <Button size="sm" onClick={handleAdd} disabled={amount <= 0} className="flex-1">Record</Button>
          </div>
        </CardContent></Card>
      )}

      {records.length > 0 && (
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Recent Records</p>
          <div className="space-y-2">
            {records.slice(0, 20).map((r) => (
              <Card key={r.id}><CardContent className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">₹{Number(r.amount).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.description || r.type} • {new Date(r.recorded_at).toLocaleDateString()}</p>
                </div>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">{r.type}</span>
              </CardContent></Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ========== USERS TAB ========== */
function UsersTab() {
  const [users, setUsers] = useState<{ user_id: string; email: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("profiles").select("user_id, email, created_at").order("created_at", { ascending: false });
      if (data) setUsers(data);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
        {users.length} registered user{users.length !== 1 ? "s" : ""}
      </p>
      {users.map((u) => (
        <Card key={u.user_id}><CardContent className="p-3 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{u.email || "No email"}</p>
            <p className="text-xs text-muted-foreground">Joined {new Date(u.created_at).toLocaleDateString()}</p>
          </div>
          <Users size={14} className="text-muted-foreground shrink-0" />
        </CardContent></Card>
      ))}
    </div>
  );
}
