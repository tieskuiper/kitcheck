# Changelog

All notable changes to KitCheck will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
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
- GPX routes: ride duration now comes from an average speed you can adjust ("Adjust" under the estimate). Recorded rides (Strava/Garmin GPX with timestamps) use their real moving time; a speed you set is remembered for your next route; "Use estimate" goes back to the intensity-based estimate
- Temperature guide pages for 0, 5, 10, 15, 20 and 25°C (with °F), generated from the calculator's own kit logic, each showing what changes with effort, wind, rain and warmth tendency
- Raas Racing Team banner below the calculator in the style of the team jersey (blurred colour print with grain), with the team wordmark and R·R·T emblem, a link to the team's Instagram and a sponsor link to Raas Bikes (plain links, no embeds or third-party tracking)
- GA4 events for calculator usage (location method, settings, recommendation shown), sent only with consent

### Fixed
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

[Unreleased]: https://github.com/tieskuiper/kitcheck/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/tieskuiper/kitcheck/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/tieskuiper/kitcheck/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/tieskuiper/kitcheck/releases/tag/v1.0.0
