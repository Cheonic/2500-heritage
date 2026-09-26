export interface Sport {
  id: string
  name: string
  tagline: string
  detail: string
}

export const sports: Sport[] = [
  {
    id: 'PB',
    name: 'Pickleball',
    tagline: 'Fast, social, easy to fall in love with',
    detail:
      'Dedicated courts for open play, lessons, and friendly competition — built for beginners and regulars alike.',
  },
  {
    id: 'BM',
    name: 'Badminton',
    tagline: 'A local favorite, given a proper home',
    detail:
      'Full-size courts for casual games, club nights, and training, right under the warehouse’s original roofline.',
  },
  {
    id: 'TK',
    name: 'Taekwondo',
    tagline: 'Discipline, training, and community',
    detail:
      'A dedicated training area for classes and sparring, welcoming students from their very first belt onward.',
  },
]
