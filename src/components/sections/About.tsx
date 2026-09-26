import Container from '../ui/Container'
import SectionHeading from '../ui/SectionHeading'

const points = [
  {
    title: 'A building with a past',
    body: 'We’re keeping the character of the old rice mill — the structure, the texture, the story it already tells.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <path d="M3 12L13 4L23 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 11v11h16V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 22v-6h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Three sports, one roof',
    body: 'Pickleball, badminton, and a dedicated taekwondo training area, all sharing the same heritage space.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <circle cx="13" cy="13" r="4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="5" cy="6" r="2.6" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="21" cy="6" r="2.6" stroke="currentColor" strokeWidth="1.8" />
        <path d="M13 9V6M9.5 8L6.6 7.2M16.5 8l2.9-0.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Built for the community',
    body: 'A place for families, friends, and athletes to play, train, connect, and start something new together.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="3.4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="18" cy="10.5" r="2.7" stroke="currentColor" strokeWidth="1.8" />
        <path d="M2.5 23c0-4 3-6.6 6.5-6.6s6.5 2.6 6.5 6.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M15.5 17c3 0.3 5 2.6 5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function About() {
  return (
    <section id="story" className="bg-sand py-12 sm:py-16 lg:py-20">
      <Container className="grid gap-12 xl:grid-cols-[0.9fr_1.1fr] xl:items-start xl:gap-20">
        <SectionHeading
          title="A place with a past, now creating a new story."
          lede="2500 Heritage was once a rice mill that served San Fernando City. We’re preserving the character of the place while giving it a new purpose — a space where history stays, and a new generation plays."
        />

        <div className="grid gap-4 md:grid-cols-3 lg:gap-5">
          {points.map((point) => (
            <div key={point.title} className="group flex flex-col gap-4 rounded-2xl border border-ink/8 bg-sand-dim/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-citrus/35 hover:shadow-lg hover:shadow-ink/5 sm:p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-court/10 text-court transition-colors duration-300 group-hover:bg-court/15">
                {point.icon}
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-base font-semibold text-ink">{point.title}</h3>
                <p className="text-sm leading-6 text-ink/65">{point.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
