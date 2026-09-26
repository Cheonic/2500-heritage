import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'ghost'

const base =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-[-0.01em] transition-all duration-200 ease-out focus-visible:outline-offset-4 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]'

const variants: Record<Variant, string> = {
  primary:
    'bg-citrus text-ink shadow-md shadow-citrus/20 hover:bg-citrus-dim hover:shadow-lg hover:shadow-citrus/25 hover:-translate-y-0.5',
  secondary:
    'border border-sand/30 bg-sand/5 text-sand hover:border-sand/55 hover:bg-sand/10 hover:-translate-y-0.5',
  ghost: 'bg-transparent text-ink hover:bg-ink/5 hover:-translate-y-0.5',
}

interface CommonProps {
  variant?: Variant
  children: ReactNode
  className?: string
}

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined }

type ButtonAsLink = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }

type ButtonProps = ButtonAsButton | ButtonAsLink

export default function Button({
  variant = 'primary',
  children,
  className = '',
  ...rest
}: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${className}`

  if ('href' in rest && rest.href) {
    const { href, ...anchorRest } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & {
      href: string
    }

    // Internal route (e.g. "/booking") -> client-side navigation via React Router,
    // so it doesn't trigger a full page reload. Anchors (#section), external URLs,
    // and mailto/tel links stay as plain <a> tags.
    const isInternalRoute = href.startsWith('/') && !href.startsWith('//')
    if (isInternalRoute) {
      return (
        <Link to={href} className={classes} {...(anchorRest as Omit<typeof anchorRest, 'href'>)}>
          {children}
        </Link>
      )
    }

    return (
      <a href={href} className={classes} {...anchorRest}>
        {children}
      </a>
    )
  }

  return (
    <button className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  )
}
