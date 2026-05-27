'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function LogoutButton() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [initials, setInitials] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    async function check() {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoggedIn(false); return }
      setLoggedIn(true)
      const { data: profile } = await supabase.from('profiles').select('name, avatar_url').eq('id', session.user.id).single()
      const name: string = profile?.name ?? session.user.email ?? ''
      setInitials(name.slice(0, 2).toUpperCase())
      setAvatarUrl(profile?.avatar_url ?? null)
    }
    check()
  }, [])

  async function handleLogout() {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loggedIn === null) return null

  if (!loggedIn) {
    return (
      <Link
        href="/login"
        className="px-4 py-2 rounded-xl text-sm font-black border border-white/20 hover:bg-eq-green hover:border-eq-green transition-all"
      >
        <span className="btn-connexion-text">CONNEXION</span>
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/compte"
        className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-sm font-black text-white border border-white/20 hover:border-eq-green transition-all"
        style={avatarUrl ? undefined : { background: 'linear-gradient(135deg, #064E3B, #10B981)' }}
        title="Mon compte"
      >
        {avatarUrl
          ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          : initials
        }
      </Link>
      <button
        onClick={handleLogout}
        className="px-4 py-2 rounded-xl text-sm font-black text-white border border-white/20 hover:bg-eq-red hover:border-eq-red transition-all"
      >
        DECONNEXION
      </button>
    </div>
  )
}
