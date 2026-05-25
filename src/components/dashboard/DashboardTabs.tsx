'use client'

import { useEffect, useState } from 'react'
import type { RaceType } from '@/types'

const TYPE_TABS: { value: RaceType | 'all'; label: string }[] = [
  { value: 'all',          label: 'Toutes'   },
  { value: 'plat',         label: 'Plat'     },
  { value: 'trot',         label: 'Trot'     },
  { value: 'obstacle',     label: 'Obstacle' },
  { value: 'steeplechase', label: 'Steeple'  },
]

export function DashboardTabs({ activeType }: { activeType: string }) {
  const [plan, setPlan] = useState<string | null>(null)

  useEffect(() => {
    async function loadPlan() {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('plan').eq('id', session.user.id).single()
        setPlan(profile?.plan ?? 'free')
      }
    }
    loadPlan()
  }, [])

  if (plan === 'free') return null

  return (
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
      {TYPE_TABS.map(({ value, label }) => (
        <a
          key={value}
          href={value === 'all' ? '/dashboard-gratuit' : `/dashboard-gratuit?type=${value}`}
          className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeType === value
              ? 'bg-eq-green text-white shadow-lg shadow-eq-green/25'
              : 'bg-eq-card border border-eq-border text-eq-muted hover:text-eq-text hover:border-eq-border-bright'
          }`}
        >
          {label}
        </a>
      ))}
    </div>
  )
}
