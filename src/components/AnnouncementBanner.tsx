import { useAnnouncements, Announcement } from "@/hooks/useAnnouncements";
import { useState } from "react";
import { Megaphone, ChevronRight, X, Play } from "lucide-react";

export function AnnouncementBanner() {
  const { announcements } = useAnnouncements();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);

  const visible = announcements.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  const latest = visible[0];

  if (expanded === latest.id) {
    return (
      <div className="mx-4 mt-2 bg-card border-2 border-primary/30 rounded-xl p-4 shadow-sm">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Megaphone size={16} className="text-primary" />
            <h3 className="font-bold text-foreground text-sm">{latest.title}</h3>
          </div>
          <button onClick={() => setExpanded(null)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
            <X size={14} />
          </button>
        </div>
        {latest.content && <p className="text-sm text-muted-foreground mb-3">{latest.content}</p>}
        {latest.image_url && (
          <img src={latest.image_url} alt="" className="w-full rounded-lg mb-3 max-h-48 object-cover" />
        )}
        {latest.video_url && (
          <video src={latest.video_url} controls playsInline className="w-full rounded-lg mb-3 max-h-48" />
        )}
        <p className="text-xs text-muted-foreground">
          {new Date(latest.created_at).toLocaleDateString()}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-2">
      <button
        onClick={() => setExpanded(latest.id)}
        className="w-full flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 text-left hover:bg-primary/15 transition-colors"
      >
        <Megaphone size={16} className="text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{latest.title}</p>
          {latest.content && (
            <p className="text-xs text-muted-foreground truncate">{latest.content}</p>
          )}
        </div>
        <ChevronRight size={14} className="text-muted-foreground shrink-0" />
      </button>
      {visible.length > 1 && (
        <p className="text-xs text-muted-foreground text-center mt-1">
          +{visible.length - 1} more announcement{visible.length > 2 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
