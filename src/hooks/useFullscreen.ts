import { useCallback, useEffect, useState } from 'react'

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
}

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void> | void
}

function getFullscreenElement() {
  const doc = document as FullscreenDocument
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null
}

export function useFullscreen() {
  const [active, setActive] = useState(false)

  useEffect(() => {
    const sync = () => setActive(Boolean(getFullscreenElement()))
    document.addEventListener('fullscreenchange', sync)
    document.addEventListener('webkitfullscreenchange', sync)
    sync()
    return () => {
      document.removeEventListener('fullscreenchange', sync)
      document.removeEventListener('webkitfullscreenchange', sync)
    }
  }, [])

  const enter = useCallback(async (el?: HTMLElement | null) => {
    const target = (el ?? document.documentElement) as FullscreenElement
    try {
      if (target.requestFullscreen) {
        await target.requestFullscreen()
      } else if (target.webkitRequestFullscreen) {
        await target.webkitRequestFullscreen()
      }
      setActive(true)
      return true
    } catch {
      setActive(true)
      return false
    }
  }, [])

  const exit = useCallback(async () => {
    const doc = document as FullscreenDocument
    try {
      if (getFullscreenElement()) {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen()
        }
      }
    } catch {
      /* already exited */
    }
    setActive(false)
  }, [])

  return { active, enter, exit }
}
