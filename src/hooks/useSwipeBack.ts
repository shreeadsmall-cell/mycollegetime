import { useRef, useCallback } from "react";

interface UseSwipeBackOptions {
  onSwipeRight: () => void;
  threshold?: number;
  edgeWidth?: number;
}

export function useSwipeBack({ onSwipeRight, threshold = 80, edgeWidth = 40 }: UseSwipeBackOptions) {
  const startX = useRef(0);
  const startY = useRef(0);
  const swiping = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    // Only trigger from left edge
    if (touch.clientX <= edgeWidth) {
      startX.current = touch.clientX;
      startY.current = touch.clientY;
      swiping.current = true;
    }
  }, [edgeWidth]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!swiping.current) return;
    swiping.current = false;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - startX.current;
    const dy = Math.abs(touch.clientY - startY.current);
    // Horizontal swipe: must travel enough and be more horizontal than vertical
    if (dx >= threshold && dy < dx * 0.5) {
      onSwipeRight();
    }
  }, [threshold, onSwipeRight]);

  return { onTouchStart, onTouchEnd };
}
