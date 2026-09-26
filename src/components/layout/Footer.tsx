import { Link, useLocation } from 'react-router-dom'
import { navLinks } from '../../data/nav'
import Logo from '../ui/Logo'
import Container from '../ui/Container'

const social = [
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61594366808151#' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@2500.heritage?_r=1&_t=ZS-9A3LQJKsNpl' },
]

export default function Footer() {
  const location = useLocation()

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
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-sand">Status</h3>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-sand/65">
              <li className="flex justify-between gap-6">
                <span>Now</span>
                <span>Under transformation</span>
              </li>
              <li className="flex justify-between gap-6">
                <span>Opening</span>
                <span>Coming soon</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-sand">Follow along</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {social.map((s) => (
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
          <p>&copy; {new Date().getFullYear()} 2500 Heritage. All rights reserved.</p>
          <p>San Fernando City, La Union</p>
        </div>
      </Container>
    </footer>
  )
}
