import type { TrackCondition, RaceType } from './race'

export type ConfidenceLevel = 'faible' | 'moyen' | 'fort'
export type FormRating = 'excellent' | 'bon' | 'moyen' | 'mauvais'
export type OddsChange = 'up' | 'down' | 'stable'

export interface HorseFormEntry {
  position: number // place à l'arrivée (0 = non classé)
  date: string // YYYY-MM-DD
  racecourse: string
  distance: number
  trackCondition: TrackCondition
  raceType: RaceType
  opponents: number // nombre de partants
}

export interface Horse {
  id: string
  raceId: string
  number: number // numéro de selle
  name: string
  jockey: string
  trainer: string
  owner: string
  age: number // années
  weight: number // kg
  odds: number // cote actuelle (ex: 3.5 = 7/2)
  oddsChange: OddsChange // évolution de la cote
  recentForm: HorseFormEntry[] // 5 dernières courses
  formRating: FormRating
  careerWins: number
  careerRaces: number
  winRate: number // 0-100 %
  earnings: number // gains carrière en euros
  preferredDistanceMin: number // distance minimale préférée
  preferredDistanceMax: number // distance maximale préférée
  preferredConditions: TrackCondition[]
  similarTrackWins: number // victoires sur terrain similaire
  similarTrackRaces: number // courses sur terrain similaire
  aiScore: number // score IA 0-100
  winProbability: number // probabilité de victoire 0-100 %
  confidenceLevel: ConfidenceLevel
  isRecommended: boolean
}

export type CreateHorsePayload = Omit<Horse, 'id'>
