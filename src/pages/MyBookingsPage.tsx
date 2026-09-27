import { useMemo, useState, type FormEvent } from 'react'
import Container from '../components/ui/Container'
import SectionHeading from '../components/ui/SectionHeading'
import Button from '../components/ui/Button'
import { formatFullDate } from '../data/booking'
import { lookupCustomerBookings, type StoredBooking } from '../data/store'
import { isSupabaseConfigured } from '../data/supabase'

export default function MyBookingsPage() {
  const [referenceInput, setReferenceInput] = useState('')
  const [mobileInput, setMobileInput] = useState('')
  const [bookings, setBookings] = useState<StoredBooking[]>([])
  const [lookupState, setLookupState] = useState<'idle' | 'loading' | 'found' | 'empty' | 'error'>('idle')
  const [lookupError, setLookupError] = useState('')
  const bookingGroups = useMemo(() => {
    const groups = new Map<string, StoredBooking[]>()
    bookings
      .filter((booking) => booking.source === 'customer')
      .forEach((booking) => {
        const group = groups.get(booking.reference) ?? []
        group.push(booking)
        groups.set(booking.reference, group)
      })

    return [...groups.entries()]
      .map(([reference, bookings]) => ({
        reference,
        bookings: bookings.sort(
          (a, b) => a.dayIso.localeCompare(b.dayIso) || a.startHour - b.startHour,
        ),
        createdAt: bookings[0]?.createdAt ?? '',
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [bookings])

  async function lookUpBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLookupState('loading')
    setLookupError('')
    try {
      const result = await lookupCustomerBookings(referenceInput, mobileInput)
      setBookings(result)
      setLookupState(result.length > 0 ? 'found' : 'empty')
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : 'Could not look up this booking.')
      setLookupState('error')
    }
  }

  return (
    <section className="bg-sand-dim py-14 sm:py-20">
      <Container className="flex flex-col gap-8">
        <SectionHeading
          title="My Bookings"
          lede={isSupabaseConfigured
            ? 'Enter your booking reference and mobile number to check your booking status from any device.'
            : 'Enter your booking reference and mobile number to check bookings saved in this browser.'}
        />

        <form onSubmit={lookUpBooking} className="grid gap-3 rounded-card border border-ink/10 bg-sand p-5 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-6">
          <label className="grid gap-1.5 text-sm font-medium text-ink/75">
            Booking reference
            <input
              required
              value={referenceInput}
              onChange={(event) => setReferenceInput(event.target.value)}
              placeholder="2500H-XXXXX"
              className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-citrus focus:ring-4 focus:ring-citrus/15"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-ink/75">
            Mobile number used for booking
            <input
              required
              type="tel"
              value={mobileInput}
              onChange={(event) => setMobileInput(event.target.value)}
              placeholder="09XX XXX XXXX"
              className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-citrus focus:ring-4 focus:ring-citrus/15"
            />
          </label>
          <Button type="submit" variant="primary" disabled={lookupState === 'loading'} className="sm:min-w-36">
            {lookupState === 'loading' ? 'Checking…' : 'Check booking'}
          </Button>
        </form>

        {lookupState === 'error' && <p role="alert" className="text-sm font-medium text-tide">{lookupError}</p>}
        {lookupState === 'empty' && (
          <div className="rounded-card border border-ink/10 bg-sand p-8 text-center shadow-sm sm:p-10">
            <p className="text-sm text-ink/65">No booking matched that reference and mobile number.</p>
            <Button href="/booking" variant="primary" className="mt-5">
              Reserve a Court
            </Button>
          </div>
        )}

        {bookingGroups.length > 0 && (
          <div className="grid gap-4">
            {bookingGroups.map(({ reference, bookings }) => (
              <article
                key={reference}
                className="overflow-hidden rounded-card border border-ink/10 bg-sand shadow-sm shadow-ink/5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-5 py-4 sm:px-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/45">Booking reference</p>
                    <h2 className="mt-1 font-display text-lg font-semibold text-ink">{reference}</h2>
                  </div>
                  <p className="text-sm text-ink/60">{bookings[0]?.name}</p>
                </div>

                <div className="divide-y divide-ink/10">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                    >
                      <div>
                        <p className="font-semibold text-ink">{booking.courtName}</p>
                        {booking.sport && <p className="mt-1 text-sm font-medium text-court">{booking.sport}</p>}
                        <p className="mt-1 text-sm text-ink/60">
                          {formatFullDate(new Date(`${booking.dayIso}T00:00:00`))} ·{' '}
                          {formatHour(booking.startHour)}–{formatHour(booking.endHour)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            booking.status === 'confirmed'
                              ? 'bg-court/10 text-court'
                              : booking.status === 'rejected'
                                ? 'bg-tide/10 text-tide'
                                : 'bg-citrus/15 text-ink'
                          }`}
                        >
                          {booking.status === 'confirmed'
                            ? 'Confirmed'
                            : booking.status === 'rejected'
                              ? 'Rejected'
                              : 'Reserved'}
                        </span>
                        <span className="font-display text-base font-semibold text-ink">
                          ₱{((booking.endHour - booking.startHour) * booking.rate).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}

function formatHour(hour: number) {
  const hour12 = hour % 12 || 12
  const suffix = hour < 12 || hour === 24 ? 'AM' : 'PM'
  return `${hour12}:00 ${suffix}`
}
