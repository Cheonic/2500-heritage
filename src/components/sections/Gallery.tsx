import { useCallback, useRef, useState } from 'react'
import Container from '../ui/Container'
import SectionHeading from '../ui/SectionHeading'
import GalleryTilePattern from '../ui/GalleryTilePattern'
import GallerySlideshow from '../ui/GallerySlideshow'
import GalleryLightbox from '../ui/GalleryLightbox'
import { galleryTiles } from '../../data/gallery'
import { getGalleryCaption, getGalleryPhotos } from '../../data/galleryImages'
import { useBookingStoreVersion } from '../../data/store'

export default function Gallery() {
  useBookingStoreVersion() // re-render when the admin adds or removes photos
  const [viewer, setViewer] = useState<{ tileId: string; index: number } | null>(null)
  const lastTriggerRef = useRef<Element | null>(null)

  const viewerTile = viewer ? galleryTiles.find((tile) => tile.id === viewer.tileId) : undefined
  const viewerPhotos = viewer ? getGalleryPhotos(viewer.tileId) : []
  const viewerCaption = viewerTile ? getGalleryCaption(viewerTile.id, viewerTile.caption) : ''

  const closeViewer = useCallback(() => {
    setViewer(null)
    ;(lastTriggerRef.current as HTMLElement | null)?.focus?.()
  }, [])

  return (
    <section id="gallery" className="bg-sand py-12 sm:py-16 lg:py-20">
      <Container>
        <SectionHeading
          title="Then and soon"
          lede="A first look at the transformation — from rice mill to a home for pickleball, badminton, and taekwondo."
        />

        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:gap-5">
          {galleryTiles.map((tile, tileIndex) => {
            const photos = getGalleryPhotos(tile.id)
            const caption = getGalleryCaption(tile.id, tile.caption)
            const description = caption || tile.caption // used for screen readers when the caption is hidden
            return (
              <figure
                key={tile.id}
                className="group relative overflow-hidden rounded-2xl border border-ink/10 bg-ink shadow-md shadow-ink/10"
              >
                {photos.length > 0 ? (
                  <div
                    onClickCapture={(event) => {
                      lastTriggerRef.current = event.target instanceof Element ? event.target.closest('button') : null
                    }}
                  >
                    <GallerySlideshow
                      photos={photos}
                      alt={description}
                      intervalMs={4200 + tileIndex * 450}
                      onOpen={(index) => setViewer({ tileId: tile.id, index })}
                    />
                  </div>
                ) : (
                  <GalleryTilePattern
                    tile={tile}
                    className="aspect-[1.05] w-full transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                )}
                {caption && (
                  <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/95 via-ink/75 to-transparent px-4 pb-3 pt-8 text-[0.7rem] leading-snug text-sand sm:text-xs">
                    {caption}
                  </figcaption>
                )}
              </figure>
            )
          })}
        </div>
      </Container>

      {viewer && viewerTile && viewerPhotos.length > 0 && (
        <GalleryLightbox
          photos={viewerPhotos}
          index={Math.min(viewer.index, viewerPhotos.length - 1)}
          caption={viewerCaption}
          label={viewerCaption || viewerTile.caption}
          onIndexChange={(index) => setViewer({ tileId: viewer.tileId, index })}
          onClose={closeViewer}
        />
      )}
    </section>
  )
}
