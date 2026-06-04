import React from 'react';
import { useCurrentFrame, useVideoConfig, delayRender, continueRender } from 'remotion';
import { Membrane } from '@okaybabe/shaders';

export const MembraneVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  const [handle] = React.useState(() => delayRender('membrane-warmup'));
  React.useEffect(() => {
    const t = setTimeout(() => continueRender(handle), 200);
    return () => clearTimeout(t);
  }, [handle]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a0f' }}>
      <Membrane
        time={time}
        alwaysRender
        brandHue={280}
        intensity={0.7}
        density={0.6}
        membraneStrength={0.5}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
