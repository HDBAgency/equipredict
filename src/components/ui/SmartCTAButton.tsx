'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'

export default function SmartCTAButton() {
  const [href] = useState('/pricing')

  return (
    <Link
      href={href}
      className="flex items-center gap-2 text-white font-bold px-8 py-4 rounded-xl transition-all hover:shadow-2xl hover:-translate-y-0.5 text-base"
      style={{ background: 'linear-gradient(135deg, #064E3B, #10B981, #34D399, #6EE7B7)' }}
    >
      VOIR LES PRONOSTICS DU JOUR
      <ArrowRight className="w-5 h-5" />
    </Link>
  )
}
