export interface GalleryTile {
  id: string
  caption: string
  tone: 'court' | 'sand' | 'tide' | 'citrus' | 'ink' | 'clay'
  pattern: 'lines' | 'dink' | 'net' | 'waves' | 'grid' | 'arc'
}

export const galleryTiles: GalleryTile[] = [
  { id: 'g1', caption: 'The old rice mill, before its second life', tone: 'ink', pattern: 'grid' },
  { id: 'g2', caption: 'Original trusses, kept in plain sight', tone: 'tide', pattern: 'lines' },
  { id: 'g3', caption: 'Pickleball courts taking shape', tone: 'court', pattern: 'net' },
  { id: 'g4', caption: 'Badminton hall, under the heritage roof', tone: 'citrus', pattern: 'waves' },
  { id: 'g5', caption: 'The taekwondo training area', tone: 'clay', pattern: 'arc' },
  { id: 'g6', caption: 'Community day, coming soon', tone: 'sand', pattern: 'dink' },
]
