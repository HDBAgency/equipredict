'use client'

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  RefreshCw, AlertCircle, ChevronDown, Clock, Timer,
  MapPin, Users, TrendingUp, TrendingDown, Minus,
  Wind, Droplets, Sun, Cloud, Bell, Brain, Zap, Star,
} from 'lucide-react'
import type { LiveResponse, LiveRace, LiveHorse } from '@/types/live'
import type { RaceType } from '@/types'

const POLL_INTERVAL = 20_000
const FLASH_DURATION = 1600

type OddsMap = Record<string, number>

const TYPE_TABS: { value: RaceType | 'all'; label: string }[] = [
  { value: 'all',          label: 'Toutes'   },
  { value: 'plat',         label: 'Plat'     },
  { value: 'trot',         label: 'Trot'     },
  { value: 'obstacle',     label: 'Obstacle' },
  { value: 'steeplechase', label: 'Steeple'  },
]

const RACE_TYPE_BADGE: Record<string, { label: string; color: string }> = {
  plat:         { label: 'Plat',     color: 'bg-eq-blue/15   text-eq-blue   border-eq-blue/30'   },
  trot:         { label: 'Trot',     color: 'bg-eq-green/15 text-eq-green border-eq-green/30' },
  obstacle:     { label: 'Obstacle', color: 'bg-eq-amber/15  text-eq-amber  border-eq-amber/30'  },
  steeplechase: { label: 'Steeple',  color: 'bg-eq-red/15    text-eq-red    border-eq-red/30'    },
}

const WEATHER_ICON: Record<string, React.ReactNode> = {
  ensoleillé: <Sun      className="w-3.5 h-3.5 text-eq-amber"  />,
  nuageux:    <Cloud    className="w-3.5 h-3.5 text-eq-muted"  />,
  pluvieux:   <Droplets className="w-3.5 h-3.5 text-eq-blue"   />,
  venteux:    <Wind     className="w-3.5 h-3.5 text-eq-muted"  />,
}

const CONFIDENCE_STYLE: Record<string, { label: string; color: string }> = {
  fort:   { label: 'Fort',   color: 'bg-eq-green/15 text-eq-green border-eq-green/30'  },
  moyen:  { label: 'Moyen',  color: 'bg-eq-amber/15 text-eq-amber border-eq-amber/30'  },
  faible: { label: 'Faible', color: 'bg-eq-red/15   text-eq-red   border-eq-red/30'    },
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).format(new Date(iso))
}

