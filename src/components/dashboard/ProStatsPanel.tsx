'use client'

import { BarChart2, TrendingUp, Trophy, MapPin, Percent, History } from 'lucide-react'

const STATS = [
  { icon: Trophy,     label: 'Taux de réussite IA',     value: '68%',  sub: '+4% ce mois',   color: 'text-eq-green'  },
  { icon: TrendingUp, label: 'Courses analysées',        value: '1 247', sub: 'depuis 2 ans',  color: 'text-eq-blue'   },
  { icon: Percent,    label: 'ROI moyen (simulation)',   value: '+12%', sub: 'sur 90 jours',  color: 'text-eq-amber'  },
  { icon: MapPin,     label: 'Hippodromes couverts',     value: '38',   sub: 'France entière', color: 'text-eq-green'  },
]

const TOP_JOCKEYS = [
  { name: 'C. Soumillon',   wins: 42, courses: 124, rate: '34%' },
  { name: 'M. Barzalona',   wins: 38, courses: 131, rate: '29%' },
  { name: 'O. Peslier',     wins: 35, courses: 130, rate: '27%' },
  { name: 'T. Bachelot',    wins: 31, courses: 129, rate: '24%' },
]

const TOP_HIPPODROMES = [
  { name: 'Longchamp',   rate: '71%', courses: 148 },
  { name: 'Chantilly',   rate: '69%', courses: 112 },
  { name: 'Deauville',   rate: '65%', courses: 98  },
  { name: 'Saint-Cloud', rate: '63%', courses: 87  },
]

export function ProStatsPanel() {
  return (
    <div className="mb-8 space-y-4">

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="bg-eq-card border border-eq-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-[11px] text-eq-muted">{label}</span>
            </div>
            <div className="text-2xl font-black text-white">{value}</div>
            <div className="text-[11px] text-eq-muted mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Comparaisons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

        {/* Top jockeys */}
        <div className="bg-eq-card border border-eq-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-eq-amber" />
            <h3 className="text-sm font-bold text-white">Top Jockeys — 90 jours</h3>
          </div>
          <div className="space-y-2.5">
            {TOP_JOCKEYS.map(({ name, wins, courses, rate }, i) => (
              <div key={name} className="flex items-center gap-3">
                <span className="text-xs text-eq-muted w-4 shrink-0">{i + 1}.</span>
                <span className="text-sm text-white flex-1">{name}</span>
                <span className="text-xs text-eq-muted shrink-0">{wins}V / {courses}S · <span className="text-eq-green font-bold">{rate}</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Top hippodromes */}
        <div className="bg-eq-card border border-eq-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-eq-blue" />
            <h3 className="text-sm font-bold text-white">Précision IA par hippodrome</h3>
          </div>
          <div className="space-y-2.5">
            {TOP_HIPPODROMES.map(({ name, rate, courses }) => (
              <div key={name} className="flex items-center gap-2">
                <span className="text-sm text-white flex-1 min-w-0 truncate">{name}</span>
                <span className="text-xs text-eq-muted shrink-0 hidden sm:inline">{courses} courses</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-bold text-eq-green w-9 text-right">{rate}</span>
                  <div className="w-16 sm:w-24 h-1.5 bg-eq-border rounded-full">
                    <div className="h-full bg-eq-green rounded-full" style={{ width: rate }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
