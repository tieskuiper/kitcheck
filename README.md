# KitCheck

**Know exactly what to wear before you ride.** — [kitcheck.cc](https://kitcheck.cc)

KitCheck is a free cycling kit calculator. Riders enter a location (or upload a GPX route), pick an effort level and get a kit recommendation per body zone, based on the hourly forecast for the whole ride window — not a single snapshot.

## What it does

- **Location** — city search, browser geolocation or GPX upload (start point is used for the forecast)
- **Ride window** — 7-day forecast, start time in 30-minute steps, duration set manually or estimated from the GPX route (distance + elevation at the chosen intensity)
- **Rider profile** — intensity (easy → race) and warmth tendency (always cold → always warm)
- **Recommendation** — comfort score, kit per zone (head, upper body, hands, lower body, feet), required vs optional items, and notes when conditions change during the ride
- **Route map** — GPX route with start/end markers and wind direction
- **Guide** — `/guide/` is the hub, with a page per temperature (`/guide/what-to-wear-cycling-10-degrees/` etc.). Kit lists and "what changes" are generated from `kitLogic.ts`, so the guide always matches the calculator

## Tech stack

| Layer | Choice |
| :-- | :-- |
| Framework | [Astro 7](https://astro.build) — static output, one React island for the calculator |
| UI | React 19 + Tailwind CSS 4 |
| Icons | [Central Icons](https://centralicons.com) (licensed, see below) |
| Maps | Leaflet + MapLibre GL, tiles from [OpenFreeMap](https://openfreemap.org) |
| Weather | [Open-Meteo](https://open-meteo.com) forecast + geocoding (no API key) |
| Reverse geocoding | [Nominatim](https://nominatim.org) (OpenStreetMap) |
| Hosting | Cloudflare Workers (static assets), deployed with Workers Builds |
| Analytics | Google Analytics 4, only after consent |
| Fonts | Self-hosted via Fontsource (no Google Fonts requests) |

There is no backend: all API calls happen in the browser.

## Getting started

Requires **Node.js 22.12+** (pinned to 22 in `.node-version`) and **pnpm 11** (pinned in `package.json` → `packageManager`; `corepack enable` picks it up automatically).

```sh
cp .env.example .env            # then fill in CENTRAL_LICENSE_KEY
set -a; source .env; set +a     # export it for this shell
pnpm install
pnpm dev                        # http://localhost:4321
```

| Command | Action |
| :-- | :-- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Build the production site to `./dist/` |
| `pnpm preview` | Serve the build locally |
| `pnpm check` | Type-check `.astro` and `.ts(x)` files |

### pnpm settings (`pnpm-workspace.yaml`)

- **`minimumReleaseAge: 1440`** — versions published less than 24 hours ago are not installed (protection against compromised releases). A fresh release simply resolves to the previous version until it's a day old.
- **`allowBuilds`** — pnpm 11 blocks dependency install scripts unless listed. Only the Central Icons license check is allowed. If you add a package that needs a build step, pnpm will fail the install and name it; add it here deliberately.

### Central Icons license key

`@central-icons-react/...` is a paid icon package. Its install script fails unless `CENTRAL_LICENSE_KEY` is set, so **every `pnpm install` needs the key** — locally and on Cloudflare Pages.

- **Locally:** `.env` (git-ignored, see `.env.example`), exported before installing.
- **Cloudflare Workers Builds:** *Workers & Pages → kitcheck → Settings → **Build** → Variables and secrets* → add `CENTRAL_LICENSE_KEY` as a secret. It must be a **build** variable (used during `pnpm install`), not a runtime variable of the Worker.
- **Your shell:** easiest is a line `export CENTRAL_LICENSE_KEY=...` in `~/.zshrc`, so every `pnpm install` and `pnpm dev` just works. pnpm 11 re-checks dependencies before `pnpm dev` and installs when they're out of date — without the key, that install (and therefore `pnpm dev`) fails.

If a deploy fails at the install step with `Central Icons license key is not set`, this variable is missing or expired.

## Project structure

```text
src/
├── components/
│   ├── calculator/
│   │   ├── Calculator.tsx       # React island: layout only
│   │   ├── useKitCalculator.ts  # all calculator state + handlers
│   │   ├── LocationSearch.tsx   # search, geolocation, GPX upload
│   │   ├── RiderProfile.tsx     # intensity + warmth tendency
│   │   ├── RideTiming.tsx       # day tabs, start time, duration, weather chips
│   │   ├── KitCard.tsx          # recommendation output
│   │   ├── RouteMap.tsx         # Leaflet/MapLibre route map
│   │   ├── DayTabs.tsx, WeatherChips.tsx, ui.tsx
│   │   ├── constants.tsx        # tier colours, intensity options, zone icons
│   │   └── format.ts            # unit + time formatting (°C/°F, km/mi)
│   ├── SiteHeader.astro, SiteFooter.astro, CookieBanner.astro
├── layouts/Base.astro           # <head>, SEO meta, GA consent
├── lib/
│   ├── kitLogic.ts              # comfort score + kit rules (the core logic)
│   ├── guideData.ts             # guide temperatures, intros and variations (derived from kitLogic)
│   ├── openmeteo.ts             # forecast, geocoding, hourly slices
│   ├── gpx.ts                   # GPX parsing (distance, elevation, start point)
│   ├── rideDuration.ts          # duration estimate from route + intensity
│   ├── consent.ts               # consent storage, GA4 loading, track() for events
│   └── mapTiles.ts              # map tile providers (primary + fallback)
├── pages/                       # index, guide/ (hub + [slug] temperature pages), privacy, cookies, 404
└── styles/global.css            # Tailwind theme tokens
public/
├── _headers                     # security headers incl. CSP (Cloudflare static assets)
└── _redirects                   # trailing-slash redirects
```

The page header (unit toggle, "use my location") lives outside the React island and talks to the calculator through window events: `kitcheck:unit` and `kitcheck:geolocate`.

## SEO structure

- **Homepage = the tool.** Targets tool searches ("cycling kit calculator"); only page with `WebApplication` structured data (`appSchema` prop on `Base.astro`).
- **Guide = the answers.** `/guide/` targets "what to wear cycling by temperature"; each temperature page targets "what to wear cycling at X°C / X°F", with `BreadcrumbList` structured data.
- **Adding a temperature:** add an entry with a hand-written intro to `TEMP_PAGES` in `src/lib/guideData.ts`. Only add temperatures where the advice actually differs — near-duplicate pages hurt more than they help.
- **Changing `kitLogic.ts` thresholds:** the generated kit lists update automatically, but re-read the intros in `guideData.ts` and the general FAQ answers in `src/pages/guide/index.astro`.

## Raas Racing Team banner

`src/components/TeamBanner.astro`, shown below the calculator.

- **Colours:** `--color-team-bg`, `--color-team-accent` and `--color-team-on-accent` in `src/styles/global.css`.
- **Logos:** `src/assets/raas/` — `wordmark.svg` (RAAS / Racing Team), `signature.svg` (handwritten "Raas", used as the sign-off) and `emblem.svg` (R·R·T chain, the badge on the stripes). They use `currentColor`, so colour them with a `text-*` class; Astro inlines them, so there's no extra request.
- The Instagram button is a plain link (no embed), so it needs no consent. Clicks are tracked as `team_instagram_click` in GA4 only for visitors who accepted analytics.

## Map tiles

The route map uses **OpenFreeMap** vector tiles: no API key, no registration, no view limits. If WebGL is unavailable or the style fails to load within 8 seconds, it automatically falls back to OpenStreetMap raster tiles.

To change provider, edit [`src/lib/mapTiles.ts`](src/lib/mapTiles.ts) **and** the CSP in [`public/_headers`](public/_headers).

> We moved off CARTO basemaps because they started serving "API key required" watermarked tiles. Avoid providers that need a key unless the key and its quota are actively managed.

## Privacy, consent and analytics

The site is built to need consent for as little as possible (GDPR + Dutch Telecommunicatiewet art. 11.7a):

| What | Consent? | How |
| :-- | :-- | :-- |
| Google Analytics 4 | **Yes** | `gtag.js` is only injected after *Accept* (`src/lib/consent.ts`). Before that, nothing is requested from Google — no consent-mode pings |
| Fonts | No | Self-hosted |
| Weather / place lookups | No (needed for the service) | Coordinates are rounded to ~1 km before leaving the browser |

**Consent rules in code** (`src/lib/consent.ts`):
- Choice is stored in `localStorage` (`kitcheck-consent`) with a timestamp and version; it expires after 12 months.
- Bump `CONSENT_VERSION` when the cookie policy changes materially — everyone is asked again.
- *Decline* (also later, via **Cookie settings** in the footer) disables GA and deletes the `_ga` cookies.
- Accept and Decline buttons must keep equal visual weight.

**Calculator events** — call `track(name, params, debounceMs?)` from `src/lib/consent.ts`. It does nothing without consent. Never send location names, coordinates or anything typed by the user. Full event list and the one-time GA4 setup (key events, custom dimensions): [docs/analytics-setup.md](docs/analytics-setup.md).

**GA4 admin settings** that the privacy policy relies on: data retention 2 months (default), Google signals off, ads personalisation off, data sharing settings off, data processing terms accepted.

When you add a tracker, cookie or third-party service, update `src/pages/privacy.astro`, `src/pages/cookies.astro` and the CSP together.

## Content Security Policy

`public/_headers` contains a strict CSP. When you add a third-party service (API, tiles, fonts, analytics), add its domain to the right directive or the browser will silently block it. Check the browser console for `Refused to …` errors after deploying.

## Deployment

Cloudflare Workers Builds deploys from git:

| Branch | Goes to |
| :-- | :-- |
| `develop` | Preview |
| `main` | Production |

| Build setting | Value |
| :-- | :-- |
| Build command | `pnpm build` |
| Deploy command | `npx wrangler deploy` (Cloudflare default; detects Astro and serves `dist/` as static assets) |
| Build variable `CENTRAL_LICENSE_KEY` | secret |
| Build variable `PNPM_VERSION` | `11.20.0` — keep in sync with `packageManager` |

Node is taken from `.node-version`; pnpm is detected from `pnpm-lock.yaml`. `public/_headers` and `public/_redirects` are applied by Workers static assets, including long-term caching for `/_astro/*` and HSTS.

## Changelog

See [CHANGELOG.md](CHANGELOG.md). We follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and semantic versioning.
