import type { ReactNode } from 'react'
import Container from '../ui/Container'

export default function Contact() {
  return (
    <section id="contact" className="bg-sand-dim py-12 sm:py-16 lg:py-20">
      <Container className="flex flex-col gap-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ContactCard icon={<IconPin />} title="Find us">
            1 Lucero St, cor. P. Burgos St, San Fernando City, La Union
          </ContactCard>
          <ContactCard icon={<IconClock />} title="Status">
            Under transformation — opening soon
          </ContactCard>
          <ContactCard icon={<IconPhone />} title="Follow along">
            Construction updates shared on our social pages
          </ContactCard>
        </div>

        <div className="overflow-hidden rounded-card border border-ink/10 shadow-xl shadow-ink/10">
          <iframe
            title="2500 Heritage location on Google Maps"
            src="https://www.google.com/maps?q=2500%20HERITAGE%2C%201%20Lucero%20St%2C%20Cor%20P.%20Burgos%20St%2C%20San%20Fernando%20City%2C%20La%20Union%2C%20Philippines&output=embed"
            className="h-[220px] w-full sm:h-[280px]"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </Container>
    </section>
  )
}

function ContactCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-ink/8 bg-sand p-4 sm:p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-court/10">
        {icon}
      </span>
      <div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-ink/65">{children}</p>
      </div>
    </div>
  )
}

function IconPin() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-court-light" aria-hidden="true">
      <path d="M10 18s6-5.6 6-10.4A6 6 0 0 0 4 7.6C4 12.4 10 18 10 18Z" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="10" cy="7.6" r="2.2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-court-light" aria-hidden="true">
      <circle cx="10" cy="10" r="7.3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 6v4.3l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconPhone() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-court-light" aria-hidden="true">
      <path d="M4 3h3l1.5 4-2 1.5a10 10 0 0 0 5 5l1.5-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5C9.5 17 3 10.5 2.5 4.6A1.5 1.5 0 0 1 4 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}
