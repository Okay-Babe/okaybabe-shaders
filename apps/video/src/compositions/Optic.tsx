import React from 'react';
import { useCurrentFrame, useVideoConfig, delayRender, continueRender } from 'remotion';
import { Optic } from '@okaybabe/shaders';

export const OpticVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  const [handle] = React.useState(() => delayRender('optic-warmup'));
  React.useEffect(() => {
    const t = setTimeout(() => continueRender(handle), 200);
    return () => clearTimeout(t);
  }, [handle]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a0f' }}>
      <Optic
        time={time}
        alwaysRender
        brandHue={293}
        intensity={0.75}
        apertureBlades={5}
        chromaticEdge={0.55}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
