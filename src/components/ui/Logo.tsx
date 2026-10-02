import logoIcon from '../../assets/logo-icon.png'
import logoFull from '../../assets/logo-full.png'

interface LogoProps {
  tone?: 'dark' | 'light'
  variant?: 'icon' | 'full'
  className?: string
}

export default function Logo({ tone = 'light', variant = 'icon', className = '' }: LogoProps) {
  const isFull = variant === 'full'

  return (
    <span className={`inline-flex items-center ${className}`}>
      <span
        className={`inline-flex items-center rounded-xl px-2.5 py-1.5 ${
          tone === 'light' ? 'bg-sand' : 'bg-white'
        }`}
      >
        <img
          src={isFull ? logoFull : logoIcon}
          alt="2500 Heritage"
          className={isFull ? 'h-12 w-auto sm:h-14' : 'h-9 w-auto sm:h-10'}
        />
      </span>
    </span>
  )
}
