# Changelog

All notable changes to KitCheck will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.1] - 2026-10-17

### Fixed
- GPX upload no longer hangs on "Loading…" when Open-Meteo is slow: all weather and place-name requests have a timeout; if the full route forecast takes longer than 10 s, it's fetched for five key points (start, highest point, finish and two in between) instead, and only if that fails too does the advice fall back to the start point, with a note on the kit card
- "My location" stops after 15 s with a clear message instead of staying on "Detecting…" when the browser's location prompt is left unanswered

## [1.3.0] - 2026-10-17

### Changed
- Kit logic (owner decisions): near freezing (feels-like ≤ 2°C) a hard or race effort keeps the winter body kit, with a note on the kit card that you could go lighter but will feel cold; dry cold gets thermal instead of waterproof winter gloves and overshoes (waterproof only when rain is likely); for the whole ride a waterproof pair now outranks a thermal one of equal warmth, so a dry start that turns wet gets waterproof gloves and overshoes
- docs/kit-logic.md updated: cold effort floor, glove/overshoe rules, decided quirks
- Articles no longer carry a personal byline: only the "Updated" date shows, and kitcheck.cc (the organisation) is the author in structured data; the About page still says who makes the tool
- Hero on every page except the homepage is a separate white band with a bottom border, left-aligned; the section below sits on the page background
- Pre-launch review fixes: copy corrected where it contradicted the kit logic (gilet range, wind "one step warmer", winter layers and freezing kit, rain/leg thresholds, effort 4–8°C, overshoes and rain overshoes); FAQ answers on temperature pages are full sentences that name the temperature; "no gloves" no longer listed as required; unchanged variations collapsed into one line; ranges read "below 8°C" and "-2 to 5°C"
- Route "rain likely" note now uses the same 60% threshold as the rain kit (was 50%); strong-wind variation uses 35 km/h like the wind table
- Light grey text darkened to #72716D for WCAG AA contrast (was 2.6:1)
- Header and footer moved out of `<main>`; icon-only search/clear buttons got accessible names
- MapLibre stylesheet loads only when a map is shown (was in every homepage `<head>`); headline font preloaded; share image resized to 1200×630; 512px PNG logo for structured data and apple-touch-icon
- Structured data: brand description and alternate names, logo as ImageObject, per-page publish dates; About H1 names the brand; consistent breadcrumb names
- Security/privacy: HSTS includeSubDomains, CSP frame-ancestors/form-action/upgrade-insecure-requests, stricter Permissions-Policy, UTF-8 for llms files; GA cookies removed when consent expires; privacy policy lists all analytics events; GPX points with invalid numbers rejected
- Fix: the 404 page had both an index and a noindex robots tag and a canonical pointing at the homepage
- Kit card shows "Feels like X°C on the bike" instead of a 0–110 score; condition labels now use the same bands as the kit
- Gloves and overshoes are chosen for the whole ride (nobody carries a second pair): the warmest pair needed, with a note if that's because of later cold or rain
- Default GPX speeds raised to road-cycling values: easy 22, moderate 26, hard 30, race 35 km/h on the flat (was 18/23/28/33)
- Kit notes say "take a … with you" instead of "pack a … for the return" (the cold part can be a summit, not only the way back)
- Guide turned into a hub linking to the temperature pages; per-temperature FAQ entries moved to those pages
- Homepage H1 and title focus on the tool ("What to wear cycling, sorted before you ride"); guide title targets "what to wear cycling by temperature"
- `WebApplication` structured data only on the homepage instead of every page
- Switched from npm to pnpm 11, with a 24-hour minimum release age and an explicit allowlist for install scripts
- Upgraded MapLibre GL to v6 (worker bundled separately)
- Type packages moved to `devDependencies`; Node pinned via `.node-version`
- Hashed assets (`/_astro/*`) cached for a year; added HSTS and Cross-Origin-Opener-Policy headers; removed deprecated `X-XSS-Protection`
- Upgraded to Astro 7, `@astrojs/react` 7, React 19.3 and Tailwind CSS 4.3
- Route map now uses OpenFreeMap vector tiles (MapLibre GL) with automatic fallback to OpenStreetMap raster tiles
- Calculator split into focused components under `src/components/calculator/`, with state in a `useKitCalculator` hook
- README rewritten for KitCheck (setup, license key, structure, deployment)

