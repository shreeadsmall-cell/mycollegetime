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
  FileImage, Video, Sparkles, ImagePlus, Send
} from "lucide-react";
import { toast } from "sonner";

interface PromotionSubmitProps {
  onBack: () => void;
  userId: string;
}

const CATEGORIES = ["Books", "Tutoring", "Events", "Services", "Rooms", "Other"];

export function PromotionSubmit({ onBack, userId }: PromotionSubmitProps) {
  const { promotions, loading, submit } = usePromotions(userId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [contact, setContact] = useState("");
  const [link, setLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Validation
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
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      toast.error("Only JPG, PNG, and WEBP images are supported.");
      return;
    }
    setUploading(true);
    const path = `promotions/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      setMediaUrl(data.publicUrl);
    } else {
      toast.error("Upload failed. Please try again.");
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    await submit({
      title: title.trim(),
      description: `${description.trim()}\n\nCategory: ${category}\nContact: ${contact.trim()}${link ? `\nLink: ${link.trim()}` : ""}`,
      media_url: mediaUrl || "https://placehold.co/400x200/1e3a8a/fff?text=Ad",
      media_type: "image",
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
            <p className="text-xs opacity-80 mt-0.5">Submit your ad for admin review before publishing</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 -mt-4 space-y-4">
        {/* Success state */}
        {submitted ? (
          <Card>
            <CardContent className="py-10 text-center">
              <CheckCircle size={40} className="mx-auto mb-3 text-primary" />
              <p className="text-base font-bold text-foreground">Ad Submitted!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your advertisement has been submitted and is awaiting admin approval.
              </p>
            </CardContent>
          </Card>
        ) : (
          /* Submission form */
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Submit New Ad</CardTitle>
              <CardDescription>Fill in the details below. All ads are reviewed before appearing in the app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Ad Title *</label>
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
                <label className="text-xs font-medium text-foreground mb-1 block">Description *</label>
                <Textarea
                  placeholder="Describe your ad in detail..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="min-h-[80px] resize-none"
                  maxLength={500}
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Category *</label>
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

              {/* Image upload */}
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Image (optional)</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleUpload}
                  className="hidden"
                />
                {mediaUrl ? (
                  <div className="relative">
                    <img src={mediaUrl} alt="Ad preview" className="w-full h-40 rounded-xl object-cover border border-border" />
                    <button
                      onClick={() => setMediaUrl("")}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-foreground/60 text-background"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                ) : (
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
                        <span className="text-xs font-medium">Tap to upload JPG, PNG, or WEBP</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Contact */}
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Contact Info *</label>
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
                <label className="text-xs font-medium text-foreground mb-1 block">Link (optional)</label>
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
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
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
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(p.created_at).toLocaleDateString()}
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
