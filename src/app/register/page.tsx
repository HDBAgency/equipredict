'use client'

import Link from 'next/link'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { TrendingUp, Eye, EyeOff, ArrowRight, Loader2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const PLAN_PERKS: Record<string, string[]> = {
  free: [
    '3 courses analysées par jour gratuitement',
    'Accès au tableau de bord complet',
    'Aperçu des favoris IA',
  ],
  premium: [
    'Courses illimitées chaque jour',
    'Prédictions IA top 3 + analyse 7 facteurs',
    'Alertes avant départ · Historique complet',
  ],
  pro: [
    'Tout Premium inclus',
    'Statistiques avancées + export CSV/PDF',
    'Historique 2 ans · Support prioritaire',
  ],
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratuit',
  premium: 'Premium',
  pro: 'Pro',
}

function RegisterForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const plan = searchParams.get('plan') ?? 'free'
  const emailFromUrl = searchParams.get('email') ?? ''

  const [name, setName] = useState('')
  const [email, setEmail] = useState(emailFromUrl)
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const perks = PLAN_PERKS[plan] ?? PLAN_PERKS.free

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, plan } }
      })
      if (signUpError) throw signUpError
      setSuccess(true)
      setTimeout(() => router.push('/pricing'), 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'inscription")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-eq-green/15 border border-eq-green/30 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-eq-green" />
          </div>
          <h1 className="text-2xl font-black text-eq-text mb-2">Compte créé !</h1>
          <p className="text-eq-muted text-sm mb-2">
            Plan <span className="text-eq-green font-semibold">{PLAN_LABELS[plan] ?? plan}</span> activé.
          </p>
          <p className="text-eq-muted text-xs mb-6">Redirection vers les tarifs…</p>
          <div className="w-5 h-5 rounded-full border-2 border-eq-green border-t-transparent animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-8 sm:py-16 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-eq-green/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md -mt-16">

        <div className="bg-eq-card border border-eq-border rounded-2xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-eq-text mb-1.5">Créer un compte</h1>
            <p className="text-eq-muted text-sm">
              {plan === 'free' ? 'Gratuit. Aucune carte requise.' : `Plan ${PLAN_LABELS[plan]} sélectionné.`}
            </p>
          </div>

          {/* Perks */}
          <div className="bg-eq-surface rounded-xl p-4 mb-6 space-y-2">
            {perks.map((p, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm">
                <div className="w-4 h-4 rounded-full bg-eq-green/15 border border-eq-green/30 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-eq-green" />
                </div>
                <span className="text-eq-muted-bright">{p}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-eq-muted-bright mb-1.5">Prénom</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Votre prénom"
                className="w-full bg-eq-surface border border-eq-border rounded-xl px-4 py-3 text-sm text-eq-text placeholder-eq-muted focus:outline-none focus:border-eq-green focus:ring-1 focus:ring-eq-green/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-eq-muted-bright mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@email.com"
                className="w-full bg-eq-surface border border-eq-border rounded-xl px-4 py-3 text-sm text-eq-text placeholder-eq-muted focus:outline-none focus:border-eq-green focus:ring-1 focus:ring-eq-green/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-eq-muted-bright mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="8 caractères minimum"
                  className="w-full bg-eq-surface border border-eq-border rounded-xl px-4 py-3 pr-11 text-sm text-eq-text placeholder-eq-muted focus:outline-none focus:border-eq-green focus:ring-1 focus:ring-eq-green/30 transition-all"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-eq-muted hover:text-eq-text">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-eq-red/10 border border-eq-red/25 rounded-xl px-4 py-3 text-xs text-eq-red">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-eq-green hover:bg-eq-green-light disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-eq-green/25 text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? 'Création du compte...' : 'Créer mon compte gratuitement'}
            </button>

            <p className="text-center text-[11px] text-eq-muted">
              En créant un compte, vous acceptez nos{' '}
              <span className="text-eq-green cursor-pointer">Conditions d&apos;utilisation</span>.
              {' '}Jeu responsable — 18+ uniquement.
            </p>
          </form>

          <p className="text-center text-sm text-eq-muted mt-5 pt-5 border-t border-eq-border">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-eq-green hover:text-eq-green-light font-semibold transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <RegisterForm />
    </Suspense>
  )
}
