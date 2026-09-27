import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import Container from '../components/ui/Container'
import Button from '../components/ui/Button'
import ReclubLogo from '../components/ui/ReclubLogo'
import { bookingCourts, loadBookingCourts, saveBookingCourts, hourSlots, getDayOptions, formatFullDate, isSlotPast, type BookingCourt, type DayOption } from '../data/booking'
import {
  addBooking,
  updateBooking,
  updateCustomerBookingsByReference,
  removeBooking,
  addBlockedSlot,
  removeBlockedSlot,
  getBookingAt,
  getBlockAt,
  getBookings,
  loadAdminStore,
  findOverlappingBooking,
  findOverlappingBlock,
  useBookingStoreVersion,
  type StoredBooking,
} from '../data/store'
import { isAdminUnlocked, signInAdmin, lockAdmin } from '../data/adminAuth'
import { getPaymentQrCode, loadPaymentQrCode, savePaymentQrCode } from '../data/paymentQr'
import { isSupabaseConfigured } from '../data/supabase'

interface Range {
  courtId: string
  startHour: number
  endHour: number // exclusive
}

function resizePaymentQr(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(image.naturalWidth * scale)
      canvas.height = Math.round(image.naturalHeight * scale)
      const context = canvas.getContext('2d')
      if (!context) {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Could not process this image.'))
        return
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(objectUrl)
      resolve(canvas.toDataURL('image/png'))
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not read this image.'))
    }
    image.src = objectUrl
  })
}

type AdminSectionId = 'bookings' | 'payments' | 'courts' | 'payment-qr'

const adminSections: { id: AdminSectionId; label: string }[] = [
  { id: 'bookings', label: 'Bookings calendar' },
  { id: 'payments', label: 'Payment review' },
  { id: 'courts', label: 'Courts & pricing' },
  { id: 'payment-qr', label: 'Payment QR setup' },
]

export default function AdminPage() {
  const [access, setAccess] = useState<'checking' | 'locked' | 'unlocked'>('checking')

  useEffect(() => {
    let active = true
    isAdminUnlocked()
      .then((unlocked) => {
        if (active) setAccess(unlocked ? 'unlocked' : 'locked')
      })
      .catch(() => {
        if (active) setAccess('locked')
      })
    return () => {
      active = false
    }
  }, [])

  if (access === 'checking') {
    return <Container className="flex min-h-[68vh] items-center justify-center py-16 text-sm text-ink/60">Checking staff access…</Container>
  }
  if (access === 'locked') return <AdminLogin onUnlock={() => setAccess('unlocked')} />

  return <AdminDashboard onLock={() => { void lockAdmin().catch(() => undefined).finally(() => setAccess('locked')) }} />
}

function AdminLogin({ onUnlock }: { onUnlock: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      await signInAdmin(email, password)
      onUnlock()
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in. Try again.')
    }
  }

  return (
    <Container className="flex min-h-[68vh] items-center justify-center py-16">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-card border border-ink/10 bg-sand p-7 shadow-xl shadow-ink/10 sm:p-9"
      >
        <h1 className="font-display text-lg font-semibold text-ink">Staff access</h1>
        <p className="mt-1 text-sm text-ink/60">Sign in with your authorized staff account.</p>
        <input
          type="email"
          required
          autoFocus
          autoComplete="username"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError('')
          }}
          placeholder="Email address"
          className="mt-5 w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-citrus focus:ring-4 focus:ring-citrus/15"
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError('')
          }}
          placeholder="Password"
          className="mt-5 w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-citrus focus:ring-4 focus:ring-citrus/15"
        />
        {error && <p role="alert" className="mt-2 text-xs font-medium text-tide">{error}</p>}
        <Button type="submit" variant="primary" className="mt-5 w-full">
          Login
        </Button>
      </form>
    </Container>
  )
}

