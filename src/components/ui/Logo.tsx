import logoIcon from '../../assets/logo-icon.png'

interface LogoProps {
  tone?: 'dark' | 'light'
  className?: string
}

export default function Logo({ tone = 'light', className = '' }: LogoProps) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <span
        className={`inline-flex items-center rounded-xl px-2.5 py-1.5 ${
          tone === 'light' ? 'bg-sand' : 'bg-white'
        }`}
      >
        <img
          src={logoIcon}
          alt="2500 Heritage"
          className="h-9 w-auto sm:h-10"
        />
      </span>
    </span>
  )
}