### Privacy
- Google Analytics now loads only after explicit consent; before that no request is made to Google
- Consent can be changed or withdrawn any time via "Cookie settings" in the footer; withdrawing deletes GA cookies
- Consent expires after 12 months and is re-asked when the cookie policy changes
- Cookie banner: equal Accept/Decline buttons, accessible dialog, clearer text
- Fonts self-hosted instead of loaded from Google Fonts
- Coordinates rounded to ~1 km before being sent to Open-Meteo and Nominatim
- Privacy policy and cookie policy rewritten to match exactly what the site does

### Added
- Summer page (`/guide/summer-cycling-clothing/`): kit from fresh mornings to 30°C, heat, drinking, sun and summer rain; linked from the guide, the footer and the temperature pages from 20°C (cold pages up to 5°C link the winter page)
- `docs/kit-logic.md`: the whole kit algorithm written out, with tables generated from the engine (`pnpm docs:kit`, checked with `pnpm docs:kit:check`); `CLAUDE.md` with project rules for AI agents
- `/sitemap/`: every page by section with a page count, linked from the footer
- SEO/GEO pass: homepage title on "what to wear cycling today", "no app" positioning and a homepage FAQ; byline with updated date on articles; `og:type=article` with modified time; `max-snippet`/`max-image-preview` robots directives; sitemap `lastmod` (legal pages excluded); `/llms-full.txt`; guide `CollectionPage` structured data; richer `WebApplication` data; temperature pages compare with neighbouring temperatures, answer the °F question and link to the matching kit guides; sources on How it works; shorter titles and descriptions
- SEO/GEO: interactive temperature chart page, a -5°C page, kit pages (arm & knee warmers, bib tights/leg warmers, base layer, overshoes, winter gloves) with ranges per effort level, and condition pages (rain, wind, winter)
- "How it works" and "About" pages; generated `/llms.txt`
- Generated "Short answer" and FAQs on every guide article; `Article`, `FAQPage`, `BreadcrumbList`, `WebSite`, `Organization` and `Person` structured data in one graph per page; hreflang support in the layout
- Homepage quick reference: what to wear by temperature
- Calculator and chart start in °F for visitors in a US timezone; a manual °C/°F choice is remembered (`kitcheck-unit`, listed in the cookie policy)
- Interactive temperature chart: slider, effort, wind and rain toggles, and range bars per piece of kit
- New page layout: hero, section headings, answer cards, CTA band, header navigation (with mobile menu) and a compact footer; guide hub, articles, how it works and about rebuilt on it. Homepage stays tool-first: calculator, team, quick reference
- Chance of showers (40–59%): packable rain jacket and light rain overshoes as options, with a "chance of showers" note
- Heat note from 27°C: extra bottle and sunscreen
- Note when the rain stops during the ride: the rain jacket can go in your pocket
- GPX routes: wind is judged against your riding direction (a headwind counts fully, a tailwind barely), and the longest headwind stretch and the biggest cool descent show up in "Along your route"
- GPX route map: the line is coloured by feels-like temperature along the way, with a pin for the coldest point and where rain starts, and a legend under the map
- GPX routes: forecast along the whole route instead of only at the start. Points every ~6 km plus the summit, each at the time you'll get there and at the route's own altitude (one request). The kit advice and its "changes during the ride" notes use this, and the kit card shows the coldest point and where rain starts
- GPX routes: ride duration now comes from an average speed you can adjust ("Adjust" under the estimate). Recorded rides (Strava/Garmin GPX with timestamps) use their real moving time; a speed you set is remembered for your next route; "Use estimate" goes back to the intensity-based estimate
- Temperature guide pages for 0, 5, 10, 15, 20 and 25°C (with °F), generated from the calculator's own kit logic, each showing what changes with effort, wind, rain and warmth tendency
- Raas Racing Team banner below the calculator in the style of the team jersey (blurred colour print with grain), with the team wordmark and R·R·T emblem, a link to the team's Instagram and a sponsor link to Raas Bikes (plain links, no embeds or third-party tracking)
- GA4 events for calculator usage (location method, settings, recommendation shown), sent only with consent

