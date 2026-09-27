import { notifyBookingStoreChanged } from './store'

const PAYMENT_QR_KEY = '2500h-payment-qr'

export function getPaymentQrCode() {
  try {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(PAYMENT_QR_KEY)
  } catch {
    return null
  }
}

export function savePaymentQrCode(image: string | null) {
  try {
    if (image) window.localStorage.setItem(PAYMENT_QR_KEY, image)
    else window.localStorage.removeItem(PAYMENT_QR_KEY)
  } catch {
    throw new Error('Could not save the QR code. Browser storage may be full or unavailable.')
  }
  notifyBookingStoreChanged()
}
