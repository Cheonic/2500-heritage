interface SportIllustrationProps {
  sportId: string
  className?: string
}

export default function SportIllustration({ sportId, className = '' }: SportIllustrationProps) {
  return (
    <svg
      viewBox="0 0 320 160"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="320" height="160" rx="18" fill="#EEF3EE" />
      <circle cx="264" cy="28" r="48" fill="#D3A53A" fillOpacity="0.12" />
      <path d="M0 133H320" stroke="#4C7A63" strokeOpacity="0.18" strokeWidth="2" />

      {sportId === 'PB' && (
        <>
          <rect x="18" y="18" width="284" height="124" rx="12" fill="none" stroke="#4C7A63" strokeOpacity="0.2" strokeWidth="2" />
          <path d="M160 18V142M18 80H302" stroke="#4C7A63" strokeOpacity="0.2" strokeWidth="2" />
          <path d="M126 80H194" stroke="#17302A" strokeOpacity="0.65" strokeWidth="3" />
          <path d="M126 69V91M194 69V91" stroke="#17302A" strokeOpacity="0.65" strokeWidth="3" />
          <g transform="rotate(-28 111 77)">
            <rect x="77" y="35" width="68" height="81" rx="29" fill="#4C7A63" stroke="#17302A" strokeWidth="4" />
            <circle cx="94" cy="58" r="2.5" fill="#DCE8DF" />
            <circle cx="111" cy="53" r="2.5" fill="#DCE8DF" />
            <circle cx="128" cy="58" r="2.5" fill="#DCE8DF" />
            <circle cx="89" cy="76" r="2.5" fill="#DCE8DF" />
            <circle cx="106" cy="72" r="2.5" fill="#DCE8DF" />
            <circle cx="123" cy="76" r="2.5" fill="#DCE8DF" />
            <circle cx="94" cy="94" r="2.5" fill="#DCE8DF" />
            <circle cx="111" cy="91" r="2.5" fill="#DCE8DF" />
            <circle cx="128" cy="94" r="2.5" fill="#DCE8DF" />
            <rect x="97" y="111" width="28" height="48" rx="10" fill="#D3A53A" stroke="#17302A" strokeWidth="4" />
          </g>
          <circle cx="226" cy="57" r="15" fill="#D3A53A" stroke="#17302A" strokeWidth="3" />
          <circle cx="221" cy="53" r="2" fill="#17302A" />
          <circle cx="230" cy="54" r="2" fill="#17302A" />
          <circle cx="225" cy="62" r="2" fill="#17302A" />
          <path d="M247 48L257 43M249 60L263 61" stroke="#D3A53A" strokeLinecap="round" strokeWidth="3" />
        </>
      )}

      {sportId === 'BM' && (
        <>
          <path d="M42 124H278" stroke="#4C7A63" strokeOpacity="0.3" strokeWidth="2" />
          <g transform="rotate(-24 126 75)">
            <ellipse cx="126" cy="61" rx="37" ry="49" fill="#FFFFFF" stroke="#17302A" strokeWidth="4" />
            <path d="M101 28L151 94M91 43L160 78M89 61H163M96 81L155 44M102 96L150 29" stroke="#4C7A63" strokeOpacity="0.75" strokeWidth="2" />
            <path d="M126 109L126 151" stroke="#17302A" strokeLinecap="round" strokeWidth="7" />
            <path d="M119 145L133 145" stroke="#D3A53A" strokeLinecap="round" strokeWidth="8" />
          </g>
          <g transform="rotate(22 226 58)">
            <path d="M222 36L245 73L207 73L228 36" fill="#FFFFFF" stroke="#17302A" strokeLinejoin="round" strokeWidth="3" />
            <path d="M213 65L239 65M210 71L242 71" stroke="#4C7A63" strokeWidth="2" />
            <circle cx="226" cy="82" r="10" fill="#D3A53A" stroke="#17302A" strokeWidth="3" />
          </g>
          <path d="M264 49L276 45M269 61L282 63" stroke="#D3A53A" strokeLinecap="round" strokeWidth="3" />
        </>
      )}

      {sportId === 'TK' && (
        <>
          <ellipse cx="164" cy="137" rx="105" ry="10" fill="#4C7A63" fillOpacity="0.12" />
          <path d="M126 83L93 108L60 137" fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="21" />
          <path d="M126 83L93 108L60 137" fill="none" stroke="#17302A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          <path d="M145 77L180 54L222 40" fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="20" />
          <path d="M145 77L180 54L222 40" fill="none" stroke="#17302A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          <path d="M122 64L140 56L157 87L139 104L113 84Z" fill="#FFFFFF" stroke="#17302A" strokeLinejoin="round" strokeWidth="3" />
          <path d="M126 72L144 89L136 101L116 82Z" fill="#DCE8DF" />
          <path d="M128 84L150 88" stroke="#17302A" strokeWidth="5" />
          <path d="M139 98L143 105L150 98" fill="none" stroke="#17302A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          <path d="M134 67L114 51L93 58" fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="13" />
          <path d="M134 67L114 51L93 58" fill="none" stroke="#17302A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          <path d="M149 68L166 48L158 30" fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="13" />
          <path d="M149 68L166 48L158 30" fill="none" stroke="#17302A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          <circle cx="139" cy="43" r="15" fill="#D99B72" stroke="#17302A" strokeWidth="3" />
          <path d="M125 42C127 27 146 23 154 37C146 34 135 35 125 42Z" fill="#17302A" />
          <path d="M108 120L97 130M220 40L238 38" stroke="#D3A53A" strokeLinecap="round" strokeWidth="5" />
        </>
      )}
    </svg>
  )
}
