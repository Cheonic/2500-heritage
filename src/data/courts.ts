export interface Court {
  id: string
  name: string
  surface: string
  setting: string
  detail: string
}

export const courts: Court[] = [
  {
    id: 'A',
    name: 'Court A — Windward',
    surface: 'Cushioned acrylic, outdoor',
    setting: 'Open air, shade sail',
    detail: 'Our showcase court, angled to catch the afternoon sea breeze. Built for tournament play.',
  },
  {
    id: 'B',
    name: 'Court B — Leeward',
    surface: 'Cushioned acrylic, outdoor',
    setting: 'Open air, shade sail',
    detail: 'Mirrors Windward for doubles brackets and club nights, side by side with room to spectate.',
  },
  {
    id: 'C',
    name: 'Court C — Covered',
    surface: 'Cushioned acrylic, roofed',
    setting: 'Under roof, open sides',
    detail: 'Rain or shine, this is the court we keep running. Popular for early lessons and rainy season.',
  },
  {
    id: 'D',
    name: 'Court D — Covered',
    surface: 'Cushioned acrylic, roofed',
    setting: 'Under roof, open sides',
    detail: 'Our quieter court, set slightly apart — good for private coaching and slower rallies.',
  },
]
