const STORAGE_KEY = 'teleprompter-prefs-v1'

export type StoredPrefs = {
  script: string
  speed: number
  fontSize: number
  mirrored: boolean
}

export function loadPrefs(): Partial<StoredPrefs> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Partial<StoredPrefs>
    return data && typeof data === 'object' ? data : null
  } catch {
    return null
  }
}

export function savePrefs(prefs: StoredPrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    /* quota / private mode */
  }
}
