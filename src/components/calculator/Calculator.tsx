import { IconPinLocation } from '@central-icons-react/round-outlined-radius-3-stroke-2'
import { useKitCalculator } from './useKitCalculator'
import { Card } from './ui'
import LocationSearch from './LocationSearch'
import RiderProfile from './RiderProfile'
import RideTiming from './RideTiming'
import KitCard from './KitCard'
import RouteMap from './RouteMap'

// ── Main Calculator ───────────────────────────────────────────────────────────
export default function Calculator() {
  const c = useKitCalculator()

  return (
    <section id="calculator" className="bg-bg">
      <div className="container">
        <div className="pt-6 md:pt-10 pb-10 md:pb-16 lg:pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7 items-start">

            {/* Left: inputs */}
            <div className="flex flex-col gap-3.5 min-w-0">

              <Card>
                <div className="font-head text-[14px] font-bold mb-4">Where are you riding?</div>
                <LocationSearch
                  query={c.cityQuery} setQuery={c.handleSearchInput}
                  suggestions={c.suggestions} onSearch={c.handleSearch}
                  onAutoDetect={c.geolocate} onSelectCity={c.selectCity}
                  onGpxUpload={c.handleGpxUpload} onReset={c.resetAll}
                  loading={c.loading} locating={c.locating} gpxLoading={c.gpxLoading}
                  gpxRouteName={c.gpxRoute?.name ?? ''}
                  locationError={c.locationError}
                  isGeolocated={c.isGeolocated} />
              </Card>

              <RiderProfile
                intensity={c.intensity} onIntensityChange={c.handleIntensityChange}
                warmthBias={c.warmthBias} onWarmthChange={c.handleWarmthChange} />

              {c.forecast && (
                <RideTiming
                  days={c.days} selectedDay={c.selectedDay} onDayChange={c.handleDayChange}
                  selectedHour={c.selectedHour} onHourChange={c.handleHourChange}
                  rideDuration={c.rideDuration} onDurationChange={c.handleDurationChange}
                  gpxRoute={c.gpxRoute} intensity={c.intensity}
                  weather={c.weather} unit={c.unit} />
              )}
            </div>

            {/* Right: output */}
            <div className="md:sticky md:top-[88px] min-w-0">
              {c.kitResult && c.score && c.weatherLoaded ? (
                <KitCard kitResult={c.kitResult} score={c.score} unit={c.unit} />
              ) : (
                <div className="bg-white rounded-2xl p-12 border-[1.5px] border-dashed border-border text-center text-text-light">
                  <IconPinLocation size={26} className="mx-auto mb-3" />
                  <div className="font-head text-[15px] font-semibold text-text-mid mb-[6px]">
                    Enter your ride location
                  </div>
                  <div className="text-[13px]">Search a city or tap auto-detect to get your kit</div>
                </div>
              )}
            </div>

          </div>

          {/* Route map — full width below the grid */}
          {c.gpxRoute && c.weatherLoaded && (
            <RouteMap route={c.gpxRoute} unit={c.unit} weather={c.weather} />
          )}

        </div>
      </div>
    </section>
  )
}
