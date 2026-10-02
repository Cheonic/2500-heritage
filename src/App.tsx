import { useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Hero from './components/sections/Hero'
import About from './components/sections/About'
import Sports from './components/sections/Sports'
import Facility from './components/sections/Facility'
import Booking from './components/sections/Booking'
import Gallery from './components/sections/Gallery'
import Testimonials from './components/sections/Testimonials'
import Contact from './components/sections/Contact'
import Container from './components/ui/Container'
import ChatButton from './components/ui/ChatButton'
import AdminPage from './pages/AdminPage'
import MyBookingsPage from './pages/MyBookingsPage'
import { loadBookingCourts } from './data/booking'
import { loadPaymentQrCode } from './data/paymentQr'
import { loadGalleryImages } from './data/galleryImages'
import { isSupabaseConfigured } from './data/supabase'

/**
 * Jumps to the top of the page whenever the route changes (e.g. Home -> Book Now).
 * If the new URL also carries a #section hash (e.g. coming back from /booking to
 * /#facility), scrolls to that section instead once it's rendered.
 */
function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      // Wait a tick so the target page (e.g. HomePage) has mounted its sections.
      const id = hash.replace('#', '')
      const scrollToHash = () => {
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: 'auto', block: 'start' })
          return true
        }
        return false
      }
      if (!scrollToHash()) {
        const raf = requestAnimationFrame(scrollToHash)
        return () => cancelAnimationFrame(raf)
      }
      return
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, hash])
  return null
}

function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <Sports />
      <Facility />
      <Gallery />
      <Testimonials />
      <Contact />
    </>
  )
}

function BookingPage() {
  return (
    <>
      <Container className="pt-8">
        <Link to="/" className="text-sm font-medium text-ink/60 hover:text-ink">
          ← Back to home
        </Link>
      </Container>
      <Booking />
    </>
  )
}

function App() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (!isSupabaseConfigured) return
    void Promise.all([loadBookingCourts(), loadPaymentQrCode(), loadGalleryImages()]).catch(() => {
      // The booking and admin screens surface their own errors when remote data is needed.
    })
  }, [])

  return (
    <div className="min-h-screen bg-sand">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-citrus focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
      >
        Skip to content
      </a>
      <ScrollToTop />
      <Header />
      <main id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/admin" element={<div className="bg-sand-dim"><AdminPage /></div>} />
        </Routes>
      </main>
      <Footer />
      {pathname !== '/admin' && <ChatButton />}
    </div>
  )
}

export default App
