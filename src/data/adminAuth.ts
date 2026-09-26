// There's no backend yet, so this is a simple client-side passcode gate —
// good enough to keep casual visitors out of /admin, but NOT real security
// (anyone who reads the bundled JS can see this value). Change it before
// launch, and swap this for real authentication once there's a backend.
export const ADMIN_PASSCODE = '2500heritage'

const UNLOCK_KEY = '2500h-admin-unlocked'

export function isAdminUnlocked() {
  try {
    return sessionStorage.getItem(UNLOCK_KEY) === '1'
  } catch {
    return false
  }
}

export function tryUnlockAdmin(passcode: string) {
  const ok = passcode === ADMIN_PASSCODE
  if (ok) {
    try {
      sessionStorage.setItem(UNLOCK_KEY, '1')
    } catch {
      // sessionStorage unavailable — unlock still works for this render, just won't persist
    }
  }
  return ok
}

export function lockAdmin() {
  try {
    sessionStorage.removeItem(UNLOCK_KEY)
  } catch {
    // ignore
  }
}
