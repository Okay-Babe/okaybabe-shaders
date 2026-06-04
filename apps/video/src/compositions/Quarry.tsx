import React from 'react';
import { useCurrentFrame, useVideoConfig, delayRender, continueRender } from 'remotion';
import { Quarry } from '@okaybabe/shaders';

export const QuarryVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  const [handle] = React.useState(() => delayRender('quarry-warmup'));
  React.useEffect(() => {
    const t = setTimeout(() => continueRender(handle), 200);
    return () => clearTimeout(t);
  }, [handle]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a0f' }}>
      <Quarry
        time={time}
        alwaysRender
        brandHue={280}
        intensity={0.45}
        textureScale={4}
        contrast={0.75}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
