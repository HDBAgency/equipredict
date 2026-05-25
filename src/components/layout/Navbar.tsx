'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const NAV_LINKS: { href: string; label: string }[] = []

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent pointer-events-none">
      {/* Logo — top left */}
      <div className="absolute top-0 left-0 p-4 pointer-events-auto">
        <Link href="/" className="flex items-center px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10 transition-all">
          <span className="text-sm font-black text-white">Equi<span style={{ background: 'linear-gradient(135deg, #10B981, #34D399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Predict</span></span>
        </Link>
      </div>

      {/* CONNEXION — top right (desktop) */}
      {!isDashboard && !loggedIn && (
        <div className="absolute top-0 right-0 p-4 pointer-events-auto hidden md:block">
          <Link href="/login" className="px-5 py-2 border border-white/20 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-all block">
            CONNEXION
          </Link>
        </div>
      )}

      {/* Mobile burger */}
      <div className="absolute top-0 right-0 p-4 pointer-events-auto md:hidden">
        <button
          className="p-2 rounded-lg text-eq-muted hover:text-eq-text hover:bg-eq-surface transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-eq-border bg-eq-surface/95 backdrop-blur-xl px-4 py-4 flex flex-col gap-2">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="px-4 py-3 rounded-lg text-sm font-medium text-eq-muted hover:text-eq-text hover:bg-eq-card transition-colors"
            >
              {label}
            </Link>
          ))}
          <div className="border-t border-eq-border pt-3 mt-1 flex flex-col gap-2">
            {!loggedIn && (
              <Link href="/login" onClick={() => setOpen(false)} className="px-4 py-3 text-sm font-medium text-eq-muted text-center">
                CONNEXION
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
