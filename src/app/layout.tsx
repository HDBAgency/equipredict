import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import SiteProtection from '@/components/ui/SiteProtection'
import ServiceWorkerRegistrar from '@/components/ui/ServiceWorkerRegistrar'

export const metadata: Metadata = {
  title: 'EquiPredict — Prédictions hippiques IA',
  description: "L'intelligence artificielle au service des courses hippiques. Analysez, prédisez, optimisez.",
  keywords: ['courses hippiques', 'prédictions', 'IA', 'PMU', 'trot', 'galop', 'obstacle'],
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EquiPredict',
  },
  openGraph: {
    title: 'EquiPredict',
    description: "Prédictions hippiques alimentées par l'IA",
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#10B981',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${GeistSans.variable} ${GeistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col text-eq-text antialiased bg-eq-bg overflow-x-hidden">
        <ServiceWorkerRegistrar />
        <SiteProtection />
        <Navbar />
        <main className="flex-1 pt-16 w-full overflow-x-hidden">{children}</main>
      </body>
    </html>
  )
}
