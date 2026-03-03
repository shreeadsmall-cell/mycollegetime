import { useState, useEffect, useRef } from "react";
import { Ad } from "@/hooks/useAds";
import { X, ExternalLink } from "lucide-react";

interface AdPlayerProps {
  ad: Ad;
  onClose: () => void;
  onViewed: (adId: string) => void;
  onTrackEvent?: (adId: string, event: string, duration?: number) => void;
}

export function AdPlayer({ ad, onClose, onViewed, onTrackEvent }: AdPlayerProps) {
  const [countdown, setCountdown] = useState(ad.skip_after_seconds);
  const [canSkip, setCanSkip] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    onViewed(ad.id);
    onTrackEvent?.(ad.id, "impression");
  }, [ad.id, onViewed, onTrackEvent]);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (next >= ad.duration_seconds) {
          clearInterval(interval);
          onTrackEvent?.(ad.id, "complete", next);
          onClose();
        }
        return next;
      });
      setCountdown((c) => {
        if (c <= 1) {
          setCanSkip(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [ad.duration_seconds, onClose]);

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <span className="text-xs text-muted-foreground font-medium">Sponsored</span>
        <div className="flex items-center gap-2">
          {!canSkip ? (
            <span className="text-xs font-bold text-muted-foreground bg-secondary px-3 py-1 rounded-full">
              Skip in {countdown}s
            </span>
          ) : (
            <button
              onClick={() => { onTrackEvent?.(ad.id, "skip", elapsed); onClose(); }}
              className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
            >
              Skip <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Media */}
      <div className="flex-1 flex items-center justify-center bg-background p-4">
        {ad.media_type === "video" ? (
          <video
            ref={videoRef}
            src={ad.media_url}
            autoPlay
            muted
            playsInline
            className="max-w-full max-h-full rounded-xl object-contain"
          />
        ) : (
          <img
            src={ad.media_url}
            alt={ad.title}
            className="max-w-full max-h-full rounded-xl object-contain"
          />
        )}
      </div>

      {/* Bottom */}
      <div className="px-4 py-3 bg-card border-t border-border space-y-2">
        {/* Progress bar */}
        <div className="h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${Math.min(100, (elapsed / ad.duration_seconds) * 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground truncate">{ad.title}</p>
          <div className="flex items-center gap-2 shrink-0">
            {ad.click_url && (
              <a
                href={ad.click_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onTrackEvent?.(ad.id, "click", elapsed)}
                className="flex items-center gap-1 text-xs text-primary font-semibold"
              >
                Learn more <ExternalLink size={12} />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
