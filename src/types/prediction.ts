import type { ConfidenceLevel } from './horse'

export interface AIAnalysisFactor {
  factor: string // ex: "Forme récente", "Compatibilité distance"
  score: number // 0-10
  weight: number // poids dans le score final (0-1)
  description: string // explication courte
  trend: 'positive' | 'negative' | 'neutral'
}

export interface PredictionTop3Entry {
  horseId: string
  horseName: string
  rank: 1 | 2 | 3
  probability: number // % de victoire estimée
  aiScore: number // 0-100
  confidenceLevel: ConfidenceLevel
  keyStrengths: string[] // ex: ["Forme excellente", "Terrain favorable"]
}

export interface Prediction {
  id: string
  raceId: string
  generatedAt: string // ISO 8601
  top3: PredictionTop3Entry[]
  analysisFactors: AIAnalysisFactor[]
  raceAnalysis: string // paragraphe d'analyse globale
  disclaimer: string
  modelVersion: string
}

// ─── Types enrichis pour la page de détail ───────────────────────────────────

export interface HorseFactorScores {
  recentForm: number
  distanceFit: number
  trackConditionFit: number
  jockeyPerformance: number
  trainerPerformance: number
  oddsMovement: number
  careerConsistency: number
  weighted: number // score final pondéré 0-10
}

export interface DetailedEntry extends PredictionTop3Entry {
  jockey: string
  trainer: string
  odds: number
  oddsChange: 'up' | 'down' | 'stable'
  age: number
  careerWins: number
  careerRaces: number
  winRate: number
  formPositions: number[] // [1, 2, 3, 1, 4] — 5 dernières
  factors: HorseFactorScores
  strengths: string[]
  warnings: string[]
  reasoning: string
}

export interface DetailedPrediction extends Prediction {
  detailedTop3: DetailedEntry[]
  betAdvice: { type: string; description: string; confidence: ConfidenceLevel }[]
}

// Facteurs utilisés par le moteur de scoring — à remplacer par un vrai modèle ML
export const SCORING_WEIGHTS = {
  recentForm: 0.30,
  distanceFit: 0.20,
  trackConditionFit: 0.15,
  jockeyPerformance: 0.10,
  trainerPerformance: 0.10,
  oddsMovement: 0.10,
  careerConsistency: 0.05,
} as const
