import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { User, CreditCard, LogOut, FileText } from 'lucide-react'
import LogoutButton from '@/components/ui/LogoutButton'
import AvatarUpload from '@/components/ui/AvatarUpload'

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free:    { label: 'Gratuit',  color: 'text-white border-white/20' },
  premium: { label: 'Premium', color: 'text-eq-green border-eq-green/30' },
  pro:     { label: 'Pro',     color: 'text-eq-green border-eq-green/30' },
}

export default async function ComptePage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('name, plan, created_at, avatar_url').eq('id', session.user.id).single()

  const name: string = profile?.name ?? ''
  const plan: string = profile?.plan ?? 'free'
  const email: string = session.user.email ?? ''
  const avatarUrl: string | null = profile?.avatar_url ?? null
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
      <div className="max-w-lg mx-auto px-4 py-8 sm:py-16">

        {/* Avatar + nom */}
        <div className="flex flex-col items-center mb-10">
          <div className="mb-4">
            <AvatarUpload userId={session.user.id} initialUrl={avatarUrl} initials={initials || '?'} />
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
        {plan !== 'pro' && (
          <div className={`mt-6 flex gap-3 ${plan === 'free' ? 'flex-col sm:flex-row' : ''}`}>
            {plan === 'free' && (
              <a
                href="/pricing"
                className="flex-1 flex items-center justify-center py-3.5 rounded-xl font-bold text-white text-sm transition-all border border-eq-green hover:bg-eq-green/10"
              >
                Passer Premium
              </a>
            )}
            <a
              href="/pricing"
              className="btn-pro flex-1 flex items-center justify-center py-3.5 rounded-xl font-bold text-white text-sm transition-all"
            >
              Passer Pro
            </a>
          </div>
        )}

        {/* Mentions légales */}
        <div className="mt-6 bg-eq-card border border-eq-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-eq-surface border border-eq-border flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-eq-muted" />
            </div>
            <h2 className="text-sm font-bold text-white">Mentions légales</h2>
          </div>
          <ul className="space-y-2 text-sm text-white/70">
            <li><span className="font-semibold text-white">Éditeur :</span> HDB Agency</li>
            <li><span className="font-semibold text-white">Contact :</span>{' '}
              <a href="mailto:hmbt.hugo@gmail.com" className="text-eq-green hover:underline">hmbt.hugo@gmail.com</a>
            </li>
            <li><span className="font-semibold text-white">Hébergement :</span> Vercel Inc., États-Unis</li>
            <li className="pt-1 text-xs text-white/50 leading-relaxed">
              Les prédictions EquiPredict sont à titre informatif uniquement et ne constituent pas des conseils de paris.
              Jeu responsable — 18+
            </li>
          </ul>
          <Link
            href="/mentions-legales"
            className="inline-flex items-center gap-1.5 mt-4 text-xs text-eq-green hover:text-eq-green-light transition-colors font-semibold"
          >
            Lire les mentions complètes →
          </Link>
        </div>

      </div>
    </>
  )
}
