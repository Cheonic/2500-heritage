import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import Container from '../components/ui/Container'
import SectionHeading from '../components/ui/SectionHeading'
import Button from '../components/ui/Button'
import { bookingCourts, hourSlots, getDayOptions, formatFullDate, isSlotPast, type DayOption } from '../data/booking'
import {
  addBooking,
  updateBooking,
  removeBooking,
  addBlockedSlot,
  removeBlockedSlot,
  getBookingAt,
  getBlockAt,
  findOverlappingBooking,
  findOverlappingBlock,
  useBookingStoreVersion,
  type StoredBooking,
} from '../data/store'
import { isAdminUnlocked, tryUnlockAdmin, lockAdmin } from '../data/adminAuth'

interface Range {
  courtId: string
  startHour: number
  endHour: number // exclusive
}

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(isAdminUnlocked)

  if (!unlocked) {
    return <AdminLogin onUnlock={() => setUnlocked(true)} />
  }

  return <AdminDashboard onLock={() => { lockAdmin(); setUnlocked(false) }} />
}

function AdminLogin({ onUnlock }: { onUnlock: () => void }) {
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState(false)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (tryUnlockAdmin(passcode)) {
      onUnlock()
    } else {
      setError(true)
    }
  }

  return (
    <Container className="flex min-h-[68vh] items-center justify-center py-16">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-card border border-ink/10 bg-sand p-7 shadow-xl shadow-ink/10 sm:p-9"
      >
        <h1 className="font-display text-lg font-semibold text-ink">Staff access</h1>
        <p className="mt-1 text-sm text-ink/60">Enter the staff passcode to manage bookings.</p>
        <input
          type="password"
          autoFocus
          value={passcode}
          onChange={(e) => {
            setPasscode(e.target.value)
            setError(false)
          }}
          placeholder="Passcode"
          className="mt-5 w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-citrus focus:ring-4 focus:ring-citrus/15"
        />
        {error && <p className="mt-2 text-xs font-medium text-tide">Wrong passcode. Try again.</p>}
        <Button type="submit" variant="primary" className="mt-5 w-full">
          Unlock
        </Button>
      </form>
    </Container>
  )
}

