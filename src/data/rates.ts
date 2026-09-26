export interface RatePlan {
  name: string
  price: string
  unit: string
  description: string
  features: string[]
  highlighted?: boolean
}

export const ratePlans: RatePlan[] = [
  {
    name: 'Walk-in Play',
    price: '₱150',
    unit: 'per player, per session',
    description: 'Drop by an open play session, pay at the counter, start rallying.',
    features: ['Any open play session', 'Paddle rental available', 'No booking needed'],
  },
  {
    name: 'Court Rental',
    price: '₱600',
    unit: 'per hour, per court',
    description: 'Reserve a full court for your group, lesson, or private match.',
    features: ['Book up to 2 weeks ahead', 'Up to 4 players', 'Free water station'],
    highlighted: true,
  },
  {
    name: 'Monthly Membership',
    price: '₱2,200',
    unit: 'per month',
    description: 'For regulars — unlimited open play and priority booking windows.',
    features: ['Unlimited open play', '20% off court rentals', 'Priority booking, 3 weeks out'],
  },
]

export interface RentalItem {
  name: string
  price: string
  note: string
}

export const rentals: RentalItem[] = [
  { name: 'Paddle rental', price: '₱100', note: 'per session, damage deposit required' },
  { name: 'Ball sleeve (4 pcs)', price: '₱250', note: 'outdoor-rated, yours to keep' },
  { name: 'Court shoes', price: '₱120', note: 'limited sizes, per session' },
]
