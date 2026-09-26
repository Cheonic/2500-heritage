export interface Testimonial {
  quote: string
  name: string
  role: string
}

export const testimonials: Testimonial[] = [
  {
    quote:
      'I came for one beginner clinic and now I show up every Saturday. The covered courts make it easy to keep a standing game even when the rain rolls in.',
    name: 'Mara D.',
    role: 'Member since 2023',
  },
  {
    quote:
      'Booking a court for our barangay group is quick, the staff keep the schedule honest, and the shade sails actually make midday sessions bearable.',
    name: 'Joel T.',
    role: 'Weekly regular',
  },
  {
    quote:
      'Best part of my week is sunrise open play before work. Ten minutes from the highway, coffee next door, no excuse to skip it.',
    name: 'Ces A.',
    role: 'Ladder league player',
  },
]
