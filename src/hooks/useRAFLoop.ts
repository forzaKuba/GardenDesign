import { useEffect, useRef } from 'react'

export function useRAFLoop(callback: (timestamp: number) => void, active = true): void {
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    if (!active) return
    let rafId: number
    let running = true

    function loop(ts: number) {
      if (!running) return
      cbRef.current(ts)
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => {
      running = false
      cancelAnimationFrame(rafId)
    }
  }, [active])
}
