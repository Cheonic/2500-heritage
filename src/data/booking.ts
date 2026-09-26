export interface BookingCourt {
  id: string
  name: string
  rate: number
}

export const bookingCourts: BookingCourt[] = [
  { id: 'A', name: 'Court A — Windward', rate: 600 },
  { id: 'B', name: 'Court B — Leeward', rate: 600 },
  { id: 'C', name: 'Court C — Covered', rate: 600 },
  { id: 'D', name: 'Court D — Covered', rate: 600 },
]

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
  const startHour = 6 + i // 6 AM .. 21 (9-10PM)
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

export function getDayOptions(count = 7, startOffset = 0): DayOption[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() + i + startOffset)
    return {
      date: d,
      iso: d.toISOString().slice(0, 10),
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
