import type { SocialPlatform } from '../../data/social'

const paths: Partial<Record<SocialPlatform, string>> = {
  facebook:
    'M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.5V21h3Z',
  tiktok:
    'M16.6 3h-2.9v12.2a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.6a5.6 5.6 0 1 0 4.7 5.5V9a7 7 0 0 0 4 1.3V7.4A4.2 4.2 0 0 1 16.6 3Z',
}

export default function SocialIcon({ platform, className = 'h-5 w-5' }: { platform: SocialPlatform; className?: string }) {
  if (platform === 'instagram') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={className}
        aria-hidden="true"
      >
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d={paths[platform]} />
    </svg>
  )
}
