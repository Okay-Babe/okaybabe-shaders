import React from 'react';
import { useCurrentFrame, useVideoConfig, delayRender, continueRender } from 'remotion';
import { Foxglove } from '@okaybabe/shaders';

export const FoxgloveVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  const [handle] = React.useState(() => delayRender('foxglove-warmup'));
  React.useEffect(() => {
    const t = setTimeout(() => continueRender(handle), 200);
    return () => clearTimeout(t);
  }, [handle]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a0f' }}>
      <Foxglove
        time={time}
        alwaysRender
        brandHue={310}
        intensity={0.55}
        petals={5}
        stippling={0.5}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
