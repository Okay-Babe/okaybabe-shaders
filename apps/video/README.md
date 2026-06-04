# video — Remotion compositions for @okaybabe/shaders

Headless MP4 render pipeline for the 13-shader pack. Per spec §2.2 + §0 Correction #2 (Remotion 4.x is the standard programmatic video runtime per ADR-039).

Each composition wraps one shader and drives `uTime` deterministically via `useCurrentFrame() / fps`, passed as the `time` prop — external time mode bypasses ShaderCanvas's wall-clock RAF for pixel-deterministic frame output.

## Render

```bash
# From repo root
pnpm install                                          # install workspace
pnpm --filter @okaybabe/shaders build                 # build dist/ (consumed via workspace:*)
pnpm --filter video render:halation                   # render Halation 1080p master
```

Output: `out/halation-1080p.mp4` (12s @ 60fps @ 1920×1080 H.264).

## Studio (interactive)

```bash
pnpm --filter video dev                               # launches Remotion Studio
```

## ffmpeg derivative cuts (per spec §2.2)

After 1080p master renders, generate platform variants:

```bash
# 1080x1080 social (Instagram square)
ffmpeg -i out/halation-1080p.mp4 -vf "scale=1080:1080:flags=lanczos,crop=1080:1080" \
  -c:v libx264 -crf 24 -preset slower -pix_fmt yuv420p out/halation-1080sq.mp4

# 540x540 gallery
ffmpeg -i out/halation-1080p.mp4 -vf "scale=540:540:flags=lanczos,crop=540:540" \
  -c:v libx264 -crf 24 -preset slower -pix_fmt yuv420p out/halation-540sq.mp4

# 1280x720 README
ffmpeg -i out/halation-1080p.mp4 -vf "scale=1280:720:flags=lanczos" \
  -c:v libx264 -crf 24 -preset slower -pix_fmt yuv420p out/halation-720p.mp4

# Poster JPG (frame at 2s)
ffmpeg -i out/halation-1080p.mp4 -ss 00:00:02 -vframes 1 -q:v 2 out/halation-poster.jpg
```

## Loop periods per shader (GLSL drift → MP4 length)

| Shader | GLSL loop | MP4 export |
|---|---|---|
| Halation | 24s | 12s (half) |
| Foxglove | 30s | 15s |
| Twilight Run | 18s | 9s |
| Quarry | 36s | 18s |
| Optic | 20s | 10s |
| Vellum | 30s | 15s |
| Hessian | 28s | 14s |
| Sirocco | 22s | 11s |
| Prism Stop | 26s | 13s |
| Aperture Bloom | 24s | 12s |
| Ink Run | 28s | 14s |
| Chroma Bleed | 18s | 9s |
| Membrane | 28s | 14s |

(Currently only Halation composition is implemented as proof-of-concept; remaining 12 batched in a later release.)

## Architecture notes

- **External time mode** is load-bearing for Remotion. The `time` prop on every shader component bypasses ShaderCanvas's internal `performance.now()` clock and uses Remotion's frame counter instead. Without this, MP4 frames would not be pixel-deterministic.
- **`alwaysRender` prop** disables IntersectionObserver gates (headless Chromium doesn't trigger them anyway, but explicit is better).
- **`delayRender` warmup** holds capture for ~200ms to let ShaderCanvas's `useEffect(setMounted)` defer chain settle + WebGL context create before the first frame paints.
- **`Config.setChromiumOpenGlRenderer('angle')`** in remotion.config.ts enables WebGL in headless Chromium.

## Output destination

**Production** (live as of 2026-05-22): Cloudflare R2 at `https://previews.okaybabe.dev/v1/<shader>-<variant>.<ext>` (per spec §2.5). All 65 files served from the okaybabe-pack-previews bucket with `Cache-Control: public, max-age=31536000, immutable` on the versioned URLs.

**Manifest**: `apps/video/r2-manifest.json` (tracked in git) maps every filename to its public URL + size + content-type. Landing pages and READMEs consume this file as the source of truth for shader preview URLs.

**Re-upload**: when shaders change and you re-render MP4s, just run `pnpm run upload-r2` again. The URLs are versioned (`/v1/`), so to break browser/edge caches on a content change, bump the version path (`/v2/`) — current scheme assumes content is immutable per URL.

**Local dev**: `out/` directory (gitignored). Run `pnpm run render:halation` etc. to regenerate locally.
