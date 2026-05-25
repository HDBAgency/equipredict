'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrendingUp, Menu, X } from 'lucide-react'
import { useState } from 'react'

const NAV_LINKS: { href: string; label: string }[] = []

export function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">

        <Link href="/" className="shrink-0" />

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 flex-1 ml-4">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? 'bg-eq-violet/15 text-eq-violet-light'
                  : 'text-eq-muted hover:text-eq-text hover:bg-eq-surface'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

{/* Mobile burger */}
        <button
          className="md:hidden p-2 rounded-lg text-eq-muted hover:text-eq-text hover:bg-eq-surface transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-eq-border bg-eq-surface/95 backdrop-blur-xl px-4 py-4 flex flex-col gap-2">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? 'bg-eq-violet/15 text-eq-violet-light'
                  : 'text-eq-muted hover:text-eq-text hover:bg-eq-card'
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="border-t border-eq-border pt-3 mt-1 flex flex-col gap-2">
            <Link href="/login" onClick={() => setOpen(false)} className="px-4 py-3 text-sm font-medium text-eq-muted text-center">
              CONNEXION
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
