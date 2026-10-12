/**
 * Consent + analytics.
 *
 * - Google Analytics 4 only loads AFTER the visitor accepts. Before that, nothing
 *   is requested from Google (no consent-mode pings, no gtag.js).
 * - Consent expires after 12 months, or when CONSENT_VERSION is bumped (bump it when
 *   the cookie policy changes materially, so everyone is asked again).
 */

export const GA_ID = 'G-FSYJ9GNCNP'
const STORAGE_KEY = 'kitcheck-consent'
const CONSENT_VERSION = 2
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000

export type ConsentStatus = 'accepted' | 'declined'
interface ConsentRecord { v: number; status: ConsentStatus; ts: number }

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
    [key: `ga-disable-${string}`]: boolean
  }
}

/** Current valid choice, or null when the visitor still has to (re)choose. */
export function getConsent(): ConsentStatus | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const rec = JSON.parse(raw) as ConsentRecord
    if (rec.v !== CONSENT_VERSION || Date.now() - rec.ts > MAX_AGE_MS) return null
    return rec.status === 'accepted' || rec.status === 'declined' ? rec.status : null
  } catch {
    // Unreadable storage or a pre-v2 plain string value → ask again
    return null
  }
}

export function setConsent(status: ConsentStatus) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: CONSENT_VERSION, status, ts: Date.now() }))
  } catch { /* storage blocked — choice applies to this page view only */ }

  if (status === 'accepted') loadAnalytics()
  else disableAnalytics()
  window.dispatchEvent(new CustomEvent('kitcheck:consent-change', { detail: { status } }))
}

/** Inject gtag.js. Only ever called after an explicit Accept. */
export function loadAnalytics() {
  if (window.gtag) {
    window[`ga-disable-${GA_ID}`] = false
    window.gtag('consent', 'update', { analytics_storage: 'granted' })
    return
  }
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // gtag.js expects the `arguments` object, not an array
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments)
  }
  window.gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  })
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(s)
}

/** Withdrawal: stop GA for this page and remove the cookies it already set. */
function disableAnalytics() {
  window[`ga-disable-${GA_ID}`] = true
  window.gtag?.('consent', 'update', { analytics_storage: 'denied' })

  // GA sets its cookies on the highest domain the browser allows (e.g. .kitcheck.cc, or
  // .kitcheck.pages.dev on previews), so try every parent domain; invalid ones are ignored
  const labels = location.hostname.split('.')
  const domains = ['', ...labels.slice(0, -1).map((_, i) => `.${labels.slice(i).join('.')}`)]
  document.cookie.split(';').map(c => c.split('=')[0].trim())
    .filter(name => name === '_ga' || name.startsWith('_ga_'))
    .forEach(name => domains.forEach(d => {
      document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ''}`
    }))
}

/** Re-open the consent banner (footer link, cookie policy page). */
export function openConsentSettings() {
  window.dispatchEvent(new Event('kitcheck:consent-open'))
}

// ── Events ────────────────────────────────────────────────────────────────────
const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {}

/**
 * Send a GA4 event — silently does nothing without consent.
 * `debounceMs` collapses rapid repeats (sliders) into the final value.
 */
export function track(name: string, params: Record<string, string | number | boolean> = {}, debounceMs = 0) {
  const send = () => { if (getConsent() === 'accepted') window.gtag?.('event', name, params) }
  if (!debounceMs) return send()
  clearTimeout(debounceTimers[name])
  debounceTimers[name] = setTimeout(send, debounceMs)
}
