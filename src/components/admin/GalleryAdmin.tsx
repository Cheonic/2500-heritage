import { useState, type ChangeEvent } from 'react'
import { galleryTiles } from '../../data/gallery'
import {
  MAX_PHOTOS_PER_TILE,
  addGalleryPhotos,
  getGalleryCaption,
  getGalleryPhotos,
  prepareGalleryImage,
  removeGalleryPhoto,
  saveGalleryCaption,
} from '../../data/galleryImages'
import { useBookingStoreVersion } from '../../data/store'
import GalleryTilePattern from '../ui/GalleryTilePattern'

const MAX_CAPTION_LENGTH = 120

function CaptionEditor({ tileId, defaultCaption }: { tileId: string; defaultCaption: string }) {
  const stored = getGalleryCaption(tileId, defaultCaption)
  const [draft, setDraft] = useState<string | null>(null) // null = untouched, shows the saved caption
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  const value = draft ?? stored
  const dirty = draft !== null && draft.trim() !== stored
  const isDefault = stored === defaultCaption

  async function save(next: string | null, doneText: string) {
    setSaving(true)
    setNote(null)
    try {
      await saveGalleryCaption(tileId, next)
      setDraft(null)
      setNote({ tone: 'ok', text: doneText })
    } catch (error) {
      setNote({ tone: 'error', text: error instanceof Error ? error.message : 'Could not save the caption.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <label className="block text-[0.7rem] font-semibold uppercase tracking-wide text-ink/45" htmlFor={`caption-${tileId}`}>
        Caption
      </label>
      <textarea
        id={`caption-${tileId}`}
        rows={2}
        maxLength={MAX_CAPTION_LENGTH}
        value={value}
        disabled={saving}
        onChange={(event) => {
          setDraft(event.target.value)
          setNote(null)
        }}
        placeholder="No caption (hidden on the website)"
        className="mt-1 w-full resize-none rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs leading-snug text-ink outline-none transition-all duration-200 focus:border-citrus focus:ring-4 focus:ring-citrus/15"
      />
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={() => void save(draft ?? '', draft?.trim() ? 'Caption saved.' : 'Caption hidden.')}
          className="rounded-full bg-court px-3 py-1.5 text-xs font-semibold text-sand transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save caption'}
        </button>
        {!isDefault && (
          <button
            type="button"
            disabled={saving}
            onClick={() => void save(null, 'Caption reset to the original.')}
            className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-sand-dim disabled:opacity-60"
          >
            Reset to original
          </button>
        )}
        <span className="ml-auto text-[0.65rem] text-ink/40">
          {value.length}/{MAX_CAPTION_LENGTH}
        </span>
      </div>
      {note && (
        <p role={note.tone === 'error' ? 'alert' : 'status'} className={`mt-1 text-xs font-medium ${note.tone === 'error' ? 'text-tide' : 'text-court'}`}>
          {note.text}
        </p>
      )}
    </div>
  )
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_FILE_MB = 3
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024

export default function GalleryAdmin() {
  useBookingStoreVersion() // re-render whenever photos are added or removed
  const [busyId, setBusyId] = useState<string | null>(null)
  const [progress, setProgress] = useState('')
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  async function handleFiles(tileId: string, event: ChangeEvent<HTMLInputElement>) {
    const input = event.target
    const files = Array.from(input.files ?? [])
    input.value = ''
    if (!files.length) return

    setMessage(null)
    const existing = getGalleryPhotos(tileId).length
    const room = MAX_PHOTOS_PER_TILE - existing
    if (room <= 0) {
      setMessage({ tone: 'error', text: `This tile already has the maximum of ${MAX_PHOTOS_PER_TILE} photos. Remove one first.` })
      return
    }

    const wrongType = files.filter((file) => !ACCEPTED_TYPES.includes(file.type))
    const tooBig = files.filter((file) => ACCEPTED_TYPES.includes(file.type) && file.size > MAX_FILE_BYTES)
    const valid = files.filter((file) => ACCEPTED_TYPES.includes(file.type) && file.size <= MAX_FILE_BYTES)
    const chosen = valid.slice(0, room)
    const overLimit = valid.length - chosen.length

    const sizeError = tooBig.length
      ? `File too large: ${tooBig
          .map((file) => `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`)
          .join(', ')}. Each photo must be ${MAX_FILE_MB} MB or smaller.`
      : ''
    const typeError = wrongType.length
      ? `${wrongType.length} file${wrongType.length > 1 ? 's' : ''} skipped: only PNG, JPG, or WEBP images are allowed.`
      : ''

    if (!chosen.length) {
      setMessage({
        tone: 'error',
        text: [sizeError, typeError].filter(Boolean).join(' ') || `Choose PNG, JPG, or WEBP images up to ${MAX_FILE_MB} MB.`,
      })
      return
    }

    setBusyId(tileId)
    try {
      const prepared: string[] = []
      for (let i = 0; i < chosen.length; i += 1) {
        setProgress(`Preparing photo ${i + 1} of ${chosen.length}…`)
        prepared.push(await prepareGalleryImage(chosen[i]))
      }
      setProgress(`Uploading ${prepared.length} photo${prepared.length > 1 ? 's' : ''}…`)
      await addGalleryPhotos(tileId, prepared)

      const notes: string[] = []
      if (sizeError) notes.push(sizeError)
      if (typeError) notes.push(typeError)
      if (overLimit) notes.push(`${overLimit} not added (limit of ${MAX_PHOTOS_PER_TILE} per tile).`)
      setMessage({
        tone: sizeError ? 'error' : 'ok',
        text: `${prepared.length} photo${prepared.length > 1 ? 's' : ''} added.${notes.length ? ` ${notes.join(' ')}` : ''}`,
      })
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'Could not save these photos.' })
    } finally {
      setBusyId(null)
      setProgress('')
    }
  }

  async function handleRemove(tileId: string, index: number) {
    setMessage(null)
    setBusyId(tileId)
    try {
      await removeGalleryPhoto(tileId, index)
      setMessage({ tone: 'ok', text: 'Photo removed.' })
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'Could not remove this photo.' })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="rounded-card border border-ink/10 bg-sand p-5 shadow-xl shadow-ink/5 sm:p-6">
      <div>
        <h2 className="font-display text-base font-semibold text-ink">Gallery photos</h2>
        <p className="mt-1 text-sm text-ink/60">
          Add as many photos as you like to each thumbnail in the “Then and soon” section (up to {MAX_PHOTOS_PER_TILE} each), and edit the caption shown on it.
          Tiles with more than one photo play as a slideshow on the website. Tiles without a photo keep their default design.
        </p>
      </div>

      {message && (
        <p
          role={message.tone === 'error' ? 'alert' : 'status'}
          className={`mt-4 text-sm font-medium ${message.tone === 'error' ? 'text-tide' : 'text-court'}`}
        >
          {message.text}
        </p>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {galleryTiles.map((tile) => {
          const photos = getGalleryPhotos(tile.id)
          const busy = busyId === tile.id
          const full = photos.length >= MAX_PHOTOS_PER_TILE
          return (
            <div key={tile.id} className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
              <div className="aspect-[1.05] w-full bg-ink">
                {photos.length ? (
                  <img src={photos[0]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <GalleryTilePattern tile={tile} className="h-full w-full" />
                )}
              </div>

              <div className="p-3">
                <CaptionEditor tileId={tile.id} defaultCaption={tile.caption} />
                <p className="mt-3 text-[0.7rem] font-semibold uppercase tracking-wide text-ink/45">
                  {photos.length} photo{photos.length === 1 ? '' : 's'}
                  {photos.length > 1 ? ' · slideshow' : ''}
                </p>

                {photos.length > 0 && (
                  <ul className="mt-3 grid grid-cols-4 gap-1.5">
                    {photos.map((photo, index) => (
                      <li key={index} className="relative aspect-square overflow-hidden rounded-lg bg-ink">
                        <img src={photo} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleRemove(tile.id, index)}
                          aria-label={`Remove photo ${index + 1}`}
                          className="absolute right-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink/80 text-sm leading-none text-sand transition-colors hover:bg-tide disabled:opacity-60"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label
                    className={`inline-flex cursor-pointer items-center rounded-full bg-citrus px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-citrus-dim ${
                      busy || full ? 'pointer-events-none opacity-60' : ''
                    }`}
                  >
                    {busy ? 'Working…' : full ? 'Limit reached' : photos.length ? 'Add more photos' : 'Add photos'}
                    <input
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      disabled={busy || full}
                      onChange={(event) => void handleFiles(tile.id, event)}
                    />
                  </label>
                  {busy && progress && <span className="text-xs text-ink/55">{progress}</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-4 text-xs text-ink/50">
        PNG, JPG, or WEBP · up to {MAX_FILE_MB} MB each. You can select several files at once. Photos are resized automatically.
      </p>
    </section>
  )
}
