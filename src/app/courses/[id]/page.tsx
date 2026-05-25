import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Clock, Users, Trophy, Sun, Cloud, Wind, Droplets } from 'lucide-react'
import { HorseTable } from '@/components/horses/HorseTable'
import { PredictionPanel } from '@/components/predictions/PredictionPanel'
import { fetchRaceDetail } from '@/lib/race-detail'

const RACE_TYPE_COLORS: Record<string, string> = {
  plat:        'bg-eq-blue/15   text-eq-blue   border-eq-blue/30',
  trot:        'bg-eq-violet/15 text-eq-violet border-eq-violet/30',
  obstacle:    'bg-eq-amber/15  text-eq-amber  border-eq-amber/30',
  steeplechase:'bg-eq-red/15    text-eq-red    border-eq-red/30',
}

const RACE_TYPE_LABELS: Record<string, string> = {
  plat: 'Plat', trot: 'Trot', obstacle: 'Obstacle', steeplechase: 'Steeplechase',
}

const WEATHER_ICONS: Record<string, React.ReactNode> = {
  ensoleillé: <Sun      className="w-4 h-4 text-eq-amber" />,
  nuageux:    <Cloud    className="w-4 h-4 text-eq-muted" />,
  pluvieux:   <Droplets className="w-4 h-4 text-eq-blue"  />,
  venteux:    <Wind     className="w-4 h-4 text-eq-muted" />,
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).format(new Date(iso))
}

function formatPrize(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M€`
  if (n >= 1_000)     return `${Math.round(n / 1_000)} 000 €`
  return n > 0 ? `${n} €` : '—'
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const detail = await fetchRaceDetail(id)
  if (!detail) notFound()

  const { race, horses, prediction } = detail
  const raceTypeColor = RACE_TYPE_COLORS[race.raceType] ?? ''
  const raceTypeLabel = RACE_TYPE_LABELS[race.raceType] ?? race.raceType

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Breadcrumb */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-eq-muted hover:text-eq-text transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au dashboard
      </Link>

      {/* Race header */}
      <div className="bg-eq-card border border-eq-border rounded-2xl p-6 mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-md border ${raceTypeColor}`}>
                {raceTypeLabel}
              </span>
              {race.category && (
                <span className="text-xs text-eq-muted font-medium">{race.category}</span>
              )}
              <span className="text-xs text-eq-muted">R{race.raceNumber}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-eq-text mb-3">{race.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-eq-muted">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {race.racecourse}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-eq-violet" />
                {formatTime(race.startTime)}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {race.numberOfRunners} partants
              </span>
              <span className="flex items-center gap-1.5">
                {WEATHER_ICONS[race.weather]}
                {race.temperature}°C · {race.weather}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-eq-amber">{formatPrize(race.prize)}</div>
            {race.prize > 0 && <div className="text-xs text-eq-muted mt-0.5">Allocation</div>}
            <div className="mt-3 flex items-center gap-3 justify-end text-sm">
              <span>
                <span className="text-eq-muted">Distance : </span>
                <span className="font-bold text-eq-text">{race.distance}m</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                race.trackCondition === 'lourd' || race.trackCondition === 'très lourd'
                  ? 'bg-eq-red/10 text-eq-red' :
                race.trackCondition === 'souple'
                  ? 'bg-eq-blue/10 text-eq-blue'
                  : 'bg-eq-green/10 text-eq-green'
              }`}>
                {race.trackCondition.charAt(0).toUpperCase() + race.trackCondition.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main layout: horses table + prediction panel */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 items-start">

        {/* Horses table */}
        <div className="bg-eq-card border border-eq-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-eq-text text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-eq-amber" />
              Partants ({horses.length})
            </h2>
            <div className="text-xs text-eq-muted">Trié par score IA ↓</div>
          </div>
          <HorseTable horses={horses} />
        </div>

        {/* Prediction panel */}
        <div className="bg-eq-card border border-eq-border rounded-2xl p-6 xl:sticky xl:top-6">
          <PredictionPanel prediction={prediction} />
        </div>
      </div>
    </div>
  )
}
