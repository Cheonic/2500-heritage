import Container from '../ui/Container'
import SectionHeading from '../ui/SectionHeading'
import { schedule } from '../../data/schedule'

export default function OpenPlay() {
  return (
    <section id="open-play" className="bg-sand py-12 sm:py-16 lg:py-20">
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            title="Open play, seven days a week."
            lede="Drop in during any listed window — no partner or reservation required. Ladder league is the one exception, sign up ahead at the counter."
          />
        </div>

        <div className="mt-12 overflow-hidden rounded-card border border-ink/10">
          {schedule.map((slot, index) => (
            <div
              key={slot.day}
              className={`grid grid-cols-1 gap-3 px-5 py-5 sm:px-6 md:grid-cols-[140px_1fr] md:items-center md:gap-6 md:px-8 ${
                index % 2 === 0 ? 'bg-white/60' : 'bg-sand-dim/60'
              }`}
            >
              <h3 className="text-base font-semibold text-ink">{slot.day}</h3>
              <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
                {slot.sessions.map((session) => (
                  <div
                    key={session.time}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full border border-ink/10 bg-white px-4 py-2 text-sm"
                  >
                    <span className="font-medium text-ink">{session.time}</span>
                    <span className="text-ink/50">{session.label}</span>
                    <span className="rounded-full bg-court/10 px-2.5 py-0.5 text-xs font-medium text-court-light">
                      {session.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
