import React from 'react';
import { useCurrentFrame, useVideoConfig, delayRender, continueRender } from 'remotion';
import { InkRun } from '@okaybabe/shaders';

export const InkRunVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  const [handle] = React.useState(() => delayRender('ink-run-warmup'));
  React.useEffect(() => {
    const t = setTimeout(() => continueRender(handle), 200);
    return () => clearTimeout(t);
  }, [handle]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a0f' }}>
      <InkRun
        time={time}
        alwaysRender
        brandHue={280}
        intensity={0.72}
        flow={0.55}
        capillary={0.5}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
