import { notifyBookingStoreChanged } from './store'
import { isSupabaseConfigured, requireSupabase } from './supabase'

// Admin-uploaded photos for the "Then and soon" gallery. Each tile can hold several photos,
// which the website shows as an automatic slideshow.
//
// Supabase: files live in the public `gallery` bucket (gallery/<tileId>/<unique>.jpg) and the
// ordered list of file paths for each tile is stored in `site_settings` under the key
// `gallery_images_<tileId>` (a JSON array).
// Without Supabase, photos are kept in this browser's localStorage (local testing only).

export const MAX_PHOTOS_PER_TILE = 12

const BUCKET = 'gallery'
const LIST_PREFIX = 'gallery_images_'
const LEGACY_PREFIX = 'gallery_image_' // older single-photo setting, still read if present
const LOCAL_PREFIX = '2500h-gallery-list-'
const CAPTION_PREFIX = 'gallery_caption_'
const CAPTION_LOCAL_PREFIX = '2500h-gallery-caption-'

// paths: what is stored (storage paths, or data URLs in local mode). urls: what the page shows.
const paths: Record<string, string[]> = {}
const urls: Record<string, string[]> = {}
const localLoaded = new Set<string>()
// Captions edited by the admin. A tile with no entry here uses its default caption.
const captions: Record<string, string> = {}
const captionsLocalLoaded = new Set<string>()
const EMPTY: string[] = []

function toUrl(path: string) {
  if (!isSupabaseConfigured) return path
  return requireSupabase().storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

function setList(tileId: string, nextPaths: string[]) {
  paths[tileId] = nextPaths
  urls[tileId] = nextPaths.map(toUrl)
}

function parseList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
  if (typeof value === 'string' && value) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === 'string')
    } catch {
      // Not JSON: treat as a single stored path.
    }
    return [value]
  }
  return []
}

function readLocal(tileId: string) {
  try {
    const raw = window.localStorage.getItem(LOCAL_PREFIX + tileId)
    return raw ? parseList(raw) : []
  } catch {
    return []
  }
}

/** Photos (public URLs) for one tile, in slideshow order. */
export function getGalleryPhotos(tileId: string): string[] {
  if (!isSupabaseConfigured && !localLoaded.has(tileId) && typeof window !== 'undefined') {
    localLoaded.add(tileId)
    setList(tileId, readLocal(tileId))
  }
  return urls[tileId] ?? EMPTY
}

export async function loadGalleryImages() {
  if (!isSupabaseConfigured) return
  const client = requireSupabase()
  const { data, error } = await client.from('site_settings').select('key,value').like('key', 'gallery%')
  if (error) throw error

  const next: Record<string, string[]> = {}
  const rows = data ?? []
  for (const row of rows) {
    const key = String(row.key)
    if (key.startsWith(LEGACY_PREFIX)) next[key.slice(LEGACY_PREFIX.length)] = parseList(row.value)
  }
  for (const row of rows) {
    const key = String(row.key)
    if (key.startsWith(LIST_PREFIX)) next[key.slice(LIST_PREFIX.length)] = parseList(row.value)
  }

  for (const key of Object.keys(captions)) delete captions[key]
  for (const row of rows) {
    const key = String(row.key)
    if (key.startsWith(CAPTION_PREFIX) && typeof row.value === 'string') {
      captions[key.slice(CAPTION_PREFIX.length)] = row.value
    }
  }

  for (const key of Object.keys(paths)) delete paths[key]
  for (const key of Object.keys(urls)) delete urls[key]
  for (const [tileId, list] of Object.entries(next)) setList(tileId, list)
  notifyBookingStoreChanged()
}

/** The caption shown for a tile: the admin's text if set (may be empty = hidden), otherwise the default. */
export function getGalleryCaption(tileId: string, fallback: string): string {
  if (!isSupabaseConfigured && !captionsLocalLoaded.has(tileId) && typeof window !== 'undefined') {
    captionsLocalLoaded.add(tileId)
    try {
      const raw = window.localStorage.getItem(CAPTION_LOCAL_PREFIX + tileId)
      if (raw !== null) captions[tileId] = raw
    } catch {
      // Storage unavailable: keep the default caption.
    }
  }
  return tileId in captions ? captions[tileId] : fallback
}

