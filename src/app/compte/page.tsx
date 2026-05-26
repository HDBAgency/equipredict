import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { User, CreditCard, LogOut } from 'lucide-react'
import LogoutButton from '@/components/ui/LogoutButton'

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free:    { label: 'Gratuit',  color: 'text-white border-white/20' },
  premium: { label: 'Premium', color: 'text-eq-green border-eq-green/40' },
  pro:     { label: 'Pro',     color: 'text-purple-400 border-purple-400/40' },
}

export default async function ComptePage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('name, plan, created_at').eq('id', session.user.id).single()

  const name: string = profile?.name ?? ''
  const plan: string = profile?.plan ?? 'free'
  const email: string = session.user.email ?? ''
  const initials = name.slice(0, 2).toUpperCase()
  const createdAt = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  const planInfo = PLAN_LABELS[plan] ?? PLAN_LABELS.free

  return (
    <>
      <div className="fixed top-0 right-0 z-50 p-4">
        <LogoutButton />
      </div>
      <div className="max-w-lg mx-auto px-4 py-16">

        {/* Avatar + nom */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-white mb-4"
            style={{ background: 'linear-gradient(135deg, #064E3B, #10B981)' }}
          >
            {initials || <User className="w-8 h-8" />}
          </div>
          <h1 className="text-2xl font-black text-white">{name || 'Mon compte'}</h1>
          <p className="text-eq-muted text-sm mt-1">{email}</p>
          <span className={`mt-3 px-3 py-1 rounded-full text-xs font-bold border ${planInfo.color}`}>
            {planInfo.label}
          </span>
        </div>

        {/* Infos */}
        <div className="bg-eq-card border border-eq-border rounded-2xl divide-y divide-eq-border">
          <div className="flex items-center gap-4 px-6 py-4">
            <User className="w-5 h-5 text-eq-muted shrink-0" />
            <div>
              <p className="text-xs text-eq-muted">Prénom</p>
              <p className="text-sm font-semibold text-white">{name || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-6 py-4">
            <CreditCard className="w-5 h-5 text-eq-muted shrink-0" />
            <div>
              <p className="text-xs text-eq-muted">Abonnement</p>
              <p className={`text-sm font-bold ${planInfo.color.split(' ')[0]}`}>{planInfo.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-6 py-4">
            <LogOut className="w-5 h-5 text-eq-muted shrink-0" />
            <div>
              <p className="text-xs text-eq-muted">Membre depuis</p>
              <p className="text-sm font-semibold text-white">{createdAt}</p>
            </div>
          </div>
        </div>

        {/* CTA upgrade */}
        {plan === 'free' && (
          <a
            href="/pricing"
            className="mt-6 flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all hover:shadow-lg hover:shadow-eq-green/25"
            style={{ background: 'linear-gradient(135deg, #064E3B, #10B981)' }}
          >
            Passer Premium
          </a>
        )}
      </div>
    </>
  )
}
