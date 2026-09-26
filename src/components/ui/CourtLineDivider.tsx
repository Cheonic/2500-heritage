interface CourtLineDividerProps {
  /** Background the divider sits on, so its lines stay visible against it. */
  bg?: 'sand' | 'ink'
}

/**
 * A thin structural divider styled after a court's kitchen line and
 * centerline — used to separate major page sections instead of a plain
 * horizontal rule.
 */
export default function CourtLineDivider({ bg = 'sand' }: CourtLineDividerProps) {
  const isSand = bg === 'sand'
  const stroke = isSand ? '#17302A' : '#FFFFFF'

  return (
    <div className={`w-full overflow-hidden ${isSand ? 'bg-sand' : 'bg-ink'}`} aria-hidden="true">
      <svg
        viewBox="0 0 1200 24"
        preserveAspectRatio="none"
        className="h-6 w-full opacity-30"
      >
        <line x1="0" y1="4" x2="1200" y2="4" stroke={stroke} strokeWidth="2" />
        <line x1="600" y1="0" x2="600" y2="24" stroke={stroke} strokeWidth="2" />
        <line x1="0" y1="20" x2="1200" y2="20" stroke={stroke} strokeWidth="2" strokeDasharray="10 10" />
      </svg>
    </div>
  )
}
