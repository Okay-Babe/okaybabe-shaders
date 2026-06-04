import React from 'react';
import { useCurrentFrame, useVideoConfig, delayRender, continueRender } from 'remotion';
import { Halation } from '@okaybabe/shaders';

/**
 * HalationVideo — Remotion composition wrapping the Halation shader.
 *
 * Drives uTime deterministically via useCurrentFrame() / fps (external time
 * mode bypasses ShaderCanvas's wall-clock RAF). Each captured frame gets the
 * exact time value Remotion expects, producing pixel-deterministic output.
 *
 * Brand defaults: brandHue=293 (#7C3AED OKLCH anchor), intensity=0.6,
 * chromaticGrain=0.4 — matches the demo page hero.
 */
export const HalationVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  // Hold render for the first ~3 frames to let WebGL context warm up
  // (ShaderCanvas defers mount via useEffect; first frame may be blank otherwise)
  const [handle] = React.useState(() => delayRender('halation-warmup'));
  React.useEffect(() => {
    const t = setTimeout(() => continueRender(handle), 200);
    return () => clearTimeout(t);
  }, [handle]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a0f' }}>
      <Halation
        time={time}
        alwaysRender
        brandHue={293}
        intensity={0.6}
        chromaticGrain={0.4}
        speed={1}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
