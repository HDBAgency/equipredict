import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Clock, Users, Trophy,
  TrendingUp, TrendingDown, Minus, Brain, AlertTriangle, CheckCircle,
  Star, Zap,
} from 'lucide-react'
import { fetchRaceDetail } from '@/lib/race-detail'
import { ProPaywallGate } from '@/components/dashboard/ProPaywallGate'
import type { DetailedEntry, HorseFactorScores } from '@/types/prediction'

function formatTime(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).format(new Date(iso))
}

function formatPrize(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M€`
  if (n >= 1_000) return `${Math.round(n / 1_000)} 000 €`
  return n > 0 ? `${n} €` : '—'
}

const RACE_TYPE_COLORS: Record<string, string> = {
  plat:         'bg-eq-blue/15   text-eq-blue   border-eq-blue/30',
  trot:         'bg-eq-green/15 text-eq-green border-eq-green/30',
  obstacle:     'bg-eq-amber/15  text-eq-amber  border-eq-amber/30',
  steeplechase: 'bg-eq-red/15    text-eq-red    border-eq-red/30',
}

const FACTOR_LABELS: Record<keyof Omit<HorseFactorScores, 'weighted'>, string> = {
  recentForm:         'Forme récente',
  distanceFit:        'Compatibilité distance',
  trackConditionFit:  'Terrain',
  jockeyPerformance:  'Jockey',
  trainerPerformance: 'Entraîneur',
  oddsMovement:       'Signal marché (cotes)',
  careerConsistency:  'Régularité carrière',
}

const FACTOR_WEIGHTS: Record<keyof Omit<HorseFactorScores, 'weighted'>, number> = {
  recentForm:         30,
  distanceFit:        20,
  trackConditionFit:  15,
  jockeyPerformance:  10,
  trainerPerformance: 10,
  oddsMovement:       10,
  careerConsistency:   5,
}

function ScoreBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct = Math.round((value / max) * 100)
  const color = pct >= 70 ? 'bg-eq-green' : pct >= 45 ? 'bg-eq-amber' : 'bg-eq-red'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-eq-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-white w-8 text-right">{value.toFixed(1)}</span>
    </div>
  )
}

function FormBadge({ pos }: { pos: number }) {
  if (pos === 0)   return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold bg-eq-red/15 text-eq-red border border-eq-red/30">D</span>
  if (pos === 1)   return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold bg-eq-green/15 text-eq-green border border-eq-green/30">1</span>
  if (pos <= 3)    return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold bg-eq-amber/15 text-eq-amber border border-eq-amber/30">{pos}</span>
  if (pos <= 9)    return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold bg-eq-surface text-eq-muted border border-eq-border">{pos}</span>
  return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold bg-eq-surface text-eq-muted border border-eq-border">?</span>
}

function OddsIcon({ change }: { change: 'up' | 'down' | 'stable' }) {
  if (change === 'down') return <TrendingDown className="w-3.5 h-3.5 text-eq-green" />
  if (change === 'up')   return <TrendingUp   className="w-3.5 h-3.5 text-eq-red"   />
  return <Minus className="w-3.5 h-3.5 text-eq-muted" />
}

function HorseCard({ entry, rank }: { entry: DetailedEntry; rank: number }) {
  const conf = entry.confidenceLevel
  const confStyle = conf === 'fort' ? 'bg-eq-green/15 text-eq-green border-eq-green/30'
    : conf === 'moyen' ? 'bg-eq-amber/15 text-eq-amber border-eq-amber/30'
    : 'bg-eq-red/15 text-eq-red border-eq-red/30'
  const confLabel = conf === 'fort' ? 'Fort' : conf === 'moyen' ? 'Moyen' : 'Faible'
  const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'

  return (
    <div className={`bg-eq-card border rounded-2xl p-6 ${entry.rank === 1 ? 'border-eq-green/40' : 'border-eq-border'}`}>

      {/* Header cheval */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{rankEmoji}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-black text-white">{entry.rank}. {entry.horseName}</h3>
              {entry.rank === 1 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-eq-green/15 text-eq-green border border-eq-green/30">
                  <Brain className="w-2.5 h-2.5" /> Favori IA
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-eq-muted mt-0.5 flex-wrap">
              <span>{entry.jockey}</span>
              <span>·</span>
              <span>Entr. {entry.trainer}</span>
              <span>·</span>
              <span>{entry.age} ans</span>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 justify-end text-lg font-black text-white">
            {entry.odds < 90 ? `${entry.odds.toFixed(1)}x` : 'N/A'}
            <OddsIcon change={entry.oddsChange} />
          </div>
          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md border mt-1 ${confStyle}`}>
            Confiance {confLabel}
          </span>
        </div>
      </div>

      {/* Score IA + probabilité */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-eq-surface rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Brain className="w-3.5 h-3.5 text-eq-green" />
            <span className="text-[10px] text-eq-muted uppercase tracking-wide">Score IA</span>
          </div>
          <div className="text-2xl font-black text-white">{entry.aiScore}<span className="text-sm text-eq-muted">/100</span></div>
        </div>
        <div className="bg-eq-surface rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className="w-3.5 h-3.5 text-eq-amber" />
            <span className="text-[10px] text-eq-muted uppercase tracking-wide">Probabilité</span>
          </div>
          <div className="text-2xl font-black text-white">{entry.probability.toFixed(1)}<span className="text-sm text-eq-muted">%</span></div>
        </div>
      </div>

      {/* Analyse 7 facteurs */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-3.5 h-3.5 text-eq-green" />
          <span className="text-xs font-bold text-white uppercase tracking-wide">Analyse 7 facteurs</span>
        </div>
        <div className="space-y-2">
          {(Object.keys(FACTOR_LABELS) as (keyof Omit<HorseFactorScores, 'weighted'>)[]).map(key => (
            <div key={key}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[11px] text-eq-muted">{FACTOR_LABELS[key]} <span className="text-eq-border-bright">({FACTOR_WEIGHTS[key]}%)</span></span>
              </div>
              <ScoreBar value={entry.factors[key]} />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-eq-border">
          <span className="text-xs font-bold text-white">Score pondéré</span>
          <span className="text-sm font-black text-eq-green">{entry.factors.weighted.toFixed(1)} / 10</span>
        </div>
      </div>

      {/* Historique de forme */}
      {entry.formPositions.length > 0 && (
        <div className="mb-5">
          <span className="text-xs font-bold text-white uppercase tracking-wide block mb-2">Forme récente</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {entry.formPositions.slice(0, 8).map((pos, i) => (
              <FormBadge key={i} pos={pos} />
            ))}
          </div>
        </div>
      )}

      {/* Bilan carrière */}
      <div className="flex items-center gap-4 text-xs mb-5 flex-wrap">
        <div className="flex flex-col items-center bg-eq-surface rounded-lg px-3 py-2">
          <span className="font-black text-lg text-white">{entry.careerWins}</span>
          <span className="text-eq-muted">Victoires</span>
        </div>
        <div className="flex flex-col items-center bg-eq-surface rounded-lg px-3 py-2">
          <span className="font-black text-lg text-white">{entry.careerRaces}</span>
          <span className="text-eq-muted">Courses</span>
        </div>
        <div className="flex flex-col items-center bg-eq-surface rounded-lg px-3 py-2">
          <span className="font-black text-lg text-white">{entry.winRate}%</span>
          <span className="text-eq-muted">Taux victoire</span>
        </div>
      </div>

      {/* Forces */}
      {entry.strengths.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1.5">
            {entry.strengths.map((s, i) => (
              <span key={i} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-eq-green/10 text-eq-green border border-eq-green/20">
                <CheckCircle className="w-2.5 h-2.5 shrink-0" />{s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Alertes */}
      {entry.warnings.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1.5">
            {entry.warnings.map((w, i) => (
              <span key={i} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-eq-red/10 text-eq-red border border-eq-red/20">
                <AlertTriangle className="w-2.5 h-2.5 shrink-0" />{w}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Raisonnement IA */}
      {entry.reasoning && (
        <div className="bg-eq-surface rounded-xl p-3 mt-1">
          <span className="text-[10px] text-eq-green font-semibold uppercase tracking-wide block mb-1">Analyse IA</span>
          <p className="text-xs text-white leading-relaxed">{entry.reasoning}</p>
        </div>
      )}
    </div>
  )
}

export default async function ProCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const detail = await fetchRaceDetail(id)
  if (!detail) notFound()

  const { race, prediction } = detail
  const raceTypeColor = RACE_TYPE_COLORS[race.raceType] ?? ''

  return (
    <ProPaywallGate>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Retour */}
        <Link
          href="/dashboard-pro"
          className="inline-flex items-center gap-1.5 text-sm text-eq-muted hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au dashboard Pro
        </Link>

        {/* Header course */}
        <div className="bg-eq-card border border-eq-border rounded-2xl p-6 mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-md border ${raceTypeColor}`}>
                  {race.raceType}
                </span>
                <span className="text-xs text-eq-muted">R{race.raceNumber}</span>
                {race.category && <span className="text-xs text-eq-muted">{race.category}</span>}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">{race.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-eq-muted">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />{race.racecourse}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-eq-green" />{formatTime(race.startTime)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />{race.numberOfRunners} partants
                </span>
                <span className="text-white">{race.distance}m</span>
              </div>
            </div>
            <div className="text-right">
              {race.prize > 0 && (
                <>
                  <div className="text-2xl font-black text-eq-amber">{formatPrize(race.prize)}</div>
                  <div className="text-xs text-eq-muted mt-0.5">Allocation</div>
                </>
              )}
            </div>
          </div>

          {/* Analyse globale */}
          {prediction.raceAnalysis && (
            <div className="mt-4 pt-4 border-t border-eq-border">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-eq-amber" />
                <span className="text-xs font-bold text-white uppercase tracking-wide">Analyse globale IA</span>
              </div>
              <p className="text-sm text-white leading-relaxed">{prediction.raceAnalysis}</p>
            </div>
          )}
        </div>

        {/* Grille des chevaux */}
        <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-eq-green" />
          Analyse détaillée des {prediction.detailedTop3.length} chevaux analysés
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {prediction.detailedTop3.map((entry, i) => (
            <HorseCard key={entry.horseId} entry={entry} rank={i + 1} />
          ))}
        </div>

        <p className="text-center text-xs text-white font-bold mt-10">
          Les prédictions EquiPredict sont informatives et ne constituent pas des conseils de paris. Jouez de manière responsable — 18+
        </p>
      </div>
    </ProPaywallGate>
  )
}
