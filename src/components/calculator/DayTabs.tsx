import type { getDayLabels } from '../../lib/openmeteo'

// ── Day tabs ──────────────────────────────────────────────────────────────────
export default function DayTabs({ days, selected, onChange }: {
  days: ReturnType<typeof getDayLabels>; selected: number; onChange: (i: number) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
      {days.map(d => {
        const active = d.index === selected
        return (
          <button key={d.index} onClick={() => onChange(d.index)}
            className={`shrink-0 flex flex-col items-center px-[14px] py-[9px] rounded-[10px] cursor-pointer font-head text-[12px] font-semibold transition-all min-w-[68px] hover:opacity-90 ${active
              ? 'border-[1.5px] border-coral bg-coral/[6%] text-coral'
              : 'border-[1.5px] border-border bg-transparent text-text-mid'
              }`}>
            <span>{d.label}</span>
            <span className="text-[10px] font-normal opacity-70 mt-0.5">{d.date}</span>
          </button>
        )
      })}
    </div>
  )
}
