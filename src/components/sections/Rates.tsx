import Container from '../ui/Container'
import SectionHeading from '../ui/SectionHeading'
import Button from '../ui/Button'
import { ratePlans, rentals } from '../../data/rates'

export default function Rates() {
  return (
    <section id="rates" className="bg-ink py-20 sm:py-28">
      <Container>
        <SectionHeading
          tone="light"
          title="Simple rates, no surprise fees."
          lede="Pay per session, rent a court by the hour, or go monthly once you know you’re hooked."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {ratePlans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col gap-6 rounded-card border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-ink/20 ${
                plan.highlighted
                  ? 'border-tide-light bg-court/20'
                  : 'border-sand/10 bg-ink-soft/50'
              }`}
            >
              <div>
                <h3 className="text-base font-semibold text-sand">{plan.name}</h3>
                <p className="mt-1 text-sm text-sand/60">{plan.description}</p>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-display text-xl font-semibold text-sand">{plan.price}</span>
              </div>
              <p className="-mt-4 text-xs text-sand/50">{plan.unit}</p>

              <ul className="flex flex-col gap-2.5 border-t border-sand/10 pt-5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-sand/75">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="mt-0.5 shrink-0 text-tide-light"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 8.5L6.2 11.5L13 4.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                href="#contact"
                variant={plan.highlighted ? 'primary' : 'secondary'}
                className="mt-auto"
              >
                Get started
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-card border border-sand/10 bg-ink-soft/40 p-7 sm:p-9">
          <h3 className="text-base font-semibold text-sand">Equipment rental</h3>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            {rentals.map((item) => (
              <div key={item.name} className="flex flex-col gap-1 border-t border-sand/10 pt-4 sm:border-t-0 sm:pt-0 first:border-t-0 first:pt-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium text-sand/85">{item.name}</span>
                  <span className="font-display text-base font-semibold text-tide-light">{item.price}</span>
                </div>
                <span className="text-xs text-sand/50">{item.note}</span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
