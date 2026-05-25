import Link from 'next/link'
import { Clock, MapPin, Wind, Droplets, Sun, Cloud, ArrowRight, Users } from 'lucide-react'
import type { Race } from '@/types'

const WEATHER_ICON: Record<string, React.ReactNode> = {
  ensoleillé: <Sun  className="w-3.5 h-3.5 text-eq-amber"  />,
  nuageux:    <Cloud className="w-3.5 h-3.5 text-eq-muted" />,
  pluvieux:   <Droplets className="w-3.5 h-3.5 text-eq-blue" />,
  venteux:    <Wind className="w-3.5 h-3.5 text-eq-muted"  />,
}

const RACE_TYPE_BADGE: Record<string, { label: string; color: string }> = {
  plat:        { label: 'Plat',        color: 'bg-eq-blue/15   text-eq-blue   border-eq-blue/30'   },
  trot:        { label: 'Trot',        color: 'bg-eq-green/15 text-eq-green border-eq-green/30' },
  obstacle:    { label: 'Obstacle',    color: 'bg-eq-amber/15  text-eq-amber  border-eq-amber/30'  },
  steeplechase:{ label: 'Steeple',     color: 'bg-eq-red/15    text-eq-red    border-eq-red/30'    },
}

const CONDITION_LABEL: Record<string, string> = {
  souple:       'Souple',
  bon:          'Bon',
  léger:        'Léger',
  lourd:        'Lourd',
  'très lourd': 'Très lourd',
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).format(new Date(iso))
}
function formatPrize(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M€`
  if (n >= 1_000)     return `${Math.round(n / 1_000)}K€`
  return `${n}€`
}

export function RaceCard({ race }: { race: Race }) {
  const { label: typeLabel, color: typeColor } = RACE_TYPE_BADGE[race.raceType] ?? { label: race.raceType, color: '' }

  return (
    <Link href={`/courses/${race.id}`} className="group block">
      <article className="bg-eq-card border border-eq-border rounded-xl p-5 hover:border-eq-border-bright hover:bg-eq-card-hover transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`inline-flex text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md border ${typeColor}`}>
                {typeLabel}
              </span>
              <span className="text-[11px] text-eq-muted">R{race.raceNumber}</span>
            </div>
            <h3 className="font-bold text-eq-text text-base truncate group-hover:text-eq-green-light transition-colors">
              {race.name}
            </h3>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 text-sm font-mono font-bold text-eq-text">
              <Clock className="w-3.5 h-3.5 text-eq-green" />
              {formatTime(race.startTime)}
            </div>
            <div className="text-xs text-eq-muted mt-0.5">{race.category}</div>
          </div>
        </div>

        {/* Info row */}
        <div className="flex items-center gap-4 text-xs text-eq-muted mb-4 flex-wrap">
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
          <span className="flex items-center gap-1">
            {WEATHER_ICON[race.weather]}
            {race.temperature}°
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-eq-muted">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {race.numberOfRunners} partants
            </span>
            <span className="text-eq-amber font-medium">{formatPrize(race.prize)}</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-eq-green group-hover:gap-2 transition-all">
            Voir <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </article>
    </Link>
  )
}
