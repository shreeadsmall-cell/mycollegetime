import { useState, useRef, useEffect } from "react";
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
import {
  ArrowLeft, Shield, Megaphone, Image as ImageIcon, Video, Plus,
  Trash2, ToggleLeft, ToggleRight, Loader2, Upload, Users, BarChart3,
  DollarSign, TrendingUp, Eye, MousePointer, Clock, CheckCircle,
  XCircle, Star, Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type Tab = "analytics" | "announcements" | "ads" | "promotions" | "revenue" | "users";

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
          <div>
            <div className="flex items-center gap-2">
              <Shield size={18} />
              <h1 className="text-xl font-bold">Admin Panel</h1>
            </div>
            <p className="text-sm opacity-80 mt-0.5">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === id ? "bg-primary-foreground text-primary" : "bg-primary-foreground/10 text-primary-foreground"
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-4">
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

  if (loading) return <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto text-primary" /></div>;

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.round(seconds / 60)}m`;
  };

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Total Users", value: data.totalUsers, icon: Users },
          { label: "Active Today", value: data.activeToday, icon: TrendingUp },
          { label: "Avg Session", value: formatDuration(data.avgSessionDuration), icon: Clock },
          { label: "Total Revenue", value: `₹${data.totalRevenue}`, icon: DollarSign },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4 text-center">
              <Icon size={20} className="mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Features */}
      {data.topFeatures.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Top Features</p>
            <div className="space-y-2">
              {data.topFeatures.map((f) => (
                <div key={f.name} className="flex items-center gap-3">
                  <span className="text-sm text-foreground flex-1 truncate">{f.name}</span>
                  <span className="text-xs font-mono text-muted-foreground">{f.count}</span>
                  <Progress value={Math.min(100, (f.count / (data.topFeatures[0]?.count || 1)) * 100)} className="h-1.5 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ad Performance */}
      {data.adStats.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Ad Performance</p>
            <div className="space-y-3">
              {data.adStats.map((ad) => (
                <div key={ad.ad_id} className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-semibold text-foreground mb-1 truncate">{ad.title}</p>
                  <div className="grid grid-cols-4 gap-1 text-center">
                    <div><p className="text-sm font-bold text-foreground">{ad.impressions}</p><p className="text-[10px] text-muted-foreground">Views</p></div>
                    <div><p className="text-sm font-bold text-foreground">{ad.clicks}</p><p className="text-[10px] text-muted-foreground">Clicks</p></div>
                    <div><p className="text-sm font-bold text-foreground">{ad.skips}</p><p className="text-[10px] text-muted-foreground">Skips</p></div>
                    <div><p className="text-sm font-bold text-foreground">{ad.completes}</p><p className="text-[10px] text-muted-foreground">Complete</p></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Growth */}
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
                    <span className="text-[8px] text-muted-foreground truncate w-full text-center">{d.date.split("/")[0]}/{d.date.split("/")[1]}</span>
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
  const { announcements, loading, create, toggle, remove } = useAdminAnnouncements();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `announcements/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      setImageUrl(data.publicUrl);
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    await create({ title, content: content || undefined, image_url: imageUrl || undefined });
    setTitle(""); setContent(""); setImageUrl(""); setShowForm(false);
  };

  return (
    <div className="space-y-3">
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="w-full h-11 gap-2"><Plus size={16} /> New Announcement</Button>
      ) : (
        <Card><CardContent className="p-4 space-y-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          <textarea placeholder="Content (optional)" value={content} onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none" />
          {imageUrl && <img src={imageUrl} alt="" className="w-full max-h-32 rounded-lg object-cover" />}
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept="image/*" onChange={handleUploadImage} className="hidden" />
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <><Upload size={14} /> Image</>}
            </Button>
            <div className="flex-1" />
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreate} disabled={!title.trim()}>Post</Button>
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
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{a.title}</p>
                {a.content && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.content}</p>}
                <p className="text-xs text-muted-foreground mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-1 shrink-0 ml-2">
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
  const [title, setTitle] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [clickUrl, setClickUrl] = useState("");
  const [delaySeconds, setDelaySeconds] = useState(3);
  const [skipAfterSeconds, setSkipAfterSeconds] = useState(5);
  const [durationSeconds, setDurationSeconds] = useState(10);
  const [maxViews, setMaxViews] = useState(3);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMediaType(file.type.startsWith("video/") ? "video" : "image");
    const path = `ads/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (!error) { const { data } = supabase.storage.from("media").getPublicUrl(path); setMediaUrl(data.publicUrl); }
    setUploading(false);
    e.target.value = "";
  };

  const handleCreate = async () => {
    if (!title.trim() || !mediaUrl) return;
    await create({ title, media_type: mediaType, media_url: mediaUrl, click_url: clickUrl || null,
      delay_seconds: delaySeconds, skip_after_seconds: skipAfterSeconds,
      duration_seconds: durationSeconds, max_views_per_day: maxViews });
    setTitle(""); setMediaUrl(""); setClickUrl(""); setShowForm(false);
  };

  return (
    <div className="space-y-3">
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="w-full h-11 gap-2"><Plus size={16} /> New Ad</Button>
      ) : (
        <Card><CardContent className="p-4 space-y-3">
          <Input placeholder="Ad title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleUpload} className="hidden" />
          <Button size="sm" variant="outline" className="w-full gap-2" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <><Upload size={14} /> Upload Media</>}
          </Button>
          {mediaUrl && (mediaType === "video" ? <video src={mediaUrl} className="w-full max-h-32 rounded-lg" controls /> : <img src={mediaUrl} alt="" className="w-full max-h-32 rounded-lg object-cover" />)}
          <Input placeholder="Click URL (optional)" value={clickUrl} onChange={(e) => setClickUrl(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-muted-foreground">Delay (s)</label><Input type="number" min={0} value={delaySeconds} onChange={(e) => setDelaySeconds(Number(e.target.value))} /></div>
            <div><label className="text-xs text-muted-foreground">Skip after (s)</label><Input type="number" min={1} value={skipAfterSeconds} onChange={(e) => setSkipAfterSeconds(Number(e.target.value))} /></div>
            <div><label className="text-xs text-muted-foreground">Duration (s)</label><Input type="number" min={5} value={durationSeconds} onChange={(e) => setDurationSeconds(Number(e.target.value))} /></div>
            <div><label className="text-xs text-muted-foreground">Max views/day</label><Input type="number" min={1} value={maxViews} onChange={(e) => setMaxViews(Number(e.target.value))} /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
            <Button size="sm" onClick={handleCreate} disabled={!title.trim() || !mediaUrl} className="flex-1">Create</Button>
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
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {a.media_type === "video" ? <Video size={14} className="text-primary" /> : <ImageIcon size={14} className="text-primary" />}
                  <p className="font-semibold text-foreground text-sm truncate">{a.title}</p>
                </div>
                <p className="text-xs text-muted-foreground">Skip: {a.skip_after_seconds}s • Duration: {a.duration_seconds}s • Max: {a.max_views_per_day}/day</p>
              </div>
              <div className="flex gap-1 shrink-0 ml-2">
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
                    {p.media_type === "video" ? <Video size={14} className="text-primary" /> : <ImageIcon size={14} className="text-primary" />}
                    <p className="font-semibold text-sm text-foreground truncate">{p.title}</p>
                    {p.is_featured && <Star size={12} className="text-yellow-500" />}
                  </div>
                  {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                  <p className="text-xs text-muted-foreground">{p.duration_days} days • ₹{p.budget} budget</p>
                  {p.media_url && (
                    p.media_type === "video"
                      ? <video src={p.media_url} className="w-full max-h-24 rounded-lg" controls />
                      : <img src={p.media_url} alt="" className="w-full max-h-24 rounded-lg object-cover" />
                  )}
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
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.duration_days} days • ₹{p.budget} • {p.status}</p>
                  </div>
                  <button onClick={() => remove(p.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 size={14} /></button>
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
              <Card key={r.id}><CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">₹{Number(r.amount).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{r.description || r.type} • {new Date(r.recorded_at).toLocaleDateString()}</p>
                </div>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{r.type}</span>
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
        <Card key={u.user_id}><CardContent className="p-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{u.email || "No email"}</p>
            <p className="text-xs text-muted-foreground">Joined {new Date(u.created_at).toLocaleDateString()}</p>
          </div>
          <Users size={14} className="text-muted-foreground" />
        </CardContent></Card>
      ))}
    </div>
  );
}
