import React from 'react';
import { useCurrentFrame, useVideoConfig, delayRender, continueRender } from 'remotion';
import { Vellum } from '@okaybabe/shaders';

export const VellumVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  const [handle] = React.useState(() => delayRender('vellum-warmup'));
  React.useEffect(() => {
    const t = setTimeout(() => continueRender(handle), 200);
    return () => clearTimeout(t);
  }, [handle]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a0f' }}>
      <Vellum
        time={time}
        alwaysRender
        brandHue={35}
        intensity={0.5}
        grain={0.5}
        warmth={0.6}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
