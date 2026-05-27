'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SmartCTAButton({ label = 'VOIR LES PRONOSTICS DU JOUR' }: { label?: string }) {
  const [href, setHref] = useState('/pricing')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return
      const { data: profile } = await supabase.from('profiles').select('plan').eq('id', data.session.user.id).single()
      const plan = profile?.plan ?? 'free'
      if (plan === 'pro') setHref('/dashboard-pro')
      else if (plan === 'premium') setHref('/dashboard-premium')
      else setHref('/dashboard-gratuit')
    })
  }, [])

  return (
    <Link
      href={href}
      className="flex items-center gap-2 text-white font-bold px-8 py-4 rounded-xl transition-all hover:shadow-2xl hover:-translate-y-0.5 text-base"
      style={{ background: 'linear-gradient(135deg, #064E3B, #10B981, #34D399, #6EE7B7)' }}
    >
      {label}
      <ArrowRight className="w-5 h-5" />
    </Link>
  )
}
