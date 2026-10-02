export type SocialPlatform = 'facebook' | 'tiktok' | 'instagram'

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
  // TODO: palitan ng mismong Instagram page ng 2500 Heritage
  { platform: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/' },
]
