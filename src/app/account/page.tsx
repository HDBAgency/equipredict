import Link from 'next/link'
import { User, Crown, Zap, Star, ArrowRight, Calendar, Mail, Shield, LogOut } from 'lucide-react'
import { PLAN_FEATURES, PLAN_PRICES } from '@/types'
// TODO: Remplacer par la vraie session Supabase
// import { createClient } from '@/lib/supabase/server'
// const supabase = await createClient()
// const { data: { user } } = await supabase.auth.getUser()
// const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
// const { data: subscription } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).single()

const MOCK_USER = {
  name: 'Hugo D.',
  email: 'hugo@exemple.fr',
  plan: 'free' as 'free' | 'premium' | 'pro',
  joinedAt: '2026-01-15',
}

const PLAN_ICONS = { free: Zap, premium: Star, pro: Crown }
const PLAN_LABELS = { free: 'Gratuit', premium: 'Premium', pro: 'Pro' }
const PLAN_COLORS = {
  free:    'text-eq-muted bg-eq-surface border-eq-border',
  premium: 'text-eq-violet bg-eq-violet/15 border-eq-violet/30',
  pro:     'text-eq-amber bg-eq-amber/15 border-eq-amber/30',
}

export default function AccountPage() {
  const user = MOCK_USER
  const PlanIcon = PLAN_ICONS[user.plan]
  const features = PLAN_FEATURES[user.plan]
  const price = PLAN_PRICES[user.plan]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-black text-eq-text mb-8">Mon compte</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Profile */}
        <div className="lg:col-span-2 space-y-5">

          {/* User card */}
          <div className="bg-eq-card border border-eq-border rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-eq-violet to-eq-blue flex items-center justify-center text-white font-black text-xl">
                {user.name.charAt(0)}
              </div>
              <div>
                <h2 className="font-bold text-eq-text text-lg">{user.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${PLAN_COLORS[user.plan]}`}>
                    <PlanIcon className="w-3 h-3" />
                    {PLAN_LABELS[user.plan]}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-eq-muted shrink-0" />
                <span className="text-eq-muted-bright">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-eq-muted shrink-0" />
                <span className="text-eq-muted">Membre depuis le {new Date(user.joinedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-eq-muted shrink-0" />
                <span className="text-eq-muted">
                  {features.dailyRaceLimit === null ? 'Courses illimitées' : `${features.dailyRaceLimit} courses / jour`}
                </span>
              </div>
            </div>

            <div className="border-t border-eq-border mt-5 pt-5 flex gap-3 flex-wrap">
              <button className="text-sm font-medium text-eq-muted hover:text-eq-text transition-colors px-3 py-2 rounded-lg hover:bg-eq-surface border border-transparent hover:border-eq-border">
                Modifier le profil
              </button>
              <button className="text-sm font-medium text-eq-muted hover:text-eq-text transition-colors px-3 py-2 rounded-lg hover:bg-eq-surface border border-transparent hover:border-eq-border">
                Changer le mot de passe
              </button>
              <button className="flex items-center gap-1.5 text-sm font-medium text-eq-red/70 hover:text-eq-red transition-colors px-3 py-2 rounded-lg hover:bg-eq-red/5 border border-transparent hover:border-eq-red/20 ml-auto">
                <LogOut className="w-3.5 h-3.5" />
                Se déconnecter
              </button>
            </div>
          </div>

          {/* Usage stats */}
          <div className="bg-eq-card border border-eq-border rounded-2xl p-6">
            <h3 className="font-bold text-eq-text mb-4 flex items-center gap-2">
              Utilisation du jour
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Courses vues', value: '2', max: features.dailyRaceLimit },
                { label: 'Prédictions', value: features.predictionsAccess ? '—' : 'Non inclus', max: null },
                { label: 'Alertes', value: features.alertsEnabled ? '0 active' : 'Non inclus', max: null },
              ].map(({ label, value, max }) => (
                <div key={label} className="bg-eq-surface border border-eq-border rounded-xl p-4 text-center">
                  <div className="text-xl font-black text-eq-text">{value}</div>
                  {max !== null && (
                    <div className="text-xs text-eq-muted">/ {max}</div>
                  )}
                  <div className="text-[11px] text-eq-muted mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subscription sidebar */}
        <div className="space-y-5">
          {/* Current plan */}
          <div className="bg-eq-card border border-eq-border rounded-2xl p-6">
            <h3 className="font-bold text-eq-text mb-4">Abonnement actuel</h3>
            <div className={`flex items-center gap-3 p-3 rounded-xl border mb-4 ${PLAN_COLORS[user.plan]}`}>
              <PlanIcon className="w-5 h-5" />
              <div>
                <div className="font-bold text-sm">{PLAN_LABELS[user.plan]}</div>
                <div className="text-xs opacity-75">{price === 0 ? 'Gratuit' : `${price}€/mois`}</div>
              </div>
            </div>

            <ul className="space-y-2 mb-5">
              {[
                { label: features.dailyRaceLimit === null ? 'Courses illimitées' : `${features.dailyRaceLimit} courses/jour`, ok: true },
                { label: 'Prédictions complètes', ok: features.predictionsAccess },
                { label: 'Statistiques avancées', ok: features.advancedStats },
                { label: 'Alertes de course', ok: features.alertsEnabled },
                { label: 'Export des données', ok: features.exportEnabled },
              ].map(({ label, ok }) => (
                <li key={label} className={`flex items-center gap-2 text-xs ${ok ? 'text-eq-muted-bright' : 'text-eq-border-bright line-through'}`}>
                  <span className={`w-3 h-3 rounded-full flex items-center justify-center ${ok ? 'bg-eq-green/20 text-eq-green' : 'bg-eq-border'}`}>
                    {ok && <span className="text-[8px]">✓</span>}
                  </span>
                  {label}
                </li>
              ))}
            </ul>

            {user.plan !== 'pro' && (
              <Link
                href="/pricing"
                className="flex items-center justify-center gap-2 bg-eq-violet hover:bg-eq-violet-light text-white font-bold py-3 rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-eq-violet/25"
              >
                <Crown className="w-4 h-4" />
                Passer Premium
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* Security */}
          <div className="bg-eq-card border border-eq-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-eq-muted" />
              <h3 className="font-bold text-eq-text text-sm">Sécurité</h3>
            </div>
            <p className="text-xs text-eq-muted leading-relaxed">
              Jouez de manière responsable. 18+ uniquement.
              Si le jeu vous pose problème : <span className="text-eq-amber font-semibold">09 74 75 13 13</span> (Joueurs Info Service, gratuit).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
