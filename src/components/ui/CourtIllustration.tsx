export default function CourtIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 520"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="20" y="20" width="380" height="480" rx="28" fill="#4C7A63" />
      <rect x="20" y="20" width="380" height="480" rx="28" fill="url(#courtGrad)" fillOpacity="0.35" />
      <rect x="48" y="48" width="324" height="424" rx="4" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="3" />
      <line x1="48" y1="260" x2="372" y2="260" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="3" />
      <line x1="210" y1="48" x2="210" y2="177" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="3" />
      <line x1="210" y1="343" x2="210" y2="472" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="3" />
      <line x1="48" y1="177" x2="372" y2="177" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="3" />
      <line x1="48" y1="343" x2="372" y2="343" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="3" />
      <line x1="48" y1="260" x2="372" y2="260" stroke="#D3A53A" strokeWidth="3" />

      <g>
        <line x1="120" y1="255" x2="150" y2="255" stroke="#17302A" strokeOpacity="0.35" strokeWidth="6" />
        <circle cx="150" cy="255" r="12" fill="#D3A53A" stroke="#17302A" strokeOpacity="0.25" strokeWidth="2" />
      </g>

      <defs>
        <linearGradient id="courtGrad" x1="20" y1="20" x2="400" y2="500" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7FA98F" />
          <stop offset="1" stopColor="#17302A" />
        </linearGradient>
      </defs>
    </svg>
  )
}
