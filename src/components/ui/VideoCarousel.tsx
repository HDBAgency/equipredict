'use client'

import { useRef, useEffect } from 'react'

const SPEED = 32 // secondes pour un tour complet

export default function VideoCarousel({ videos }: { videos: string[] }) {
  const ringRef = useRef<HTMLDivElement>(null)
  const angle = useRef(0)
  const isDragging = useRef(false)
  const lastX = useRef(0)
  const lastTime = useRef<number | null>(null)
  const rafId = useRef<number>(0)

  useEffect(() => {
    const tick = (now: number) => {
      if (!isDragging.current) {
        if (lastTime.current !== null) {
          angle.current += ((now - lastTime.current) / 1000 / SPEED) * 360
        }
        lastTime.current = now
      } else {
        lastTime.current = null
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `rotateY(${angle.current}deg)`
      }
      rafId.current = requestAnimationFrame(tick)
    }
    rafId.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId.current)
  }, [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      angle.current += (e.clientX - lastX.current) * 0.3
      lastX.current = e.clientX
    }
    const onMouseUp = () => { isDragging.current = false }
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return
      angle.current += (e.touches[0].clientX - lastX.current) * 0.3
      lastX.current = e.touches[0].clientX
    }
    const onTouchEnd = () => { isDragging.current = false }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('touchmove', onTouchMove)
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  const n = videos.length

  return (
    <div className="video-carousel-scene" style={{ cursor: 'grab' }}>
      <div
        ref={ringRef}
        className="video-carousel-ring-js"
        style={{ '--n': n } as React.CSSProperties}
        onMouseDown={(e) => { isDragging.current = true; lastX.current = e.clientX }}
        onTouchStart={(e) => { isDragging.current = true; lastX.current = e.touches[0].clientX }}
      >
        {videos.map((src, i) => (
          <div key={i} className="video-carousel-card" style={{ '--i': i, '--n': n } as React.CSSProperties}>
            <video src={src} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
