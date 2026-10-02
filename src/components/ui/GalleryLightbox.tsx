import { useCallback, useEffect, useRef } from 'react'

interface GalleryLightboxProps {
  photos: string[]
  index: number
  caption: string
  /** Accessible name for the photo; used when the visible caption is empty. */
  label?: string
  onIndexChange: (index: number) => void
  onClose: () => void
}

export default function GalleryLightbox({ photos, index, caption, label, onIndexChange, onClose }: GalleryLightboxProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const touchStartX = useRef<number | null>(null)
  const count = photos.length

  const step = useCallback(
    (direction: 1 | -1) => {
      if (count < 2) return
      onIndexChange((index + direction + count) % count)
    },
    [count, index, onIndexChange],
  )

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      else if (event.key === 'ArrowRight') step(1)
      else if (event.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, step])

  const photo = photos[index]
  if (!photo) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label || caption || 'Photo'}
      className="fixed inset-0 z-[80] flex flex-col bg-ink/95 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <p className="text-xs text-sand/60">
          {count > 1 ? `${index + 1} / ${count}` : ''}
        </p>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close photo"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-sand/25 text-xl leading-none text-sand transition-colors hover:border-citrus hover:text-citrus"
        >
          ×
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-16"
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0].clientX
        }}
        onTouchEnd={(event) => {
          const start = touchStartX.current
          touchStartX.current = null
          if (start === null) return
          const delta = event.changedTouches[0].clientX - start
          if (Math.abs(delta) > 50) step(delta < 0 ? 1 : -1)
        }}
      >
        <img
          src={photo}
          alt={label || caption}
          onClick={(event) => event.stopPropagation()}
          className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
        />
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                step(-1)
              }}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-ink/70 text-2xl leading-none text-sand transition-colors hover:text-citrus sm:left-4"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                step(1)
              }}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-ink/70 text-2xl leading-none text-sand transition-colors hover:text-citrus sm:right-4"
            >
              ›
            </button>
          </>
        )}
      </div>

      {caption ? (
        <p
          onClick={(event) => event.stopPropagation()}
          className="px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 text-center text-sm text-sand/85"
        >
          {caption}
        </p>
      ) : (
        <div className="pb-[max(1.25rem,env(safe-area-inset-bottom))]" />
      )}
    </div>
  )
}