function formatPrize(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M€`
  if (n >= 1_000)     return `${Math.round(n / 1_000)}K€`
  return `${n}€`
}

function formatRelativeTime(isoDate: string): string {
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000)
  if (diff < 5)  return "à l'instant"
  if (diff < 60) return `il y a ${diff}s`
  return `il y a ${Math.floor(diff / 60)}min`
}

function isPast(race: LiveRace): boolean {
  if (race.status === 'live') return false
  if (race.status === 'completed') return true
  return new Date(race.startTime).getTime() < Date.now()
}

function isStartingSoon(race: LiveRace): boolean {
  const diff = new Date(race.startTime).getTime() - Date.now()
  return diff > 0 && diff < 30 * 60 * 1000
}

function OddsArrow({ change }: { change: 'up' | 'down' | 'stable' }) {
  if (change === 'down') return <TrendingDown className="w-3 h-3 text-eq-green shrink-0" />
  if (change === 'up')   return <TrendingUp   className="w-3 h-3 text-eq-red   shrink-0" />
  return <Minus className="w-3 h-3 text-eq-border-bright shrink-0" />
}

function UpdatedAt({ updatedAt, source }: { updatedAt: string; source: string }) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="text-xs text-white">
      Mis à jour {formatRelativeTime(updatedAt)}
      {source === 'pmu' && <span className="ml-1.5 text-eq-green font-medium">· PMU</span>}
    </span>
  )
}

// ─── Premium Race Card ─────────────────────────────────────────────────────────

const PremiumRaceCard = memo(function PremiumRaceCard({
  race,
  flashDown,
  flashUp,
  isFavorite,
  onToggleFavorite,
}: {
  race: LiveRace
  flashDown: Set<string>
  flashUp: Set<string>
  isFavorite?: boolean
  onToggleFavorite?: (e: React.MouseEvent) => void
}) {
  const { label: typeLabel, color: typeColor } = RACE_TYPE_BADGE[race.raceType] ?? { label: race.raceType, color: '' }
  const soon = isStartingSoon(race)

  const top3: LiveHorse[] = race.horses
    .filter(h => h.odds < 90)
    .sort((a, b) => a.odds - b.odds)
    .slice(0, 3)

  const displayHorses = top3.length >= 1 ? top3 : race.horses.slice(0, 3)
  const recommended = displayHorses.find(h => h.isRecommended) ?? displayHorses[0]

  return (
    <article className="bg-eq-card border border-eq-border rounded-xl p-5 flex flex-col gap-3 relative">

      {/* Alerte départ imminent */}
      {soon && (
        <div className="absolute -top-2.5 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-eq-amber border border-eq-amber/50">
          <Bell className="w-3 h-3" />
          Départ imminent
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`inline-flex text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md border ${typeColor}`}>
              {typeLabel}
            </span>
            <span className="text-[11px] text-eq-muted">R{race.raceNumber}</span>
            {race.category && <span className="text-[10px] text-eq-muted truncate">{race.category}</span>}
          </div>
          <h3 className="font-bold text-eq-text text-sm truncate">{race.name}</h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onToggleFavorite && (
            <button
              onClick={onToggleFavorite}
              className="p-1 rounded-md hover:bg-eq-surface transition-colors"
              title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Star className={`w-4 h-4 transition-colors ${isFavorite ? 'text-eq-amber fill-eq-amber' : 'text-eq-muted hover:text-eq-amber'}`} />
            </button>
          )}
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm font-mono font-bold text-eq-text">
              <Clock className="w-3.5 h-3.5 text-eq-green" />
              {formatTime(race.startTime)}
            </div>
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
          {race.trackCondition.charAt(0).toUpperCase() + race.trackCondition.slice(1)}
        </span>
        {WEATHER_ICON[race.weather]}
        {race.temperature > 0 && <span>{race.temperature}°</span>}
      </div>

      {/* IA recommandation */}
      {recommended && (
        <div className="flex items-center gap-2 bg-eq-green/5 border border-eq-green/20 rounded-lg px-3 py-2">
          <Brain className="w-3.5 h-3.5 text-eq-green shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-eq-green font-semibold uppercase tracking-wide">Favori IA · </span>
            <span className="text-xs font-bold text-eq-text">{recommended.number}. {recommended.name}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {recommended.confidenceLevel && CONFIDENCE_STYLE[recommended.confidenceLevel] && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${CONFIDENCE_STYLE[recommended.confidenceLevel].color}`}>
                {CONFIDENCE_STYLE[recommended.confidenceLevel].label}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Top 3 avec probabilités */}
      {displayHorses.length > 0 && (
        <div className="bg-eq-surface border border-eq-border rounded-lg px-1 py-1 space-y-0.5">
          <div className="flex items-center justify-between px-2 pb-1 border-b border-eq-border">
            <span className="text-[10px] font-semibold text-eq-muted uppercase tracking-wide">Top 3 IA</span>
            <span className="text-[10px] text-eq-muted">Probabilité · Cote</span>
          </div>
          {displayHorses.map((horse, i) => {
            const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'
            const prob = horse.winProbability ?? 0
            const flashClass = flashDown.has(horse.id) ? 'animate-flash-down' : flashUp.has(horse.id) ? 'animate-flash-up' : ''
            const oddsColor = horse.odds < 90
              ? horse.oddsChange === 'down' ? 'text-eq-green' : horse.oddsChange === 'up' ? 'text-eq-red' : 'text-eq-text'
              : 'text-eq-border-bright'

            return (
              <div key={horse.id} className={`px-2 py-1.5 rounded-md ${flashClass}`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm shrink-0">{rankEmoji}</span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-eq-text truncate block">{horse.number}. {horse.name}</span>
                      <span className="text-[10px] text-eq-muted truncate block">{horse.jockey}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold text-eq-green">{prob > 0 ? `${prob}%` : '—'}</span>
                    <span className={`text-sm font-black font-mono tabular-nums ${oddsColor}`}>
                      {horse.odds < 90 ? `${horse.odds.toFixed(1)}x` : 'N/A'}
                    </span>
                    <OddsArrow change={horse.oddsChange} />
                  </div>
                </div>
                {/* Barre de probabilité */}
                {prob > 0 && (
                  <div className="h-1 bg-eq-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-eq-green rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(prob, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-center gap-3 text-xs text-eq-muted">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {race.numberOfRunners} partants
          </span>
          {race.prize > 0 && <span className="text-eq-amber font-medium">{formatPrize(race.prize)}</span>}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-eq-green font-semibold">
          <Zap className="w-3 h-3" />
          7 facteurs analysés
        </div>
      </div>
    </article>
  )
})

// ─── Grid principale ───────────────────────────────────────────────────────────

export function PremiumRacesGrid({ activeType, basePath = '/dashboard-premium', detailBasePath, showFavorites = false }: { activeType: string; basePath?: string; detailBasePath?: string; showFavorites?: boolean }) {
  const [data, setData]             = useState<LiveResponse | null>(null)
  const [error, setError]           = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showPast, setShowPast]     = useState(false)
  const [favorites, setFavorites]   = useState<Set<string>>(new Set())

  useEffect(() => {
    const stored = localStorage.getItem('eq_pro_favorites')
    if (stored) setFavorites(new Set(JSON.parse(stored)))
  }, [])

  function toggleFavorite(raceId: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(raceId)) next.delete(raceId)
      else next.add(raceId)
      localStorage.setItem('eq_pro_favorites', JSON.stringify([...next]))
      return next
    })
  }

  const prevOddsRef = useRef<OddsMap>({})
  const [flashDown, setFlashDown] = useState<Set<string>>(new Set())
  const [flashUp,   setFlashUp]   = useState<Set<string>>(new Set())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchRaces = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const res = await fetch('/api/races/live', { cache: 'no-store' })
      if (!res.ok) throw new Error('fetch failed')
      const json: LiveResponse = await res.json()

      const newOdds: OddsMap = {}
      const down = new Set<string>()
      const up   = new Set<string>()
      const prev = prevOddsRef.current
      const isFirstFetch = Object.keys(prev).length === 0

      for (const race of json.races) {
        for (const h of race.horses) {
          newOdds[h.id] = h.odds
          if (!isFirstFetch && h.id in prev) {
            const delta = h.odds - prev[h.id]
            if (delta < -0.05) down.add(h.id)
            else if (delta > 0.05) up.add(h.id)
          }
        }
      }

      prevOddsRef.current = newOdds
      setData(json)
      setError(false)

      if (!isFirstFetch && (down.size > 0 || up.size > 0)) {
        setFlashDown(down)
        setFlashUp(up)
        setTimeout(() => { setFlashDown(new Set()); setFlashUp(new Set()) }, FLASH_DURATION)
      }
    } catch {
      setError(true)
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchRaces()
    intervalRef.current = setInterval(() => fetchRaces(), POLL_INTERVAL)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchRaces])

  const allRaces: LiveRace[] = data?.races ?? []
  const filtered = activeType === 'favoris'
    ? allRaces.filter(r => favorites.has(r.id))
    : allRaces.filter(r => activeType === 'all' || r.raceType === activeType)
  const upcoming = filtered.filter(r => !isPast(r))
  const past     = filtered.filter(r => isPast(r)).reverse()

  const tabs = showFavorites
    ? [...TYPE_TABS, { value: 'favoris' as RaceType | 'all' | 'favoris', label: '⭐ Favoris' }]
    : TYPE_TABS

  const totalRunners = allRaces.reduce((s, r) => s + r.numberOfRunners, 0)

  return (
    <div>
      {/* Onglets filtre */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map(({ value, label }) => (
          <a
            key={value}
            href={value === 'all' ? basePath : `${basePath}?type=${value}`}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeType === value
                ? value === 'favoris'
                  ? 'bg-eq-amber text-white shadow-lg shadow-eq-amber/25'
                  : 'bg-eq-green text-white shadow-lg shadow-eq-green/25'
                : 'bg-eq-card border border-eq-border text-eq-muted hover:text-eq-text hover:border-eq-border-bright'
            }`}
          >
            {label}
          </a>
        ))}
      </div>

      {/* Barre statuts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-eq-green/10 border border-eq-green/25 text-eq-green">
            <span className="w-1.5 h-1.5 rounded-full bg-eq-green animate-pulse" />
            LIVE
          </div>
          {data ? (
            <>
              <div className="flex items-center gap-2">
                <div className="text-center bg-eq-card border border-eq-border rounded-xl px-4 py-2">
                  <div className="text-lg font-black text-eq-text leading-none">{upcoming.length}</div>
                  <div className="text-[10px] text-eq-muted mt-0.5">À venir</div>
                </div>
                <div className="text-center bg-eq-card border border-eq-border rounded-xl px-4 py-2">
                  <div className="text-lg font-black text-eq-text leading-none">{totalRunners}</div>
                  <div className="text-[10px] text-eq-muted mt-0.5">Partants</div>
                </div>
              </div>
              <UpdatedAt updatedAt={data.updatedAt} source={data.source} />
            </>
          ) : (
            <div className="flex gap-2">
              {[0, 1].map(i => (
                <div key={i} className="bg-eq-card border border-eq-border rounded-xl px-4 py-2 w-16 animate-pulse">
                  <div className="h-4 w-8 bg-eq-border rounded mb-1" />
                  <div className="h-2 w-10 bg-eq-border rounded" />
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => fetchRaces(true)}
          disabled={refreshing}
          className="self-start sm:self-auto flex items-center gap-1.5 text-xs text-white hover:text-white/80 transition-colors px-3 py-1.5 rounded-lg border border-eq-border hover:border-eq-border-bright bg-eq-card disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-eq-red/10 border border-eq-red/25 rounded-xl px-4 py-3 mb-6 text-sm text-eq-red">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Impossible de charger les courses. Nouvelle tentative dans quelques secondes…
        </div>
      )}

      {/* Skeleton */}
      {!data && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-eq-card border border-eq-border rounded-xl p-5 h-64 animate-pulse">
              <div className="h-3 w-24 bg-eq-border rounded mb-3" />
              <div className="h-5 w-3/4 bg-eq-border rounded mb-5" />
              <div className="space-y-2">
                {[0, 1, 2].map(j => (
                  <div key={j} className="flex justify-between">
                    <div className="h-3 w-32 bg-eq-border rounded" />
                    <div className="h-3 w-10 bg-eq-border rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Aucune course */}
      {data && upcoming.length === 0 && (
        <div className="text-center py-16">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${activeType === 'favoris' ? 'bg-eq-amber/10 border border-eq-amber/20' : 'bg-eq-green/10 border border-eq-green/20'}`}>
            {activeType === 'favoris' ? <Star className="w-6 h-6 text-eq-amber" /> : <Timer className="w-6 h-6 text-eq-green" />}
          </div>
          <h3 className="text-lg font-bold text-eq-text mb-2">
            {activeType === 'favoris' ? 'Aucun favori ajouté' : 'Aucune course à venir'}
          </h3>
          <p className="text-white text-sm">
            {activeType === 'favoris' ? 'Cliquez sur l\'étoile ⭐ d\'une course pour l\'ajouter ici.' : 'Essayez un autre filtre ou revenez demain.'}
          </p>
        </div>
      )}

      {/* Grille */}
      {data && upcoming.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcoming.map(race => (
            detailBasePath ? (
              <a key={race.id} href={`${detailBasePath}/${race.id}`} className="block hover:scale-[1.01] transition-transform">
                <PremiumRaceCard race={race} flashDown={flashDown} flashUp={flashUp} isFavorite={showFavorites ? favorites.has(race.id) : undefined} onToggleFavorite={showFavorites ? (e) => toggleFavorite(race.id, e) : undefined} />
              </a>
            ) : (
              <PremiumRaceCard key={race.id} race={race} flashDown={flashDown} flashUp={flashUp} />
            )
          ))}
        </div>
      )}

      {/* Passés */}
      {data && past.length > 0 && (
        <div className="mt-10">
          <button
            onClick={() => setShowPast(v => !v)}
            className="w-full flex items-center justify-between gap-3 px-5 py-3.5 bg-eq-card border border-eq-border rounded-xl hover:border-eq-border-bright transition-all"
          >
            <div className="flex items-center gap-2.5 text-sm font-semibold text-white">
              <Clock className="w-4 h-4" />
              Passés
              <span className="text-xs font-normal bg-eq-surface border border-eq-border rounded-full px-2 py-0.5 text-white">
                {past.length} course{past.length > 1 ? 's' : ''}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-eq-muted transition-transform duration-200 ${showPast ? 'rotate-180' : ''}`} />
          </button>

          {showPast && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-55">
              {past.map(race => (
                detailBasePath ? (
                  <a key={race.id} href={`${detailBasePath}/${race.id}`} className="block">
                    <PremiumRaceCard race={race} flashDown={flashDown} flashUp={flashUp} isFavorite={showFavorites ? favorites.has(race.id) : undefined} onToggleFavorite={showFavorites ? (e) => toggleFavorite(race.id, e) : undefined} />
                  </a>
                ) : (
                  <PremiumRaceCard key={race.id} race={race} flashDown={flashDown} flashUp={flashUp} />
                )
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
