import { useState, useRef } from "react";
import { usePromotions } from "@/hooks/usePromotions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Upload, Loader2, CheckCircle, Clock, XCircle,
  ImagePlus, Send, Sparkles, Link as LinkIcon, Image as ImageIcon,
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

function isImageUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (lower.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/)) return true;
  // Assume it's an image if it's not a video and has http
  if (lower.startsWith("http") && !isVideoUrl(url)) return true;
  return false;
}

export function PromotionSubmit({ onBack, userId }: PromotionSubmitProps) {
  const { promotions, loading, submit } = usePromotions(userId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaLinkInput, setMediaLinkInput] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [contact, setContact] = useState("");
  const [link, setLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mediaMethod, setMediaMethod] = useState<"upload" | "link">("upload");
  const fileRef = useRef<HTMLInputElement>(null);

  const errors = {
    title: !title.trim(),
    description: !description.trim(),
    category: !category,
    contact: !contact.trim(),
  };
  const isValid = !errors.title && !errors.description && !errors.category && !errors.contact;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.match(/^image\/(jpeg|png|webp)$/);
    const isVid = file.type.match(/^video\/(mp4|webm)$/);

    if (!isImage && !isVid) {
      toast.error("Supported formats: JPG, PNG, WEBP, MP4, WEBM");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File too large. Maximum 50MB.");
      return;
    }

    setUploading(true);
    const path = `promotions/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      setMediaUrl(data.publicUrl);
      setMediaType(isVid ? "video" : "image");
      toast.success("Media uploaded successfully!");
    } else {
      toast.error("Upload failed. Please try again.");
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleMediaLink = () => {
    if (!mediaLinkInput.trim()) return;
    const url = mediaLinkInput.trim();
    if (isVideoUrl(url)) {
      setMediaType("video");
    } else {
      setMediaType("image");
    }
    setMediaUrl(url);
    toast.success("Media link added!");
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
      setContact(""); setLink(""); setMediaLinkInput(""); setSubmitted(false);
    }, 3000);
  };

  const clearMedia = () => {
    setMediaUrl("");
    setMediaLinkInput("");
    setMediaType("image");
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
            onError={() => { toast.error("Image failed to load"); clearMedia(); }}
          />
        )}
        <button
          onClick={clearMedia}
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
        {/* Success state */}
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
          /* Submission form */
          <Card className="mt-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Submit New Ad</CardTitle>
              <CardDescription className="text-xs">
                Fill in the details below. All ads are reviewed before appearing in the app.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Ad Title <span className="text-destructive">*</span></label>
                <Input
                  placeholder="e.g. Selling NCERT Books"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="h-11"
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Description <span className="text-destructive">*</span></label>
                <Textarea
                  placeholder="Describe your ad in detail..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="min-h-[80px] resize-none"
                  maxLength={500}
                />
                <p className="text-[10px] text-muted-foreground text-right mt-0.5">{description.length}/500</p>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Category <span className="text-destructive">*</span></label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Media section */}
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Media (optional)</label>

                {/* Tab toggle for upload vs link */}
                {!mediaUrl && (
                  <div className="flex rounded-lg border border-border overflow-hidden mb-3">
                    <button
                      onClick={() => setMediaMethod("upload")}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                        mediaMethod === "upload"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Upload size={12} /> Upload File
                    </button>
                    <button
                      onClick={() => setMediaMethod("link")}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                        mediaMethod === "link"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <LinkIcon size={12} /> Paste URL
                    </button>
                  </div>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                  onChange={handleUpload}
                  className="hidden"
                />

                {mediaUrl ? (
                  renderMediaPreview()
                ) : mediaMethod === "upload" ? (
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="w-full h-28 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    {uploading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <ImagePlus size={24} />
                        <span className="text-xs font-medium">Tap to upload image or video</span>
                        <span className="text-[10px] text-muted-foreground">JPG, PNG, WEBP, MP4, WEBM • Max 50MB</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://... (image or video URL)"
                        value={mediaLinkInput}
                        onChange={e => setMediaLinkInput(e.target.value)}
                        className="h-10 flex-1"
                        type="url"
                      />
                      <Button
                        size="sm"
                        onClick={handleMediaLink}
                        disabled={!mediaLinkInput.trim()}
                        className="h-10 px-3"
                      >
                        Add
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Supports image URLs, YouTube links, and direct video URLs
                    </p>
                  </div>
                )}
              </div>

              {/* Contact */}
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Contact Info <span className="text-destructive">*</span></label>
                <Input
                  placeholder="Phone number or email"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  className="h-11"
                  maxLength={100}
                />
              </div>

              {/* Optional link */}
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Website Link (optional)</label>
                <Input
                  placeholder="https://..."
                  value={link}
                  onChange={e => setLink(e.target.value)}
                  className="h-11"
                  type="url"
                />
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={!isValid || submitting}
                className="w-full h-12 gap-2 font-semibold text-base"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Submit Ad for Review
              </Button>

              <p className="text-center text-[11px] text-muted-foreground">
                All ads are reviewed before appearing in the app.
              </p>
            </CardContent>
          </Card>
        )}

        {/* My submissions */}
        <div className="pb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            My Submissions
          </p>
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
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(p.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColor(p.status)}`}>
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
