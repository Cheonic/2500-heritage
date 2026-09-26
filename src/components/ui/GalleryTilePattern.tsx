import type { GalleryTile } from '../../data/gallery'

const toneMap: Record<GalleryTile['tone'], { bg: string; fg: string }> = {
  court: { bg: '#4C7A63', fg: '#FFFFFF' },
  sand: { bg: '#F4F1EA', fg: '#13231D' },
  tide: { bg: '#A13B49', fg: '#FFFFFF' },
  citrus: { bg: '#D3A53A', fg: '#17302A' },
  ink: { bg: '#17302A', fg: '#E3B655' },
  clay: { bg: '#13231D', fg: '#FFFFFF' },
}

function PatternShape({ pattern, fg }: { pattern: GalleryTile['pattern']; fg: string }) {
  switch (pattern) {
    case 'lines':
      return (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={i} x1="0" y1={20 + i * 22} x2="200" y2={20 + i * 22} stroke={fg} strokeOpacity={0.5} strokeWidth="2" />
          ))}
        </>
      )
    case 'dink':
      return <circle cx="100" cy="100" r="46" stroke={fg} strokeWidth="2" fill="none" strokeDasharray="6 8" />
    case 'net':
      return (
        <g stroke={fg} strokeOpacity={0.6} strokeWidth="1.4">
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 25} x2="200" y2={i * 25} />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 25} y1="0" x2={i * 25} y2="200" />
          ))}
        </g>
      )
    case 'waves':
      return (
        <>
          {[60, 100, 140].map((y, i) => (
            <path
              key={i}
              d={`M0 ${y} Q 50 ${y - 20} 100 ${y} T 200 ${y}`}
              stroke={fg}
              strokeOpacity={0.55}
              strokeWidth="3"
              fill="none"
            />
          ))}
        </>
      )
    case 'grid':
      return (
        <g fill={fg} fillOpacity={0.55}>
          {Array.from({ length: 4 }).map((_, r) =>
            Array.from({ length: 4 }).map((_, c) => (
              <rect key={`${r}-${c}`} x={20 + c * 42} y={20 + r * 42} width="26" height="26" rx="4" />
            )),
          )}
        </g>
      )
    case 'arc':
      return (
        <>
          <path d="M20 160 A 80 80 0 0 1 180 160" stroke={fg} strokeWidth="3" fill="none" strokeOpacity={0.6} />
          <circle cx="100" cy="160" r="6" fill={fg} />
        </>
      )
    default:
      return null
  }
}

export default function GalleryTilePattern({ tile, className = '' }: { tile: GalleryTile; className?: string }) {
  const { bg, fg } = toneMap[tile.tone]
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={tile.caption}>
      <rect width="200" height="200" fill={bg} />
      <PatternShape pattern={tile.pattern} fg={fg} />
    </svg>
  )
}
