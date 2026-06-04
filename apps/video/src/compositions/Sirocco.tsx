import React from 'react';
import { useCurrentFrame, useVideoConfig, delayRender, continueRender } from 'remotion';
import { Sirocco } from '@okaybabe/shaders';

export const SiroccoVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  const [handle] = React.useState(() => delayRender('sirocco-warmup'));
  React.useEffect(() => {
    const t = setTimeout(() => continueRender(handle), 200);
    return () => clearTimeout(t);
  }, [handle]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a0f' }}>
      <Sirocco
        time={time}
        alwaysRender
        brandHue={25}
        intensity={0.7}
        windStrength={0.65}
        dustAmount={0.55}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
