import Container from '../ui/Container'
import SectionHeading from '../ui/SectionHeading'
import GalleryTilePattern from '../ui/GalleryTilePattern'
import { galleryTiles } from '../../data/gallery'

export default function Gallery() {
  return (
    <section id="gallery" className="bg-sand py-12 sm:py-16 lg:py-20">
      <Container>
        <SectionHeading
          title="Then and soon"
          lede="A first look at the transformation — from rice mill to a home for pickleball, badminton, and taekwondo."
        />

        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:gap-5">
          {galleryTiles.map((tile) => (
            <figure
              key={tile.id}
              className="group relative overflow-hidden rounded-2xl border border-ink/10 bg-ink shadow-md shadow-ink/10"
            >
              <GalleryTilePattern
                tile={tile}
                className="aspect-[1.05] w-full transition-transform duration-500 ease-out group-hover:scale-105"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/95 via-ink/75 to-transparent px-4 pb-3 pt-8 text-[0.7rem] leading-snug text-sand sm:text-xs">
                {tile.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  )
}
