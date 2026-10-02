export type SocialPlatform = 'facebook' | 'tiktok' | 'instagram' | 'threads'

export interface SocialLink {
  platform: SocialPlatform
  label: string
  href: string
}

// Single source of truth for social links (used by the Hero and the Footer).
// To change a URL, just edit the href below.
export const socialLinks: SocialLink[] = [
  { platform: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61594366808151#' },
  { platform: 'tiktok', label: 'TikTok', href: 'https://www.tiktok.com/@2500.heritage?_r=1&_t=ZS-9A3LQJKsNpl' },
  
  { platform: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/2500_heritage/?fbclid=IwY2xjawUsmt1leHRuA2FlbQIxMABwZG9mBWJyaWQRMXVZdWVkRmtwSnNxaDM1cUhzcnRjBmFwcF9pZBAyMjIwMzkxNzg4MjAwODkyAAEeS7QYHDOCZipAXTsqSYCkxzu9x6LQZX8S0ZcFMRRKsUQpuknL-96_h9rIUH8_aem_GN78oyvJYWtodnniZ09iVA' },
  // TODO: palitan ng mismong Threads profile ng 2500 Heritage
  { platform: 'threads', label: 'Threads', href: 'https://www.threads.com/@2500_heritage?xmt=AQG0KqAqHzYHHJ8R54PIRJY4i1dZlGWXZrVUEU5Y6jTJWq8' },
]

// Messenger link used by the floating chat button.
// Format: https://m.me/<page username or page ID>
// (Currently uses the Facebook page ID from the Facebook link above.)
export const messengerUrl = 'https://m.me/61594366808151'
