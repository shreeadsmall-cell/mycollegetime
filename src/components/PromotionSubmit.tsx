import { useState } from "react";
import { usePromotions } from "@/hooks/usePromotions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Loader2, CheckCircle, Clock, XCircle,
  Send, Sparkles, Link as LinkIcon, Image as ImageIcon,
  Video, Eye
} from "lucide-react";
import { toast } from "sonner";

interface PromotionSubmitProps {
  onBack: () => void;
  userId: string;
}

const CATEGORIES = ["Books", "Tutoring", "Events", "Services", "Rooms", "Other"];

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

export function PromotionSubmit({ onBack, userId }: PromotionSubmitProps) {
  const { promotions, loading, submit } = usePromotions(userId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [contact, setContact] = useState("");
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    title: !title.trim(),
    description: !description.trim(),
    category: !category,
    contact: !contact.trim(),
  };
  const isValid = !errors.title && !errors.description && !errors.category && !errors.contact;

  const handleMediaUrl = (url: string) => {
    setMediaUrl(url);
    if (isVideoUrl(url)) {
      setMediaType("video");
    } else {
      setMediaType("image");
    }
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    await submit({
      title: title.trim(),
      description: `${description.trim()}\n\nCategory: ${category}\nContact: ${contact.trim()}${link ? `\nLink: ${link.trim()}` : ""}`,
      media_url: mediaUrl || "https://placehold.co/400x200/1e3a8a/fff?text=Ad",
      media_type: mediaType,
      duration_days: 7,
      budget: 0,
    });
    setSubmitted(true);
    setSubmitting(false);
    setTimeout(() => {
      setTitle(""); setDescription(""); setCategory(""); setMediaUrl("");
      setContact(""); setLink(""); setSubmitted(false);
    }, 3000);
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "approved": case "active": return <CheckCircle size={14} className="text-emerald-500" />;
      case "pending": return <Clock size={14} className="text-yellow-500" />;
      case "rejected": return <XCircle size={14} className="text-destructive" />;
      default: return <Clock size={14} className="text-muted-foreground" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "approved": case "active": return "bg-emerald-500/10 text-emerald-600";
      case "pending": return "bg-yellow-500/10 text-yellow-600";
      case "rejected": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const renderMediaPreview = () => {
    if (!mediaUrl) return null;
    const youtubeEmbed = getYouTubeEmbedUrl(mediaUrl);

    return (
      <div className="relative rounded-xl overflow-hidden border border-border">
        {mediaType === "video" ? (
          youtubeEmbed ? (
            <iframe
              src={youtubeEmbed}
              className="w-full aspect-video"
              allowFullScreen
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : (
            <video src={mediaUrl} className="w-full aspect-video object-cover" controls />
          )
        ) : (
          <img
            src={mediaUrl}
            alt="Ad preview"
            className="w-full h-40 object-cover"
            loading="lazy"
            onError={() => { toast.error("Image failed to load"); setMediaUrl(""); }}
          />
        )}
        <button
          onClick={() => setMediaUrl("")}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-foreground/60 text-background hover:bg-foreground/80 transition-colors"
        >
          <XCircle size={14} />
        </button>
        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-foreground/60 text-background text-[10px] font-medium">
          <Eye size={10} /> Preview
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-10 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Sparkles size={20} /> Promote Your Ad
            </h1>
            <p className="text-xs opacity-80 mt-0.5">Submit your ad for admin review</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 -mt-4 space-y-4">
        {submitted ? (
          <Card className="mt-1">
            <CardContent className="py-10 text-center">
              <CheckCircle size={40} className="mx-auto mb-3 text-emerald-500" />
              <p className="text-base font-bold text-foreground">Ad Submitted!</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-[250px] mx-auto">
                Your advertisement has been submitted and is awaiting admin approval.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Submit New Ad</CardTitle>
              <CardDescription className="text-xs">
                Fill in the details below. All ads are reviewed before appearing in the app.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Ad Title <span className="text-destructive">*</span></label>
                <Input placeholder="e.g. Selling NCERT Books" value={title} onChange={e => setTitle(e.target.value)} className="h-11" maxLength={100} />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Description <span className="text-destructive">*</span></label>
                <Textarea placeholder="Describe your ad in detail..." value={description} onChange={e => setDescription(e.target.value)} className="min-h-[80px] resize-none" maxLength={500} />
                <p className="text-[10px] text-muted-foreground text-right mt-0.5">{description.length}/500</p>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Category <span className="text-destructive">*</span></label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Media URL only */}
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Media URL (optional)</label>
                {mediaUrl ? (
                  renderMediaPreview()
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Paste image or video URL"
                        value={mediaUrl}
                        onChange={e => handleMediaUrl(e.target.value)}
                        className="h-10 flex-1"
                        type="url"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <LinkIcon size={9} /> Supports image URLs, YouTube links, and direct video URLs
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Contact Info <span className="text-destructive">*</span></label>
                <Input placeholder="Phone number or email" value={contact} onChange={e => setContact(e.target.value)} className="h-11" maxLength={100} />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Website Link (optional)</label>
                <Input placeholder="https://..." value={link} onChange={e => setLink(e.target.value)} className="h-11" type="url" />
              </div>

              <Button onClick={handleSubmit} disabled={!isValid || submitting} className="w-full h-12 gap-2 font-semibold text-base">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Submit Ad for Review
              </Button>

              <p className="text-center text-[11px] text-muted-foreground">All ads are reviewed before appearing in the app.</p>
            </CardContent>
          </Card>
        )}

        {/* My submissions */}
        <div className="pb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">My Submissions</p>
          {loading ? (
            <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto text-primary" /></div>
          ) : promotions.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No submissions yet</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {promotions.map(p => (
                <Card key={p.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColor(p.status)}`}>
                        {statusIcon(p.status)} {p.status}
                      </span>
                    </div>
                    {p.admin_notes && (
                      <p className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded">Admin: {p.admin_notes}</p>
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
