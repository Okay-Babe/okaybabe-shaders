/**
 * useReducedMotion — SSR-safe matchMedia hook.
 *
 * Returns boolean reflecting `prefers-reduced-motion: reduce`, with explicit
 * override modes. Live-updates on system preference changes.
 */

import { useEffect, useState } from 'react';
import type { ReducedMotionMode } from '../types';

export function useReducedMotion(mode: ReducedMotionMode = 'auto'): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (mode === 'force-static') {
      setReduced(true);
      return;
    }
    if (mode === 'force-animate') {
      setReduced(false);
      return;
    }
    // mode === 'auto'
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [mode]);

  return reduced;
}
