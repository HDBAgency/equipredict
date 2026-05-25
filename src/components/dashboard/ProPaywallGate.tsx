'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lock, ArrowRight } from 'lucide-react'

interface Props {
  children: React.ReactNode
}

export function ProPaywallGate({ children }: Props) {
  const [plan, setPlan] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    async function checkAuth() {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', session.user.id)
          .single()
        setPlan(profile?.plan ?? 'free')
      } else {
        setPlan(null)
      }
    }
    checkAuth()
  }, [])

  if (plan === undefined) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-eq-green border-t-transparent animate-spin" />
      </div>
    )
  }

  if (plan === 'pro') return <>{children}</>

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(167,139,250,0.15))', borderColor: 'rgba(124,58,237,0.3)' }}>
          <Lock className="w-8 h-8" style={{ color: '#A78BFA' }} />
        </div>
        <h2 className="text-2xl font-black text-eq-text mb-3">Accès Pro requis</h2>
        <p className="text-white text-sm mb-8">
          Ce tableau de bord est exclusivement réservé aux abonnés Pro.
          Statistiques avancées, export CSV/PDF, historique 2 ans et comparaisons hippodrome/saison.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)' }}
        >
          Passer Pro
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
