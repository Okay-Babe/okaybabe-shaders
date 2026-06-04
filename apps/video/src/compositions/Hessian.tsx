import React from 'react';
import { useCurrentFrame, useVideoConfig, delayRender, continueRender } from 'remotion';
import { Hessian } from '@okaybabe/shaders';

export const HessianVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  const [handle] = React.useState(() => delayRender('hessian-warmup'));
  React.useEffect(() => {
    const t = setTimeout(() => continueRender(handle), 200);
    return () => clearTimeout(t);
  }, [handle]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a0f' }}>
      <Hessian
        time={time}
        alwaysRender
        brandHue={35}
        intensity={0.55}
        weaveScale={60}
        fiberVariance={0.45}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
