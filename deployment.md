# Deployment — `@okaybabe/shaders` context-loss + reduced-motion fix

> Branch: `fix/shadercanvas-context-loss-and-reduced-motion`
> This is a published npm package — "deploy" = `npm publish` (manual, maintainer,
> 2FA). There is no runtime service to redeploy.

## 1. What changed

`src/lib/ShaderCanvas.tsx` — two robustness fixes to the load-bearing WebGL engine
(public props unchanged; the 26 wrapper components are unaffected):

- **WebGL context-loss recovery.** Added `webglcontextlost` (`preventDefault()` +
  drop the invalidated program/buffer refs + hide the canvas so the CSS fallback
  shows) and `webglcontextrestored` (rebuild program + quad buffer on the recovered
  context via the extracted `buildGLResources(gl)`, reset viewport, resume). Before
  this, a GPU/driver reset — common on Firefox, tab backgrounding, GPU OOM — left a
  permanently blank canvas with no recovery path.
- **Reduced motion stops the rAF loop.** Under `prefers-reduced-motion` the engine
  now draws a single static frame then cancels `requestAnimationFrame` (redrawing
  only on resize / context restore), instead of redrawing a frozen frame every rAF
  tick. Makes the implementation match the behavior the v1.0.0 changelog already
  documented. External/Remotion time mode is unchanged (still animates).

Plus drift fixes (G5): `package.json` `homepage` → `/shaders`; MP4 preview host
references → `previews.okaybabe.dev`; doc-comment shader count `12` → `13`.

## 2. New env vars
None.

## 3. New dependencies
None. (No test harness added — see §7.)

## 4. Database migrations
N/A — static package.

## 5. Breaking changes / rollback
**None.** Internal behavior only; the public `ShaderCanvas` / wrapper prop surface is
identical. Backward compatible → recommend a **patch** bump (`1.0.1`): both changes
are fixes (resilience + honoring an OS preference + aligning with documented
behavior), not new opt-in API.

Rollback: revert the merge commit and republish the prior `dist/` (or `git revert`
the branch merge); no consumer migration needed either direction.

## 6. Publish + post-publish verification
1. `nvm use` (Node 24) → `pnpm install` → `pnpm typecheck && pnpm build && pnpm test && pnpm size` (all green on this branch: typecheck clean, full pack 15.19 KB ≤ 35, r3f 12.79 KB ≤ 15, Halation 4.55 KB ≤ 6).
2. Bump version to `1.0.1`, move the `[Unreleased]` CHANGELOG block under the new version heading.
3. `npm publish` (maintainer, 2FA). Verify `npm audit signatures` (sigstore provenance).
4. **Manual QA** (jsdom can't exercise real WebGL — verify in a browser):
   - **Firefox context-loss:** load a live shader → DevTools/`WEBGL_lose_context.loseContext()` (or tab-away ×5) → confirm the canvas hides to the CSS fallback, then **restores and resumes** on `restoreContext()` / tab-return (no permanent blank).
   - **Reduced motion:** enable OS "Reduce motion" → confirm the shader shows a single static frame and the rAF loop is **not** running (DevTools Performance: no per-frame `drawArrays`); resize the window → static frame redraws at the new resolution.
   - **Remotion/external-time** (if used): confirm headless render still animates frame-by-frame (reduced-motion exemption holds).

## 7. Consumer impact + follow-up
- **okaybabe.com/shaders landing is NOT a consumer of this package** — it uses a
  self-contained vanilla-WebGL port (`build-shaders.mjs`) that already has its own
  context-loss handling. So this PR does **not** require rebuilding/redeploying the
  landing page. The fix benefits **React / r3f consumers** of the published package.
- After publish, bump `@okaybabe/shaders` in any React/r3f consumer to pick up the
  Firefox resilience.
- **Follow-up (recommended, separate PR):** the package has no test harness. Add
  `jsdom` + `@testing-library/react` + a vitest setup and cover the new context-loss
  and reduced-motion paths with a mocked WebGL context. Deferred here to keep this a
  focused fix and avoid pulling new devDeps into a fix PR without maintainer sign-off.
