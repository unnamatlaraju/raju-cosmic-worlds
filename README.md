# Raju's Cosmic Worlds

**Stage 1 — The Nebula Gateway · Interactive redesign**

A cinematic, procedural portfolio introduction built with React, TypeScript, Vite, and Three.js. All art is generated locally. The two small, self-hosted font files are DM Sans and Instrument Serif, distributed with their SIL Open Font Licenses in `public/fonts/`.

## Run locally

Requires Node.js **20.19+ or 22.12+**. This project was built with Node **22.22.3** and npm **10.9.8**.

```sh
npm ci --cache .npm-cache
npm run dev
```

Open **http://localhost:5173**. The first command is only needed when dependencies have not already been installed. No environment variables, API keys, backend services, or external runtime requests are required.

```sh
npm run typecheck  # Strict TypeScript checks, including browser tests
npm run build      # Type checks and a production bundle in dist/
npm run preview    # Serve that bundle locally, normally on port 4173
```

## The experience

- **Fasten Your Seatbelt** starts a 3.2-second eased camera journey to the Vidyu World destination marker, with a restrained field-of-view change and depth-separated stellar motion.
- The stable arrival presents **A World of Ideas** and the supplied school-management SaaS introduction.
- **Return to Gateway**, the header's **Gateway** control, or the wordmark restores the gateway. The header can also interrupt an in-progress flight.
- **Explore the Universe** and **The worlds** open the accessible cosmic atlas. Vidyu is the only available destination. The other four are labelled future destinations.
- Moving the mouse produces damped positional, yaw and pitch changes, with different parallax at each stellar/cloud depth. Leaving the page settles the camera. Vidyu has a projected HTML hit target that follows the sphere, reveals its invitation on hover/focus, and launches on click, touch or Enter. No essential action requires interacting with the artwork.
- The footer's scene control switches between live WebGL and a lightweight illustrated scene. It controls graphics, not sound.
- Reduced-motion preferences stop ambient animation and parallax, and replace travel with a 360ms dissolve between stable camera positions. The frame scheduler sleeps at rest.

## Main files

| File | Responsibility |
| --- | --- |
| `src/App.tsx` | Gateway/arrival content, application composition, focus and interface state |
| `src/navigation/useJourney.ts` | Guarded navigation state machine and time-based, eased travel |
| `src/animation/frameClock.ts` | The single shared, visibility-aware frame scheduler for rendering, travel and progress |
| `src/scene/UniverseScene.tsx` | Lazy renderer loading, graphics status, illustrated fallback, cleanup boundary |
| `src/scene/UniverseRenderer.ts` | Camera, render loop, resize/DPR handling, adaptive quality and GPU-resource ownership |
| `src/scene/shaders.ts` | Procedural nebula clouds, distant galaxy, stars, planet material and rings |
| `src/scene/createStars.ts` | Three seeded star populations, reusable buffers and a distant cluster |
| `src/scene/createPlanet.ts` | Real spherical destination geometry, shaded rings and three supporting moons |
| `src/scene/composition.ts` | Purpose-designed portrait/landscape celestial placement and arrival proportions |
| `src/components/WorldIndex.tsx` | Native modal destination atlas, keyboard focus wrapping and dismissal |
| `src/components/FlightOverlay.tsx` | Travel caption, visual progress and reduced-motion dissolve |
| `src/components/Icon.tsx` | Small local SVG icon set |
| `src/hooks/useMotionPreference.ts` | Live subscription to the system's reduced-motion preference |
| `src/data/destinations.ts` | Typed registry of the five planned destinations |
| `src/styles.css` | Art direction, layout, responsive behavior and CSS fallback illustration |
| `tests/gateway.spec.ts` | Browser-level navigation, mobile, motion and graphics-failure checks |

## Rendering and accessibility

