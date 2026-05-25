import { createBrowserClient } from '@supabase/ssr'

// Client côté navigateur — utilisé dans les composants client ("use client")
// Connecter ici à votre projet Supabase via les variables d'environnement
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
