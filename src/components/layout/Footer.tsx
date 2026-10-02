import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { navLinks } from '../../data/nav'
import { socialLinks } from '../../data/social'
import { signInAdmin } from '../../data/adminAuth'
import Logo from '../ui/Logo'
import Container from '../ui/Container'
import Button from '../ui/Button'

export default function Footer() {
  const location = useLocation()
  const navigate = useNavigate()
  const [loginOpen, setLoginOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    if (!loginOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLoginOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [loginOpen])

  function openLogin() {
    setEmail('')
    setPassword('')
    setLoginError('')
    setLoginOpen(true)
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await signInAdmin(email, password)
      setLoginOpen(false)
      navigate('/admin')
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Unable to sign in. Try again.')
    }
  }

  return (
    <footer className="bg-ink pt-16 pb-8 text-sand sm:pt-20">
      <Container>
        <div className="grid gap-10 border-b border-sand/10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_1fr_0.8fr] lg:gap-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-sand/65">
              A heritage rice mill in San Fernando City, La Union — reborn as a home for
              Pickleball, Badminton &amp; Taekwondo.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-sand">Explore</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  {link.isRoute ? (
                    <Link to={link.href} className="text-sm text-sand/65 transition-colors hover:text-sand">
                      {link.label}
                    </Link>
                  ) : location.pathname === '/' ? (
                    <a href={link.href} className="text-sm text-sand/65 transition-colors hover:text-citrus">
                      {link.label}
                    </a>
                  ) : (
                    <Link to={`/${link.href}`} className="text-sm text-sand/65 transition-colors hover:text-citrus">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
              {location.pathname !== '/admin' && (
                <li>
                  <button
                    type="button"
                    onClick={openLogin}
                    className="text-sm text-sand/65 transition-colors hover:text-citrus"
                  >
                    Login
                  </button>
                </li>
              )}
            </ul>
          </div>

          

          <div>
            <h3 className="text-sm font-semibold text-sand">Follow along</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {socialLinks.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-sand/65 transition-colors hover:text-citrus"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 pt-8 text-xs text-sand/50 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} SysTech Solutions. All rights reserved.</p>
          <p>San Fernando City, La Union</p>
        </div>
      </Container>

      {loginOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/60 p-4"
          onClick={() => setLoginOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-login-title"
            className="w-full max-w-sm rounded-card border border-ink/10 bg-sand p-6 shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="staff-login-title" className="font-display text-lg font-semibold text-ink">
                  Staff login
                </h2>
                <p className="mt-1 text-sm text-ink/60">Sign in with your authorized staff account.</p>
              </div>
              <button
                type="button"
                aria-label="Close login"
                onClick={() => setLoginOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl leading-none text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
              >
                ×
              </button>
            </div>

            <form onSubmit={submitLogin}>
              <label htmlFor="staff-login-email" className="mt-5 block text-sm font-medium text-ink/75">
                Email
              </label>
              <input
                id="staff-login-email"
                type="email"
                required
                autoFocus
                autoComplete="username"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setLoginError('')
                }}
                className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-citrus focus:ring-4 focus:ring-citrus/15"
              />
              <label htmlFor="staff-login-password" className="mt-4 block text-sm font-medium text-ink/75">
                Password
              </label>
              <input
                id="staff-login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setLoginError('')
                }}
                className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-citrus focus:ring-4 focus:ring-citrus/15"
              />
              {loginError && (
                <p role="alert" className="mt-2 text-xs font-medium text-tide">
                  {loginError}
                </p>
              )}
              <Button type="submit" variant="primary" className="mt-5 w-full">
                Login
              </Button>
            </form>
          </section>
        </div>
      )}
    </footer>
  )
}
