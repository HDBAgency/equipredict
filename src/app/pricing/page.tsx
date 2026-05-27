import Link from 'next/link'
import { Check, X, Zap, Star, Crown } from 'lucide-react'
import { PLAN_FEATURES, PLAN_PRICES } from '@/types'
import PricingCTAButton from '@/components/ui/PricingCTAButton'

const PLANS = [
  {
    id: 'free' as const,
    name: 'Gratuit',
    icon: Zap,
    description: 'Découvrez EquiPredict sans engagement.',
    cta: 'COMMENCER GRATUITEMENT',
    href: '/register',
    popular: false,
  },
  {
    id: 'premium' as const,
    name: 'Premium',
    icon: Star,
    description: 'Accès complet aux prédictions IA pour les passionnés.',
    cta: 'PASSER PREMIUM',
    href: '/register?plan=premium',
    popular: true,
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    icon: Crown,
    description: 'Statistiques avancées et export pour les professionnels.',
    cta: 'PASSER PRO',
    href: '/register?plan=pro',
    popular: false,
  },
]

const FEATURE_ROWS = [
  { label: 'Courses accessibles / jour', key: 'dailyRaceLimit' as const, format: (v: number | null | boolean) => v === null ? 'Illimitées' : v === false ? '—' : `${v} courses` },
  { label: 'Prédictions IA top 3', key: 'predictionsAccess' as const, format: (v: number | null | boolean) => v ? '✓' : '✗' },
  { label: 'Historique des données', key: 'historicalData' as const, format: (v: number | null | boolean) => v ? '✓' : '✗' },
  { label: 'Alertes de course', key: 'alertsEnabled' as const, format: (v: number | null | boolean) => v ? '✓' : '✗' },
  { label: 'Statistiques avancées', key: 'advancedStats' as const, format: (v: number | null | boolean) => v ? '✓' : '✗' },
  { label: 'Export des données', key: 'exportEnabled' as const, format: (v: number | null | boolean) => v ? '✓' : '✗' },
]

const PLAN_HIGHLIGHTS: Record<string, string[]> = {
  free: [
    '3 courses accessibles par jour',
    'Données de base sur les partants',
    'Aperçu des favoris IA',
  ],
  premium: [
    'Accès illimité à toutes les courses',
    'Prédictions IA complètes (top 3)',
    'Niveau de confiance et probabilités',
    'Analyse des 7 facteurs clés',
    'Historique des performances',
    'Alertes avant le départ',
  ],
  pro: [
    'Tout Premium inclus',
    'Statistiques avancées et tendances',
    'Historique complet 2 ans',
    'Export CSV / PDF',
    'Comparaisons hippodrome / saison',
    'Support prioritaire',
  ],
}

