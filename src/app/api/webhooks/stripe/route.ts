import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

// Supabase admin client (service role) pour mettre à jour le plan
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook signature invalide' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.metadata?.supabase_user_id
    const plan = session.metadata?.plan

    if (userId && plan) {
      await supabaseAdmin
        .from('profiles')
        .update({ plan })
        .eq('id', userId)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object
    const userId = sub.metadata?.supabase_user_id
    if (userId) {
      await supabaseAdmin
        .from('profiles')
        .update({ plan: 'free' })
        .eq('id', userId)
    }
  }

  return NextResponse.json({ received: true })
}
