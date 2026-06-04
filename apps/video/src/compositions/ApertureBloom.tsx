import React from 'react';
import { useCurrentFrame, useVideoConfig, delayRender, continueRender } from 'remotion';
import { ApertureBloom } from '@okaybabe/shaders';

export const ApertureBloomVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  const [handle] = React.useState(() => delayRender('aperture-bloom-warmup'));
  React.useEffect(() => {
    const t = setTimeout(() => continueRender(handle), 200);
    return () => clearTimeout(t);
  }, [handle]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a0f' }}>
      <ApertureBloom
        time={time}
        alwaysRender
        brandHue={293}
        intensity={0.78}
        bloomRadius={0.55}
        shadowAmount={0.4}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
