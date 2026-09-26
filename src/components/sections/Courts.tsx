import Container from '../ui/Container'
import SectionHeading from '../ui/SectionHeading'
import { courts } from '../../data/courts'

export default function Courts() {
  return (
    <section id="courts" className="bg-ink py-20 sm:py-28">
      <Container>
        <SectionHeading
          tone="light"
          title="Four courts. Pick your weather."
          lede="Two sit under open sky with shade sails for the breeze, two are fully covered for rain or the harshest sun."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {courts.map((court) => (
            <article
              key={court.id}
              className="group flex flex-col justify-between gap-6 rounded-card border border-sand/10 bg-ink-soft/60 p-7 transition-all duration-300 hover:border-tide-light/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-ink/20"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-semibold text-sand">{court.name}</h3>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tide-light/15 font-display text-sm font-semibold text-tide-light">
                  {court.id}
                </span>
              </div>

              <p className="text-sm leading-relaxed text-sand/65">{court.detail}</p>

              <dl className="grid grid-cols-2 gap-4 border-t border-sand/10 pt-5 text-sm">
                <div>
                  <dt className="text-sand/45">Surface</dt>
                  <dd className="mt-1 text-sand/80">{court.surface}</dd>
                </div>
                <div>
                  <dt className="text-sand/45">Setting</dt>
                  <dd className="mt-1 text-sand/80">{court.setting}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
