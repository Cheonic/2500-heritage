import Container from '../ui/Container'
import { pillars } from '../../data/pillars'

export default function Testimonials() {
  return (
    <section className="bg-ink py-12 sm:py-16 lg:py-20">
      <Container>
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
          {pillars.map((pillar) => (
            <figure
              key={pillar.title}
              className="relative flex flex-col gap-4 overflow-hidden rounded-card border border-sand/10 bg-ink-soft/55 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-citrus/35 hover:shadow-xl hover:shadow-black/15 sm:p-8"
            >
              <span aria-hidden="true" className="font-display text-4xl leading-none text-citrus/65">“</span>
              <h3 className="font-display text-lg font-semibold text-tide-light">{pillar.title}</h3>
              <p className="text-balance text-base leading-7 text-sand/80">{pillar.body}</p>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  )
}
