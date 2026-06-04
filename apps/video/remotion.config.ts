import { Config } from '@remotion/cli/config';

// MP4 output quality
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(90);
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');
Config.setCrf(23);

// Headless Chrome flags — enable WebGL for shader rendering
Config.setChromiumOpenGlRenderer('angle');

// Concurrency: render 2 compositions in parallel (M-series Macs handle this fine)
Config.setConcurrency(2);
