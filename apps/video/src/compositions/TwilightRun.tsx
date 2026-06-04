import React from 'react';
import { useCurrentFrame, useVideoConfig, delayRender, continueRender } from 'remotion';
import { TwilightRun } from '@okaybabe/shaders';

export const TwilightRunVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  const [handle] = React.useState(() => delayRender('twilight-run-warmup'));
  React.useEffect(() => {
    const t = setTimeout(() => continueRender(handle), 200);
    return () => clearTimeout(t);
  }, [handle]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a0f' }}>
      <TwilightRun
        time={time}
        alwaysRender
        brandHue={20}
        intensity={0.7}
        streakAmp={0.6}
        horizon={0.55}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
