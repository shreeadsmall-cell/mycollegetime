import { useState, useRef } from "react";
import { usePromotions } from "@/hooks/usePromotions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ArrowLeft, Upload, Loader2, CheckCircle, Clock, XCircle,
  FileImage, Video, Sparkles, Star
} from "lucide-react";

interface PromotionSubmitProps {
  onBack: () => void;
  userId: string;
}

export function PromotionSubmit({ onBack, userId }: PromotionSubmitProps) {
  const { promotions, loading, submit } = usePromotions(userId);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [durationDays, setDurationDays] = useState(7);
  const [budget, setBudget] = useState(0);
  const [isFeatured, setIsFeatured] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const isVideo = file.type.startsWith("video/");
    setMediaType(isVideo ? "video" : "image");
    const path = `promotions/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      setMediaUrl(data.publicUrl);
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!title.trim() || !mediaUrl) return;
    setSubmitting(true);
    await submit({
      title, description: description || undefined, media_url: mediaUrl,
      media_type: mediaType, duration_days: durationDays,
      budget, is_featured: isFeatured,
    });
    setTitle(""); setDescription(""); setMediaUrl("");
    setBudget(0); setDurationDays(7); setIsFeatured(false);
    setShowForm(false);
    setSubmitting(false);
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "approved": case "active": return <CheckCircle size={14} className="text-primary" />;
      case "pending": return <Clock size={14} className="text-yellow-500" />;
      case "rejected": return <XCircle size={14} className="text-destructive" />;
      default: return <Clock size={14} className="text-muted-foreground" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "approved": case "active": return "bg-primary/10 text-primary";
      case "pending": return "bg-yellow-500/10 text-yellow-600";
      case "rejected": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      <div className="bg-primary text-primary-foreground px-4 pt-10 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Sparkles size={20} /> Promote Your Ad
            </h1>
            <p className="text-xs opacity-80 mt-0.5">Submit ads for admin approval</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 -mt-4 space-y-4">
        {!showForm ? (
          <Button onClick={() => setShowForm(true)} className="w-full h-12 gap-2 text-base font-semibold">
            <Upload size={18} /> Submit New Promotion
          </Button>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">New Promotion</CardTitle>
              <CardDescription>Submit for admin review</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Ad title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-none"
              />
              <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleUpload} className="hidden" />
              <Button variant="outline" className="w-full gap-2" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <><Upload size={14} /> Upload Media</>}
              </Button>
              {mediaUrl && (
                mediaType === "video"
                  ? <video src={mediaUrl} className="w-full max-h-32 rounded-lg" controls />
                  : <img src={mediaUrl} alt="" className="w-full max-h-32 rounded-lg object-cover" />
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Duration (days)</label>
                  <Input type="number" min={1} value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Budget (₹)</label>
                  <Input type="number" min={0} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded border-input" />
                <Star size={14} className="text-yellow-500" /> Featured promotion (higher visibility)
              </label>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleSubmit} disabled={!title.trim() || !mediaUrl || submitting} className="flex-1 gap-2">
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : "Submit"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Promotions */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
            My Promotions
          </p>
          {loading ? (
            <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto text-primary" /></div>
          ) : promotions.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No promotions yet</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {promotions.map((p) => (
                <Card key={p.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {p.media_type === "video" ? <Video size={14} className="text-primary" /> : <FileImage size={14} className="text-primary" />}
                          <p className="font-semibold text-sm text-foreground truncate">{p.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {p.duration_days} days • ₹{p.budget} budget
                          {p.is_featured && " • ⭐ Featured"}
                        </p>
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(p.status)}`}>
                        {statusIcon(p.status)} {p.status}
                      </span>
                    </div>
                    {p.admin_notes && (
                      <p className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded">
                        Admin: {p.admin_notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
