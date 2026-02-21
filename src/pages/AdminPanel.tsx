import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useAdminAnnouncements } from "@/hooks/useAnnouncements";
import { useAdminAds, Ad } from "@/hooks/useAds";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Shield, Megaphone, Image as ImageIcon, Video, Plus,
  Trash2, ToggleLeft, ToggleRight, Loader2, Upload, Users, BarChart3
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type Tab = "announcements" | "ads" | "users" | "stats";

export default function AdminPanel() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin(user?.id);
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("announcements");

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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
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

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {([
            { id: "announcements", label: "Announce", icon: Megaphone },
            { id: "ads", label: "Ads", icon: ImageIcon },
            { id: "users", label: "Users", icon: Users },
            { id: "stats", label: "Stats", icon: BarChart3 },
          ] as const).map(({ id, label, icon: Icon }) => (
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
        {tab === "announcements" && <AnnouncementsTab />}
        {tab === "ads" && <AdsTab />}
        {tab === "users" && <UsersTab />}
        {tab === "stats" && <StatsTab />}
      </div>
    </div>
  );
}

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
    setTitle("");
    setContent("");
    setImageUrl("");
    setShowForm(false);
  };

  return (
    <div className="space-y-3">
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="w-full h-11 gap-2">
          <Plus size={16} /> New Announcement
        </Button>
      ) : (
        <div className="bg-card border rounded-xl p-4 space-y-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          <textarea
            placeholder="Content (optional)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none"
          />
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
        </div>
      )}

      {loading ? (
        <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto text-primary" /></div>
      ) : announcements.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No announcements yet</p>
      ) : (
        announcements.map((a) => (
          <div key={a.id} className="bg-card border rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{a.title}</p>
                {a.content && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.content}</p>}
                <p className="text-xs text-muted-foreground mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-1 shrink-0 ml-2">
                <button onClick={() => toggle(a.id, !a.is_active)} className="p-2 rounded-lg hover:bg-muted">
                  {a.is_active ? <ToggleRight size={16} className="text-[hsl(var(--current))]" /> : <ToggleLeft size={16} className="text-muted-foreground" />}
                </button>
                <button onClick={() => remove(a.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

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
    const isVideo = file.type.startsWith("video/");
    setMediaType(isVideo ? "video" : "image");
    const path = `ads/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      setMediaUrl(data.publicUrl);
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleCreate = async () => {
    if (!title.trim() || !mediaUrl) return;
    await create({
      title,
      media_type: mediaType,
      media_url: mediaUrl,
      click_url: clickUrl || null,
      delay_seconds: delaySeconds,
      skip_after_seconds: skipAfterSeconds,
      duration_seconds: durationSeconds,
      max_views_per_day: maxViews,
    });
    setTitle(""); setMediaUrl(""); setClickUrl("");
    setShowForm(false);
  };

  return (
    <div className="space-y-3">
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="w-full h-11 gap-2">
          <Plus size={16} /> New Ad
        </Button>
      ) : (
        <div className="bg-card border rounded-xl p-4 space-y-3">
          <Input placeholder="Ad title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleUpload} className="hidden" />
          <Button size="sm" variant="outline" className="w-full gap-2" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <><Upload size={14} /> Upload Media (image/video)</>}
          </Button>
          {mediaUrl && (
            mediaType === "video" ?
              <video src={mediaUrl} className="w-full max-h-32 rounded-lg" controls /> :
              <img src={mediaUrl} alt="" className="w-full max-h-32 rounded-lg object-cover" />
          )}
          <Input placeholder="Click URL (optional)" value={clickUrl} onChange={(e) => setClickUrl(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Delay (s)</label>
              <Input type="number" min={0} value={delaySeconds} onChange={(e) => setDelaySeconds(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Skip after (s)</label>
              <Input type="number" min={1} value={skipAfterSeconds} onChange={(e) => setSkipAfterSeconds(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Duration (s)</label>
              <Input type="number" min={5} value={durationSeconds} onChange={(e) => setDurationSeconds(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Max views/day</label>
              <Input type="number" min={1} value={maxViews} onChange={(e) => setMaxViews(Number(e.target.value))} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
            <Button size="sm" onClick={handleCreate} disabled={!title.trim() || !mediaUrl} className="flex-1">Create Ad</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto text-primary" /></div>
      ) : ads.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No ads yet</p>
      ) : (
        ads.map((a) => (
          <div key={a.id} className="bg-card border rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {a.media_type === "video" ? <Video size={14} className="text-primary" /> : <ImageIcon size={14} className="text-primary" />}
                  <p className="font-semibold text-foreground text-sm truncate">{a.title}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Skip: {a.skip_after_seconds}s • Duration: {a.duration_seconds}s • Max: {a.max_views_per_day}/day
                </p>
              </div>
              <div className="flex gap-1 shrink-0 ml-2">
                <button onClick={() => toggle(a.id, !a.is_active)} className="p-2 rounded-lg hover:bg-muted">
                  {a.is_active ? <ToggleRight size={16} className="text-[hsl(var(--current))]" /> : <ToggleLeft size={16} className="text-muted-foreground" />}
                </button>
                <button onClick={() => remove(a.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<{ user_id: string; email: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    const fetch = async () => {
      const { data } = await supabase.from("profiles").select("user_id, email, created_at").order("created_at", { ascending: false });
      if (data) setUsers(data);
      setLoading(false);
    };
    fetch();
  });

  if (loading) return <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
        {users.length} registered user{users.length !== 1 ? "s" : ""}
      </p>
      {users.map((u) => (
        <div key={u.user_id} className="bg-card border rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{u.email || "No email"}</p>
            <p className="text-xs text-muted-foreground">Joined {new Date(u.created_at).toLocaleDateString()}</p>
          </div>
          <Users size={14} className="text-muted-foreground" />
        </div>
      ))}
    </div>
  );
}

function StatsTab() {
  const { announcements } = useAdminAnnouncements();
  const { ads } = useAdminAds();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Active Announcements", value: announcements.filter((a) => a.is_active).length },
          { label: "Total Announcements", value: announcements.length },
          { label: "Active Ads", value: ads.filter((a) => a.is_active).length },
          { label: "Total Ads", value: ads.length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
