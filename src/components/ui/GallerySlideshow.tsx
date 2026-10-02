import { useEffect, useState } from 'react'

interface GallerySlideshowProps {
  photos: string[]
  alt: string
  /** Stagger the timing so neighbouring tiles do not all change at once. */
  intervalMs?: number
  onOpen: (index: number) => void
}

export default function GallerySlideshow({ photos, alt, intervalMs = 4500, onOpen }: GallerySlideshowProps) {
  const [index, setIndex] = useState(0)
  const count = photos.length
  const current = count ? index % count : 0

  useEffect(() => {
    if (count < 2) return
    // Visitors who prefer reduced motion still get the slideshow (that is the content), just
    // slower; the fade itself is switched off globally in index.css for them.
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const delay = reduced ? Math.max(intervalMs, 7000) : intervalMs
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), delay)
    return () => window.clearInterval(timer)
  }, [count, intervalMs])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpen(current)}
        aria-label={`View full photos: ${alt}${count > 1 ? ` (${count} photos)` : ''}`}
        className="relative block aspect-[1.05] w-full cursor-zoom-in overflow-hidden bg-ink"
      >
        {photos.map((photo, i) => (
          <img
            key={i}
            src={photo}
            alt={i === current ? alt : ''}
            aria-hidden={i === current ? undefined : true}
            loading={i === 0 ? 'eager' : 'lazy'}
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-105 ${
              i === current ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
      </button>

      {count > 1 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-3 flex items-center gap-1 rounded-full bg-ink/60 px-2 py-1 backdrop-blur-sm"
        >
          {photos.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'w-4 bg-citrus' : 'w-1.5 bg-sand/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
