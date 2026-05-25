'use client'

import { useEffect, useRef, useState } from 'react'

export default function ScrollRevealTitle() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { setVisible(entry.isIntersecting) },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="absolute left-0 right-0 text-center" style={{ top: '20px' }}>
      <h2 className="text-5xl sm:text-7xl font-black tracking-tight uppercase">
        <span
          className="block"
          style={{
            opacity: 0,
            animation: visible ? 'hero-reveal 0.9s cubic-bezier(.22,1,.36,1) 0s forwards' : 'none',
          }}
        >
          <span className="text-white">PLUS DE 50 COURSES</span>
        </span>
        <span
          className="block"
          style={{
            opacity: 0,
            animation: visible ? 'hero-reveal 0.9s cubic-bezier(.22,1,.36,1) 0.3s forwards' : 'none',
            background: 'linear-gradient(135deg, #064E3B, #10B981, #34D399, #6EE7B7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          COUVERTES PAR JOUR
        </span>
      </h2>
    </div>
  )
}
