import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { navLinks } from '../../data/nav'
import { useActiveSection } from '../../hooks/useActiveSection'
import Logo from '../ui/Logo'
import Button from '../ui/Button'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const anchorLinks = navLinks.filter((l) => !l.isRoute)
  const activeId = useActiveSection(anchorLinks.map((l) => l.href.replace('#', '')))

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (location.pathname === '/admin') {
    return (
      <header className="sticky top-0 z-50 border-b border-sand/10 bg-ink">
        <div className="mx-auto flex w-full max-w-7xl items-center px-5 py-3 sm:px-8">
          <Link to="/" aria-label="2500 Heritage, home">
            <Logo variant="full" />
          </Link>
        </div>
      </header>
    )
  }

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled ? 'border-sand/10 bg-ink/95 shadow-lg shadow-ink/10 backdrop-blur-xl' : 'border-sand/5 bg-ink'
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-5 py-3 sm:gap-5 sm:px-8">
        <Link to="/" onClick={() => setIsOpen(false)} aria-label="2500 Heritage, home">
          <Logo variant="full" />
        </Link>

        <nav className="hidden items-center gap-0.5 xl:flex xl:gap-1" aria-label="Primary">
          {navLinks.map((link) => {
            const isActive = link.isRoute
              ? location.pathname === link.href
              : activeId === link.href.replace('#', '')
            const linkClassName = `rounded-full px-2.5 py-2 text-xs font-medium transition-all duration-200 xl:px-3 xl:text-[0.8rem] ${
              isActive ? 'bg-sand/10 text-sand' : 'text-sand/65 hover:bg-sand/5 hover:text-sand'
            }`

            if (link.isRoute) {
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={linkClassName}
                  aria-current={isActive ? 'true' : undefined}
                >
                  {link.label}
                </Link>
              )
            }

            // On the home page, plain #anchors are enough for native scrolling.
            // On any other route (e.g. /booking), an <a href="#..."> would just
            // append the hash to the current URL (e.g. /booking#home) instead of
            // navigating back to the home page, so we route there explicitly.
            if (location.pathname !== '/') {
              return (
                <Link
                  key={link.href}
                  to={`/${link.href}`}
                  className={linkClassName}
                  aria-current={isActive ? 'true' : undefined}
                >
                  {link.label}
                </Link>
              )
            }

            return (
              <a
                key={link.href}
                href={link.href}
                className={linkClassName}
                aria-current={isActive ? 'true' : undefined}
              >
                {link.label}
              </a>
            )
          })}
        </nav>

        <div className="hidden xl:block">
          <Button
            href="https://reclub.co/clubs/@2500-heritage-la-union"
            target="_blank"
            rel="noreferrer noopener"
            variant="primary"
            className="!px-4 !py-2 !text-xs xl:!px-5 xl:!text-sm"
          >
            Reclub
          </Button>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sand xl:hidden"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
          aria-controls="mobile-nav"
          onClick={() => setIsOpen((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            {isOpen ? (
              <path d="M4 4L18 18M18 4L4 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <>
                <path d="M2 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M2 11H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M2 16H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>
      </div>

      <div
        id="mobile-nav"
        className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out xl:hidden ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div
          className={`min-h-0 border-t border-sand/10 ${
            isOpen
              ? 'max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain'
              : 'overflow-hidden'
          }`}
        >
          <nav className="flex flex-col px-5 py-4 sm:px-8" aria-label="Mobile">
            {navLinks.map((link) => {
              const mobileClassName =
                'rounded-xl px-3 py-3 text-sm font-medium text-sand/75 transition-colors duration-200 hover:bg-sand/5 hover:text-sand'

              if (link.isRoute) {
                return (
                  <Link key={link.href} to={link.href} onClick={() => setIsOpen(false)} className={mobileClassName}>
                    {link.label}
                  </Link>
                )
              }

              if (location.pathname !== '/') {
                return (
                  <Link
                    key={link.href}
                    to={`/${link.href}`}
                    onClick={() => setIsOpen(false)}
                    className={mobileClassName}
                  >
                    {link.label}
                  </Link>
                )
              }

              return (
                <a key={link.href} href={link.href} onClick={() => setIsOpen(false)} className={mobileClassName}>
                  {link.label}
                </a>
              )
            })}
            <Button
              href="https://reclub.co/clubs/@2500-heritage-la-union"
              target="_blank"
              rel="noreferrer noopener"
              variant="primary"
              className="mt-4 w-full"
            >
              Reclub
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}
