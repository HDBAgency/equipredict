'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const NAV_LINKS: { href: string; label: string }[] = []

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const isDashboard = pathname === '/' || pathname.startsWith('/dashboard-gratuit') || pathname.startsWith('/dashboard-premium') || pathname.startsWith('/dashboard-pro') || pathname.startsWith('/pricing')

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none" style={{ background: 'transparent' }}>
      {/* Logo — top left */}
      <div className="absolute top-0 left-0 p-4 pointer-events-auto">
        <Link href="/" className="flex items-center px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10 transition-all">
          <span className="text-sm font-black text-white">Equi<span style={{ background: 'linear-gradient(135deg, #10B981, #34D399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Predict</span></span>
        </Link>
      </div>

      {/* CONNEXION — top right */}
      {!isDashboard && !loggedIn && (
        <div className="absolute top-0 right-0 p-4 pointer-events-auto">
          <Link href="/login" className="px-3 sm:px-5 py-2 border border-white/20 rounded-xl text-xs sm:text-sm font-bold text-white hover:bg-eq-green hover:border-eq-green transition-all block">
            CONNEXION
          </Link>
        </div>
      )}

    </header>
  )
}
