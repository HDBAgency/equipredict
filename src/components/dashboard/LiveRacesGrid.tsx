'use client'

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { RefreshCw, Radio, AlertCircle, ChevronDown, Clock } from 'lucide-react'
import { LiveRaceCard } from '@/components/races/LiveRaceCard'
import type { LiveResponse, LiveRace } from '@/types/live'
import type { RaceType } from '@/types'

const POLL_INTERVAL = 20_000
const FLASH_DURATION = 1600

type OddsMap = Record<string, number>

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

// Composant isolé pour le "Mis à jour" — évite de re-rendre toute la grille chaque seconde
function UpdatedAt({ updatedAt, source }: { updatedAt: string; source: string }) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="text-xs text-eq-muted">
      Mis à jour {formatRelativeTime(updatedAt)}
      {source === 'pmu' && <span className="ml-1.5 text-eq-violet font-medium">· PMU</span>}
    </span>
  )
}

export function LiveRacesGrid() {
  const searchParams = useSearchParams()
  const activeType = (searchParams.get('type') ?? 'all') as RaceType | 'all'

  const [data, setData]             = useState<LiveResponse | null>(null)
  const [error, setError]           = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showPast, setShowPast]     = useState(false)

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
  const filtered = allRaces.filter(r => activeType === 'all' || r.raceType === activeType)

  const upcoming = filtered.filter(r => !isPast(r))           // à venir / en cours
  const past     = filtered.filter(r =>  isPast(r)).reverse() // déjà passées, plus récentes en premier

  const totalRunners = allRaces.reduce((s, r) => s + r.numberOfRunners, 0)

  return (
    <div>
      {/* Barre statuts + stats */}
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
          className="self-start sm:self-auto flex items-center gap-1.5 text-xs text-eq-muted hover:text-eq-text transition-colors px-3 py-1.5 rounded-lg border border-eq-border hover:border-eq-border-bright bg-eq-card disabled:opacity-50"
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
            <div key={i} className="bg-eq-card border border-eq-border rounded-xl p-5 h-60 animate-pulse">
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

      {/* Aucune course à venir */}
      {data && upcoming.length === 0 && (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-2xl bg-eq-violet/10 border border-eq-violet/20 flex items-center justify-center mx-auto mb-4">
            <Radio className="w-6 h-6 text-eq-violet" />
          </div>
          <h3 className="text-lg font-bold text-eq-text mb-2">Aucune course à venir</h3>
          <p className="text-eq-muted text-sm">Essayez un autre filtre ou revenez demain.</p>
        </div>
      )}

      {/* Grille des courses à venir */}
      {data && upcoming.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcoming.map(race => (
            <LiveRaceCard
              key={race.id}
              race={race}
              flashDown={flashDown}
              flashUp={flashUp}
            />
          ))}
        </div>
      )}

      {/* Section Passés */}
      {data && past.length > 0 && (
        <div className="mt-10">
          <button
            onClick={() => setShowPast(v => !v)}
            className="w-full flex items-center justify-between gap-3 px-5 py-3.5 bg-eq-card border border-eq-border rounded-xl hover:border-eq-border-bright transition-all group"
          >
            <div className="flex items-center gap-2.5 text-sm font-semibold text-eq-muted group-hover:text-eq-text transition-colors">
              <Clock className="w-4 h-4" />
              Passés
              <span className="text-xs font-normal bg-eq-surface border border-eq-border rounded-full px-2 py-0.5">
                {past.length} course{past.length > 1 ? 's' : ''}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-eq-muted transition-transform duration-200 ${showPast ? 'rotate-180' : ''}`}
            />
          </button>

          {showPast && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-55">
              {past.map(race => (
                <LiveRaceCard
                  key={race.id}
                  race={race}
                  flashDown={flashDown}
                  flashUp={flashUp}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
