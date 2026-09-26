import { useMemo, useState } from 'react'
import Container from '../ui/Container'
import SectionHeading from '../ui/SectionHeading'
import Button from '../ui/Button'
import {
  bookingCourts,
  hourSlots,
  getDayOptions,
  formatFullDate,
  isSlotBooked,
  isSlotPast,
  type DayOption,
} from '../../data/booking'
import { addBooking, genReference, useBookingStoreVersion } from '../../data/store'
import qrPlaceholder from '../../assets/payment-qr-placeholder.png'

interface Selection {
  courtId: string
  courtName: string
  dayIso: string
  dayLabel: string
  startHour: number
  endHour: number // exclusive
  rate: number
}

type Step = 'calendar' | 'details' | 'payment' | 'confirmed'

export default function Booking() {
  // Re-render whenever bookings/blocks change anywhere (e.g. staff blocks a slot in Admin).
  useBookingStoreVersion()
  const [weekOffset, setWeekOffset] = useState(0)
  const days = useMemo(() => getDayOptions(7, weekOffset * 7), [weekOffset])
  const [activeDay, setActiveDay] = useState<DayOption>(days[0])

  const activeDayData = days.find((d) => d.iso === activeDay.iso) ?? days[0]

  const [selections, setSelections] = useState<Selection[]>([])
  const [step, setStep] = useState<Step>('calendar')
  const [form, setForm] = useState({ name: '', mobile: '', email: '' })
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [reference, setReference] = useState('')

  function switchDay(d: DayOption) {
    setActiveDay(d)
  }

  function toggleHour(court: (typeof bookingCourts)[number], hour: number) {
    const dayIso = activeDayData.iso
    const booked = isSlotBooked(dayIso, court.id, hour)
    const past = isSlotPast(dayIso, hour)
    if (booked || past) return

    setSelections((prev) => {
      const existing = prev.find((s) => s.courtId === court.id && s.dayIso === dayIso)

      if (!existing) {
        return [
          ...prev,
          {
            courtId: court.id,
            courtName: court.name,
            dayIso,
            dayLabel: formatFullDate(activeDayData.date),
            startHour: hour,
            endHour: hour + 1,
            rate: court.rate,
          },
        ]
      }

      // clicking inside current range: shrink from whichever edge is closer
      if (hour >= existing.startHour && hour < existing.endHour) {
        if (hour === existing.startHour && hour === existing.endHour - 1) {
          return prev.filter((s) => s !== existing)
        }
        if (hour === existing.startHour) {
          return prev.map((s) => (s === existing ? { ...s, startHour: hour + 1 } : s))
        }
        if (hour === existing.endHour - 1) {
          return prev.map((s) => (s === existing ? { ...s, endHour: hour } : s))
        }
        // clicked mid-range: reset selection to just this hour
        return prev.map((s) => (s === existing ? { ...s, startHour: hour, endHour: hour + 1 } : s))
      }

      // extend forward or backward if adjacent
      if (hour === existing.endHour) {
        return prev.map((s) => (s === existing ? { ...s, endHour: hour + 1 } : s))
      }
      if (hour === existing.startHour - 1) {
        return prev.map((s) => (s === existing ? { ...s, startHour: hour } : s))
      }

      // not adjacent: start a fresh single-hour selection for this court/day
      return prev.map((s) =>
        s === existing ? { ...s, startHour: hour, endHour: hour + 1 } : s,
      )
    })
  }

  function removeSelection(target: Selection) {
    setSelections((prev) => prev.filter((s) => s !== target))
  }

  const total = selections.reduce((sum, s) => sum + (s.endHour - s.startHour) * s.rate, 0)
  const totalHours = selections.reduce((sum, s) => sum + (s.endHour - s.startHour), 0)

  function goToDetails() {
    if (selections.length === 0) return
    setStep('details')
  }

  function goToPayment() {
    if (!form.name.trim() || !form.mobile.trim()) return
    setReference(genReference())
    setStep('payment')
  }

  function confirmBooking() {
    const ref = reference || genReference()
    selections.forEach((s) => {
      addBooking({
        reference: ref,
        courtId: s.courtId,
        courtName: s.courtName,
        dayIso: s.dayIso,
        startHour: s.startHour,
        endHour: s.endHour,
        rate: s.rate,
        name: form.name,
        mobile: form.mobile,
        email: form.email,
        source: 'customer',
        status: 'pending', // staff verifies payment before marking it confirmed in Admin
      })
    })
    setStep('confirmed')
  }

  function startOver() {
    setSelections([])
    setForm({ name: '', mobile: '', email: '' })
    setProofFile(null)
    setReference('')
    setStep('calendar')
  }

  return (
    <section id="booking" className="bg-sand-dim py-16 sm:py-24 lg:py-28">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          title="Book a court."
          lede="Pick a date and time, review your total, then pay by GCash or Maya QR — no account needed."
        />

        {step === 'calendar' && (
          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start xl:gap-6">
            <div className="overflow-hidden rounded-card border border-ink/10 bg-sand shadow-xl shadow-ink/5">
              {/* Date strip */}
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
                        <span className="font-display text-sm font-semibold sm:text-base">
                          {d.dayNum}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-ink/10 px-4 py-3 text-xs text-ink/70 sm:px-6">
                <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink/50">
                  Legend
                </span>
                <LegendSwatch className="border border-ink/20 bg-sand" label="Available" />
                <LegendSwatch className="bg-tide" label="Booked" />
                <LegendSwatch className="bg-citrus" label="Selected" />
                <LegendSwatch className="border border-ink/10 bg-sand-dim" label="Past" />
              </div>

              {/* Grid */}
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

                    {bookingCourts.map((court) => {
                      const selection = selections.find(
                        (s) => s.courtId === court.id && s.dayIso === activeDayData.iso,
                      )
                      return (
                        <div key={court.id} className="contents">
                          <div className="flex flex-col justify-center py-2 pr-3">
                            <p className="text-sm font-semibold text-ink">{court.name}</p>
                            <p className="text-xs text-ink/55">₱{court.rate}/hr</p>
                          </div>
                          {hourSlots.map((h) => {
                            const booked = isSlotBooked(activeDayData.iso, court.id, h.hour)
                            const past = isSlotPast(activeDayData.iso, h.hour)
                            const isSelected =
                              !!selection && h.hour >= selection.startHour && h.hour < selection.endHour

                            let cls =
                              'flex h-11 items-center justify-center rounded-lg border text-[0.65rem] font-semibold transition-all sm:h-12 '
                            if (past) cls += 'cursor-not-allowed border-ink/5 bg-sand-dim text-ink/25'
                            else if (booked) cls += 'cursor-not-allowed border-tide bg-tide text-sand'
                            else if (isSelected) cls += 'border-citrus bg-citrus text-ink shadow-sm shadow-citrus/25'
                            else cls += 'border-ink/10 bg-white text-ink/35 hover:border-court/45 hover:bg-court/5 hover:text-ink'

                            return (
                              <button
                                key={h.hour}
                                type="button"
                                disabled={booked || past}
                                onClick={() => toggleHour(court, h.hour)}
                                className={cls}
                                aria-label={`${court.name}, ${h.label}, ${
                                  booked ? 'booked' : past ? 'past' : isSelected ? 'selected' : 'available'
                                }`}
                              >
                                {booked ? '—' : isSelected ? '✓' : ''}
                              </button>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <p className="border-t border-ink/10 px-4 py-3 text-xs text-ink/55 sm:px-6">
                Tap a slot to select it, tap again to extend or shrink your time range. One
                continuous block per court, per day.
              </p>
            </div>

            <BookingSummaryPanel
              selections={selections}
              total={total}
              totalHours={totalHours}
              onRemove={removeSelection}
              onProceed={goToDetails}
            />
          </div>
        )}

        {step === 'details' && (
          <div className="mx-auto w-full max-w-lg rounded-card border border-ink/10 bg-sand p-6 shadow-xl shadow-ink/5 sm:p-9">
            <button
              type="button"
              onClick={() => setStep('calendar')}
              className="mb-5 text-sm font-medium text-ink/60 hover:text-ink"
            >
              ← Back to schedule
            </button>
            <h3 className="font-display text-lg font-semibold text-ink">Your details</h3>
            <p className="mt-1 text-sm text-ink/60">
              So we can confirm your booking and reach you if anything changes.
            </p>

            <div className="mt-6 flex flex-col gap-4">
              <Field label="Full name">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Juan Dela Cruz"
                  className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-citrus focus:ring-4 focus:ring-citrus/15"
                />
              </Field>
              <Field label="Mobile number">
                <input
                  type="tel"
                  value={form.mobile}
                  onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                  placeholder="09XX XXX XXXX"
                  className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-citrus focus:ring-4 focus:ring-citrus/15"
                />
              </Field>
              <Field label="Email (optional)">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="juan@email.com"
                  className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-citrus focus:ring-4 focus:ring-citrus/15"
                />
              </Field>
            </div>

            <Button
              variant="primary"
              className="mt-6 w-full"
              onClick={goToPayment}
              disabled={!form.name.trim() || !form.mobile.trim()}
            >
              Continue to payment →
            </Button>
          </div>
        )}

        {step === 'payment' && (
          <div className="mx-auto grid w-full max-w-3xl gap-7 rounded-card border border-ink/10 bg-sand p-5 shadow-xl shadow-ink/5 sm:p-9 md:grid-cols-[1fr_1.1fr]">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-full max-w-[220px] overflow-hidden rounded-2xl border-2 border-dashed border-citrus/50 bg-white p-2">
                <img src={qrPlaceholder} alt="Scan to pay via GCash or Maya" className="w-full rounded-xl" />
              </div>
              <p className="text-xs text-ink/50">
                Placeholder QR — swap in your real GCash/Maya "Scan to Pay" code at
                <br />
                <code className="text-[0.65rem]">src/assets/payment-qr-placeholder.png</code>
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => setStep('details')}
                className="self-start text-sm font-medium text-ink/60 hover:text-ink"
              >
                ← Back
              </button>
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">Scan &amp; pay</h3>
                <p className="mt-1 text-sm text-ink/60">
                  Open GCash or Maya, scan the code, and send the exact amount below.
                </p>
              </div>

              <div className="rounded-xl bg-ink px-4 py-3.5 text-sand">
                <p className="text-xs uppercase tracking-wide text-sand/60">Amount to send</p>
                <p className="font-display text-lg font-semibold text-tide-light">
                  ₱{total.toLocaleString()}
                </p>
              </div>

              <Field label="Booking reference (add this as the payment note)">
                <input
                  readOnly
                  value={reference}
                  className="w-full rounded-xl border border-ink/15 bg-sand-dim px-3.5 py-2.5 text-sm font-semibold text-ink"
                />
              </Field>

              <Field label="Upload screenshot of payment (optional)">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm text-ink transition-colors duration-200 file:mr-3 file:rounded-full file:border-0 file:bg-citrus file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-ink"
                />
                {proofFile && <p className="mt-1 text-xs text-ink/50">Attached: {proofFile.name}</p>}
              </Field>

              <Button variant="primary" className="w-full" onClick={confirmBooking}>
                I've sent payment — confirm booking
              </Button>
              <p className="text-center text-xs text-ink/45">
                We'll verify your payment and text you a confirmation within a few hours.
              </p>
            </div>
          </div>
        )}

        {step === 'confirmed' && (
          <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 rounded-card border border-ink/10 bg-sand p-8 text-center shadow-xl shadow-ink/5">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-court/15 text-xl text-court">
              ✓
            </span>
            <h3 className="font-display text-lg font-semibold text-ink">Booking received!</h3>
            <p className="text-sm text-ink/65">
              Reference <span className="font-semibold text-ink">{reference}</span> — we've noted
              your slot and will confirm by SMS once your payment is verified.
            </p>

            <div className="w-full rounded-xl bg-sand-dim p-4 text-left text-sm text-ink/75">
              {selections.map((s) => (
                <div key={`${s.courtId}-${s.dayIso}`} className="flex flex-wrap justify-between gap-x-3 gap-y-1 border-b border-ink/10 py-1.5 last:border-0">
                  <span className="min-w-0 break-words">
                    {s.courtName.split('—')[0].trim()} · {s.dayLabel}, {s.startHour % 12 || 12}
                    {s.startHour < 12 ? 'AM' : 'PM'}–{s.endHour % 12 || 12}
                    {s.endHour < 12 || s.endHour === 24 ? 'AM' : 'PM'}
                  </span>
                  <span className="font-semibold text-ink">
                    ₱{((s.endHour - s.startHour) * s.rate).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-2 text-base font-semibold text-ink">
                <span>Total</span>
                <span>₱{total.toLocaleString()}</span>
              </div>
            </div>

            <Button variant="secondary" onClick={startOver} className="!text-ink !border-ink/20">
              Book another slot
            </Button>
          </div>
        )}
      </Container>
    </section>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</span>
      {children}
    </label>
  )
}

function BookingSummaryPanel({
  selections,
  total,
  totalHours,
  onRemove,
  onProceed,
}: {
  selections: Selection[]
  total: number
  totalHours: number
  onRemove: (s: Selection) => void
  onProceed: () => void
}) {
  return (
    <aside className="flex flex-col overflow-hidden rounded-card border border-ink/10 bg-sand shadow-xl shadow-ink/5 xl:sticky xl:top-24">
      <div className="bg-ink px-5 py-4">
        <h3 className="font-display text-base font-semibold text-sand">Booking Summary</h3>
      </div>

      {selections.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-ink/50">
          Select a time slot to start your booking.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-ink/10">
          {selections.map((s) => (
            <div key={`${s.courtId}-${s.dayIso}`} className="flex items-start justify-between gap-3 px-5 py-3.5">
              <div>
                <p className="text-sm font-semibold text-ink">{s.courtName.split('—')[0].trim()}</p>
                <p className="text-xs text-ink/55">
                  {s.dayLabel} · {s.startHour % 12 || 12}
                  {s.startHour < 12 ? 'AM' : 'PM'}–{s.endHour % 12 || 12}
                  {s.endHour < 12 || s.endHour === 24 ? 'AM' : 'PM'} ·{' '}
                  {s.endHour - s.startHour} hr × ₱{s.rate}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-semibold text-ink">
                  ₱{((s.endHour - s.startHour) * s.rate).toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(s)}
                  aria-label="Remove"
                  className="text-ink/40 hover:text-tide"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto border-t border-ink/10 px-5 py-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">Total</span>
          <span className="font-display text-lg font-semibold text-ink">₱{total.toLocaleString()}</span>
        </div>
        <Button
          variant="primary"
          className="w-full"
          onClick={onProceed}
          disabled={selections.length === 0}
        >
          Book {totalHours > 0 ? `${totalHours} hr` : ''} →
        </Button>
      </div>
    </aside>
  )
}
