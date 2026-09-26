import Container from '../ui/Container'
import SectionHeading from '../ui/SectionHeading'
import Button from '../ui/Button'
import { involveOptions } from '../../data/involve'

export default function GetInvolved() {
  return (
    <section id="involved" className="bg-ink py-12 sm:py-16 lg:py-20">
      <Container>
        <SectionHeading
          tone="light"
          title="Ways to get involved."
          lede="Pricing and schedules will be announced closer to opening — here’s how to be part of it from day one."
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-3 lg:gap-5">
          {involveOptions.map((option) => (
            <div
              key={option.name}
              className={`flex flex-col gap-6 rounded-card border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-ink/20 ${
                option.highlighted
                  ? 'border-citrus/50 bg-court/20 shadow-lg shadow-black/10'
                  : 'border-sand/10 bg-ink-soft/55'
              }`}
            >
              <div>
                <h3 className="text-base font-semibold text-sand">{option.name}</h3>
                <p className="mt-1 text-sm text-sand/60">{option.description}</p>
              </div>

              <ul className="flex flex-col gap-2.5 border-t border-sand/10 pt-5">
                {option.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-sand/75">
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
                    {point}
                  </li>
                ))}
              </ul>

              <Button
                href="#contact"
                variant={option.highlighted ? 'primary' : 'secondary'}
                className="mt-auto"
              >
                Register interest
              </Button>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
