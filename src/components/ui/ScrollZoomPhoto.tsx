'use client'

import { useEffect, useRef } from 'react'

interface Props {
  src: string
  overlay?: boolean
}

export function ScrollZoomPhoto({ src, overlay = true }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    function onScroll() {
      const section = sectionRef.current
      const img = imgRef.current
      if (!section || !img) return

      const rect = section.getBoundingClientRect()
      const viewH = window.innerHeight

      // progress: 0 quand le haut de la section arrive en bas de l'écran
      //           1 quand le bas de la section quitte le haut de l'écran
      const progress = 1 - (rect.top + rect.height) / (viewH + rect.height)
      const clamped = Math.max(0, Math.min(1, progress))

      // zoom : 1 → 1.35 au milieu → 1 à la fin
      const peak = Math.sin(clamped * Math.PI) // 0 → 1 → 0
      const scale = 1 + peak * 0.35

      img.style.transform = `translateX(-50%) scale(${scale})`
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section ref={sectionRef} className="relative overflow-hidden" style={{ height: '1080px' }}>
      <img
        ref={imgRef}
        src={src}
        alt=""
        style={{
          width: '1920px',
          height: '1080px',
          maxWidth: 'none',
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%) scale(1)',
          transformOrigin: 'center center',
          transition: 'transform 0.05s linear',
        }}
      />
      {overlay && <div className="absolute inset-0 bg-black/60" />}
    </section>
  )
}
