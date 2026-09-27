import { useMemo } from 'react'
import Container from '../components/ui/Container'
import SectionHeading from '../components/ui/SectionHeading'
import Button from '../components/ui/Button'
import { formatFullDate } from '../data/booking'
import { getBookings, useBookingStoreVersion, type StoredBooking } from '../data/store'

export default function MyBookingsPage() {
  const version = useBookingStoreVersion()
  const bookingGroups = useMemo(() => {
    const groups = new Map<string, StoredBooking[]>()

    getBookings()
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
  }, [version])

  return (
    <section className="bg-sand-dim py-14 sm:py-20">
      <Container className="flex flex-col gap-8">
        <SectionHeading
          title="My Bookings"
          lede="Bookings saved in this browser appear here. Use the same device and browser you booked with."
        />

        {bookingGroups.length === 0 ? (
          <div className="rounded-card border border-ink/10 bg-sand p-8 text-center shadow-sm sm:p-10">
            <p className="text-sm text-ink/65">No bookings found on this device yet.</p>
            <Button href="/booking" variant="primary" className="mt-5">
              Reserve a Court
            </Button>
          </div>
        ) : (
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
