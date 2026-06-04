/**
 * useScrollGate — debounced scroll/wheel/touchmove listener.
 *
 * Returns a ref to a boolean (NOT React state — we don't want to re-render every
 * scroll event; the rAF loop reads the ref directly). Sets true on any scroll
 * input, clears 150ms after the last event.
 *
 * Per WebGL 5-pattern stack #3 — gates the render loop during active scrolling
 * to give the compositor breathing room.
 */

import { useEffect, useRef } from 'react';

export function useScrollGate(debounceMs = 150): React.RefObject<boolean> {
  const isScrollingRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const onScroll = () => {
      isScrollingRef.current = true;
      if (timerId !== null) clearTimeout(timerId);
      timerId = setTimeout(() => {
        isScrollingRef.current = false;
        timerId = null;
      }, debounceMs);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', onScroll, { passive: true });
    window.addEventListener('touchmove', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('wheel', onScroll);
      window.removeEventListener('touchmove', onScroll);
      if (timerId !== null) clearTimeout(timerId);
    };
  }, [debounceMs]);

  return isScrollingRef;
}
