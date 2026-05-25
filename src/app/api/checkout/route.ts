import { NextRequest, NextResponse } from 'next/server'
import { stripe, PLANS } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { plan } = await req.json() as { plan: 'premium' | 'pro' }

  if (!PLANS[plan]) {
    return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const origin = req.headers.get('origin') ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
    success_url: `${origin}/dashboard-${plan}?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
    customer_email: user?.email,
    metadata: {
      supabase_user_id: user?.id ?? '',
      plan,
    },
    subscription_data: {
      metadata: {
        supabase_user_id: user?.id ?? '',
        plan,
      },
    },
  })

  return NextResponse.json({ url: session.url })
}
