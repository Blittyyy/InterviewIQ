import FingerprintJS from '@fingerprintjs/fingerprintjs'

let visitorId: string | null = null

export async function getDeviceFingerprint(): Promise<string> {
  if (visitorId) {
    return visitorId
  }

  try {
    const fp = await FingerprintJS.load()
    const result = await fp.get()
    visitorId = result.visitorId
    return visitorId
  } catch (error) {
    console.error('Error getting device fingerprint:', error)
    return 'unknown'
  }
}

export function getStoredFingerprint(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('device_fingerprint')
}

export function storeFingerprint(fingerprint: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('device_fingerprint', fingerprint)
} 