'use client'

import Link from 'next/link'
import { useState } from 'react'
import { TrendingUp, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
// TODO: remplacer par supabase.auth.signInWithPassword
// import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      // TODO: const supabase = createClient()
      // const { error } = await supabase.auth.signInWithPassword({ email, password })
      // if (error) throw error
      // router.push('/dashboard')
      await new Promise(r => setTimeout(r, 1000)) // Simulation
      console.log('Login:', { email })
      setError("Supabase non configuré — connectez votre projet dans .env.local")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-eq-violet/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-eq-violet flex items-center justify-center glow-violet">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black">Equi<span className="text-gradient">Predict</span></span>
          </Link>
        </div>

        <div className="bg-eq-card border border-eq-border rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-eq-text mb-1.5">Bon retour</h1>
            <p className="text-eq-muted text-sm">Connectez-vous pour accéder à vos prédictions</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-eq-muted-bright mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@email.com"
                className="w-full bg-eq-surface border border-eq-border rounded-xl px-4 py-3 text-sm text-eq-text placeholder-eq-muted focus:outline-none focus:border-eq-violet focus:ring-1 focus:ring-eq-violet/30 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-eq-muted-bright">Mot de passe</label>
                <Link href="/forgot-password" className="text-xs text-eq-violet hover:text-eq-violet-light transition-colors">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-eq-surface border border-eq-border rounded-xl px-4 py-3 pr-11 text-sm text-eq-text placeholder-eq-muted focus:outline-none focus:border-eq-violet focus:ring-1 focus:ring-eq-violet/30 transition-all"
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
              className="w-full flex items-center justify-center gap-2 bg-eq-violet hover:bg-eq-violet-light disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-eq-violet/25 text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-sm text-eq-muted mt-6">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-eq-violet hover:text-eq-violet-light font-semibold transition-colors">
              {"S'inscrire gratuitement"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
