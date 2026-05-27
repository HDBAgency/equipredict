'use client'

import { useEffect, useRef, useState } from 'react'

export default function HeroTitle() {
  const ref = useRef<HTMLHeadingElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { setVisible(entry.isIntersecting) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <h1 ref={ref} className="text-3xl sm:text-5xl lg:text-7xl font-black tracking-tight mb-4 sm:mb-6 uppercase leading-tight">
      <span
        className="block"
        style={{
          opacity: 0,
          animation: visible ? 'hero-reveal 0.9s cubic-bezier(.22,1,.36,1) 0s forwards' : 'none',
        }}
      >
        Tes prédictions hippiques
      </span>
      <span
        className="block"
        style={{
          opacity: 0,
          animation: visible ? 'hero-reveal 0.9s cubic-bezier(.22,1,.36,1) 0.4s forwards' : 'none',
          background: 'linear-gradient(135deg, #064E3B, #10B981, #34D399, #6EE7B7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        avant chaque départ.
      </span>
    </h1>
  )
}
