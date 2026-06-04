import React from 'react';
import { useCurrentFrame, useVideoConfig, delayRender, continueRender } from 'remotion';
import { ChromaBleed } from '@okaybabe/shaders';

export const ChromaBleedVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  const [handle] = React.useState(() => delayRender('chroma-bleed-warmup'));
  React.useEffect(() => {
    const t = setTimeout(() => continueRender(handle), 200);
    return () => clearTimeout(t);
  }, [handle]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a0f' }}>
      <ChromaBleed
        time={time}
        alwaysRender
        brandHue={293}
        intensity={0.75}
        bleedAmount={0.6}
        edgeStrength={0.7}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
