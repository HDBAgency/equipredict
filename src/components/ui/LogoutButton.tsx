'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white border border-white/20 hover:bg-eq-green hover:border-eq-green transition-all"
    >
      <LogOut className="w-4 h-4" />
      Déconnexion
    </button>
  )
}