### Fixed
- Rain kit now scales with temperature: waterproof jacket, gloves and winter overshoes in cold rain; packable jacket, optional light gloves and light rain overshoes in mild rain; jacket optional in warm rain (was winter gloves and thermal socks even at 25°C)
- No more leg warmers under thermal bib tights
- Effort and warmth tendency only partly lighten gloves, overshoes and head cover (racing at 0°C no longer suggests light gloves and toe covers)
- Wind no longer counted twice: the forecast feels-like already includes wind chill, so the extra riding-into-the-wind adjustment is smaller
- Route map showed "API key required" watermarks after CARTO stopped serving keyless tiles
- Google Analytics requests to regional endpoints (`region1.google-analytics.com`) were blocked by the CSP
- City suggestion dropdown reopened after searching or selecting a city
- `http-cache-semantics` vulnerability (via `npm audit fix`)

## [1.2.0] - 2026-04-29

### Added
- GPX route upload — automatically detects start location, fetches weather, and estimates ride duration from distance and elevation gain
- Interactive route map with CartoDB Voyager tiles, coral route polyline, start/end dot markers, wind direction badge (top-right) and custom zoom controls (top-left)
- Start time slider with 30-minute precision; end time calculated and displayed as a range (e.g. 08:00 → 11:30)
- Ride duration estimated automatically from GPX route at the selected intensity; manual duration slider hidden when a GPX is loaded
- Phase notes in recommendations suggest kit adjustments for changing conditions across the ride window
- Icon-based body zone labels throughout recommendations, replacing emoji (Central Icons: helmet, jersey, gloves, bibs, shoes)
- "My location" and "Upload GPX" option tiles with confirmed green state once selected
- Auto-detected location shows confirmed "Location set / Auto-detected" tile state

### Changed
- Recommendations now evaluate weather across the full ride window using hourly forecast slices, rather than a single point-in-time snapshot
- Changing ride intensity with a GPX loaded re-estimates duration and recalculates recommendations automatically
- Kit recommendation card redesigned: unified zone list with dividers, score progress bar in header, item chips (solid for required, dashed for optional)
- All zone icons and labels use the tier accent colour consistently
- Location input card redesigned with clearer visual hierarchy and option tiles
- Map tile switched from OpenStreetMap to CartoDB Voyager for a cleaner, brand-aligned style

### Fixed
- Leaflet CSS now bundled from the npm package — CDN dependency (unpkg.com) fully removed
- Security headers added via `public/_headers`: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- GPX upload rejects files over 10 MB and validates coordinate bounds before parsing
- Score info tooltip constrained to viewport width on small screens
- Route name truncation now responsive (`max-w` adapts to breakpoint)
- Time slider tick labels scale down on narrow screens to prevent overlap

## [1.1.0] - 2026-04-24

### Added
- Kit recommendation results now display each item on its own line with an "Optional" label where applicable
- Info icon on the score tile with a hover popup explaining how the comfort score works
- Sticky site header
- Results widget accounts for sticky header offset

### Changed
- Recommendation logic overhauled for consistency across all body zones:
  - Arm warmers and knee warmers now share the same required/optional temperature thresholds (required below ~14°C, optional up to ~17°C)
  - Leg warmers correctly appear as an intermediate step between bib tights and knee warmers (8–11°C range)
  - Long-sleeve jersey replaces the confusing "jersey or arm warmers" suggestion at 7–11°C
  - Thermal socks removed as a standalone recommendation; feet zone now always shows regular cycling socks as base, with toe covers optional at 11–14°C
  - Helmet now always shown in head zone results
  - Fingerless gloves shown as "Fingerless gloves or no gloves" to reflect that some riders prefer bare hands
  - "No gloves or fingerless gloves" shown at warm temperatures as an open choice
- Guide page updated to match revised recommendation logic (temperature cards, FAQ answers and structured data)

## [1.0.0] - 2026-04-24

Initial public launch.

### Added
- Kit cost calculator with location search and unit selection
- Guide page with usage instructions
- Cookie consent banner with GA4 consent mode integration
- Google Analytics (GA4) tracking
- Cookie policy and privacy policy pages
- Open Graph image for social sharing
- Sitemap for SEO
- Mobile-responsive layout across all pages

### Fixed
- Horizontal overflow on mobile
- Responsive header buttons and calculator padding
- Mobile layout improvements across calculator

[Unreleased]: https://github.com/tieskuiper/kitcheck/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/tieskuiper/kitcheck/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/tieskuiper/kitcheck/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/tieskuiper/kitcheck/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/tieskuiper/kitcheck/releases/tag/v1.0.0
