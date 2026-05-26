'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LogoutButton() {
  const router = useRouter()
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    async function check() {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      setLoggedIn(!!session)
    }
    check()
  }, [])

  async function handleLogout() {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loggedIn === null) return null

  if (!loggedIn) {
    return (
      <Link
        href="/login"
        className="px-4 py-2 rounded-xl text-sm font-black text-white border border-white/20 hover:bg-white/10 transition-all"
      >
        CONNEXION
      </Link>
    )
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 rounded-xl text-sm font-black text-white border border-white/20 hover:bg-eq-red hover:border-eq-red transition-all"
    >
      DECONNEXION
    </button>
  )
}
