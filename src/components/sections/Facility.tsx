import Container from '../ui/Container'
import SectionHeading from '../ui/SectionHeading'
import { amenities } from '../../data/amenities'

export default function Facility() {
  return (
    <section id="facility" className="bg-sand-dim py-12 sm:py-16 lg:py-20">
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            title="What we’re building."
            lede="A heritage warehouse, reworked into a modern space for play and training — here's what to expect when the doors open."
          />
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:gap-5">
          {amenities.map((item) => (
            <div
              key={item.title}
              className="group flex min-h-40 flex-col justify-center gap-3 rounded-card border border-ink/8 bg-sand p-6 shadow-sm shadow-ink/[0.02] transition-all duration-300 hover:-translate-y-1 hover:border-citrus/40 hover:shadow-xl hover:shadow-ink/5 sm:p-8"
            >
              <h3 className="text-lg font-semibold text-ink transition-colors group-hover:text-court">{item.title}</h3>
              <p className="max-w-2xl text-sm leading-6 text-ink/65">{item.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
