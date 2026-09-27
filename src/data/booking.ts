import { notifyBookingStoreChanged } from './store'

export interface BookingCourt {
  id: string
  name: string
  rate: number
}

const defaultBookingCourts: BookingCourt[] = [
  { id: 'A', name: 'Court A — Windward', rate: 600 },
  { id: 'B', name: 'Court B — Leeward', rate: 600 },
  { id: 'C', name: 'Court C — Covered', rate: 600 },
  { id: 'D', name: 'Court D — Covered', rate: 600 },
]

const COURTS_KEY = '2500h-court-settings'

function readBookingCourts(): BookingCourt[] {
  try {
    if (typeof window === 'undefined') return defaultBookingCourts.map((court) => ({ ...court }))
    const raw = window.localStorage.getItem(COURTS_KEY)
    if (!raw) return defaultBookingCourts.map((court) => ({ ...court }))

    const saved = JSON.parse(raw) as Partial<BookingCourt>[]
    if (!Array.isArray(saved)) return defaultBookingCourts.map((court) => ({ ...court }))

    return defaultBookingCourts.map((court) => {
      const stored = saved.find((item) => item.id === court.id)
      if (
        !stored ||
        typeof stored.name !== 'string' ||
        !stored.name.trim() ||
        typeof stored.rate !== 'number' ||
        !Number.isFinite(stored.rate) ||
        stored.rate < 0
      ) {
        return { ...court }
      }
      return { ...court, name: stored.name.trim(), rate: stored.rate }
    })
  } catch {
    return defaultBookingCourts.map((court) => ({ ...court }))
  }
}

export const bookingCourts: BookingCourt[] = readBookingCourts()

export function saveBookingCourts(updatedCourts: readonly BookingCourt[]) {
  const next = defaultBookingCourts.map((defaultCourt) => {
    const updated = updatedCourts.find((court) => court.id === defaultCourt.id)
    if (
      !updated ||
      !updated.name.trim() ||
      !Number.isFinite(updated.rate) ||
      updated.rate < 0
    ) {
      throw new Error('Each court needs a name and a valid hourly rate.')
    }
    return { ...defaultCourt, name: updated.name.trim(), rate: updated.rate }
  })

  bookingCourts.splice(0, bookingCourts.length, ...next)
  try {
    localStorage.setItem(COURTS_KEY, JSON.stringify(next))
  } catch {
    // Keep the updated values for this session when localStorage is unavailable.
  }
  notifyBookingStoreChanged()
}

export interface HourSlot {
  hour: number // 24h start hour
  label: string // "3–4 PM"
}

function formatHour(h: number) {
  const h12 = h % 12 === 0 ? 12 : h % 12
  const suffix = h < 12 || h === 24 ? 'AM' : 'PM'
  return { h12, suffix }
}

export const hourSlots: HourSlot[] = Array.from({ length: 16 }, (_, i) => {
  const startHour = 8 + i // 8 AM .. 23 (11 PM-midnight)
  const endHour = startHour + 1
  const start = formatHour(startHour)
  const end = formatHour(endHour)
  const label =
    start.suffix === end.suffix
      ? `${start.h12}–${end.h12} ${end.suffix}`
      : `${start.h12} ${start.suffix}–${end.h12} ${end.suffix}`
  return { hour: startHour, label }
})

export interface DayOption {
  date: Date
  iso: string
  weekday: string
  dayNum: number
  isToday: boolean
}

function toLocalDateIso(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getDayOptions(count = 7, startOffset = 0): DayOption[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() + i + startOffset)
    return {
      date: d,
      iso: toLocalDateIso(d),
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      dayNum: d.getDate(),
      isToday: i + startOffset === 0,
    }
  })
}

export function formatFullDate(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export { isSlotTaken as isSlotBooked } from './store'

export function isSlotPast(dayIso: string, hour: number) {
  const now = new Date()
  const slotDate = new Date(`${dayIso}T00:00:00`)
  slotDate.setHours(hour)
  return slotDate.getTime() < now.getTime()
}
