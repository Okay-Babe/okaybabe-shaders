/**
 * useIntersection — IntersectionObserver hook returning a ref + isIntersecting boolean.
 *
 * Per the WebGL 5-pattern stack #3 (triple-gate render loop), this is one of
 * the three gates. rootMargin=100px means "warm up just before visible" so
 * consumers don't see a static-to-animated pop.
 */

import { useEffect, useRef, useState } from 'react';

export function useIntersection<T extends Element = HTMLDivElement>(options?: {
  rootMargin?: string;
  threshold?: number;
  disabled?: boolean;
}): { ref: React.RefObject<T | null>; isIntersecting: boolean } {
  const ref = useRef<T | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(true); // start true to allow first render

  useEffect(() => {
    if (options?.disabled) {
      setIsIntersecting(true);
      return;
    }
    if (typeof window === 'undefined' || !ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      {
        threshold: options?.threshold ?? 0,
        rootMargin: options?.rootMargin ?? '100px',
      }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [options?.disabled, options?.rootMargin, options?.threshold]);

  return { ref, isIntersecting };
}
