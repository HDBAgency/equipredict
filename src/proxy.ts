import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Routes protégées — l'utilisateur doit être connecté
// TODO: activer une fois Supabase configuré dans .env.local
const PROTECTED_ROUTES: string[] = [] // ['/dashboard', '/account']

// Routes protégées par abonnement Premium/Pro
// TODO: ajouter /api/predictions/* une fois l'auth Supabase activée
const PREMIUM_API_ROUTES = ['/api/predictions']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Crée un client Supabase en lecture des cookies de session
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Récupère la session de l'utilisateur
  const { data: { user } } = await supabase.auth.getUser()

  // Redirige vers /login si route protégée et non connecté
  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r))
  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirige vers le dashboard si déjà connecté et sur /login ou /register
  if (user && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard-gratuit', request.url))
  }

  // TODO: vérification du plan d'abonnement pour les routes premium API
  // const isPremiumRoute = PREMIUM_API_ROUTES.some(r => pathname.startsWith(r))
  // if (isPremiumRoute && user) {
  //   const { data: sub } = await supabase.from('subscriptions').select('plan').eq('user_id', user.id).single()
  //   if (sub?.plan === 'free') {
  //     return NextResponse.json({ error: 'Abonnement Premium requis' }, { status: 403 })
  //   }
  // }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Exclut les fichiers statiques et les routes internes Next.js
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
