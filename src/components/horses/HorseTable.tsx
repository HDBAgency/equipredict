import { TrendingDown, TrendingUp, Minus, Star } from 'lucide-react'
import { ConfidenceBadge } from './ConfidenceBadge'
import type { Horse, HorseFormEntry } from '@/types'

function FormDots({ form }: { form: HorseFormEntry[] }) {
  return (
    <div className="flex items-center gap-1">
      {form.slice(0, 5).map((f, i) => {
        let color = 'bg-eq-border'
        if (f.position === 1)                               color = 'bg-eq-green'
        else if (f.position <= 3)                           color = 'bg-eq-amber'
        else if (f.position <= Math.ceil(f.opponents * .4)) color = 'bg-eq-blue/60'
        return (
          <span
            key={i}
            title={`${f.position}e — ${f.racecourse} (${f.distance}m)`}
            className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`}
          />
        )
      })}
    </div>
  )
}

function ScoreBar({ score }: { score: number }) {
  let color = 'bg-eq-red'
  if (score >= 70) color = 'bg-gradient-to-r from-eq-violet to-eq-green'
  else if (score >= 50) color = 'bg-eq-blue'
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 rounded-full bg-eq-border overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xs font-bold tabular-nums w-6 text-right ${
        score >= 70 ? 'text-eq-violet-light' : score >= 50 ? 'text-eq-blue' : 'text-eq-muted'
      }`}>
        {score}
      </span>
    </div>
  )
}

function OddsChange({ change }: { change: Horse['oddsChange'] }) {
  if (change === 'down') return <TrendingDown className="w-3.5 h-3.5 text-eq-green inline ml-0.5" />
  if (change === 'up')   return <TrendingUp   className="w-3.5 h-3.5 text-eq-red   inline ml-0.5" />
  return <Minus className="w-3 h-3 text-eq-muted inline ml-0.5" />
}

export function HorseTable({ horses }: { horses: Horse[] }) {
  const sorted = [...horses].sort((a, b) => b.aiScore - a.aiScore)

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm min-w-[780px]">
        <thead>
          <tr className="border-b border-eq-border text-[11px] uppercase tracking-wider text-eq-muted">
            <th className="text-left py-3 px-3 font-medium w-8">#</th>
            <th className="text-left py-3 px-3 font-medium">Cheval</th>
            <th className="text-left py-3 px-3 font-medium hidden lg:table-cell">Jockey / Entraîneur</th>
            <th className="text-right py-3 px-3 font-medium">Cote</th>
            <th className="text-left py-3 px-3 font-medium hidden sm:table-cell">Forme</th>
            <th className="text-left py-3 px-3 font-medium">Score IA</th>
            <th className="text-right py-3 px-3 font-medium hidden sm:table-cell">Proba</th>
            <th className="text-center py-3 px-3 font-medium">Niveau</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-eq-border/50">
          {sorted.map((horse) => (
            <tr
              key={horse.id}
              className={`group transition-colors hover:bg-eq-surface/60 ${
                horse.isRecommended ? 'bg-eq-violet/5' : ''
              }`}
            >
              {/* Numéro */}
              <td className="py-3.5 px-3 text-eq-muted font-mono text-xs">{horse.number}</td>

              {/* Nom + recommended */}
              <td className="py-3.5 px-3">
                <div className="flex items-center gap-2">
                  {horse.isRecommended && (
                    <Star className="w-3.5 h-3.5 text-eq-amber shrink-0 fill-eq-amber" />
                  )}
                  <div>
                    <div className={`font-semibold ${horse.isRecommended ? 'text-eq-text' : 'text-eq-muted-bright'}`}>
                      {horse.name}
                    </div>
                    <div className="text-[11px] text-eq-muted">
                      {horse.age} ans · {horse.careerWins}V/{horse.careerRaces} courses
                    </div>
                  </div>
                </div>
              </td>

              {/* Jockey / Entraîneur */}
              <td className="py-3.5 px-3 hidden lg:table-cell">
                <div className="text-eq-muted-bright text-xs leading-relaxed">
                  {horse.jockey}
                  <span className="block text-eq-muted text-[11px]">{horse.trainer}</span>
                </div>
              </td>

              {/* Cote */}
              <td className="py-3.5 px-3 text-right">
                <span className="font-mono font-bold text-eq-text text-sm">{horse.odds.toFixed(1)}</span>
                <OddsChange change={horse.oddsChange} />
              </td>

              {/* Forme */}
              <td className="py-3.5 px-3 hidden sm:table-cell">
                <FormDots form={horse.recentForm} />
              </td>

              {/* Score IA */}
              <td className="py-3.5 px-3">
                <ScoreBar score={horse.aiScore} />
              </td>

              {/* Probabilité */}
              <td className="py-3.5 px-3 text-right hidden sm:table-cell">
                <span className="font-mono text-xs font-semibold text-eq-muted-bright">
                  {horse.winProbability.toFixed(1)}%
                </span>
              </td>

              {/* Confiance */}
              <td className="py-3.5 px-3 text-center">
                <ConfidenceBadge level={horse.confidenceLevel} size="sm" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Légende */}
      <div className="flex items-center gap-5 mt-4 px-3 text-[11px] text-eq-muted flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-eq-green" />Victoire</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-eq-amber" />Podium</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-eq-blue/60" />Top 40%</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-eq-border" />Hors classement</span>
        <span className="flex items-center gap-1.5 ml-auto"><Star className="w-3 h-3 text-eq-amber fill-eq-amber" />Recommandé IA</span>
      </div>
    </div>
  )
}
