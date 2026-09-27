export default function ReclubLogo({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      role="img"
      aria-label="Reclub"
      className={className}
    >
      <rect width="40" height="40" rx="10" fill="#FFE34D" />
      <path
        d="M13 30V10h8.5a6 6 0 0 1 0 12H13m7 0 8 8"
        fill="none"
        stroke="#4055C8"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      />
    </svg>
  )
}
