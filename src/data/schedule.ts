export interface ScheduleSlot {
  day: string
  sessions: { time: string; label: string; level: string }[]
}

export const schedule: ScheduleSlot[] = [
  {
    day: 'Monday',
    sessions: [{ time: '6:00 – 8:00 AM', label: 'Sunrise Open Play', level: 'All levels' }],
  },
  {
    day: 'Tuesday',
    sessions: [{ time: '5:30 – 8:00 PM', label: 'Evening Open Play', level: 'Intermediate+' }],
  },
  {
    day: 'Wednesday',
    sessions: [{ time: '6:00 – 8:00 AM', label: 'Sunrise Open Play', level: 'All levels' }],
  },
  {
    day: 'Thursday',
    sessions: [{ time: '5:30 – 8:00 PM', label: 'Ladder League', level: 'Competitive' }],
  },
  {
    day: 'Friday',
    sessions: [{ time: '6:00 – 8:00 AM', label: 'Sunrise Open Play', level: 'All levels' }],
  },
  {
    day: 'Saturday',
    sessions: [
      { time: '7:00 – 9:00 AM', label: 'Beginner Clinic', level: 'New players' },
      { time: '4:00 – 7:00 PM', label: 'Weekend Open Play', level: 'All levels' },
    ],
  },
  {
    day: 'Sunday',
    sessions: [{ time: '4:00 – 7:00 PM', label: 'Weekend Open Play', level: 'All levels' }],
  },
]
