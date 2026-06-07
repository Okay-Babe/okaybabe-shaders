/**
 * useWebGLSupported — one-time WebGL detection on mount.
 *
 * Tries WebGL 1.0 (sufficient for all 13 okaybabe shaders). Cleans up the
 * test context immediately via WEBGL_lose_context extension to avoid leaking
 * a context slot (browsers cap at 8-16 active contexts).
 *
 * Returns `true` when WebGL is supported, `false` after detection if not.
 * Initial `null` means "not yet detected" — components should treat null as
 * "not yet mounted" and skip canvas creation.
 */

import { useEffect, useState } from 'react';

export function useWebGLSupported(): boolean | null {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      setSupported(false);
      return;
    }
    try {
      const canvas = document.createElement('canvas');
      const gl =
        (canvas.getContext('webgl', {
          preserveDrawingBuffer: false,
          powerPreference: 'low-power',
          failIfMajorPerformanceCaveat: false,
        }) as WebGLRenderingContext | null) ||
        (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

      if (gl) {
        const loseCtx = gl.getExtension('WEBGL_lose_context');
        loseCtx?.loseContext();
        setSupported(true);
      } else {
        setSupported(false);
      }
    } catch {
      setSupported(false);
    }
  }, []);

  return supported;
}
