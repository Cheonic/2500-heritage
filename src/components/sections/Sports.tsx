import Container from '../ui/Container'
import SectionHeading from '../ui/SectionHeading'
import { sports } from '../../data/sports'

export default function Sports() {
  return (
    <section id="sports" className="bg-ink py-12 sm:py-16 lg:py-20">
      <Container>
        <SectionHeading
          tone="light"
          title="Three sports. One heritage home."
          lede="Pickleball, badminton, and taekwondo, sharing the same roof that once covered sacks of rice instead of scoreboards."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:gap-5">
          {sports.map((sport) => (
            <article
              key={sport.id}
              className="group relative flex min-h-64 flex-col justify-between gap-6 overflow-hidden rounded-card border border-sand/10 bg-gradient-to-br from-ink-soft to-ink-soft/55 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-citrus/45 hover:shadow-xl hover:shadow-black/15 sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-semibold text-sand">{sport.name}</h3>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-citrus/25 bg-citrus/10 font-display text-sm font-semibold text-citrus">
                  {sport.id}
                </span>
              </div>

              <p className="text-sm font-semibold leading-relaxed text-tide-light">{sport.tagline}</p>
              <p className="text-sm leading-6 text-sand/65">{sport.detail}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
