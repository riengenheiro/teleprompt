import { useCallback, useEffect, useRef } from 'react'

export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null)

  const release = useCallback(async () => {
    try {
      await lockRef.current?.release()
    } catch {
      /* ignore */
    }
    lockRef.current = null
  }, [])

  const request = useCallback(async () => {
    if (!('wakeLock' in navigator)) return
    try {
      lockRef.current = await navigator.wakeLock.request('screen')
      lockRef.current.addEventListener('release', () => {
        lockRef.current = null
      })
    } catch {
      /* permission / visibility */
    }
  }, [])

  useEffect(() => {
    if (!active) {
      void release()
      return
    }

    void request()

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && active) {
        void request()
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      void release()
    }
  }, [active, request, release])
}
