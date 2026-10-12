# GA4 setup for KitCheck

One-time setup in Google Analytics 4 so the calculator events from the site show up in your reports.

**You don't create the events in GA4.** The site sends them; GA4 registers each event automatically the first time it receives it. In GA4 you only (1) mark the important ones as key events and (2) register their parameters so you can use them in reports.

> Events only come from visitors who clicked **Accept** in the cookie banner, so GA4 shows a sample of your visitors, not all of them. For total traffic, Cloudflare's own request statistics in the Workers dashboard (no script on the site) give a rough upper bound — they include bots.

---

## To do

- [ ] **1. Generate test data** (after the deploy)
- [ ] **2. Check the events arrive** (Realtime)
- [ ] **3. Create 3 key events**
- [ ] **4. Create 8 custom dimensions**
- [ ] **5. Create 9 custom metrics**
- [ ] **6. Build 2 explorations** (optional, after a few days of data)

---

## 1. Generate test data

1. Open https://kitcheck.cc in a normal browser window (not private, ad blocker off for this site).
2. Click **Accept** in the cookie banner. Already chose before? Use *Cookie settings* in the footer.
3. Use the calculator: search a city, change intensity and warmth, switch °C/°F, pick another day and start time, upload a GPX file.
4. Click **Follow @raasracingteam** and the **raasbikes.cc** sponsor link in the team banner.

## 2. Check the events arrive

1. GA4 → **Reports → Realtime overview**.
2. In the card **Event count by Event name** you should see `page_view`, `location_selected`, `recommendation_shown`, `intensity_change` and so on, within about a minute.

Nothing there? Check the browser console for `Refused to …` (CSP) errors and that you clicked Accept, then tell Claude.

## 3. Create key events

These count as conversions in reports.

1. GA4 → **Admin** (gear, bottom left) → *Data display* → **Key events**.
2. Click **New key event**, type the exact name, **Save**. Repeat for each:

| Event name | Why |
| :-- | :-- |
| `recommendation_shown` | Main goal: a visitor got kit advice |
| `location_selected` | A visitor started using the tool |
| `team_instagram_click` | Click through to the Raas Racing Team Instagram |

You can create these before the events have arrived.

## 4. Create custom dimensions

Text parameters you want to filter or break down by.

1. GA4 → **Admin** → *Data display* → **Custom definitions** → tab **Custom dimensions** → **Create custom dimension**.
2. Fill in: *Dimension name* (anything readable), *Scope* **Event**, *Event parameter* (exact name below). **Save**. Repeat.

| Dimension name | Event parameter | Values |
| :-- | :-- | :-- |
| Location method | `method` | `search`, `suggestion`, `geolocation`, `gpx` |
| Conditions | `conditions` | `Extreme cold`, `Cold`, `Cool`, `Comfortable`, `Warm`, `Hot` |
| Intensity | `intensity` | `easy`, `moderate`, `hard`, `race` |
| Recommendation source | `source` | `location`, `gpx` |
| Unit | `unit` | `C`, `F` |
| GPX error reason | `reason` | `too_large` (empty for other read errors) |
| Speed source | `speed_source` | `estimate`, `recorded`, `saved` |
| Rain | `rain` | `likely`, `showers`, `none` |

## 5. Create custom metrics

Numeric parameters you want to average or sum.

1. Same screen → tab **Custom metrics** → **Create custom metric**.
2. Fill in: *Metric name*, *Scope* **Event**, *Event parameter*, *Unit of measurement* **Standard**. **Save**. Repeat.

| Metric name | Event parameter | Meaning |
| :-- | :-- | :-- |
| Feels like on the bike (°C) | `feels_like_c` | What the kit is based on — the number riders see |
| Comfort score | `score` | Internal 0–110 score (not shown to riders any more) |
| Ride hours | `ride_hours` | Ride length in the recommendation |
| Warmth bias | `warmth_bias` | -2 (always cold) to +2 (always warm) |
| Route distance (km) | `distance_km` | Distance of an uploaded GPX route |
| Start hour | `start_hour` | Chosen start time (8.5 = 08:30) |
| Duration (h) | `duration_h` | Duration set with the slider |
| Day offset | `day_offset` | 0 = today, 1 = tomorrow, … |
| Average speed (km/h) | `speed_kmh` | Speed a rider set themselves — compare with the estimates to tune the defaults |

Custom dimensions and metrics only fill from the moment you create them — they don't apply to older data. So do steps 4 and 5 soon after the deploy.

## 6. Explorations (optional)

After a few days of data, in GA4 → **Explore**:

**Funnel: from location to advice**
- Template **Funnel exploration**
- Step 1: event `location_selected` · Step 2: event `recommendation_shown`
- Breakdown: *Location method*
- Shows how many visitors who pick a location actually get advice, per method.

**What riders choose**
- Template **Free form**
- Rows: *Conditions* · Columns: *Intensity* · Value: *Event count*, filtered on event `recommendation_shown`
- Shows which conditions and intensities are most common — useful for the guide and for tuning the kit logic.

> Data retention is set to the default **2 months**. Explorations can only look back that far; standard reports keep aggregated data longer. Want to compare seasons year over year? Set retention to 14 months (*Admin → Data collection and modification → Data retention*) **and** ask Claude to update the privacy policy, which currently states 2 months.

---

## Event reference

All events the site sends (code: `src/components/calculator/useKitCalculator.ts`, `src/components/TeamBanner.astro`):

| Event | When | Parameters |
| :-- | :-- | :-- |
| `location_selected` | Location chosen | `method`; with GPX also `distance_km` and `speed_source` |
| `recommendation_shown` | Kit advice shown (once per settled result) | `conditions`, `score`, `feels_like_c`, `rain`, `intensity`, `warmth_bias`, `ride_hours`, `source` |
| `intensity_change` | Intensity picked | `intensity` |
| `warmth_change` | Warmth slider settled | `warmth_bias` |
| `unit_change` | °C/°F switched | `unit` |
| `day_change` | Day tab picked | `day_offset` |
| `start_time_change` | Start time slider settled | `start_hour` |
| `duration_change` | Duration slider settled (rides without a GPX) | `duration_h` |
| `speed_adjusted` | Rider set their own average speed for a GPX route | `speed_kmh` |
| `speed_reset` | Rider clicked *Use estimate* | — |
| `location_reset` | Location cleared | — |
| `search_no_result` | City search found nothing | — |
| `geolocation_denied` | Browser location refused | — |
| `gpx_error` | GPX file rejected | `reason` (sometimes) |
| `forecast_error` | Weather could not load | — |
| `team_instagram_click` | Instagram button in team banner | — |
| `team_sponsor_click` | Raas Bikes sponsor link in team banner | — |

Never sent: location names, coordinates, search text or route files.

Adding an event later? Use `track()` from `src/lib/consent.ts`, add it to this table, and register any new parameter as in steps 4–5.