/** Saves a caption. Pass null to go back to the default caption; an empty string hides it. */
export async function saveGalleryCaption(tileId: string, text: string | null) {
  const value = text === null ? null : text.trim()

  if (isSupabaseConfigured) {
    const { error } = await requireSupabase().from('site_settings').upsert({
      key: CAPTION_PREFIX + tileId,
      value,
      updated_at: new Date().toISOString(),
    })
    if (error) throw error
  } else {
    try {
      if (value === null) window.localStorage.removeItem(CAPTION_LOCAL_PREFIX + tileId)
      else window.localStorage.setItem(CAPTION_LOCAL_PREFIX + tileId, value)
    } catch {
      throw new Error('Could not save the caption. Browser storage may be unavailable.')
    }
    captionsLocalLoaded.add(tileId)
  }

  if (value === null) delete captions[tileId]
  else captions[tileId] = value
  notifyBookingStoreChanged()
}

async function writeRemoteList(tileId: string, list: string[]) {
  const client = requireSupabase()
  const { error } = await client.from('site_settings').upsert({
    key: LIST_PREFIX + tileId,
    value: JSON.stringify(list),
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

function writeLocalList(tileId: string, list: string[]) {
  try {
    if (list.length) window.localStorage.setItem(LOCAL_PREFIX + tileId, JSON.stringify(list))
    else window.localStorage.removeItem(LOCAL_PREFIX + tileId)
  } catch {
    throw new Error('Could not save the photos. Browser storage may be full or unavailable.')
  }
}

function uniquePath(tileId: string) {
  const random = Math.random().toString(36).slice(2, 8)
  return `${tileId}/${Date.now()}-${random}.jpg`
}

/** Adds already-resized photos (data URLs) to the end of a tile's slideshow. */
export async function addGalleryPhotos(tileId: string, images: string[]) {
  getGalleryPhotos(tileId) // make sure local photos are loaded first
  const current = paths[tileId] ?? []
  if (current.length + images.length > MAX_PHOTOS_PER_TILE) {
    throw new Error(`Each tile can hold up to ${MAX_PHOTOS_PER_TILE} photos.`)
  }

  if (isSupabaseConfigured) {
    const client = requireSupabase()
    const uploaded: string[] = []
    try {
      for (const image of images) {
        const blob = await (await fetch(image)).blob()
        const path = uniquePath(tileId)
        const { error } = await client.storage.from(BUCKET).upload(path, blob, {
          contentType: 'image/jpeg',
          cacheControl: '31536000',
        })
        if (error) throw error
        uploaded.push(path)
      }
      const next = [...current, ...uploaded]
      await writeRemoteList(tileId, next)
      setList(tileId, next)
    } catch (error) {
      if (uploaded.length) await client.storage.from(BUCKET).remove(uploaded).catch(() => undefined)
      throw error
    }
  } else {
    const next = [...current, ...images]
    writeLocalList(tileId, next)
    setList(tileId, next)
  }
  notifyBookingStoreChanged()
}

/** Removes one photo (by its position) from a tile's slideshow. */
export async function removeGalleryPhoto(tileId: string, index: number) {
  const current = paths[tileId] ?? []
  if (index < 0 || index >= current.length) return
  const removed = current[index]
  const next = current.filter((_, i) => i !== index)

  if (isSupabaseConfigured) {
    await writeRemoteList(tileId, next)
    setList(tileId, next)
    await requireSupabase().storage.from(BUCKET).remove([removed]).catch(() => undefined)
  } else {
    writeLocalList(tileId, next)
    setList(tileId, next)
  }
  notifyBookingStoreChanged()
}

// Shrinks the chosen photo (max 1600px, JPEG) so uploads stay light and the gallery loads fast.
export function prepareGalleryImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(image.naturalWidth * scale)
      canvas.height = Math.round(image.naturalHeight * scale)
      const context = canvas.getContext('2d')
      if (!context) {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Could not process this image.'))
        return
      }
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(objectUrl)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not read this image.'))
    }
    image.src = objectUrl
  })
}
