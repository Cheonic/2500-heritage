import { notifyBookingStoreChanged } from './store'
import { isSupabaseConfigured, requireSupabase } from './supabase'

const PAYMENT_QR_KEY = '2500h-payment-qr'
const PAYMENT_QR_PATH = 'payment-qr.png'

let paymentQrCode: string | null = readLocalPaymentQr()

function readLocalPaymentQr() {
  try {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(PAYMENT_QR_KEY)
  } catch {
    return null
  }
}

export function getPaymentQrCode() {
  return paymentQrCode
}

export async function loadPaymentQrCode() {
  if (!isSupabaseConfigured) return
  const client = requireSupabase()
  const { data, error } = await client
    .from('site_settings')
    .select('value')
    .eq('key', 'payment_qr_path')
    .maybeSingle()
  if (error) throw error

  const path = data?.value
  paymentQrCode = path
    ? `${client.storage.from('payment-qr').getPublicUrl(path).data.publicUrl}?v=${Date.now()}`
    : null
  notifyBookingStoreChanged()
}

export async function savePaymentQrCode(image: string | null) {
  if (isSupabaseConfigured) {
    const client = requireSupabase()
    let path: string | null = null

    if (image) {
      const response = await fetch(image)
      const file = await response.blob()
      const { data, error } = await client.storage.from('payment-qr').upload(PAYMENT_QR_PATH, file, {
        upsert: true,
        contentType: 'image/png',
        cacheControl: '3600',
      })
      if (error) throw error
      path = data.path
    } else {
      const { error } = await client.storage.from('payment-qr').remove([PAYMENT_QR_PATH])
      if (error) throw error
    }

    const { error } = await client.from('site_settings').upsert({
      key: 'payment_qr_path',
      value: path,
      updated_at: new Date().toISOString(),
    })
    if (error) throw error

    paymentQrCode = path
      ? `${client.storage.from('payment-qr').getPublicUrl(path).data.publicUrl}?v=${Date.now()}`
      : null
    notifyBookingStoreChanged()
    return
  }

  try {
    if (image) window.localStorage.setItem(PAYMENT_QR_KEY, image)
    else window.localStorage.removeItem(PAYMENT_QR_KEY)
    paymentQrCode = image
  } catch {
    throw new Error('Could not save the QR code. Browser storage may be full or unavailable.')
  }
  notifyBookingStoreChanged()
}
