export type SubscriptionPlan = 'free' | 'premium' | 'pro'

export interface PlanFeatures {
  dailyRaceLimit: number | null // null = illimité
  predictionsAccess: boolean
  advancedStats: boolean
  historicalData: boolean
  alertsEnabled: boolean
  exportEnabled: boolean
}

export const PLAN_FEATURES: Record<SubscriptionPlan, PlanFeatures> = {
  free: {
    dailyRaceLimit: 3,
    predictionsAccess: false,
    advancedStats: false,
    historicalData: false,
    alertsEnabled: false,
    exportEnabled: false,
  },
  premium: {
    dailyRaceLimit: null,
    predictionsAccess: true,
    advancedStats: false,
    historicalData: true,
    alertsEnabled: true,
    exportEnabled: false,
  },
  pro: {
    dailyRaceLimit: null,
    predictionsAccess: true,
    advancedStats: true,
    historicalData: true,
    alertsEnabled: true,
    exportEnabled: true,
  },
}

export const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  free: 0,
  premium: 19.99,
  pro: 49.99,
}

export interface Subscription {
  id: string
  userId: string
  plan: SubscriptionPlan
  startDate: string
  endDate: string | null
  isActive: boolean
}
