'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        if (signInError.message.includes('Invalid login credentials') || signInError.message.includes('invalid_credentials')) {
          router.push(`/register?email=${encodeURIComponent(email)}`)
          return
        }
        throw signInError
      }
      const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user!.id).single()
      const plan = profile?.plan ?? 'free'
      if (plan === 'pro') router.push('/dashboard-pro')
      else if (plan === 'premium') router.push('/dashboard-premium')
      else router.push('/dashboard-gratuit')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-x-0 top-16 bottom-0 flex items-center justify-center px-4 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-eq-green/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md mx-auto -mt-16">

        <div className="bg-eq-card border border-eq-border rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-eq-text mb-1.5">BON RETOUR</h1>
            <p className="text-eq-muted text-sm">Connectez-vous pour accéder à vos prédictions</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-eq-muted-bright mb-1.5">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@email.com"
                className="w-full bg-eq-surface border border-eq-border rounded-xl px-4 py-3 text-sm text-eq-text placeholder-eq-muted focus:outline-none focus:border-eq-green focus:ring-1 focus:ring-eq-green/30 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-eq-muted-bright">Mot de passe</label>
                <Link href="/forgot-password" className="text-xs text-eq-green hover:text-eq-green-light transition-colors">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-eq-surface border border-eq-border rounded-xl px-4 py-3 pr-11 text-sm text-eq-text placeholder-eq-muted focus:outline-none focus:border-eq-green focus:ring-1 focus:ring-eq-green/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-eq-muted hover:text-eq-text transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-eq-red/10 border border-eq-red/25 rounded-xl px-4 py-3 text-xs text-eq-red">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-eq-green hover:bg-eq-green-light disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-eq-green/25 text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-sm text-eq-muted mt-6">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-eq-green hover:text-eq-green-light font-semibold transition-colors">
              {"S'inscrire gratuitement"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
