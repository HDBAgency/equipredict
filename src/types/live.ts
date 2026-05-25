import type { Race, OddsChange, ConfidenceLevel } from './index'

export interface LiveHorse {
  id: string
  name: string
  number: number
  jockey: string
  odds: number
  previousOdds: number
  oddsChange: OddsChange
  isFavorite: boolean
  aiScore: number
  winProbability: number
  confidenceLevel: ConfidenceLevel
  isRecommended: boolean
}

export interface LiveRace extends Race {
  horses: LiveHorse[]
  favorite: Pick<LiveHorse, 'name' | 'number' | 'odds' | 'oddsChange'> | null
}

export interface LiveResponse {
  races: LiveRace[]
  updatedAt: string
  source: 'pmu' | 'mock'
}