function AdminDashboard({ onLock }: { onLock: () => void }) {
  const storeVersion = useBookingStoreVersion() // re-render on any booking/block change
  const [adminStoreError, setAdminStoreError] = useState('')
  const [adminStoreLoading, setAdminStoreLoading] = useState(isSupabaseConfigured)
  const [activeSection, setActiveSection] = useState<AdminSectionId>('bookings')
  const reservedGroups = useMemo(() => {
    const groups = new Map<string, StoredBooking[]>()
    getBookings()
      .filter(
        (booking) =>
          booking.source === 'customer' &&
          (booking.status === 'reserved' || booking.status === 'pending'),
      )
      .forEach((booking) => {
        const group = groups.get(booking.reference) ?? []
        group.push(booking)
        groups.set(booking.reference, group)
      })
    return [...groups.entries()].map(([reference, bookings]) => ({ reference, bookings }))
  }, [storeVersion])
  const [weekOffset, setWeekOffset] = useState(0)
  const days = useMemo(() => getDayOptions(7, weekOffset * 7), [weekOffset])
  const [activeDay, setActiveDay] = useState<DayOption>(days[0])
  const activeDayData = days.find((d) => d.iso === activeDay.iso) ?? days[0]

  const [selection, setSelection] = useState<Range | null>(null)
  const [assignFormOpen, setAssignFormOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<StoredBooking | null>(null)
  const [viewingBlockId, setViewingBlockId] = useState<string | null>(null)
  const [courtDraft, setCourtDraft] = useState<BookingCourt[]>(() => bookingCourts.map((court) => ({ ...court })))
  const [courtSettingsError, setCourtSettingsError] = useState('')
  const [courtSettingsSaved, setCourtSettingsSaved] = useState(false)
  const [selectionError, setSelectionError] = useState('')
  const [savedPaymentQr, setSavedPaymentQr] = useState<string | null>(() => getPaymentQrCode())
  const [paymentQrDraft, setPaymentQrDraft] = useState<string | null>(null)
  const [paymentQrFileName, setPaymentQrFileName] = useState('')
  const [paymentQrError, setPaymentQrError] = useState('')
  const [paymentQrStatus, setPaymentQrStatus] = useState('')
  const [isPreparingPaymentQr, setIsPreparingPaymentQr] = useState(false)
  const [paymentActionError, setPaymentActionError] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let active = true
    const refreshBookings = () => {
      void loadAdminStore()
        .then(() => {
          if (active) setAdminStoreError('')
        })
        .catch((error) => {
          if (active) setAdminStoreError(error instanceof Error ? error.message : 'Could not refresh booking data.')
        })
    }
    Promise.all([loadAdminStore(), loadBookingCourts(), loadPaymentQrCode()])
      .then(() => {
        if (!active) return
        setCourtDraft(bookingCourts.map((court) => ({ ...court })))
        setSavedPaymentQr(getPaymentQrCode())
      })
      .catch((error) => {
        if (active) setAdminStoreError(error instanceof Error ? error.message : 'Could not load shared admin data.')
      })
      .finally(() => {
        if (active) setAdminStoreLoading(false)
      })
    const interval = window.setInterval(refreshBookings, 20_000)
    window.addEventListener('focus', refreshBookings)
    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshBookings)
    }
  }, [])

  async function saveCourtSettings(e: FormEvent) {
    e.preventDefault()
    if (courtDraft.some((court) => !court.name.trim() || !Number.isFinite(court.rate) || court.rate < 0)) {
      setCourtSettingsError('Enter a name and a valid hourly rate for every court.')
      setCourtSettingsSaved(false)
      return
    }
    try {
      await saveBookingCourts(courtDraft)
      setCourtSettingsError('')
      setCourtSettingsSaved(true)
    } catch (error) {
      setCourtSettingsError(error instanceof Error ? error.message : 'Could not save court settings.')
      setCourtSettingsSaved(false)
    }
  }

  async function preparePaymentQr(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    const input = event.currentTarget
    if (!file) return
    setPaymentQrError('')
    setPaymentQrStatus('')
    setPaymentQrDraft(null)
    setPaymentQrFileName('')
    if (!file.type.startsWith('image/')) {
      setPaymentQrError('Choose a PNG, JPG, or WEBP image.')
      input.value = ''
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setPaymentQrError('The image is too large. Choose a file under 8 MB.')
      input.value = ''
      return
    }

    setIsPreparingPaymentQr(true)
    try {
      setPaymentQrDraft(await resizePaymentQr(file))
      setPaymentQrFileName(file.name)
    } catch (error) {
      setPaymentQrError(error instanceof Error ? error.message : 'Could not process this image.')
      setPaymentQrDraft(null)
      setPaymentQrFileName('')
    } finally {
      setIsPreparingPaymentQr(false)
      input.value = ''
    }
  }

  async function commitPaymentQr() {
    if (!paymentQrDraft) return
    try {
      await savePaymentQrCode(paymentQrDraft)
      setSavedPaymentQr(getPaymentQrCode())
      setPaymentQrDraft(null)
      setPaymentQrStatus('Payment QR code saved.')
      setPaymentQrError('')
    } catch (error) {
      setPaymentQrError(error instanceof Error ? error.message : 'Could not save the QR code.')
      setPaymentQrStatus('')
    }
  }

  async function removePaymentQr() {
    try {
      await savePaymentQrCode(null)
      setSavedPaymentQr(null)
      setPaymentQrDraft(null)
      setPaymentQrFileName('')
      setPaymentQrStatus('Payment QR code removed.')
      setPaymentQrError('')
    } catch (error) {
      setPaymentQrError(error instanceof Error ? error.message : 'Could not remove the QR code.')
      setPaymentQrStatus('')
    }
  }

  async function approvePayment(reference: string) {
    setPaymentActionError('')
    try {
      await updateCustomerBookingsByReference(reference, 'confirmed')
    } catch (error) {
      setPaymentActionError(error instanceof Error ? error.message : 'Could not approve this payment.')
    }
  }

  async function rejectPayment(reference: string) {
    setPaymentActionError('')
    try {
      await updateCustomerBookingsByReference(reference, 'rejected')
    } catch (error) {
      setPaymentActionError(error instanceof Error ? error.message : 'Could not reject this payment.')
    }
  }

  function switchDay(d: DayOption) {
    setActiveDay(d)
    setSelection(null)
    setAssignFormOpen(false)
  }

  function navigateTo(section: AdminSectionId) {
    setActiveSection(section)
    setSelection(null)
    setAssignFormOpen(false)
  }

  function clickCell(courtId: string, hour: number) {
    if (adminStoreLoading) return
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

  async function blockSelection(reason: string) {
    if (!selection) return
    setSelectionError('')
    try {
      await addBlockedSlot({
        courtId: selection.courtId,
        dayIso: activeDayData.iso,
        startHour: selection.startHour,
        endHour: selection.endHour,
        reason: reason.trim() || undefined,
      })
      setSelection(null)
    } catch (error) {
      setSelectionError(error instanceof Error ? error.message : 'Could not block this time.')
    }
  }

  async function assignReclubSelection() {
    if (!selection) return
    const clash =
      findOverlappingBooking(
        activeDayData.iso,
        selection.courtId,
        selection.startHour,
        selection.endHour,
      ) ||
      findOverlappingBlock(
        activeDayData.iso,
        selection.courtId,
        selection.startHour,
        selection.endHour,
      )
    if (clash) {
      setSelectionError('That time is no longer available. Refresh the schedule and try again.')
      return
    }

    const court = bookingCourts.find((item) => item.id === selection.courtId)
    setSelectionError('')
    try {
      await addBooking({
        courtId: selection.courtId,
        courtName: court?.name ?? selection.courtId,
        dayIso: activeDayData.iso,
        startHour: selection.startHour,
        endHour: selection.endHour,
        rate: court?.rate ?? 0,
        name: 'Reclub',
        mobile: '',
        notes: 'Assigned from Reclub',
        source: 'reclub',
        status: 'confirmed',
      })
      setSelection(null)
    } catch (error) {
      setSelectionError(error instanceof Error ? error.message : 'Could not assign this Reclub booking.')
    }
  }

  return (
    <Container className="py-8 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-court">Staff workspace</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink sm:text-3xl">Admin dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink/60">Manage bookings, payment reviews, and court settings.</p>
        </div>
        <Button variant="secondary" className="!border-ink/15 !bg-sand !text-ink hover:!bg-sand-dim shrink-0 self-start" onClick={onLock}>
          Lock admin
        </Button>
      </div>

      {adminStoreLoading && <p role="status" className="mt-4 text-sm text-ink/60">Loading shared booking data…</p>}
      {adminStoreError && <p role="alert" className="mt-4 rounded-xl bg-tide/10 px-4 py-3 text-sm text-tide">Could not load Supabase data: {adminStoreError}</p>}

      <div className="mt-7 grid min-w-0 gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="h-fit rounded-card border border-ink/10 bg-sand p-3 shadow-xl shadow-ink/5 sm:p-4 lg:sticky lg:top-24">
          <p className="px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink/45">Navigation</p>
          <nav aria-label="Admin sections" className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {adminSections.map((section) => {
              const active = activeSection === section.id
              return (
                <button
                  key={section.id}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => navigateTo(section.id)}
                  className={`flex min-h-11 min-w-max items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition-colors lg:w-full ${
                    active
                      ? 'bg-court text-white'
                      : 'text-ink/65 hover:bg-sand-dim hover:text-ink'
                  }`}
                >
                  {section.label}
                  {section.id === 'payments' && reservedGroups.length > 0 && (
                    <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-white/20 text-white' : 'bg-citrus text-ink'}`}>
                      {reservedGroups.length}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="min-w-0">
      {activeSection === 'courts' && (
      <>
      <form onSubmit={saveCourtSettings} className="rounded-card border border-ink/10 bg-sand p-5 shadow-xl shadow-ink/5 sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-ink">Court names & rates</h2>
            <p className="mt-1 text-sm text-ink/60">Saved to the shared schedule and used across all devices.</p>
          </div>
          <Button type="submit" variant="primary" className="mt-3 self-start sm:mt-0">Save changes</Button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {courtDraft.map((court) => (
            <div key={court.id} className="grid grid-cols-[minmax(0,1fr)_120px] items-end gap-3 rounded-xl border border-ink/10 bg-white p-3">
              <Field label={`Court ${court.id} name`}>
                <input
                  required
                  value={court.name}
                  onChange={(e) => {
                    setCourtSettingsSaved(false)
                    setCourtDraft((current) => current.map((item) => item.id === court.id ? { ...item, name: e.target.value } : item))
                  }}
                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-citrus focus:ring-4 focus:ring-citrus/15"
                />
              </Field>
              <Field label="Rate / hour (₱)">
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={Number.isFinite(court.rate) ? court.rate : ''}
                  onChange={(e) => {
                    setCourtSettingsSaved(false)
                    setCourtDraft((current) => current.map((item) => item.id === court.id ? { ...item, rate: e.target.value === '' ? Number.NaN : Number(e.target.value) } : item))
                  }}
                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-citrus focus:ring-4 focus:ring-citrus/15"
                />
              </Field>
            </div>
          ))}
        </div>
        {courtSettingsError && <p role="alert" className="mt-3 text-sm font-medium text-tide">{courtSettingsError}</p>}
        {courtSettingsSaved && <p role="status" className="mt-3 text-sm font-medium text-court">Court settings saved.</p>}
      </form>
      </>
      )}

      {activeSection === 'payment-qr' && (
      <section className="rounded-card border border-ink/10 bg-sand p-5 shadow-xl shadow-ink/5 sm:p-6">
        <div>
          <h2 className="font-display text-base font-semibold text-ink">Payment QR code</h2>
          <p className="mt-1 text-sm text-ink/60">Upload the GCash or Maya QR shown to customers in the payment step.</p>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <Field label="Upload QR image">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={isPreparingPaymentQr}
                onChange={(event) => void preparePaymentQr(event)}
                className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm text-ink transition-colors file:mr-3 file:rounded-full file:border-0 file:bg-citrus file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-ink"
              />
            </Field>
            {paymentQrFileName && <p className="mt-2 text-xs text-ink/50">Selected: {paymentQrFileName}</p>}
            <p className="mt-2 text-xs text-ink/50">PNG, JPG, or WEBP · maximum 8 MB. Saved in this browser.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="primary" onClick={commitPaymentQr} disabled={!paymentQrDraft || isPreparingPaymentQr}>
                {isPreparingPaymentQr ? 'Preparing image…' : 'Save QR code'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="!border-ink/15 !bg-white !text-ink hover:!bg-sand-dim"
                onClick={removePaymentQr}
                disabled={!savedPaymentQr && !paymentQrDraft}
              >
                Remove QR code
              </Button>
            </div>
            {paymentQrError && <p role="alert" className="mt-3 text-sm font-medium text-tide">{paymentQrError}</p>}
            {paymentQrStatus && <p role="status" className="mt-3 text-sm font-medium text-court">{paymentQrStatus}</p>}
          </div>

          <div className="flex min-h-48 items-center justify-center rounded-2xl border border-ink/10 bg-white p-3">
            {paymentQrDraft || savedPaymentQr ? (
              <div className="text-center">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/45">
                  {paymentQrDraft ? 'New image preview' : 'Current QR code'}
                </p>
                <img
                  src={paymentQrDraft ?? savedPaymentQr ?? undefined}
                  alt="Payment QR code preview"
                  className="mx-auto max-h-52 max-w-full rounded-xl object-contain"
                />
              </div>
            ) : (
              <p className="text-center text-sm text-ink/45">No payment QR uploaded yet.</p>
            )}
          </div>
        </div>
      </section>
      )}

      {activeSection === 'payments' && (
      <section className="rounded-card border border-ink/10 bg-sand p-5 shadow-xl shadow-ink/5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-ink">Payment verification</h2>
            <p className="mt-1 text-sm text-ink/60">Check the GCash or Maya transaction reference before confirming each reservation.</p>
          </div>
          <span className="rounded-full bg-citrus/20 px-3 py-1 text-xs font-semibold text-ink">
            {reservedGroups.length} awaiting review
          </span>
        </div>
        {paymentActionError && <p role="alert" className="mt-4 rounded-xl bg-tide/10 px-4 py-3 text-sm text-tide">{paymentActionError}</p>}

        {reservedGroups.length === 0 ? (
          <p className="mt-5 rounded-xl bg-white px-4 py-5 text-center text-sm text-ink/55">
            No reservations are waiting for payment verification.
          </p>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {reservedGroups.map(({ reference, bookings }) => {
              const customer = bookings[0]
              const paymentReference = bookings.find((booking) => booking.paymentReference)?.paymentReference
              const total = bookings.reduce(
                (sum, booking) => sum + (booking.endHour - booking.startHour) * booking.rate,
                0,
              )
              return (
                <article key={reference} className="rounded-2xl border border-ink/10 bg-white p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-ink">{customer.name}</h3>
                      <p className="mt-1 text-xs text-ink/55">{reference} · {customer.mobile}</p>
                      <p className="mt-1 text-xs font-semibold text-court">
                        {customer.sport ?? 'Sport not specified'} · Reserved
                      </p>
                      <p className="mt-2 text-xs text-ink/60">
                        Payment reference: <span className="font-semibold text-ink">{paymentReference || 'Not provided'}</span>
                      </p>
                    </div>
                    <span className="font-display text-base font-semibold text-ink">₱{total.toLocaleString()}</span>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-ink/65">
                    {bookings.map((booking) => (
                      <p key={booking.id}>
                        {booking.courtName} · {formatFullDate(new Date(`${booking.dayIso}T00:00:00`))} ·{' '}
                        {rangeLabel(booking.startHour, booking.endHour)}
                      </p>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="primary"
                      className="w-full sm:flex-1"
                      onClick={() => approvePayment(reference)}
                    >
                      Approve and confirm
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full !border-tide/30 !bg-white !text-tide hover:!bg-tide/5 sm:w-auto"
                      onClick={() => rejectPayment(reference)}
                    >
                      Reject
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
      )}

      {activeSection === 'bookings' && (
      <>
      <div className="mb-5">
        <h2 className="font-display text-lg font-semibold text-ink">Bookings calendar</h2>
        <p className="mt-1 text-sm text-ink/60">Select a slot to create a booking or block time; select an existing entry to manage it.</p>
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
          <LegendSwatch className="bg-citrus" label="Reserved" />
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
                    } else if (booking?.status !== 'confirmed' && booking) {
                      cls += 'cursor-pointer border-citrus bg-citrus text-ink'
                      label = 'R'
                    } else if (booking) {
                      cls += 'cursor-pointer border-tide bg-tide text-sand'
                      label = booking.source === 'reclub' ? '' : booking.name.split(' ')[0]
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
                        disabled={past || adminStoreLoading}
                        onClick={() => clickCell(court.id, h.hour)}
                        className={cls}
                        title={
                          booking
                            ? booking.source === 'reclub'
                              ? `Reclub booking · ${rangeLabel(booking.startHour, booking.endHour)}`
                              : `${booking.sport ? `${booking.sport} · ` : ''}${booking.name} · ${booking.mobile} · ${booking.status === 'confirmed' ? 'Confirmed' : 'Reserved'}`
                            : block?.reason || (block ? 'Blocked' : undefined)
                        }
                      >
                        {booking?.source === 'reclub' ? <ReclubLogo className="h-7 w-7" /> : label}
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
      </>
      )}

      {activeSection === 'bookings' && selection && !assignFormOpen && (
        <>
        {selectionError && <p role="alert" className="rounded-xl bg-tide/10 px-4 py-3 text-sm text-tide">{selectionError}</p>}
        <SelectionActionBar
          courtName={bookingCourts.find((c) => c.id === selection.courtId)?.name ?? ''}
          startHour={selection.startHour}
          endHour={selection.endHour}
          onBlock={blockSelection}
          onAssign={() => setAssignFormOpen(true)}
          onAssignReclub={assignReclubSelection}
          onClear={() => setSelection(null)}
        />
        </>
      )}

      {activeSection === 'bookings' && selection && assignFormOpen && (
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
        </main>
      </div>
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
  onAssignReclub,
  onClear,
}: {
  courtName: string
  startHour: number
  endHour: number
  onBlock: (reason: string) => void
  onAssign: () => void
  onAssignReclub: () => void
  onClear: () => void
}) {
  const [reason, setReason] = useState('')

  return (
    <div className="flex flex-col gap-3 rounded-card border border-ink/10 bg-sand-dim p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div>
        <p className="text-sm font-semibold text-ink">
          {courtName} · {rangeLabel(startHour, endHour)}
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
        <Button
          variant="secondary"
          className="!border-ink/20 !bg-white !py-2 !text-xs !text-ink hover:!bg-sand"
          onClick={onAssignReclub}
        >
          <ReclubLogo className="h-5 w-5" />
          Assign Reclub
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
  const [saving, setSaving] = useState(false)

  async function save() {
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
    setSaving(true)
    setError('')
    try {
      await addBooking({
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
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save this booking.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-card border border-ink/10 bg-sand p-6 shadow-xl shadow-ink/5 sm:p-8">
      <h3 className="font-display text-lg font-semibold text-ink">Assign a booking</h3>
      <p className="mt-1 text-sm text-ink/60">
        {court?.name} · {dayLabel} · {rangeLabel(selection.startHour, selection.endHour)}
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
        <Button variant="primary" className="!flex-1" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save booking'}
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
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function saveReschedule() {
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
    setSaving(true)
    setError('')
    try {
      await updateBooking(booking.id, {
        dayIso,
        courtId,
        courtName: court?.name ?? courtId,
        startHour,
        endHour,
        rate: court?.rate ?? booking.rate,
      })
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update this booking.')
    } finally {
      setSaving(false)
    }
  }

  async function cancelBooking() {
    setSaving(true)
    setError('')
    try {
      await removeBooking(booking.id)
      onClose()
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Could not cancel this booking.')
    } finally {
      setSaving(false)
    }
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
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold text-ink">
            {booking.name} <span className="text-sm font-normal text-ink/50">· {booking.reference}</span>
          </h3>
          <ModalCloseButton onClose={onClose} />
        </div>
        <p className="mt-1 text-sm text-ink/60">
          {booking.mobile}
          {booking.email ? ` · ${booking.email}` : ''}
          {booking.notes ? ` · ${booking.notes}` : ''}
        </p>
        <p className="mt-1 text-xs uppercase tracking-wide text-ink/40">
          {booking.source === 'admin'
            ? 'Added by staff'
            : booking.source === 'reclub'
              ? 'Assigned from Reclub'
              : 'Booked by customer'}
          {booking.sport ? ` · ${booking.sport}` : ''}
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
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <p className="rounded-xl border border-ink/10 bg-sand-dim px-3 py-2.5 text-sm font-semibold text-ink">
              {booking.status === 'confirmed' ? 'Confirmed' : 'Reserved'}
            </p>
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
          <Button variant="secondary" className="!flex-1 !text-tide !border-tide/40" onClick={cancelBooking} disabled={saving}>
            Cancel booking
          </Button>
          <Button variant="primary" className="!flex-1" onClick={saveReschedule} disabled={saving}>
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
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function unblock() {
    setSaving(true)
    setError('')
    try {
      await removeBlockedSlot(blockId)
      onClose()
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Could not unblock this time.')
    } finally {
      setSaving(false)
    }
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
        <div className="grid grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-2">
          <span aria-hidden="true" />
          <h3 className="font-display text-lg font-semibold text-ink">Blocked time</h3>
          <ModalCloseButton onClose={onClose} />
        </div>
        <p className="mt-1 text-sm text-ink/60">This slot is closed off from customer bookings.</p>
        {error && <p role="alert" className="mt-3 text-xs font-medium text-tide">{error}</p>}
        <div className="mt-6 flex gap-3">
          <Button variant="secondary" className="!flex-1 !text-ink !border-ink/20" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" className="!flex-1" onClick={unblock} disabled={saving}>
            {saving ? 'Saving…' : 'Unblock'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ModalCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      aria-label="Close modal"
      title="Close"
      onClick={onClose}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink/10 bg-white text-xl leading-none text-ink/60 transition-colors hover:bg-sand-dim hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-court"
    >
      ×
    </button>
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
