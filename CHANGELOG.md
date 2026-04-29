# Changelog

All notable changes to KitCheck will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
