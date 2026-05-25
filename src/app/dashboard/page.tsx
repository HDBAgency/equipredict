import { Suspense } from 'react'
import { CalendarDays, CloudRain, Thermometer } from 'lucide-react'
import { LiveRacesGrid } from '@/components/dashboard/LiveRacesGrid'
import { PaywallGate } from '@/components/dashboard/PaywallGate'
import type { RaceType } from '@/types'

const TYPE_TABS: { value: RaceType | 'all'; label: string }[] = [
  { value: 'all',          label: 'Toutes'   },
  { value: 'plat',         label: 'Plat'     },
  { value: 'trot',         label: 'Trot'     },
  { value: 'obstacle',     label: 'Obstacle' },
  { value: 'steeplechase', label: 'Steeple'  },
]

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const { type } = await searchParams
  const activeType = type ?? 'all'

  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris',
  })

  return (
    <PaywallGate>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-eq-text mb-1">
            Courses du jour
          </h1>
          <div className="flex items-center gap-3 text-sm text-eq-muted flex-wrap">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" />
              {today}
            </span>
            <span className="flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-eq-blue" />
              Temps variable
            </span>
            <span className="flex items-center gap-1.5">
              <Thermometer className="w-4 h-4" />
              France
            </span>
          </div>
        </div>

        {/* Type filter tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {TYPE_TABS.map(({ value, label }) => (
            <a
              key={value}
              href={value === 'all' ? '/dashboard' : `/dashboard?type=${value}`}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeType === value
                  ? 'bg-eq-violet text-white shadow-lg shadow-eq-violet/25'
                  : 'bg-eq-card border border-eq-border text-eq-muted hover:text-eq-text hover:border-eq-border-bright'
              }`}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Live race grid — client component with polling */}
        <Suspense fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-eq-card border border-eq-border rounded-xl p-5 h-52 animate-pulse">
                <div className="h-3 w-20 bg-eq-border rounded mb-3" />
                <div className="h-5 w-3/4 bg-eq-border rounded mb-6" />
                <div className="h-10 w-full bg-eq-border/60 rounded-lg" />
              </div>
            ))}
          </div>
        }>
          <LiveRacesGrid />
        </Suspense>

        <p className="text-center text-xs text-eq-muted mt-10">
          Les prédictions EquiPredict sont informatives et ne constituent pas des conseils de paris.
          Jouez de manière responsable — 18+
        </p>
      </div>
    </PaywallGate>
  )
}
