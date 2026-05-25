import type { SubscriptionPlan } from './subscription'

export interface UserProfile {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  subscription: SubscriptionPlan
  createdAt: string
}
