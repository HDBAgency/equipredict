import {
  Trophy, AlertTriangle, TrendingUp, TrendingDown, Minus,
  Brain, Star, ShieldCheck, ShieldAlert,
} from 'lucide-react'
import { ConfidenceBadge } from '@/components/horses/ConfidenceBadge'
import type { DetailedPrediction, DetailedEntry, HorseFactorScores } from '@/types/prediction'
import type { ConfidenceLevel } from '@/types'

const MEDALS = ['🥇', '🥈', '🥉'] as const

type FactorKey = keyof Omit<HorseFactorScores, 'weighted'>

const FACTOR_META: { key: FactorKey; label: string; weight: number }[] = [
  { key: 'recentForm',         label: 'Forme récente',    weight: 30 },
  { key: 'distanceFit',        label: 'Distance',         weight: 20 },
  { key: 'trackConditionFit',  label: 'Terrain',          weight: 15 },
  { key: 'jockeyPerformance',  label: 'Jockey',           weight: 10 },
  { key: 'trainerPerformance', label: 'Entraîneur',       weight: 10 },
  { key: 'oddsMovement',       label: 'Mouv. cote',       weight: 10 },
  { key: 'careerConsistency',  label: 'Régularité',       weight: 5  },
]

function MiniFactorBar({ label, score, weight }: { label: string; score: number; weight: number }) {
  const pct = (score / 10) * 100
  const color = score >= 7.5 ? 'bg-eq-green' : score >= 5 ? 'bg-eq-blue' : 'bg-eq-red'
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-eq-muted">
          {label}
          <span className="ml-1 text-eq-border-bright">{weight}%</span>
        </span>
        <span className={`text-[10px] font-mono font-bold tabular-nums ${
          score >= 7.5 ? 'text-eq-green' : score >= 5 ? 'text-eq-text' : 'text-eq-red'
        }`}>{score.toFixed(1)}</span>
      </div>
      <div className="h-1 rounded-full bg-eq-border overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function FormBadge({ pos }: { pos: number }) {
  const { bg, text } =
    pos === 1 ? { bg: 'bg-eq-green',       text: 'text-white' } :
    pos <= 3 && pos > 0 ? { bg: 'bg-eq-amber', text: 'text-white' } :
    pos === 0  ? { bg: 'bg-eq-surface border border-eq-border', text: 'text-eq-muted' } :
                 { bg: 'bg-eq-border',     text: 'text-eq-muted' }
  return (
    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${bg} ${text}`}>
      {pos === 0 ? '?' : pos}
    </span>
  )
}

function HorseDetailCard({ entry, medalIdx }: { entry: DetailedEntry; medalIdx: number }) {
  const isWinner = medalIdx === 0
  const horseNum = entry.horseId.split('-h').pop() ?? '?'

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${
      isWinner
        ? 'bg-gradient-to-b from-eq-green/10 to-transparent border-eq-green/40'
        : 'bg-eq-surface border-eq-border'
    }`}>

      {/* Name + probability */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl leading-none shrink-0">{MEDALS[medalIdx]}</span>
          <div className="min-w-0">
            <div className="font-bold text-eq-text text-sm truncate">{entry.horseName}</div>
            <div className="text-[11px] text-eq-muted mt-0.5">
              #{horseNum} · {entry.age} ans · {entry.jockey}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className={`text-xl font-black tabular-nums ${isWinner ? 'text-eq-green-light' : 'text-eq-text'}`}>
            {entry.probability.toFixed(1)}%
          </div>
          <div className="text-[10px] text-eq-muted">probabilité</div>
        </div>
      </div>

      {/* Badges row */}
      <div className="flex items-center gap-2 flex-wrap">
        <ConfidenceBadge level={entry.confidenceLevel} size="sm" />
        <span className="text-[11px] text-eq-muted">Score&nbsp;<span className="font-bold text-eq-text">{entry.aiScore}</span>/100</span>
        <span className="ml-auto text-xs font-mono text-eq-text flex items-center gap-0.5">
          {entry.odds.toFixed(1)}x
          {entry.oddsChange === 'down' && <TrendingDown className="w-3 h-3 text-eq-green" />}
          {entry.oddsChange === 'up'   && <TrendingUp   className="w-3 h-3 text-eq-red"   />}
          {entry.oddsChange === 'stable' && <Minus className="w-3 h-3 text-eq-muted" />}
        </span>
      </div>

      {/* Weighted score bar */}
      <div className="space-y-0.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-semibold text-eq-muted-bright uppercase tracking-wide">Score global pondéré</span>
          <span className="font-mono font-bold text-eq-text">{entry.factors.weighted.toFixed(1)}/10</span>
        </div>
        <div className="h-2 rounded-full bg-eq-border overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-eq-green to-eq-blue transition-all duration-700"
            style={{ width: `${(entry.factors.weighted / 10) * 100}%` }}
          />
        </div>
      </div>

      {/* Factor breakdown */}
      <div className="bg-eq-card/60 rounded-lg p-2.5 space-y-1.5">
        {FACTOR_META.map(({ key, label, weight }) => (
          <MiniFactorBar key={key} label={label} score={entry.factors[key]} weight={weight} />
        ))}
      </div>

      {/* Form positions */}
      {entry.formPositions.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-eq-muted shrink-0">Récente :</span>
          {entry.formPositions.slice(0, 5).map((pos, i) => (
            <FormBadge key={i} pos={pos} />
          ))}
        </div>
      )}

      {/* Reasoning */}
      <p className="text-[11px] text-eq-muted-bright leading-relaxed">{entry.reasoning}</p>

      {/* Strengths */}
      {entry.strengths.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entry.strengths.map((s, i) => (
            <span key={i} className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-eq-green/10 border border-eq-green/25 text-eq-green">
              <ShieldCheck className="w-2.5 h-2.5 shrink-0" />{s}
            </span>
          ))}
        </div>
      )}

      {/* Warnings */}
      {entry.warnings.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entry.warnings.map((w, i) => (
            <span key={i} className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-eq-amber/10 border border-eq-amber/25 text-eq-amber">
              <ShieldAlert className="w-2.5 h-2.5 shrink-0" />{w}
            </span>
          ))}
        </div>
      )}

      {/* Career stats */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-eq-border">
        <div className="text-center">
          <div className="text-sm font-bold text-eq-text">{entry.careerWins}</div>
          <div className="text-[10px] text-eq-muted">Victoires</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-eq-text">{entry.careerRaces}</div>
          <div className="text-[10px] text-eq-muted">Courses</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-eq-text">{entry.winRate}%</div>
          <div className="text-[10px] text-eq-muted">Taux victoire</div>
        </div>
      </div>
    </div>
  )
}

