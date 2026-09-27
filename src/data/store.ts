// Shared "database" for the booking system.
//
// There's no backend yet, so this persists to localStorage and broadcasts a
// custom event whenever it changes. Both the public Booking page and the
// Admin page subscribe to it (via `useBookingStore` / `useSyncExternalStore`)
// so a block, reschedule, or manual assignment made in Admin shows up
// immediately anywhere else that's open.
//
// Swap the bodies of these functions for real API calls whenever a backend
// exists — the shape (StoredBooking / BlockedSlot) can stay the same.

import { useSyncExternalStore } from 'react'

export interface StoredBooking {
  id: string
  reference: string
  /** Customer-provided GCash/Maya transaction reference for payment review. */
  paymentReference?: string
  courtId: string
  courtName: string
  sport?: string
  dayIso: string
  startHour: number
  endHour: number // exclusive
  rate: number
  name: string
  mobile: string
  email?: string
  notes?: string
  /** 'customer' = booked through the public site. 'admin' = added manually by staff. */
  source: 'customer' | 'admin' | 'reclub'
  status: 'confirmed' | 'reserved' | 'pending' | 'rejected'
  createdAt: string
}

export interface BlockedSlot {
  id: string
  courtId: string
  dayIso: string
  startHour: number
  endHour: number // exclusive
  reason?: string
  createdAt: string
}

const BOOKINGS_KEY = '2500h-bookings'
const BLOCKS_KEY = '2500h-blocked-slots'
const CHANGE_EVENT = '2500h-store-changed'

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function write<T>(key: string, value: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — changes just won't persist
  }
  notifyBookingStoreChanged()
}

export function notifyBookingStoreChanged() {
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function genReference() {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `2500H-${rand}`
}

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd
}

// ---------- Bookings ----------

export function getBookings(): StoredBooking[] {
  return read<StoredBooking>(BOOKINGS_KEY)
}

export function addBooking(
  input: Omit<StoredBooking, 'id' | 'reference' | 'createdAt' | 'status'> &
    Partial<Pick<StoredBooking, 'status' | 'reference'>>,
): StoredBooking {
  const booking: StoredBooking = {
    ...input,
    id: genId(),
    reference: input.reference ?? genReference(),
    status: input.status ?? 'confirmed',
    createdAt: new Date().toISOString(),
  }
  write(BOOKINGS_KEY, [...getBookings(), booking])
  return booking
}

export function updateBooking(id: string, patch: Partial<StoredBooking>) {
  write(
    BOOKINGS_KEY,
    getBookings().map((b) => (b.id === id ? { ...b, ...patch } : b)),
  )
}

export function updateCustomerBookingsByReference(
  reference: string,
  status: StoredBooking['status'],
) {
  write(
    BOOKINGS_KEY,
    getBookings().map((booking) =>
      booking.reference === reference && booking.source === 'customer'
        ? { ...booking, status }
        : booking,
    ),
  )
}

export function removeBooking(id: string) {
  write(BOOKINGS_KEY, getBookings().filter((b) => b.id !== id))
}

/** Booking that occupies this exact court/day/hour, if any. */
export function getBookingAt(dayIso: string, courtId: string, hour: number) {
  return getBookings().find(
    (b) =>
      b.status !== 'rejected' &&
      b.dayIso === dayIso &&
      b.courtId === courtId &&
      overlaps(b.startHour, b.endHour, hour, hour + 1),
  )
}

/** Any booking that would overlap this range on this court/day — used to validate reschedules/manual assigns. */
export function findOverlappingBooking(
  dayIso: string,
  courtId: string,
  startHour: number,
  endHour: number,
  excludeId?: string,
) {
  return getBookings().find(
    (b) =>
      b.id !== excludeId &&
      b.status !== 'rejected' &&
      b.dayIso === dayIso &&
      b.courtId === courtId &&
      overlaps(b.startHour, b.endHour, startHour, endHour),
  )
}

// ---------- Admin-blocked slots ----------

export function getBlockedSlots(): BlockedSlot[] {
  return read<BlockedSlot>(BLOCKS_KEY)
}

export function addBlockedSlot(input: Omit<BlockedSlot, 'id' | 'createdAt'>): BlockedSlot {
  const block: BlockedSlot = { ...input, id: genId(), createdAt: new Date().toISOString() }
  write(BLOCKS_KEY, [...getBlockedSlots(), block])
  return block
}

export function removeBlockedSlot(id: string) {
  write(BLOCKS_KEY, getBlockedSlots().filter((b) => b.id !== id))
}

export function getBlockAt(dayIso: string, courtId: string, hour: number) {
  return getBlockedSlots().find(
    (b) => b.dayIso === dayIso && b.courtId === courtId && overlaps(b.startHour, b.endHour, hour, hour + 1),
  )
}

export function findOverlappingBlock(
  dayIso: string,
  courtId: string,
  startHour: number,
  endHour: number,
  excludeId?: string,
) {
  return getBlockedSlots().find(
    (b) =>
      b.id !== excludeId &&
      b.dayIso === dayIso &&
      b.courtId === courtId &&
      overlaps(b.startHour, b.endHour, startHour, endHour),
  )
}

// ---------- Combined availability ----------

/** True if a customer should NOT be able to select this hour (booked by anyone, or blocked by staff). */
export function isSlotTaken(dayIso: string, courtId: string, hour: number) {
  return Boolean(getBookingAt(dayIso, courtId, hour) || getBlockAt(dayIso, courtId, hour))
}

// ---------- React subscription ----------

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

let snapshotVersion = 0
window.addEventListener(CHANGE_EVENT, () => {
  snapshotVersion++
})
window.addEventListener('storage', () => {
  snapshotVersion++
})

/** Re-renders the calling component whenever booking data or court settings change. */
export function useBookingStoreVersion() {
  return useSyncExternalStore(
    subscribe,
    () => snapshotVersion,
    () => 0,
  )
}
