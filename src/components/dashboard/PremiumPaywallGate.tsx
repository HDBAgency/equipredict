'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lock, ArrowRight, TrendingUp } from 'lucide-react'

interface Props {
  children: React.ReactNode
}

export function PremiumPaywallGate({ children }: Props) {
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

  if (plan === 'premium' || plan === 'pro') return <>{children}</>

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-eq-green/10 border border-eq-green/20 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-eq-green" />
        </div>
        <h2 className="text-2xl font-black text-eq-text mb-3">Accès Premium requis</h2>
        <p className="text-white text-sm mb-8">
          Ce tableau de bord est réservé aux abonnés Premium et Pro.
          Accédez à toutes les courses, prédictions IA complètes et analyse des 7 facteurs.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/pricing"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:shadow-lg hover:shadow-eq-green/25"
            style={{ background: 'linear-gradient(135deg, #064E3B, #10B981)' }}
          >
            Voir les offres
            <ArrowRight className="w-4 h-4" />
          </Link>
          {plan === null && (
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white border border-eq-border hover:border-eq-border-bright transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              Se connecter
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
