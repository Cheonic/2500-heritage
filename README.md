# 2500 Heritage — website

A "coming soon" single-page site for 2500 Heritage, a heritage rice-mill
warehouse in San Fernando City, La Union being transformed into a home for
Pickleball, Badminton & Taekwondo. Built with Vite + React + TypeScript +
Tailwind CSS v4. All illustrations are original inline SVG — no external
image dependencies.

## Getting started

```bash
npm install
npm run dev       # start local dev server
npm run build     # type-check + production build to dist/
npm run preview   # preview the production build
```

## Project structure

```
src/
  components/
    layout/     Header (sticky, scroll-spy nav, mobile menu), Footer
    ui/         Reusable primitives: Button, Container, SectionHeading,
                Logo, CourtIllustration, GalleryTilePattern, CourtLineDivider
    sections/   Page sections: Hero, About (Our Story), Sports, Facility
                (what's being built), GetInvolved, Gallery, Testimonials
                (brand pillars), Contact (notify-me signup)
  data/         Typed content (nav links, sports, amenities, involve
                options, gallery, pillars) — separate from markup, easy
                to edit
  hooks/        useActiveSection — IntersectionObserver scroll-spy
  index.css     Tailwind v4 theme tokens (@theme): colors, fonts, radii
  App.tsx       Page composition
  main.tsx      Entry point
```

## Customizing

- **Content**: edit the files under `src/data/` — no component changes
  needed for text updates.
- **Colors & type**: edit the `@theme` block in `src/index.css`.
- **Sections**: each section is a self-contained component in
  `src/components/sections/`; reorder or remove them in `src/App.tsx`.

## Notes

- Placeholder contact details (phone, exact address, social links) are
  left generic since the venue hasn't opened yet — swap them for the real
  ones in `src/components/sections/Contact.tsx` and
  `src/components/layout/Footer.tsx` once available.
- The signup form is client-side only (no backend wired up) — hook up
  `handleSubmit` in `src/components/sections/Contact.tsx` to your mailing
  list or notification service of choice.
