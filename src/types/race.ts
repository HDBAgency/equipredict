export type RaceType = 'plat' | 'trot' | 'obstacle' | 'steeplechase'
export type TrackCondition = 'souple' | 'bon' | 'léger' | 'lourd' | 'très lourd'
export type WeatherCondition = 'ensoleillé' | 'nuageux' | 'pluvieux' | 'venteux'
export type RaceStatus = 'upcoming' | 'live' | 'completed'

export interface Race {
  id: string
  name: string
  racecourse: string
  startTime: string // ISO 8601
  raceType: RaceType
  distance: number // mètres
  trackCondition: TrackCondition
  weather: WeatherCondition
  temperature: number // °C
  numberOfRunners: number
  prize: number // euros
  date: string // YYYY-MM-DD
  status: RaceStatus
  raceNumber: number
  category: string // ex: "Groupe I", "Handicap", "Listed"
}

// Payload de création (sans id géré par la BDD)
export type CreateRacePayload = Omit<Race, 'id'>
