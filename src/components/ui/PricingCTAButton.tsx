'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Props {
  planId: string
  href: string
  label: string
  popular: boolean
}

const PLAN_DASHBOARD: Record<string, string> = {
  free:    '/dashboard-gratuit',
  premium: '/dashboard-premium',
  pro:     '/dashboard-pro',
}

export default function PricingCTAButton({ planId, href, label, popular }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userPlan, setUserPlan] = useState<string | null>(null)

  useEffect(() => {
    async function check() {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setIsLoggedIn(true)
      const { data } = await supabase.from('profiles').select('plan').eq('id', session.user.id).single()
      setUserPlan(data?.plan ?? 'free')
    }
    check()
  }, [])

  // Plan gratuit → inscription
  if (planId === 'free') {
    return (
      <Link
        href={isLoggedIn ? '/dashboard-gratuit' : href}
        className={`block text-center font-bold py-5 rounded-xl text-lg transition-all ${
          popular
            ? 'bg-eq-green hover:bg-eq-green-light text-white hover:shadow-lg hover:shadow-eq-green/30'
            : 'bg-eq-surface border border-eq-border text-white hover:bg-eq-green hover:border-eq-green hover:shadow-lg hover:shadow-eq-green/30'
        }`}
      >
        {label}
      </Link>
    )
  }

  // Utilisateur déjà sur ce plan → aller au dashboard
  if (isLoggedIn && userPlan === planId) {
    return (
      <Link
        href={PLAN_DASHBOARD[planId]}
        className={`block text-center font-bold py-5 rounded-xl text-lg transition-all ${
          popular
            ? 'bg-eq-green hover:bg-eq-green-light text-white hover:shadow-lg hover:shadow-eq-green/30'
            : 'bg-eq-surface border border-eq-border text-white hover:bg-eq-green hover:border-eq-green hover:shadow-lg hover:shadow-eq-green/30'
        }`}
      >
        Accéder au dashboard
      </Link>
    )
  }

  // Paiement Stripe
  async function handleCheckout() {
    if (!isLoggedIn) {
      window.location.href = href
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setError(data.error ?? 'Erreur lors du paiement')
    } catch {
      setError('Erreur réseau, réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-red-400 text-xs text-center">{error}</p>}
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`w-full font-bold py-5 rounded-xl text-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
          popular
            ? 'bg-eq-green hover:bg-eq-green-light text-white hover:shadow-lg hover:shadow-eq-green/30'
            : 'bg-eq-surface border border-eq-border text-white hover:bg-eq-green hover:border-eq-green hover:shadow-lg hover:shadow-eq-green/30'
        }`}
      >
        {loading ? 'Redirection...' : label}
      </button>
    </div>
  )
}
