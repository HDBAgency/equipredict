'use client'

import React, { useEffect, useRef, useState } from 'react'

interface Props {
  line1: string
  line2: string
  className?: string
  style?: React.CSSProperties
}

export default function ScrollRevealHeading({ line1, line2, className = '', style }: Props) {
  const ref = useRef<HTMLHeadingElement>(null)
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
    <h2 ref={ref} className={`text-5xl sm:text-7xl font-black text-center mb-6 uppercase ${className}`} style={style}>
      <span
        className="block"
        style={{
          opacity: 0,
          animation: visible ? 'hero-reveal 0.9s cubic-bezier(.22,1,.36,1) 0s forwards' : 'none',
        }}
      >
        <span className="text-white">{line1}</span>
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
        {line2}
      </span>
    </h2>
  )
}