function BetAdviceCard({
  advice,
}: {
  advice: { type: string; description: string; confidence: ConfidenceLevel }
}) {
  const style: Record<ConfidenceLevel, string> = {
    fort:   'border-eq-green/30 bg-eq-green/5',
    moyen:  'border-eq-blue/30 bg-eq-blue/5',
    faible: 'border-eq-border bg-eq-surface',
  }
  return (
    <div className={`rounded-xl border p-3 ${style[advice.confidence]}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-eq-text">{advice.type}</span>
        <ConfidenceBadge level={advice.confidence} size="sm" />
      </div>
      <p className="text-[11px] text-eq-muted leading-relaxed">{advice.description}</p>
    </div>
  )
}

export function PredictionPanel({ prediction }: { prediction: DetailedPrediction }) {
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-eq-green/20 border border-eq-green/30 flex items-center justify-center">
          <Brain className="w-4 h-4 text-eq-green" />
        </div>
        <div>
          <h2 className="font-bold text-eq-text">Pronostic IA</h2>
          <p className="text-[11px] text-eq-muted">
            Modèle v{prediction.modelVersion} ·{' '}
            {new Date(prediction.generatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Detailed top 3 */}
      <div className="space-y-3">
        {prediction.detailedTop3.map((entry, i) => (
          <HorseDetailCard key={entry.horseId} entry={entry} medalIdx={i} />
        ))}
      </div>

      {/* Race analysis */}
      <div className="bg-eq-surface border-l-2 border-eq-green rounded-r-xl p-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-eq-muted mb-2">
          Analyse de la course
        </h3>
        <p className="text-sm text-eq-muted-bright leading-relaxed">{prediction.raceAnalysis}</p>
      </div>

      {/* Betting advice */}
      {prediction.betAdvice.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-eq-muted flex items-center gap-1.5">
            <Star className="w-3 h-3 text-eq-amber fill-eq-amber" />
            Conseils de mise
          </h3>
          {prediction.betAdvice.map((a, i) => (
            <BetAdviceCard key={i} advice={a} />
          ))}
        </div>
      )}

      {/* Trophy: top 3 quick list */}
      <div className="bg-eq-surface rounded-xl border border-eq-border p-3">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-eq-muted mb-2">
          <Trophy className="w-3 h-3 text-eq-amber" />
          Sélection IA
        </div>
        <div className="space-y-1">
          {prediction.detailedTop3.map((e, i) => (
            <div key={e.horseId} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span>{MEDALS[i]}</span>
                <span className="font-semibold text-eq-text">{e.horseName}</span>
              </span>
              <span className="font-mono text-eq-muted tabular-nums">{e.probability.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2.5 bg-eq-amber/5 border border-eq-amber/20 rounded-xl p-3.5">
        <AlertTriangle className="w-4 h-4 text-eq-amber shrink-0 mt-0.5" />
        <p className="text-[11px] text-eq-muted leading-relaxed">{prediction.disclaimer}</p>
      </div>
    </div>
  )
}
