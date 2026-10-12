import type { ReactNode } from 'react'

// ── Shared primitives ─────────────────────────────────────────────────────────
export function Label({ text }: { text: string }) {
  return (
    <p className="font-head text-[11px] font-semibold tracking-[0.08em] uppercase text-coral mb-2">{text}</p>
  )
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-4 sm:p-[22px]">
      {children}
    </div>
  )
}
