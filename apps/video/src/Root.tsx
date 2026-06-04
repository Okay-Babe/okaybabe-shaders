import React from 'react';
import { Composition } from 'remotion';
import { HalationVideo } from './compositions/Halation';
import { FoxgloveVideo } from './compositions/Foxglove';
import { TwilightRunVideo } from './compositions/TwilightRun';
import { QuarryVideo } from './compositions/Quarry';
import { OpticVideo } from './compositions/Optic';
import { VellumVideo } from './compositions/Vellum';
import { HessianVideo } from './compositions/Hessian';
import { SiroccoVideo } from './compositions/Sirocco';
import { PrismStopVideo } from './compositions/PrismStop';
import { ApertureBloomVideo } from './compositions/ApertureBloom';
import { InkRunVideo } from './compositions/InkRun';
import { ChromaBleedVideo } from './compositions/ChromaBleed';
import { MembraneVideo } from './compositions/Membrane';

const FPS = 60;
const WIDTH = 1920;
const HEIGHT = 1080;

// Per-shader durations match each shader's GLSL drift loop (half-period for
// seamless MP4 loops). Defined as seconds × FPS at composition registration.
const durations = {
  halation: 12,
  foxglove: 15,
  twilightRun: 9,
  quarry: 18,
  optic: 10,
  vellum: 15,
  hessian: 14,
  sirocco: 11,
  prismStop: 13,
  apertureBloom: 12,
  inkRun: 14,
  chromaBleed: 9,
  membrane: 14,
} as const;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="halation"       component={HalationVideo}       durationInFrames={durations.halation * FPS}       fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="foxglove"       component={FoxgloveVideo}       durationInFrames={durations.foxglove * FPS}       fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="twilight-run"   component={TwilightRunVideo}    durationInFrames={durations.twilightRun * FPS}    fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="quarry"         component={QuarryVideo}         durationInFrames={durations.quarry * FPS}         fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="optic"          component={OpticVideo}          durationInFrames={durations.optic * FPS}          fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="vellum"         component={VellumVideo}         durationInFrames={durations.vellum * FPS}         fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="hessian"        component={HessianVideo}        durationInFrames={durations.hessian * FPS}        fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="sirocco"        component={SiroccoVideo}        durationInFrames={durations.sirocco * FPS}        fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="prism-stop"     component={PrismStopVideo}      durationInFrames={durations.prismStop * FPS}      fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="aperture-bloom" component={ApertureBloomVideo}  durationInFrames={durations.apertureBloom * FPS}  fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="ink-run"        component={InkRunVideo}         durationInFrames={durations.inkRun * FPS}         fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="chroma-bleed"   component={ChromaBleedVideo}    durationInFrames={durations.chromaBleed * FPS}    fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="membrane"       component={MembraneVideo}       durationInFrames={durations.membrane * FPS}       fps={FPS} width={WIDTH} height={HEIGHT} />
    </>
  );
};