export default function PricingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-10">

      {/* Header */}
      <div className="text-center mb-14">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black mb-4 leading-tight">
          CHOISISSEZ VOTRE <span style={{ background: 'linear-gradient(135deg, #064E3B, #10B981, #34D399, #6EE7B7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>NIVEAU</span>
        </h1>
        <p className="text-white text-lg max-w-xl mx-auto">
          Commencez gratuitement. Passez Premium quand vous êtes prêt.
          Aucun engagement, annulation à tout moment.
        </p>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8 md:gap-10 mb-16 sm:mb-20">
        {PLANS.map(({ id, name, icon: Icon, description, cta, href, popular }) => {
          const features = PLAN_HIGHLIGHTS[id]
          const price = PLAN_PRICES[id]

          return (
            <div
              key={id}
              className={`relative rounded-3xl flex flex-col ${
                popular
                  ? 'border-gradient bg-eq-card shadow-2xl shadow-eq-green/15 scale-105'
                  : 'border border-eq-border bg-eq-card'
              }`}
              style={{ padding: 'clamp(16px, 3vw, 24px)', minHeight: 'auto' }}
            >
              {popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-eq-green rounded-full text-sm font-bold text-white whitespace-nowrap">
                  ⭐ Le plus populaire
                </div>
              )}

              <div className="flex items-center gap-3 sm:gap-5 mb-6 sm:mb-8">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                  popular ? 'bg-eq-green text-white' : 'bg-eq-surface border border-eq-border text-eq-muted'
                }`}>
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-eq-text uppercase">{name}</div>
                  <div className="text-xs sm:text-sm text-white mt-1">{description}</div>
                </div>
              </div>

              <div className="mb-6 sm:mb-10">
                {price === 0 ? (
                  <div className="text-4xl sm:text-6xl font-black text-eq-text uppercase">Gratuit</div>
                ) : (
                  <div className="flex items-end gap-2">
                    <span className="text-4xl sm:text-6xl font-black text-eq-text">{price}€</span>
                    <span className="text-white mb-2 sm:mb-3 text-base sm:text-lg">/mois</span>
                  </div>
                )}
              </div>

              <ul className="space-y-3 sm:space-y-5 mb-8 sm:mb-12 flex-1">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-base">
                    <Check className="w-5 h-5 text-eq-green shrink-0 mt-0.5" />
                    <span className="text-white">{f}</span>
                  </li>
                ))}
              </ul>

              <PricingCTAButton planId={id} href={href} label={cta} popular={popular} />
            </div>
          )
        })}
      </div>

      {/* Feature comparison table */}
      <div className="bg-eq-card border border-eq-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-eq-border">
          <h2 className="font-bold text-white">Comparaison détaillée</h2>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-eq-border">
                <th className="text-left px-6 py-4 text-white font-medium w-1/2">Fonctionnalité</th>
                {PLANS.map(({ name, popular }) => (
                  <th key={name} className={`text-center px-4 py-4 font-bold ${popular ? 'text-eq-green-light' : 'text-white'}`}>
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURE_ROWS.map(({ label, key, format }, i) => (
                <tr key={key} className={`border-b border-eq-border/50 ${i % 2 === 0 ? '' : 'bg-eq-surface/30'}`}>
                  <td className="px-6 py-3.5 text-white">{label}</td>
                  {PLANS.map(({ id }) => {
                    const val = PLAN_FEATURES[id][key]
                    const formatted = format(val)
                    const isCheck = formatted === '✓'
                    const isCross = formatted === '✗'
                    return (
                      <td key={id} className="px-4 py-3.5 text-center">
                        {isCheck ? <Check className="w-4 h-4 text-eq-green mx-auto" /> :
                         isCross ? <X className="w-4 h-4 text-white mx-auto" /> :
                         <span className="font-semibold text-white">{formatted}</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile layout — une ligne par fonctionnalité, 3 valeurs en dessous */}
        <div className="sm:hidden divide-y divide-eq-border/50">
          {/* En-têtes plans */}
          <div className="grid grid-cols-3 px-4 py-3 border-b border-eq-border">
            {PLANS.map(({ name, popular }) => (
              <div key={name} className={`text-center text-xs font-bold ${popular ? 'text-eq-green' : 'text-white'}`}>
                {name}
              </div>
            ))}
          </div>
          {FEATURE_ROWS.map(({ label, key, format }, i) => (
            <div key={key} className={`px-4 py-3 ${i % 2 !== 0 ? 'bg-eq-surface/30' : ''}`}>
              <p className="text-xs text-white/60 mb-2">{label}</p>
              <div className="grid grid-cols-3 gap-2">
                {PLANS.map(({ id }) => {
                  const val = PLAN_FEATURES[id][key]
                  const formatted = format(val)
                  const isCheck = formatted === '✓'
                  const isCross = formatted === '✗'
                  return (
                    <div key={id} className="flex justify-center">
                      {isCheck ? <Check className="w-4 h-4 text-eq-green" /> :
                       isCross ? <X className="w-4 h-4 text-white/40" /> :
                       <span className="text-xs font-semibold text-white text-center">{formatted}</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ / Bottom note */}
      <p className="text-center text-xs text-white font-bold mt-10">
        Paiement sécurisé. Annulation à tout moment. Aucune carte requise pour le plan gratuit.
        {' '}Prédictions informatives uniquement. Jouez responsable — 18+
      </p>
    </div>
  )
}
