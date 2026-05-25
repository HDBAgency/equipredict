import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

export const PLANS = {
  premium: {
    priceId: process.env.STRIPE_PRICE_PREMIUM!,
    plan: 'premium',
    label: 'Premium',
    amount: 1999,
  },
  pro: {
    priceId: process.env.STRIPE_PRICE_PRO!,
    plan: 'pro',
    label: 'Pro',
    amount: 4999,
  },
} as const
