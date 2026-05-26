import { Suspense } from 'react'
import { CalendarDays, CloudRain, Thermometer } from 'lucide-react'
import { LiveRacesGrid } from '@/components/dashboard/LiveRacesGrid'
import { PaywallGate } from '@/components/dashboard/PaywallGate'
import { DashboardTabs } from '@/components/dashboard/DashboardTabs'
import LogoutButton from '@/components/ui/LogoutButton'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const { type } = await searchParams
  const activeType = type ?? 'all'

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  let plan = 'free'
  if (session) {
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', session.user.id).single()
    plan = profile?.plan ?? 'free'
  }

  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris',
  })

  return (
    <>
      <div className="fixed top-0 right-0 z-50 p-4">
        <LogoutButton />
      </div>
      <PaywallGate>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-eq-text">COURSES DU JOUR</h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold text-white border border-white/20">
              GRATUIT
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-eq-muted flex-wrap">
            <span className="flex items-center gap-1.5 text-white">
              <CalendarDays className="w-4 h-4" />
              {today}
            </span>
            <span className="flex items-center gap-1.5 text-white">
              <CloudRain className="w-4 h-4 text-eq-blue" />
              Temps variable
            </span>
            <span className="flex items-center gap-1.5 text-white">
              <Thermometer className="w-4 h-4" />
              France
            </span>
          </div>
        </div>

        {/* Type filter tabs — masqués pour le plan gratuit */}
        <DashboardTabs activeType={activeType} />

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
          <LiveRacesGrid plan={plan} />
        </Suspense>

        <p className="text-center text-xs text-eq-muted mt-10">
          <strong className="text-white">Les prédictions EquiPredict sont informatives et ne constituent pas des conseils de paris.
          Jouez de manière responsable — 18+</strong>
        </p>
      </div>
    </PaywallGate>
    </>
  )
}
