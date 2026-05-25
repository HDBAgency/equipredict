import Link from 'next/link'
import { TrendingUp, Shield } from 'lucide-react'

const LINKS = {
  Produit: [
    { href: '/dashboard-gratuit', label: 'Dashboard' },
    { href: '/pricing', label: 'Tarifs' },
    { href: '/courses/race-001', label: 'Exemple de course' },
  ],
  Compte: [
    { href: '/login', label: 'Se connecter' },
    { href: '/register', label: 'S\'inscrire' },
    { href: '/account', label: 'Mon compte' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-eq-border bg-eq-surface/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-eq-violet flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">Equi<span className="text-gradient">Predict</span></span>
            </Link>
            <p className="text-eq-muted text-sm leading-relaxed max-w-xs">
              L&apos;intelligence artificielle au service des courses hippiques.
              Analysez. Prédisez. Optimisez.
            </p>
            <div className="flex items-center gap-2 mt-4 text-xs text-eq-muted border border-eq-border rounded-lg px-3 py-2 w-fit">
              <Shield className="w-3.5 h-3.5 text-eq-amber" />
              Jeu responsable — 18+ — Joueurs Info Service : 09 74 75 13 13
            </div>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([section, items]) => (
            <div key={section}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-eq-muted mb-4">{section}</h3>
              <ul className="space-y-2.5">
                {items.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-eq-muted hover:text-eq-text transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-eq-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-eq-muted">
          <span>© 2026 EquiPredict. Tous droits réservés.</span>
          <span className="text-center">
            Les prédictions sont informatives et ne garantissent aucun résultat. Jouez responsable.
          </span>
        </div>
      </div>
    </footer>
  )
}
