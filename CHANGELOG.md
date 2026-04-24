# Changelog

All notable changes to KitCheck will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/tieskuiper/kitcheck/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/tieskuiper/kitcheck/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/tieskuiper/kitcheck/releases/tag/v1.0.0
