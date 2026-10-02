import { useState, type InputHTMLAttributes } from 'react'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> {
  /** Spacing/layout classes for the wrapper, e.g. "mt-5". */
  wrapperClassName?: string
}

export default function PasswordInput({ wrapperClassName = '', ...inputProps }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={`relative w-full ${wrapperClassName}`}>
      <input
        {...inputProps}
        type={visible ? 'text' : 'password'}
        className="w-full rounded-xl border border-ink/15 bg-white py-2.5 pl-3.5 pr-11 text-sm text-ink outline-none transition-all duration-200 focus:border-citrus focus:ring-4 focus:ring-citrus/15"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        title={visible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-ink/45 transition-colors hover:text-ink focus-visible:text-ink"
      >
        {visible ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
            <path d="M3 3l18 18" />
            <path d="M10.6 6.2A9.8 9.8 0 0 1 12 6c5 0 8.5 4 9.5 6a13.7 13.7 0 0 1-2.6 3.3M6.4 7.5C4.3 9 2.9 11 2.5 12c1 2 4.5 6 9.5 6 1.4 0 2.7-.3 3.8-.8" />
            <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
            <path d="M2.5 12C3.5 10 7 6 12 6s8.5 4 9.5 6c-1 2-4.5 6-9.5 6s-8.5-4-9.5-6Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  )
}
