import Container from '../ui/Container'
import Button from '../ui/Button'

const bannerAlt =
  '2500 Heritage banner with the San Fernando rice mill, the 2500 Heritage logo, and a message about sports and community.'

export default function Hero() {
  return (
    <section id="home" className="overflow-hidden bg-ink">
      {/* Keep the full artwork intact on larger screens and gently soften it. */}
      <div className="relative hidden bg-ink lg:block">
        <img
          src="/heritage-hero.png"
          alt={bannerAlt}
          fetchPriority="high"
          className="block h-auto w-full opacity-70"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-ink/10" />
        <div className="absolute bottom-[27%] left-1/2 z-10 -translate-x-1/2">
          <div className="flex items-center gap-3">
            <Button
              href="/booking"
              variant="primary"
              className="!min-h-12 !px-8 !py-3 !text-sm"
            >
              Reserve a Court
            </Button>
            <Button href="#open-play" variant="secondary" className="!bg-ink/65 !backdrop-blur-sm">
              Open Play
            </Button>
            <Button href="/my-bookings" variant="secondary" className="!bg-ink/65 !backdrop-blur-sm">
              My Bookings
            </Button>
          </div>
        </div>
      </div>

      {/* On phones, keep the banner's natural proportions so the whole image scales to the screen. */}
      <div className="relative bg-ink lg:hidden">
        <div className="relative">
          <img
            src="/heritage-hero.png"
            alt=""
            aria-hidden="true"
            className="block h-auto w-full opacity-70"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-ink"
          />
        </div>
        <Container className="relative z-10 flex flex-col items-start gap-4 py-6 sm:py-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-citrus">
            Sports · People · Community
          </p>
          <h1 className="max-w-lg text-balance font-display text-4xl font-semibold leading-[0.98] text-sand sm:text-5xl">
            Same Court.
            <br />
            <span className="text-tide-light">Bigger Stories.</span>
          </h1>
          <p className="max-w-sm text-sm leading-6 text-sand/75">
            A new home for pickleball, badminton, and taekwondo in San Fernando City.
          </p>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center sm:gap-3">
            <Button href="/booking" variant="primary" className="col-span-2 w-full !min-h-12 !px-5 !text-sm sm:col-span-1 sm:w-auto sm:!px-8">
              Reserve a Court
            </Button>
            <Button href="#open-play" variant="secondary" className="w-full !bg-ink/65 !px-3 !text-xs !backdrop-blur-sm sm:w-auto sm:!px-6 sm:!text-sm">
              Open Play
            </Button>
            <Button href="/my-bookings" variant="secondary" className="w-full !bg-ink/65 !px-3 !text-xs !backdrop-blur-sm sm:w-auto sm:!px-6 sm:!text-sm">
              My Bookings
            </Button>
          </div>
        </Container>
      </div>
    </section>
  )
}
