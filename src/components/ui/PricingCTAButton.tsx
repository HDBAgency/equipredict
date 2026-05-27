'use client'

import { useState } from 'react'

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

const btnClass = (popular: boolean, loading?: boolean) =>
  `w-full font-bold py-5 rounded-xl text-lg transition-all ${loading ? 'opacity-60 cursor-not-allowed' : ''} ${
    popular
      ? 'bg-eq-green hover:bg-eq-green-light text-white hover:shadow-lg hover:shadow-eq-green/30'
      : 'bg-eq-surface border border-eq-border text-white hover:bg-eq-green hover:border-eq-green hover:shadow-lg hover:shadow-eq-green/30'
  }`

export default function PricingCTAButton({ planId, href, label, popular }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function getSession() {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return { supabase, session }
  }

  // Plan gratuit : dashboard si connecté, sinon inscription
  async function handleFreeClick() {
    setLoading(true)
    const { session } = await getSession()
    setLoading(false)
    window.location.href = session ? '/dashboard-gratuit' : href
  }

  // Plans payants : checkout Stripe si connecté, sinon inscription
  async function handleCheckout() {
    setLoading(true)
    setError('')
    const { supabase, session } = await getSession()
    if (!session) {
      window.location.href = href
      setLoading(false)
      return
    }
    // Déjà sur ce plan → dashboard
    const { data } = await supabase.from('profiles').select('plan').eq('id', session.user.id).single()
    if ((data?.plan ?? 'free') === planId) {
      window.location.href = PLAN_DASHBOARD[planId]
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const json = await res.json()
      if (json.url) window.location.href = json.url
      else setError(json.error ?? 'Erreur lors du paiement')
    } catch {
      setError('Erreur réseau, réessayez.')
    } finally {
      setLoading(false)
    }
  }

  if (planId === 'free') {
    return (
      <button
        onClick={handleFreeClick}
        disabled={loading}
        className={btnClass(popular, loading)}
      >
        {loading ? 'Chargement...' : label}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-red-400 text-xs text-center">{error}</p>}
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={btnClass(popular, loading)}
      >
        {loading ? 'Redirection...' : label}
      </button>
    </div>
  )
}
