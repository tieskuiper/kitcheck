/**
 * Preferred temperature unit, shared by the calculator, the header toggle and the chart.
 * °C unless the visitor chose °F before, or the device's timezone is in the US.
 * (Browser language is no signal: plenty of Europeans run their browser in en-US.)
 */
export type Unit = 'C' | 'F'

const KEY = 'kitcheck-unit'

function inUS(): boolean {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''
    return /^America\/(New_York|Detroit|Kentucky|Indiana|Chicago|Menominee|North_Dakota|Denver|Boise|Phoenix|Los_Angeles|Anchorage|Juneau|Sitka|Metlakatla|Yakutat|Nome|Adak)/.test(tz)
      || tz === 'Pacific/Honolulu'
  } catch { return false }
}

export function preferredUnit(): Unit {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'C' || saved === 'F') return saved
  } catch { /* storage blocked: fall through */ }
  return inUS() ? 'F' : 'C'
}

export function saveUnit(unit: Unit): void {
  try { localStorage.setItem(KEY, unit) } catch { /* not critical */ }
}
