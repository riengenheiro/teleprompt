import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

type Options = {
  speedPxPerSec: number
  enabled: boolean
  containerRef: RefObject<HTMLElement | null>
}

const DEFAULT_REWIND_PX = 200

export function useTeleprompterScroll({
  speedPxPerSec,
  enabled,
  containerRef,
}: Options) {
  const [finished, setFinished] = useState(false)
  const offsetRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef<number | null>(null)

  const reset = useCallback(() => {
    offsetRef.current = 0
    setFinished(false)
    lastTsRef.current = null
    if (containerRef.current) {
      containerRef.current.scrollTop = 0
    }
  }, [containerRef])

  const rewind = useCallback(
    (pixels = DEFAULT_REWIND_PX) => {
      const el = containerRef.current
      const next = Math.max(0, offsetRef.current - pixels)
      offsetRef.current = next
      setFinished(false)
      lastTsRef.current = null
      if (el) el.scrollTop = next
    },
    [containerRef],
  )

  useEffect(() => {
    if (!enabled) {
      lastTsRef.current = null
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    setFinished(false)

    const tick = (ts: number) => {
      const el = containerRef.current
      if (!el) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      if (lastTsRef.current == null) {
        lastTsRef.current = ts
      }

      const dt = (ts - lastTsRef.current) / 1000
      lastTsRef.current = ts

      const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight)
      const next = Math.min(maxScroll, offsetRef.current + speedPxPerSec * dt)
      offsetRef.current = next
      el.scrollTop = next

      if (next >= maxScroll && maxScroll > 0) {
        setFinished(true)
        rafRef.current = null
        return
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      lastTsRef.current = null
    }
  }, [enabled, speedPxPerSec, containerRef])

  return { finished, reset, rewind }
}
