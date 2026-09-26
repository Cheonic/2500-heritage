export interface NavLink {
  label: string
  href: string
  /** True when this points to its own page (react-router route) instead of a same-page #anchor. */
  isRoute?: boolean
}

export const navLinks: NavLink[] = [
  { label: 'Home', href: '#home' },
  { label: 'Our Story', href: '#story' },
  { label: 'Sports', href: '#sports' },
  { label: 'The Facility', href: '#facility' },
  { label: 'Book Now', href: '/booking', isRoute: true },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Contact', href: '#contact' },
]
