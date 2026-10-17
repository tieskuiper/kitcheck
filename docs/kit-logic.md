# Kit logic: how kitcheck.cc decides what to wear

The reference for the recommendation engine, for developers and AI agents. Read this before
changing anything in `src/lib/kitLogic.ts`, and use it to check quickly whether the advice is right.

- **Source of truth is the code.** This file explains it; it does not replace it.
- **Blocks between `<!-- gen:… -->` markers are generated** from the real engine by
  `pnpm docs:kit`. Never edit them by hand. `pnpm docs:kit:check` fails when they are out of
  date, so a changed threshold always shows up as a diff here.
- Everything else is hand-written. When the engine changes, update it in the same commit
  (see [Changing the algorithm](#8-changing-the-algorithm)).

| File | What it does |
| --- | --- |
| `src/lib/kitLogic.ts` | The engine: comfort score, kit per zone, rain/wind/heat, multi-hour notes |
| `src/lib/routeForecast.ts` | GPX: forecast along the route, headwind, descents, route highlights |
| `src/lib/rideDuration.ts` | GPX ride duration from average speed |
| `src/lib/openmeteo.ts` | Forecast requests (Open-Meteo, 7 days, km/h) and the hourly ride window |
| `src/lib/kitRanges.ts` | Temperature range per item, read off the engine (guide pages, chart, llms) |
| `src/lib/kitRows.ts` | The list of distinct items, grouped by zone (chart and this doc) |
| `src/lib/guideData.ts` | Guide temperatures and sentences built from the engine |

## 1. Inputs

Per ride hour the engine gets a `RiderInput`:

| Field | Source | Unit |
| --- | --- | --- |
| `apparentTemp` | Open-Meteo `apparent_temperature` (feels-like: includes wind chill and humidity) | °C |
| `windspeed` | Open-Meteo `windspeed_10m`; with a GPX: the wind as felt on the route (section 5) | km/h |
| `precipProb` | Open-Meteo `precipitation_probability` | % |
| `intensity` | rider: `easy`, `moderate`, `hard`, `race` | |
| `warmthBias` | rider: -2 (always cold) … +2 (always warm) | |

The ride window is every hour from the start time for the chosen duration (7-day forecast). All
temperatures in the engine and in this doc are **forecast feels-like** temperatures, not air
temperature.

## 2. The comfort score

Everything runs on a score from 0 (freezing) through 75 (perfect) to 110 (too hot).

```
core score      = clamp(0, 110, tempToScore(feelsLike) + INTENSITY_BONUS[intensity]
                                + warmthBias × WARMTH_STEP − windPenalty(wind))
extremity score = clamp(0, 110, tempToScore(feelsLike) + INTENSITY_BONUS[intensity] × EXTREMITY_EFFORT
                                + warmthBias × WARMTH_STEP × EXTREMITY_WARMTH − windPenalty(wind))
```

- The **core score** decides upper body and legs.
- The **extremity score** decides head, hands and feet. Effort and warmth tendency count only
  partly there, because riding hard warms your body far more than your fingers, toes and ears.
- The forecast feels-like already includes wind chill; the wind penalty only adds the extra
  airflow of riding into it, so it is deliberately small.
- **Cold effort floor:** at or below `COLD_EFFORT_FLOOR_C` forecast feels-like, a hard or race
  effort no longer lightens the body kit (owner decision, Oct 2026): upper body and legs use
  the moderate-pace score instead (`bodyScore = min(score, moderate score)`). You start cold and
  every stop or descent is cold. When that makes the kit warmer, `lighterOption` lists the
  lighter body items and the kit card says "You could go lighter (…), but expect to feel cold".
  The label and "feels like on the bike" still use the real score.

`tempToScore` is piecewise linear:

| Feels-like | Score |
| --- | --- |
| -5°C and below | 5 |
| -5 to 0°C | 10 → 20 |
| 0 to 8°C | 20 → 40 |
| 8 to 15°C | 40 → 65 |
| 15 to 22°C | 65 → 90 |
| above 22°C | 90, +2 per °C |

"Feels like X on the bike" on the kit card is `scoreToTemp(core score)`: the inverse of this table.

<!-- gen:constants -->
| Constant | Value | Meaning |
| --- | --- | --- |
| `RAIN_SHOWERS` | 40% | chance of rain from which a packable rain jacket (and light rain overshoes) become optional |
| `RAIN_LIKELY` | 60% | rain is "likely": full rain kit, scaled to the temperature; also the route "rain from km X" note |
| `HEAT_FROM_C` | 27°C | forecast feels-like from which the heat note (extra bottle, sunscreen) shows |
| `WINDY_KMH` | > 25 km/h | windy: optional wind gilet (score < 74, no rain) and a windproof note |
| `COLD_EFFORT_FLOOR_C` | 2°C | at or below this forecast feels-like, hard/race effort no longer lightens the body kit (the lighter kit is shown as an option) |
| `WARMTH_STEP` | 7.5 points | per step of warmth tendency (-2 always cold … +2 always warm) |
| `EXTREMITY_EFFORT` | 0.35 | share of the effort bonus that counts for head, hands and feet |
| `EXTREMITY_WARMTH` | 0.75 | share of the warmth tendency that counts for head, hands and feet |
| `INTENSITY_BONUS` | easy -5, moderate 0, hard +12, race +18 | score points added for effort |
| `WIND_PENALTY` | > 30 km/h: -6, > 20 km/h: -4, > 12 km/h: -2 | score points subtracted for riding into the wind |
<!-- /gen:constants -->

**Feels like on the bike** for each effort level and warmth tendency (light wind, dry):

<!-- gen:effort -->
| Forecast feels-like | easy | moderate | hard | race | always cold (moderate) | always warm (moderate) |
| --- | --- | --- | --- | --- | --- | --- |
| 0°C (32°F) | -2°C | 0°C | 5°C | 7°C | -7°C | 6°C |
| 10°C (50°F) | 9°C | 10°C | 13°C | 15°C | 5°C | 14°C |
| 20°C (68°F) | 19°C | 20°C | 25°C | 28°C | 16°C | 26°C |
<!-- /gen:effort -->

**Condition labels** (kit card header) at a moderate pace, light wind:

<!-- gen:conditions -->
| Forecast feels-like | Score | Label |
| --- | --- | --- |
| -10°C (14°F) | 5 | Extreme cold |
| -5°C (23°F) | 5 | Extreme cold |
| 0°C (32°F) | 20 | Cold |
| 5°C (41°F) | 33 | Cold |
| 8°C (46°F) | 40 | Cool |
| 10°C (50°F) | 47 | Cool |
| 12°C (54°F) | 54 | Comfortable |
| 15°C (59°F) | 65 | Comfortable |
| 18°C (64°F) | 76 | Warm |
| 20°C (68°F) | 83 | Warm |
| 22°C (72°F) | 90 | Hot |
| 25°C (77°F) | 96 | Hot |
| 30°C (86°F) | 106 | Hot |
<!-- /gen:conditions -->

## 3. Kit per zone

The rules as written in `kitLogic.ts`, in score points. `wet` means rain likely
(≥ `RAIN_LIKELY`), `showers` means ≥ `RAIN_SHOWERS` but not likely, `windy` means wind above
`WINDY_KMH`. The first matching row wins.

**Head** (extremity score)

| Score | Kit |
| --- | --- |
| < 20 | Thermal skull cap + helmet |
| < 40 | Cycling cap + helmet |
| < 62 | Helmet, light cap optional |
| else | Helmet |

**Upper body** (body score: the core score, or the moderate-pace score under the cold effort floor)

| Score | Kit |
| --- | --- |
| < 20 | Thermal long-sleeve base layer, winter jersey, insulated jacket |
| < 35 | Thermal base layer, winter jersey or softshell |
| < 50 | Long-sleeve jersey, base layer optional |
| < 62 | Jersey, arm warmers |
| < 74 | Jersey, arm warmers optional |
| < 86 | Summer jersey |
| else | Lightweight summer jersey |

Added on top: `wet` and score < 65 → rain jacket (waterproof); `wet` and < 90 → packable rain
jacket; `wet` and ≥ 90 → packable rain jacket optional; `showers` → packable rain jacket optional;
otherwise `windy` and score < 74 → wind gilet optional.

**Hands** (extremity score)

| Score | Kit |
| --- | --- |
| `wet` and < 47 | Waterproof winter gloves |
| < 35 | Thermal winter gloves (below 20 too: in dry cold the warmest thermal pair, not waterproof) |
| < 50 | Light cycling gloves |
| `wet` and < 74 | Fingerless or no gloves, light full-finger gloves optional |
| < 62 | Fingerless or no gloves, thin full-finger gloves optional |
| < 74 | Fingerless or no gloves, optional |
| else | No gloves or fingerless gloves |

**Legs** (body score, as for the upper body)

| Score | Kit |
| --- | --- |
| < 22 | Thermal bib tights |
| < 40 | Bib tights |
| < 52 | Bib shorts, leg warmers |
| < 62 | Bib shorts, knee warmers |
| < 74 | Bib shorts, knee warmers optional |
| else | Bib shorts |

Rain and wind never change the leg kit directly; strong wind only lowers the score.

**Feet** (extremity score)

| Score | Kit |
| --- | --- |
| `wet` and < 35 | Waterproof winter overshoes, thermal socks |
| < 35 | Thermal overshoes, thermal socks (also in dry cold below 20) |
| `wet` and < 50 | Waterproof overshoes |
| < 50 | Light overshoes or toe covers |
| `wet` and < 90 | Regular socks, light rain overshoes optional |
| `showers` and < 74 | Regular socks, light rain overshoes optional |
| < 62 | Regular socks, toe covers optional |
| else | Regular socks |

**The same rules in °C**, at a moderate pace with an average warmth tendency (generated):

<!-- gen:zones -->
**Head**

| Feels-like (moderate, light wind, dry) | Kit |
| --- | --- |
| below 0°C (32°F) | Thermal skull cap, Helmet |
| 0 to 8°C (32 to 46°F) | Cycling cap, Helmet |
| 8 to 14°C (46 to 57°F) | Helmet, Light cap *(opt)* |
| 14°C (57°F) and warmer | Helmet |

**Upper body**

| Feels-like (moderate, light wind, dry) | Kit |
| --- | --- |
| below 0°C (32°F) | Thermal long-sleeve base layer, Winter jersey, Insulated jacket |
| 0 to 6°C (32 to 43°F) | Thermal base layer, Winter jersey or softshell |
| 6 to 11°C (43 to 52°F) | Long-sleeve jersey, Base layer *(opt)* |
| 11 to 14°C (52 to 57°F) | Jersey, Arm warmers |
| 14 to 18°C (57 to 64°F) | Jersey, Arm warmers *(opt)* |
| 18 to 21°C (64 to 70°F) | Summer jersey |
| 21°C (70°F) and warmer | Lightweight summer jersey |

**Hands**

| Feels-like (moderate, light wind, dry) | Kit |
| --- | --- |
| below 6°C (43°F) | Thermal winter gloves |
| 6 to 11°C (43 to 52°F) | Light cycling gloves |
| 11 to 14°C (52 to 57°F) | Fingerless gloves or no gloves, Thin full-finger gloves *(opt)* |
| 14 to 18°C (57 to 64°F) | Fingerless gloves or no gloves *(opt)* |
| 18°C (64°F) and warmer | No gloves or fingerless gloves |

**Legs**

| Feels-like (moderate, light wind, dry) | Kit |
| --- | --- |
| below 1°C (34°F) | Thermal bib tights |
| 1 to 8°C (34 to 46°F) | Bib tights |
| 8 to 11°C (46 to 52°F) | Bib shorts, Leg warmers |
| 11 to 14°C (52 to 57°F) | Bib shorts, Knee warmers |
| 14 to 18°C (57 to 64°F) | Bib shorts, Knee warmers *(opt)* |
| 18°C (64°F) and warmer | Bib shorts |

**Feet**

| Feels-like (moderate, light wind, dry) | Kit |
| --- | --- |
| below 6°C (43°F) | Thermal overshoes, Thermal socks |
| 6 to 11°C (43 to 52°F) | Light overshoes or toe covers |
| 11 to 14°C (52 to 57°F) | Regular cycling socks, Toe covers *(opt)* |
| 14°C (57°F) and warmer | Regular cycling socks |
<!-- /gen:zones -->

**With rain likely** (only the zones rain changes):

<!-- gen:rain -->
**Upper body, rain likely (60%+)**

| Feels-like (moderate, light wind) | Kit |
| --- | --- |
| below 0°C (32°F) | Thermal long-sleeve base layer, Winter jersey, Insulated jacket, Rain jacket (waterproof) |
| 0 to 6°C (32 to 43°F) | Thermal base layer, Winter jersey or softshell, Rain jacket (waterproof) |
| 6 to 11°C (43 to 52°F) | Long-sleeve jersey, Base layer *(opt)*, Rain jacket (waterproof) |
| 11 to 14°C (52 to 57°F) | Jersey, Arm warmers, Rain jacket (waterproof) |
| 14 to 15°C (57 to 59°F) | Jersey, Arm warmers *(opt)*, Rain jacket (waterproof) |
| 15 to 18°C (59 to 64°F) | Jersey, Arm warmers *(opt)*, Packable rain jacket |
| 18 to 21°C (64 to 70°F) | Summer jersey, Packable rain jacket |
| 21 to 22°C (70 to 72°F) | Lightweight summer jersey, Packable rain jacket |
| 22°C (72°F) and warmer | Lightweight summer jersey, Packable rain jacket *(opt)* |

**Hands, rain likely (60%+)**

| Feels-like (moderate, light wind) | Kit |
| --- | --- |
| below 10°C (50°F) | Waterproof winter gloves |
| 10 to 11°C (50 to 52°F) | Light cycling gloves |
| 11 to 18°C (52 to 64°F) | Fingerless gloves or no gloves, Light full-finger gloves *(opt)* |
| 18°C (64°F) and warmer | No gloves or fingerless gloves |

**Feet, rain likely (60%+)**

| Feels-like (moderate, light wind) | Kit |
| --- | --- |
| below 6°C (43°F) | Waterproof winter overshoes, Thermal socks |
| 6 to 11°C (43 to 52°F) | Waterproof overshoes |
| 11 to 22°C (52 to 72°F) | Regular cycling socks, Light rain overshoes *(opt)* |
| 22°C (72°F) and warmer | Regular cycling socks |
<!-- /gen:rain -->

**In strong wind** (the gilet is the visible difference; the score drops a little):

<!-- gen:wind -->
**Upper body, strong wind (35 km/h)**

| Feels-like (moderate, dry) | Kit |
| --- | --- |
| below 2°C (36°F) | Thermal long-sleeve base layer, Winter jersey, Insulated jacket, Wind gilet *(opt)* |
| 2 to 8°C (36 to 46°F) | Thermal base layer, Winter jersey or softshell, Wind gilet *(opt)* |
| 8 to 13°C (46 to 55°F) | Long-sleeve jersey, Base layer *(opt)*, Wind gilet *(opt)* |
| 13 to 16°C (55 to 61°F) | Jersey, Arm warmers, Wind gilet *(opt)* |
| 16 to 19°C (61 to 66°F) | Jersey, Arm warmers *(opt)*, Wind gilet *(opt)* |
| 19 to 23°C (66 to 73°F) | Summer jersey |
| 23°C (73°F) and warmer | Lightweight summer jersey |
<!-- /gen:wind -->

**Heat:** when any ride hour has a forecast feels-like of `HEAT_FROM_C` or more, the kit card
shows a note: extra bottle and sunscreen. The kit itself doesn't change.

## 4. The whole ride (multi-hour)

`getRideKitRecommendation` runs the engine for every ride hour, then combines:

- **Upper body and legs** follow the **start hour**, with notes for what changes later:
  - rain arrives during the ride → "Rain expected from hour X — pack a rain jacket";
  - rain at the start stops for the rest of the ride → "Dry from hour X";
  - arm warmers needed at the start but not later as it warms → "Remove arm warmers after hour X";
  - comfortable start (score ≥ 62) that cools into arm-warmer territory → "Arm warmers needed from hour X";
  - otherwise a drop of 20+ score points → "Gets colder from hour X — take a … with you";
  - leg or knee warmers needed at the start, not later as it warms → "Remove … after hour X".
- **Gloves and overshoes are chosen for the whole ride** (owner rule: one pair per ride, never
  swap mid-ride). The engine picks the warmest pair any hour needs; at equal warmth a waterproof
  pair wins (`pairRank`), so a dry, cold start that turns wet gets waterproof gloves and
  overshoes from the start. It says why when it is because of later cold or rain. A light pair at the start gets "Warm enough to pocket your
  gloves after hour X" when a later hour needs none.
- **Heat** shows when any hour is hot.

## 5. GPX routes

With a GPX file the forecast follows the route instead of the start point:

1. **Points:** start, finish, the highest point and evenly spaced points (about every `STEP_KM`,
   at most `MAX_POINTS`, so further apart on very long routes). Each point gets the forecast for
   its own location and altitude.
2. **Arrival time** at each point follows from the ride duration at a constant average speed;
   hourly values are interpolated between hours.
3. **Wind against your direction:** headwind component = wind × cos(wind direction − riding
   direction). The wind the engine gets is the felt wind: wind × (0.6 + 0.4 × cos), so a headwind
   counts 100%, side wind about 60%, tailwind about 20%.
4. **Per ride hour** the engine gets the coldest feels-like, the strongest felt wind and the
   highest rain chance of the points passed in that hour.
5. **Along your route** notes: coldest point (when 2°C+ colder than the start), where rain
   becomes likely (≥ `RAIN_LIKELY`), the longest headwind stretch (headwind ≥ `HEADWIND_KMH`)
   and the biggest descent (when its feels-like is below `DESCENT_COOL_BELOW`).
6. **Slow API:** if the full route request takes longer than 10 s, the forecast is fetched
   again for `FALLBACK_POINTS` key points only (start, finish, highest point, evenly spaced
   between), one parallel request each; points that fail are left out. If the start point
   fails too, the advice uses the start point's forecast and the kit card says so.
7. **Duration:** the recorded moving time if the GPX has one, else the rider's saved speed,
   else an estimate: flat speed for the intensity, minus 5 minutes per 100 m of climbing.

<!-- gen:route -->
| Constant | Value | Meaning |
| --- | --- | --- |
| `STEP_KM` / `MAX_POINTS` | 6 km / 24 | forecast point every ~6 km, at most 24 points (+ start, finish, highest point) |
| `FALLBACK_POINTS` | 5 | when the full route request times out: start, finish, highest point and evenly spaced points up to this many, fetched one by one |
| `HEADWIND_KMH` | 12 km/h | headwind component from which a stretch counts as "headwind" |
| `DESCENT_MIN_DROP_M` / `DESCENT_MIN_KM` | 150 m / 2 km | minimum size of a "long descent" |
| `DESCENT_COOL_BELOW` | 20°C | only descents colder than this feels-like get a note |
| `INTENSITY_FLAT_SPEED` | easy 22, moderate 26, hard 30, race 35 km/h | default flat speed for GPX duration estimates, minus 5 min per 100 m climbing |
<!-- /gen:route -->

## 6. Generated reference

**When each item comes in, per effort level** (light wind, dry, average warmth tendency). Ranges
are feels-like, from (inclusive) to (exclusive): "11–14°C" ends where "14–18°C optional" begins.

<!-- gen:items -->
| Item | easy: wear | moderate: wear | hard: wear | race: wear | moderate: optional |
| --- | --- | --- | --- | --- | --- |
| Cap under helmet | below 9°C (48°F) | below 8°C (46°F) | below 6°C (43°F) | below 6°C (43°F) | 8–14°C (46–57°F) |
| Insulated jacket | below 2°C (36°F) | below 0°C (32°F) | below 0°C (32°F) | below 0°C (32°F) | – |
| Winter jersey | below 8°C (46°F) | below 6°C (43°F) | below 2°C (36°F) | below 2°C (36°F) | – |
| Base layer | below 8°C (46°F) | below 6°C (43°F) | below 2°C (36°F) | below 2°C (36°F) | 6–11°C (43–52°F) |
| Long-sleeve jersey | 8–12°C (46–54°F) | 6–11°C (43–52°F) | 2–7°C (36–45°F) | 2–5°C (36–41°F) | – |
| Short-sleeve jersey | 12°C (54°F) and warmer | 11°C (52°F) and warmer | 7°C (45°F) and warmer | 5°C (41°F) and warmer | – |
| Arm warmers | 12–16°C (54–61°F) | 11–14°C (52–57°F) | 7–11°C (45–52°F) | 5–9°C (41–48°F) | 14–18°C (57–64°F) |
| Gilet | – | – | – | – | – |
| Rain jacket | – | – | – | – | – |
| Winter gloves | below 7°C (45°F) | below 6°C (43°F) | below 4°C (39°F) | below 4°C (39°F) | – |
| Light full-finger gloves | 7–11°C (45–52°F) | 6–11°C (43–52°F) | 4–10°C (39–50°F) | 4–9°C (39–48°F) | 11–14°C (52–57°F) |
| Fingerless or none | 11°C (52°F) and warmer | 11°C (52°F) and warmer | 10°C (50°F) and warmer | 9°C (48°F) and warmer | 14–18°C (57–64°F) |
| Thermal bib tights | below 3°C (37°F) | below 1°C (34°F) | below 1°C (34°F) | below 1°C (34°F) | – |
| Bib tights | 3–10°C (37–50°F) | 1–8°C (34–46°F) | 1–3°C (34–37°F) | 1–2°C (34–36°F) | – |
| Leg warmers | 10–13°C (50–55°F) | 8–11°C (46–52°F) | 3–8°C (37–46°F) | 2–6°C (36–43°F) | – |
| Knee warmers | 13–16°C (55–61°F) | 11–14°C (52–57°F) | 8–11°C (46–52°F) | 6–9°C (43–48°F) | 14–18°C (57–64°F) |
| Bib shorts | 10°C (50°F) and warmer | 8°C (46°F) and warmer | 3°C (37°F) and warmer | 2°C (36°F) and warmer | – |
| Winter overshoes | below 7°C (45°F) | below 6°C (43°F) | below 4°C (39°F) | below 4°C (39°F) | – |
| Light overshoes / toe covers | 7–11°C (45–52°F) | 6–11°C (43–52°F) | 4–10°C (39–50°F) | 4–9°C (39–48°F) | 11–14°C (52–57°F) |
<!-- /gen:items -->

**The guide temperatures** (what the temperature pages and llms.txt say):

<!-- gen:temps -->
- **-5°C (23°F)**: Thermal skull cap, thermal long-sleeve base layer, winter jersey, insulated jacket, thermal winter gloves, thermal bib tights, thermal overshoes and thermal socks.
- **0°C (32°F)**: Cycling cap, thermal base layer, winter jersey or softshell, thermal winter gloves, thermal bib tights, thermal overshoes and thermal socks.
- **5°C (41°F)**: Cycling cap, thermal base layer, winter jersey or softshell, thermal winter gloves, bib tights, thermal overshoes and thermal socks.
- **10°C (50°F)**: Long-sleeve jersey, light cycling gloves, bib shorts, leg warmers and light overshoes or toe covers. Optional: light cap and base layer.
- **15°C (59°F)**: Jersey, bib shorts and regular cycling socks. Optional: arm warmers, fingerless gloves and knee warmers.
- **20°C (68°F)**: Summer jersey, bib shorts and regular cycling socks. Optional: fingerless gloves.
- **25°C (77°F)**: Lightweight summer jersey, bib shorts and regular cycling socks. Optional: fingerless gloves.
<!-- /gen:temps -->

## 7. Known quirks and open questions

Behaviour that is deliberate or still to be decided. Check here before "fixing" one.

Decided in Oct 2026 (owner): race pace near freezing keeps winter kit with a lighter option
(cold effort floor, section 2); dry cold below score 20 gets thermal, not waterproof, gloves and
overshoes (section 3); the wind gilet below freezing stays (below).


- **Step at -5°C:** `tempToScore` is 5 at -5°C and below, but 10 just above it. Harmless in
  practice (both are full winter kit).
- **Wind gilet below freezing (deliberate):** in strong, dry wind the optional gilet also appears
  on top of an insulated jacket. Kept on purpose (owner, Oct 2026): wind around freezing makes
  it feel very cold, so an extra windproof layer is a sensible option.
- **Step at the cold effort floor:** at a hard or race effort the body kit jumps from winter kit
  at 2°C (floor applies) to the lighter effort kit at 3°C, e.g. race pace: winter jersey and bib
  tights at 2°C, long-sleeve jersey and leg warmers at 3°C. Tune `COLD_EFFORT_FLOOR_C` if that
  edge feels wrong.
- **"Fingerless gloves or no gloves"** is a required item in the engine; guide sentences show it as
  optional fingerless gloves (`kitSummary` in `guideData.ts`).
- **"Hot" from about 21°C:** the condition label turns "Hot" at score 86, which a moderate pace
  reaches around 21°C feels-like (22°C = score 90). The kit is fine (lightweight summer jersey);
  the label may read strong for a nice summer day. Open question.
- **Owner rule:** one pair of gloves and overshoes per ride. Never suggest swapping mid-ride.

## 8. Changing the algorithm

1. Change `src/lib/kitLogic.ts` (thresholds, items, constants). New item name? Add or extend a
   row in `src/lib/kitRows.ts`.
2. Run `pnpm docs:kit` and read the diff of the generated tables: that diff *is* the behaviour
   change. Update the hand-written tables in sections 2–5 if you changed a rule.
3. Re-read the copy that quotes numbers or kit by hand:
   - temperature intros: `TEMP_PAGES` in `src/lib/guideData.ts`;
   - kit and condition pages: intros, tips, FAQs and `facts` in `src/lib/guideContent.ts`;
   - FAQs in `src/pages/guide/index.astro`, `src/pages/index.astro`,
     `src/pages/guide/cycling-temperature-chart.astro`;
   - numbers on `src/pages/how-it-works.astro`.
4. `pnpm check && pnpm build`, then `pnpm docs:kit:check`.
5. Bump `CONTENT_UPDATED` in `src/lib/site.ts` and add a line to `CHANGELOG.md`.