function AdminDashboard({ onLock }: { onLock: () => void }) {
  useBookingStoreVersion() // re-render on any booking/block change
  const [weekOffset, setWeekOffset] = useState(0)
  const days = useMemo(() => getDayOptions(7, weekOffset * 7), [weekOffset])
  const [activeDay, setActiveDay] = useState<DayOption>(days[0])
  const activeDayData = days.find((d) => d.iso === activeDay.iso) ?? days[0]

  const [selection, setSelection] = useState<Range | null>(null)
  const [assignFormOpen, setAssignFormOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<StoredBooking | null>(null)
  const [viewingBlockId, setViewingBlockId] = useState<string | null>(null)

  function switchDay(d: DayOption) {
    setActiveDay(d)
    setSelection(null)
    setAssignFormOpen(false)
  }

  function clickCell(courtId: string, hour: number) {
    const dayIso = activeDayData.iso
    if (isSlotPast(dayIso, hour)) return

    const booking = getBookingAt(dayIso, courtId, hour)
    if (booking) {
      setEditingBooking(booking)
      setSelection(null)
      return
    }

    const block = getBlockAt(dayIso, courtId, hour)
    if (block) {
      setViewingBlockId(block.id)
      setSelection(null)
      return
    }

    // Free slot: build/extend a selection range the same way the public
    // calendar does, so staff can drag out a multi-hour block or booking.
    setAssignFormOpen(false)
    setSelection((prev) => {
      if (!prev || prev.courtId !== courtId) {
        return { courtId, startHour: hour, endHour: hour + 1 }
      }
      if (hour >= prev.startHour && hour < prev.endHour) {
        if (hour === prev.startHour && hour === prev.endHour - 1) return null
        if (hour === prev.startHour) return { ...prev, startHour: hour + 1 }
        if (hour === prev.endHour - 1) return { ...prev, endHour: hour }
        return { ...prev, startHour: hour, endHour: hour + 1 }
      }
      if (hour === prev.endHour) return { ...prev, endHour: hour + 1 }
      if (hour === prev.startHour - 1) return { ...prev, startHour: hour }
      return { ...prev, startHour: hour, endHour: hour + 1 }
    })
  }

  function blockSelection(reason: string) {
    if (!selection) return
    addBlockedSlot({
      courtId: selection.courtId,
      dayIso: activeDayData.iso,
      startHour: selection.startHour,
      endHour: selection.endHour,
      reason: reason.trim() || undefined,
    })
    setSelection(null)
  }

  return (
    <Container className="flex flex-col gap-8 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeading
          title="Manage bookings."
          lede="Block off maintenance time, walk in a customer directly, or reschedule an existing booking."
        />
        <Button variant="secondary" className="!border-ink/15 !bg-sand !text-ink hover:!bg-sand-dim shrink-0 self-start" onClick={onLock}>
          Lock
        </Button>
      </div>

      <div className="overflow-hidden rounded-card border border-ink/10 bg-sand shadow-xl shadow-ink/5">
        <div className="bg-ink px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              aria-label="Previous week"
              onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
              disabled={weekOffset === 0}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sand/70 transition-colors hover:text-sand disabled:opacity-30"
            >
              ‹
            </button>
            <p className="font-display text-sm font-semibold text-sand sm:text-base">
              {formatFullDate(activeDayData.date)}
            </p>
            <button
              type="button"
              aria-label="Next week"
              onClick={() => setWeekOffset((w) => w + 1)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sand/70 transition-colors hover:text-sand"
            >
              ›
            </button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1.5 sm:gap-2">
            {days.map((d) => {
              const isActive = d.iso === activeDayData.iso
              return (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => switchDay(d)}
                  className={`flex flex-col items-center gap-0.5 rounded-xl border px-1.5 py-2 text-center transition-all ${
                    isActive
                      ? 'border-transparent bg-sand text-ink'
                      : 'border-citrus/40 bg-transparent text-sand hover:border-citrus'
                  }`}
                >
                  <span className="text-[0.6rem] font-semibold uppercase tracking-wide opacity-70">
                    {d.isToday ? 'Now' : d.weekday}
                  </span>
                  <span className="font-display text-sm font-semibold sm:text-base">{d.dayNum}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-ink/10 px-4 py-3 text-xs text-ink/70 sm:px-6">
          <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink/50">Legend</span>
          <LegendSwatch className="border border-ink/20 bg-sand" label="Available" />
          <LegendSwatch className="bg-tide" label="Booked" />
          <LegendSwatch className="bg-ink/50" label="Blocked" />
          <LegendSwatch className="bg-citrus" label="Selecting" />
          <LegendSwatch className="border border-ink/10 bg-sand-dim" label="Past" />
        </div>

        <p className="px-4 pt-3 text-xs text-ink/50 sm:px-6">Scroll horizontally to see all time slots â†’</p>
        <div className="overflow-x-auto overscroll-x-contain">
          <div className="min-w-[720px] px-4 py-4 sm:px-6">
            <div
              className="grid gap-1.5"
              style={{ gridTemplateColumns: `120px repeat(${hourSlots.length}, 64px)` }}
            >
              <div />
              {hourSlots.map((h) => (
                <div key={h.hour} className="pb-2 text-center text-[0.7rem] font-medium text-ink/60">
                  {h.label}
                </div>
              ))}

              {bookingCourts.map((court) => (
                <div key={court.id} className="contents">
                  <div className="flex flex-col justify-center py-2 pr-3">
                    <p className="text-sm font-semibold text-ink">{court.name}</p>
                    <p className="text-xs text-ink/55">₱{court.rate}/hr</p>
                  </div>
                  {hourSlots.map((h) => {
                    const dayIso = activeDayData.iso
                    const past = isSlotPast(dayIso, h.hour)
                    const booking = getBookingAt(dayIso, court.id, h.hour)
                    const block = getBlockAt(dayIso, court.id, h.hour)
                    const isSelecting =
                      !!selection &&
                      selection.courtId === court.id &&
                      h.hour >= selection.startHour &&
                      h.hour < selection.endHour

                    let cls =
                      'flex h-11 items-center justify-center rounded-lg border text-[0.65rem] font-semibold transition-all sm:h-12 '
                    let label = ''
                    if (past) {
                      cls += 'cursor-not-allowed border-ink/5 bg-sand-dim text-ink/25'
                    } else if (booking) {
                      cls += 'cursor-pointer border-tide bg-tide text-sand'
                      label = booking.name.split(' ')[0]
                    } else if (block) {
                      cls += 'cursor-pointer border-ink/50 bg-ink/50 text-sand'
                      label = '⛔'
                    } else if (isSelecting) {
                      cls += 'cursor-pointer border-citrus bg-citrus text-ink'
                      label = '✓'
                    } else {
                      cls += 'cursor-pointer border-ink/10 bg-white text-ink/40 hover:border-court/45 hover:bg-court/5 hover:text-ink'
                    }

                    return (
                      <button
                        key={h.hour}
                        type="button"
                        disabled={past}
                        onClick={() => clickCell(court.id, h.hour)}
                        className={cls}
                        title={
                          booking
                            ? `${booking.name} · ${booking.mobile} · ${booking.status}`
                            : block?.reason || (block ? 'Blocked' : undefined)
                        }
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="border-t border-ink/10 px-4 py-3 text-xs text-ink/55 sm:px-6">
          Tap an open slot to select a time range, tap a booked slot (orange) to reschedule or cancel
          it, or tap a blocked slot (dark) to unblock it.
        </p>
      </div>

      {selection && !assignFormOpen && (
        <SelectionActionBar
          courtName={bookingCourts.find((c) => c.id === selection.courtId)?.name ?? ''}
          startHour={selection.startHour}
          endHour={selection.endHour}
          onBlock={blockSelection}
          onAssign={() => setAssignFormOpen(true)}
          onClear={() => setSelection(null)}
        />
      )}

      {selection && assignFormOpen && (
        <AssignForm
          dayIso={activeDayData.iso}
          dayLabel={formatFullDate(activeDayData.date)}
          selection={selection}
          onCancel={() => setAssignFormOpen(false)}
          onSaved={() => {
            setAssignFormOpen(false)
            setSelection(null)
          }}
        />
      )}

      {editingBooking && (
        <BookingEditModal booking={editingBooking} onClose={() => setEditingBooking(null)} />
      )}

      {viewingBlockId && (
        <BlockModal blockId={viewingBlockId} onClose={() => setViewingBlockId(null)} />
      )}
    </Container>
  )
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded-sm ${className}`} />
      {label}
    </span>
  )
}

function rangeLabel(startHour: number, endHour: number) {
  const fmt = (h: number) => `${h % 12 || 12}${h < 12 || h === 24 ? 'AM' : 'PM'}`
  return `${fmt(startHour)}–${fmt(endHour)}`
}

function SelectionActionBar({
  courtName,
  startHour,
  endHour,
  onBlock,
  onAssign,
  onClear,
}: {
  courtName: string
  startHour: number
  endHour: number
  onBlock: (reason: string) => void
  onAssign: () => void
  onClear: () => void
}) {
  const [reason, setReason] = useState('')

  return (
    <div className="flex flex-col gap-3 rounded-card border border-ink/10 bg-sand-dim p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div>
        <p className="text-sm font-semibold text-ink">
          {courtName.split('—')[0].trim()} · {rangeLabel(startHour, endHour)}
        </p>
        <p className="text-xs text-ink/55">{endHour - startHour} hour(s) selected</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs text-ink outline-none transition-all duration-200 focus:border-citrus focus:ring-4 focus:ring-citrus/15 sm:w-40"
        />
        <Button variant="secondary" className="!border-ink/20 !py-2 !text-xs !text-ink" onClick={() => onBlock(reason)}>
          Block this time
        </Button>
        <Button variant="primary" className="!py-2 !text-xs" onClick={onAssign}>
          Assign a booking
        </Button>
        <button type="button" onClick={onClear} className="text-xs font-medium text-ink/50 hover:text-ink">
          Clear
        </button>
      </div>
    </div>
  )
}

function AssignForm({
  dayIso,
  dayLabel,
  selection,
  onCancel,
  onSaved,
}: {
  dayIso: string
  dayLabel: string
  selection: Range
  onCancel: () => void
  onSaved: () => void
}) {
  const court = bookingCourts.find((c) => c.id === selection.courtId)
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  function save() {
    if (!name.trim() || !mobile.trim()) {
      setError('Name and mobile number are required.')
      return
    }
    const clash =
      findOverlappingBooking(dayIso, selection.courtId, selection.startHour, selection.endHour) ||
      findOverlappingBlock(dayIso, selection.courtId, selection.startHour, selection.endHour)
    if (clash) {
      setError('That time was just taken — pick another slot.')
      return
    }
    addBooking({
      courtId: selection.courtId,
      courtName: court?.name ?? selection.courtId,
      dayIso,
      startHour: selection.startHour,
      endHour: selection.endHour,
      rate: court?.rate ?? 0,
      name: name.trim(),
      mobile: mobile.trim(),
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
      source: 'admin',
      status: 'confirmed',
    })
    onSaved()
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-card border border-ink/10 bg-sand p-6 shadow-xl shadow-ink/5 sm:p-8">
      <h3 className="font-display text-lg font-semibold text-ink">Assign a booking</h3>
      <p className="mt-1 text-sm text-ink/60">
        {court?.name.split('—')[0].trim()} · {dayLabel} · {rangeLabel(selection.startHour, selection.endHour)}
      </p>

      <div className="mt-5 flex flex-col gap-4">
        <Field label="Full name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Juan Dela Cruz"
            className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-citrus focus:ring-4 focus:ring-citrus/15"
          />
        </Field>
        <Field label="Mobile number">
          <input
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="09XX XXX XXXX"
            className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-citrus focus:ring-4 focus:ring-citrus/15"
          />
        </Field>
        <Field label="Email (optional)">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="juan@email.com"
            className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-citrus focus:ring-4 focus:ring-citrus/15"
          />
        </Field>
        <Field label="Notes (optional)">
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Walk-in, paid cash, etc."
            className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-citrus focus:ring-4 focus:ring-citrus/15"
          />
        </Field>
      </div>

      {error && <p className="mt-3 text-xs font-medium text-tide">{error}</p>}

      <div className="mt-6 flex gap-3">
        <Button variant="secondary" className="!flex-1 !text-ink !border-ink/20" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" className="!flex-1" onClick={save}>
          Save booking
        </Button>
      </div>
    </div>
  )
}

function BookingEditModal({ booking, onClose }: { booking: StoredBooking; onClose: () => void }) {
  const days = useMemo(() => getDayOptions(30, 0), [])
  const [dayIso, setDayIso] = useState(booking.dayIso)
  const [courtId, setCourtId] = useState(booking.courtId)
  const [startHour, setStartHour] = useState(booking.startHour)
  const [endHour, setEndHour] = useState(booking.endHour)
  const [status, setStatus] = useState(booking.status)
  const [error, setError] = useState('')

  function saveReschedule() {
    if (endHour <= startHour) {
      setError('End time must be after start time.')
      return
    }
    const clash =
      findOverlappingBooking(dayIso, courtId, startHour, endHour, booking.id) ||
      findOverlappingBlock(dayIso, courtId, startHour, endHour)
    if (clash) {
      setError('That time is already taken — pick another slot.')
      return
    }
    const court = bookingCourts.find((c) => c.id === courtId)
    updateBooking(booking.id, {
      dayIso,
      courtId,
      courtName: court?.name ?? courtId,
      startHour,
      endHour,
      rate: court?.rate ?? booking.rate,
      status,
    })
    onClose()
  }

  function cancelBooking() {
    removeBooking(booking.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-card border border-ink/10 bg-sand p-5 shadow-xl shadow-ink/10 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-semibold text-ink">
          {booking.name} <span className="text-sm font-normal text-ink/50">· {booking.reference}</span>
        </h3>
        <p className="mt-1 text-sm text-ink/60">
          {booking.mobile}
          {booking.email ? ` · ${booking.email}` : ''}
          {booking.notes ? ` · ${booking.notes}` : ''}
        </p>
        <p className="mt-1 text-xs uppercase tracking-wide text-ink/40">
          {booking.source === 'admin' ? 'Added by staff' : 'Booked by customer'}
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Court">
            <select
              value={courtId}
              onChange={(e) => setCourtId(e.target.value)}
              className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-citrus focus:ring-4 focus:ring-citrus/15"
            >
              {bookingCourts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name.split('—')[0].trim()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StoredBooking['status'])}
              className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-citrus focus:ring-4 focus:ring-citrus/15"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
            </select>
          </Field>
          <Field label="Date">
            <select
              value={dayIso}
              onChange={(e) => setDayIso(e.target.value)}
              className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-citrus focus:ring-4 focus:ring-citrus/15"
            >
              {days.map((d) => (
                <option key={d.iso} value={d.iso}>
                  {formatFullDate(d.date)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Time">
            <div className="flex items-center gap-1.5">
              <select
                value={startHour}
                onChange={(e) => setStartHour(Number(e.target.value))}
                className="w-full rounded-xl border border-ink/15 bg-white px-2 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-citrus focus:ring-4 focus:ring-citrus/15"
              >
                {hourSlots.map((h) => (
                  <option key={h.hour} value={h.hour}>
                    {h.label.split('–')[0]}
                  </option>
                ))}
              </select>
              <span className="text-ink/40">–</span>
              <select
                value={endHour}
                onChange={(e) => setEndHour(Number(e.target.value))}
                className="w-full rounded-xl border border-ink/15 bg-white px-2 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-citrus focus:ring-4 focus:ring-citrus/15"
              >
                {hourSlots.map((h) => (
                  <option key={h.hour + 1} value={h.hour + 1}>
                    {h.label.split('–')[1]}
                  </option>
                ))}
              </select>
            </div>
          </Field>
        </div>

        {error && <p className="mt-3 text-xs font-medium text-tide">{error}</p>}

        <div className="mt-6 flex gap-3">
          <Button variant="secondary" className="!flex-1 !text-tide !border-tide/40" onClick={cancelBooking}>
            Cancel booking
          </Button>
          <Button variant="primary" className="!flex-1" onClick={saveReschedule}>
            Save changes
          </Button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full text-center text-xs font-medium text-ink/50 hover:text-ink"
        >
          Close without saving
        </button>
      </div>
    </div>
  )
}

function BlockModal({ blockId, onClose }: { blockId: string; onClose: () => void }) {
  function unblock() {
    removeBlockedSlot(blockId)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-card border border-ink/10 bg-sand p-5 text-center shadow-xl shadow-ink/10 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-semibold text-ink">Blocked time</h3>
        <p className="mt-1 text-sm text-ink/60">This slot is closed off from customer bookings.</p>
        <div className="mt-6 flex gap-3">
          <Button variant="secondary" className="!flex-1 !text-ink !border-ink/20" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" className="!flex-1" onClick={unblock}>
            Unblock
          </Button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</span>
      {children}
    </label>
  )
}
