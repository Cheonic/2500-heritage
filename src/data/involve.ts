export interface InvolveOption {
  name: string
  description: string
  points: string[]
  highlighted?: boolean
}

export const involveOptions: InvolveOption[] = [
  {
    name: 'Founding Members',
    description: 'Be first in line once the courts open, with perks reserved for our earliest supporters.',
    points: ['Priority booking at launch', 'Early-bird rates once pricing is set', 'First look at the finished space'],
    highlighted: true,
  },
  {
    name: 'Classes & Programs',
    description: 'Taekwondo training, badminton clinics, and pickleball lessons for all ages and skill levels.',
    points: ['Beginner-friendly schedules', 'Group and private options', 'Details announced closer to opening'],
  },
  {
    name: 'Events & Bookings',
    description: 'Planning a tournament, team building, or celebration? Let us know what you have in mind.',
    points: ['Full or partial venue rental', 'Tournaments and league play', 'Get in touch to start the conversation'],
  },
]
