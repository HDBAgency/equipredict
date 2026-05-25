'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  text1: string
  text2: string
  className?: string
}

export default function ScrollRevealInline({ text1, text2, className = '' }: Props) {
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
    <h2
      ref={ref}
      className={`text-5xl sm:text-7xl font-black uppercase flex justify-center flex-nowrap whitespace-nowrap gap-x-4 ${className}`}
      style={{ opacity: 0, animation: visible ? 'hero-reveal 0.9s cubic-bezier(.22,1,.36,1) 0s forwards' : 'none' }}
    >
      <span className="text-white">{text1}</span>
      <span style={{ background: 'linear-gradient(135deg, #064E3B, #10B981, #34D399, #6EE7B7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{text2}</span>
    </h2>
  )
}
