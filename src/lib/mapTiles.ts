/**
 * Map tile providers — the only place that knows where map tiles come from.
 *
 * Primary: OpenFreeMap vector tiles (no API key, no registration, no view limits),
 * rendered with MapLibre GL inside Leaflet.
 * Fallback: OpenStreetMap raster tiles, used when WebGL is unavailable or the
 * vector style fails to load.
 *
 * Swapping provider = change this file + the CSP in public/_headers.
 */

// Other OpenFreeMap styles: 'liberty', 'bright'
export const VECTOR_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'

export const VECTOR_ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> ' +
  '© <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> ' +
  'Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'

export const FALLBACK_RASTER = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
  maxZoom: 19,
}
