'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Props {
  planId: string
  href: string
  label: string
  popular: boolean
}

export default function PricingCTAButton({ planId, href, label, popular }: Props) {
  const [resolvedHref, setResolvedHref] = useState(href)

  const PLAN_DASHBOARD: Record<string, string> = {
    free:    '/dashboard-gratuit',
    premium: '/dashboard-premium',
    pro:     '/dashboard-pro',
  }

  useEffect(() => {
    async function check() {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setResolvedHref(PLAN_DASHBOARD[planId] ?? href)
    }
    check()
  }, [planId, href])

  return (
    <Link
      href={resolvedHref}
      className={`block text-center font-bold py-5 rounded-xl text-lg transition-all ${
        popular
          ? 'bg-eq-green hover:bg-eq-green-light text-white hover:shadow-lg hover:shadow-eq-green/30'
          : 'bg-eq-surface border border-eq-border text-white hover:bg-eq-green hover:border-eq-green hover:shadow-lg hover:shadow-eq-green/30'
      }`}
    >
      {label}
    </Link>
  )
}
