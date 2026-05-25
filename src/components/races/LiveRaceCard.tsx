'use client'

import { memo } from 'react'
import Link from 'next/link'
import {
  Clock, MapPin, Wind, Droplets, Sun, Cloud,
  ArrowRight, Users, TrendingUp, TrendingDown, Minus,
} from 'lucide-react'
import type { LiveRace, LiveHorse } from '@/types/live'

// ─── Maps ─────────────────────────────────────────────────────────────────────

const WEATHER_ICON: Record<string, React.ReactNode> = {
  ensoleillé: <Sun      className="w-3.5 h-3.5 text-eq-amber"  />,
  nuageux:    <Cloud    className="w-3.5 h-3.5 text-eq-muted"  />,
  pluvieux:   <Droplets className="w-3.5 h-3.5 text-eq-blue"   />,
  venteux:    <Wind     className="w-3.5 h-3.5 text-eq-muted"  />,
}

const RACE_TYPE_BADGE: Record<string, { label: string; color: string }> = {
  plat:         { label: 'Plat',     color: 'bg-eq-blue/15   text-eq-blue   border-eq-blue/30'   },
  trot:         { label: 'Trot',     color: 'bg-eq-violet/15 text-eq-violet border-eq-violet/30' },
  obstacle:     { label: 'Obstacle', color: 'bg-eq-amber/15  text-eq-amber  border-eq-amber/30'  },
  steeplechase: { label: 'Steeple',  color: 'bg-eq-red/15    text-eq-red    border-eq-red/30'    },
}

const CONDITION_LABEL: Record<string, string> = {
  souple: 'Souple', bon: 'Bon', léger: 'Léger', lourd: 'Lourd', 'très lourd': 'Très lourd',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris',
  }).format(new Date(iso))
}

function formatPrize(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M€`
  if (n >= 1_000)     return `${Math.round(n / 1_000)}K€`
  return `${n}€`
}

function OddsArrow({ change }: { change: 'up' | 'down' | 'stable' }) {
  if (change === 'down') return <TrendingDown className="w-3 h-3 text-eq-green shrink-0" />
  if (change === 'up')   return <TrendingUp   className="w-3 h-3 text-eq-red   shrink-0" />
  return <Minus className="w-3 h-3 text-eq-border-bright shrink-0" />
}

// ─── Sub-component: tableau des cotes ─────────────────────────────────────────

function OddsRow({
  horse,
  rank,
  isFlashDown,
  isFlashUp,
}: {
  horse: LiveHorse
  rank: number
  isFlashDown: boolean
  isFlashUp: boolean
}) {
  const flashClass = isFlashDown
    ? 'animate-flash-down'
    : isFlashUp
    ? 'animate-flash-up'
    : ''

  const oddsColor = horse.odds < 90
    ? horse.oddsChange === 'down'
      ? 'text-eq-green'
      : horse.oddsChange === 'up'
      ? 'text-eq-red'
      : 'text-eq-text'
    : 'text-eq-border-bright'

  const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'

  return (
    <div className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-md ${flashClass}`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm shrink-0">{rankEmoji}</span>
        <div className="min-w-0">
          <span className="text-xs font-semibold text-eq-text truncate block">
            {horse.number}. {horse.name}
          </span>
          <span className="text-[10px] text-eq-muted truncate block">{horse.jockey}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`text-sm font-black font-mono tabular-nums ${oddsColor}`}>
          {horse.odds < 90 ? `${horse.odds.toFixed(1)}x` : 'N/A'}
        </span>
        <OddsArrow change={horse.oddsChange} />
      </div>
    </div>
  )
}

// ─── Main card ─────────────────────────────────────────────────────────────────

interface LiveRaceCardProps {
  race: LiveRace
  flashDown: Set<string>
  flashUp: Set<string>
}

export const LiveRaceCard = memo(function LiveRaceCard({ race, flashDown, flashUp }: LiveRaceCardProps) {
  const { label: typeLabel, color: typeColor } =
    RACE_TYPE_BADGE[race.raceType] ?? { label: race.raceType, color: '' }

  // Top 3 par cote croissante (exclure non-partants sans cote)
  const top3: LiveHorse[] = race.horses
    .filter(h => h.odds < 90)
    .sort((a, b) => a.odds - b.odds)
    .slice(0, 3)

  // Si pas assez de cotes disponibles, fallback sur les premiers déclarés
  const displayHorses = top3.length >= 1
    ? top3
    : race.horses.slice(0, 3)

  return (
    <Link href={`/courses/${race.id}`} className="group block">
      <article className="bg-eq-card border border-eq-border rounded-xl p-5 hover:border-eq-border-bright hover:bg-eq-card-hover transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40 flex flex-col gap-3">

        {/* Header : badge type + heure */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md border ${typeColor}`}>
                {typeLabel}
              </span>
              <span className="text-[11px] text-eq-muted">R{race.raceNumber}</span>
              {race.category && (
                <span className="text-[10px] text-eq-muted truncate">{race.category}</span>
              )}
            </div>
            <h3 className="font-bold text-eq-text text-sm truncate group-hover:text-eq-violet-light transition-colors">
              {race.name}
            </h3>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 text-sm font-mono font-bold text-eq-text">
              <Clock className="w-3.5 h-3.5 text-eq-violet" />
              {formatTime(race.startTime)}
            </div>
          </div>
        </div>

        {/* Info row */}
        <div className="flex items-center gap-3 text-xs text-eq-muted flex-wrap">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {race.racecourse}
          </span>
          <span>{race.distance}m</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
            race.trackCondition === 'lourd' || race.trackCondition === 'très lourd'
              ? 'bg-eq-red/10 text-eq-red'
              : race.trackCondition === 'souple'
              ? 'bg-eq-blue/10 text-eq-blue'
              : 'bg-eq-green/10 text-eq-green'
          }`}>
            {CONDITION_LABEL[race.trackCondition]}
          </span>
          {WEATHER_ICON[race.weather]}
          {race.temperature > 0 && <span>{race.temperature}°</span>}
        </div>

        {/* Tableau des cotes live */}
        {displayHorses.length > 0 ? (
          <div className="bg-eq-surface border border-eq-border rounded-lg px-1 py-1 space-y-0.5">
            <div className="flex items-center justify-between px-2 pb-1 border-b border-eq-border">
              <span className="text-[10px] font-semibold text-eq-muted uppercase tracking-wide">Favoris</span>
              <span className="text-[10px] text-eq-muted">Cote</span>
            </div>
            {displayHorses.map((horse, i) => (
              <OddsRow
                key={horse.id}
                horse={horse}
                rank={i + 1}
                isFlashDown={flashDown.has(horse.id)}
                isFlashUp={flashUp.has(horse.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-eq-surface border border-eq-border rounded-lg px-3 py-3 text-center">
            <span className="text-xs text-eq-muted">Cotes non disponibles</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-3 text-xs text-eq-muted">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {race.numberOfRunners} partants
            </span>
            {race.prize > 0 && (
              <span className="text-eq-amber font-medium">{formatPrize(race.prize)}</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-eq-violet group-hover:gap-2 transition-all">
            Voir <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </article>
    </Link>
  )
})