The UI renders immediately, independently of the lazy-loaded 3D engine. Far, middle and near cloud strata use different noise scales, motion and pointer offsets in a low-resolution offscreen pass. Dark dust lanes preserve negative space. Three star populations have crisp cores, sparse halos, individual twinkling rates and different depth ranges. The nearest stellar plane still sits behind Vidyu. Three supporting bodies use teal, ochre and slate palettes with different light directions and scales.

The main planet is a rotating sphere with seamless object-space surface noise, a directional terminator, reflected fill and an atmospheric rim. Its annular mesh has irregular dusty bands, depth-tested foreground/background occlusion and a procedural planetary shadow. It is a destination marker, not a full planet environment.

The desktop DPR cap is 1.6; mobile is 1.35. The cloud pass is at most 720px wide (420px on mobile) and updates at up to 24Hz, while geometry follows the display frame loop. Mobile uses fewer stars and lighter geometry. No bloom chain, full-screen blur, external texture downloads or new dependencies were added.

The renderer samples frame rate after warmup. Below 27 FPS it lowers DPR, cloud resolution/update rate and stellar density; constrained mobile drops the smallest moon while preserving the others. If the next sample remains below 16 FPS, it switches to the illustrated scene. These are adaptation thresholds, not a frame-rate guarantee. WebGL creation failure and context loss use the same fallback, preserving all controls and navigation. The shared scheduler pauses in hidden tabs and completes interrupted flights using wall-clock time when the tab resumes. GPU resources, animation subscriptions, event listeners and observers are released on teardown; shared geometries are disposed only once.

Essential navigation is semantic HTML. Focus indicators, a skip link, a modal atlas, screen-reader status announcements, focus restoration, touch-sized controls and reduced-motion support are included. Short screens can scroll vertically; content does not require a mouse or interaction with 3D objects.

## Browser checks

Playwright is a development-only dependency. Its browser binaries, temporary profiles and screenshots stay inside this project.

```sh
PLAYWRIGHT_BROWSERS_PATH="$PWD/.browsers" npm exec --cache .npm-cache -- playwright install chromium
npm run build
npm run test:e2e
```

The suite starts a **production preview on port 5174** and checks:

1. Working WebGL, duplicate-click protection, departure, arrival, return and console errors.
2. Atlas keyboard focus, Escape dismissal, future destination labels and the Vidyu entry.
3. Compact mobile touch navigation, 320px overflow checks and orientation changes.
4. Laptop/tablet compositions at 1280×720, 1024×768, 768×1024 and 375×667, including checks for destination/hero collisions.
5. Measurable, bounded pointer parallax, pointer-leave settling, hover feedback and keyboard activation of the planet.
6. Reduced-motion idle scheduling, single-RAF travel, short navigation and live preference changes.
7. Navigation when WebGL is unavailable.
8. Navigation after WebGL context loss.
9. Flight interruption and complete navigation with the renderer disabled.

Screenshots are saved in `artifacts/`; failure traces go in `test-results/`. The tests use Chromium's software renderer for headless environments. Linux requires Chromium's shared libraries; this sandbox's extra libraries and font runtime were extracted under `.runtime/`, without a system-wide installation. Local runtime directories and downloaded browser binaries are ignored by Git and excluded from the production bundle.

The redesigned desktop, mobile and tablet screenshots have been visually reviewed for star separation, planet lighting, three supporting bodies and layout. Physical-device GPU performance, Safari and Firefox have not been validated. Very short or zoomed viewports intentionally allow vertical scrolling to preserve readable, accessible controls.

## Stage 2 foundation

`destinations.ts` is the future navigation catalogue; `useJourney` supplies the gateway/flight/arrival boundary. Scene builders are independent of interface content. A future planet environment and character guide can attach at the Vidyu arrival boundary, with authored dialogue managed by React rather than the graphics loop.

Stage 1 contains the gateway and Vidyu arrival marker only. Future destination descriptions are navigation categories, not claims about completed projects or personal achievements.
