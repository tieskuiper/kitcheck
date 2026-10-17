# kitcheck.cc — notes for AI agents

Free cycling kit calculator for **road cyclists** (kitcheck.cc). Astro 7 static site, one React
island for the calculator, Tailwind 4, Cloudflare Pages. No backend: all API calls happen in the
browser. See `README.md` for setup, structure and deployment.

## Before you change the kit logic

Read **`docs/kit-logic.md`** first: the full algorithm (score, thresholds per zone, rain/wind/heat,
multi-hour rules, GPX) with tables generated from the engine.

- After any change to `src/lib/kitLogic.ts` (or `routeForecast.ts`, `rideDuration.ts`):
  run `pnpm docs:kit`, read the diff of the generated tables (that diff is the behaviour change),
  update the hand-written parts of the doc, and follow its checklist ("Changing the algorithm").
- `pnpm docs:kit:check` must pass before committing.
- Copy that quotes kit or numbers by hand (guide intros, `src/lib/guideContent.ts`, FAQs,
  how-it-works) must stay consistent with the engine. Prefer generated text from
  `src/lib/kitRanges.ts` / `src/lib/guideData.ts` over hard-coded numbers.

## Commands

```sh
set -a; source .env; set +a   # CENTRAL_LICENSE_KEY, needed for pnpm install (paid icon package)
pnpm dev | pnpm build | pnpm check
pnpm docs:kit | pnpm docs:kit:check
```

## Owner decisions (don't re-propose the alternatives)

- **Kit rule:** one pair of gloves and overshoes per ride. Never suggest swapping mid-ride.
- **Cold effort floor:** near freezing (≤ `COLD_EFFORT_FLOOR_C`), hard/race effort keeps the
  winter body kit and only mentions the lighter option.
- **Dry cold:** thermal gloves and overshoes, also well below freezing; waterproof only when
  rain is likely. The optional wind gilet below freezing in strong wind is deliberate.
- **Brand colour:** keep coral `#FF5130` as is (contrast of white-on-coral was reviewed and accepted).
- **Scope:** road cycling only (no gravel, MTB or commuting content).
- **Units:** °C by default; °F only for a US timezone or when the visitor chose it.
- **Privacy:** Google Analytics 4 only after explicit consent, with no consent-mode pings before
  that. No Cloudflare Web Analytics, no Plausible. Every new `localStorage` key or tracked event
  goes into `src/pages/privacy.astro` and `src/pages/cookies.astro`.
- **Design:** clean and calm, tool-first homepage, light brand touch (coral, Space Grotesk, DM
  Sans). No decorative glows, pill labels or heavy styling; propose style changes small first.
- **Pages:** few strong pages over many near-duplicates (no separate °F pages).
- **Brand-neutral:** no product recommendations, affiliate links or ads in the advice.

## Workflow

- Work on `develop` or a feature branch. `main` is production and protected: changes only via a
  pull request.
- Commits are signed through 1Password; if signing fails, ask the owner to unlock it instead of
  bypassing it.
- When guide content changes, bump `CONTENT_UPDATED` in `src/lib/site.ts` and add a line to
  `CHANGELOG.md`.
- New third-party domains need an entry in the CSP in `public/_headers`.
