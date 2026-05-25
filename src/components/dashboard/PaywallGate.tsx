'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lock, Zap, Star, Crown, Check, ArrowRight, TrendingUp } from 'lucide-react'
import type { SubscriptionPlan } from '@/types/subscription'
import { PLAN_PRICES } from '@/types/subscription'

const PLANS: {
  id: SubscriptionPlan
  name: string
  icon: React.ElementType
  price: number
  features: string[]
  popular: boolean
  color: string
}[] = [
  {
    id: 'free',
    name: 'Gratuit',
    icon: Zap,
    price: 0,
    features: ['3 courses / jour', 'Aperçu des favoris IA', 'Tableau de bord de base'],
    popular: false,
    color: 'border-eq-border bg-eq-surface',
  },
  {
    id: 'premium',
    name: 'Premium',
    icon: Star,
    price: PLAN_PRICES.premium,
    features: ['Courses illimitées', 'Prédictions IA top 3', 'Analyse 7 facteurs', 'Alertes avant départ', 'Historique complet'],
    popular: true,
    color: 'border-gradient bg-eq-card',
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Crown,
    price: PLAN_PRICES.pro,
    features: ['Tout Premium inclus', 'Statistiques avancées', 'Export CSV / PDF', 'Historique 2 ans', 'Support prioritaire'],
    popular: false,
    color: 'border-eq-border bg-eq-surface',
  },
]

interface Props {
  children: React.ReactNode
}

export function PaywallGate({ children }: Props) {
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

  // Hydration en cours — évite le flash
  if (plan === undefined) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-eq-green border-t-transparent animate-spin" />
      </div>
    )
  }

  // Connecté — accès direct
  if (plan) return <>{children}</>

  // Pas d'abonnement — paywall
  return (
    <div className="relative">

      {/* Teaser flouté du dashboard en fond */}
      <div className="pointer-events-none select-none opacity-30 blur-sm" aria-hidden>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-eq-card border border-eq-border rounded-xl p-5 h-52">
                <div className="h-3 w-20 bg-eq-border-bright rounded mb-3" />
                <div className="h-5 w-3/4 bg-eq-border-bright rounded mb-5" />
                <div className="space-y-2">
                  {[0, 1, 2].map(j => (
                    <div key={j} className="flex justify-between">
                      <div className="h-3 w-32 bg-eq-border-bright rounded" />
                      <div className="h-3 w-10 bg-eq-border-bright rounded" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overlay paywall */}
      <div className="absolute inset-0 flex items-start justify-center pt-8 px-4 pb-16 z-10"
           style={{ background: 'linear-gradient(to bottom, rgba(8,8,15,0.7) 0%, rgba(8,8,15,0.97) 25%, #08080F 55%)' }}>
        <div className="w-full max-w-4xl">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-eq-green/20 border border-eq-green/40 mb-5">
              <Lock className="w-7 h-7 text-eq-green" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-eq-text mb-3">
              Accédez aux prédictions IA
            </h2>
            <p className="text-eq-muted text-base max-w-lg mx-auto">
              Toutes les courses du jour en temps réel, analysées par notre moteur IA.
              Choisissez le plan qui vous correspond.
            </p>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {PLANS.map(({ id, name, icon: Icon, price, features, popular, color }) => (
              <div
                key={id}
                className={`relative rounded-2xl p-6 flex flex-col ${color} ${popular ? 'shadow-2xl shadow-eq-green/20' : ''}`}
              >
                {popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-eq-green rounded-full text-[11px] font-bold text-white whitespace-nowrap">
                    ⭐ Le plus populaire
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${popular ? 'bg-eq-green text-white' : 'bg-eq-card border border-eq-border text-eq-muted'}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className={`font-bold ${popular ? 'text-eq-text' : 'text-eq-muted-bright'}`}>{name}</div>
                    {price === 0
                      ? <div className="text-[11px] text-eq-muted">Gratuit pour toujours</div>
                      : <div className="text-[11px] text-eq-muted">{price}€ / mois</div>}
                  </div>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${popular ? 'text-eq-green' : 'text-eq-muted'}`} />
                      <span className={popular ? 'text-white' : 'text-white'}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={id === 'free' ? '/register' : `/register?plan=${id}`}
                  className={`block text-center font-bold py-2.5 rounded-xl text-sm transition-all ${
                    popular
                      ? 'bg-eq-green hover:bg-eq-green-light text-white hover:shadow-lg hover:shadow-eq-green/30'
                      : 'bg-eq-card border border-eq-border text-eq-text hover:border-eq-border-bright'
                  }`}
                >
                  {id === 'free' ? "Commencer gratuitement" : `Passer ${name}`}
                  {popular && <ArrowRight className="inline ml-1.5 w-3.5 h-3.5" />}
                </Link>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
            <span className="text-eq-muted">Déjà un compte ?</span>
            <Link href="/login" className="flex items-center gap-1.5 text-eq-green hover:text-eq-green-light font-semibold transition-colors">
              <TrendingUp className="w-3.5 h-3.5" />
              Se connecter
            </Link>
            <span className="hidden sm:block text-eq-border-bright">·</span>
            <span className="text-[11px] text-eq-muted">
              Paiement sécurisé · Annulation à tout moment · 18+
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
