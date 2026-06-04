import React from 'react';
import { useCurrentFrame, useVideoConfig, delayRender, continueRender } from 'remotion';
import { PrismStop } from '@okaybabe/shaders';

export const PrismStopVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  const [handle] = React.useState(() => delayRender('prism-stop-warmup'));
  React.useEffect(() => {
    const t = setTimeout(() => continueRender(handle), 200);
    return () => clearTimeout(t);
  }, [handle]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a0f' }}>
      <PrismStop
        time={time}
        alwaysRender
        brandHue={293}
        intensity={0.85}
        dispersion={0.6}
        bandWidth={0.2}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
