import type { Horse, Race, Prediction, PredictionTop3Entry, AIAnalysisFactor } from '@/types'
import { SCORING_WEIGHTS } from '@/types'
import {
  scoreRecentForm,
  scoreDistanceFit,
  scoreTrackCondition,
  scoreOddsMovement,
  scoreCareerConsistency,
  scoreJockey,
  scoreTrainer,
} from './factors'

interface RawScore {
  horse: Horse
  components: {
    recentForm: number
    distanceFit: number
    trackConditionFit: number
    jockeyPerformance: number
    trainerPerformance: number
    oddsMovement: number
    careerConsistency: number
  }
  rawTotal: number
}

// Calcule le score brut pondéré pour un cheval
function computeRawScore(horse: Horse, race: Race): RawScore {
  const components = {
    recentForm: scoreRecentForm(horse.recentForm),
    distanceFit: scoreDistanceFit(race.distance, horse.preferredDistanceMin, horse.preferredDistanceMax),
    trackConditionFit: scoreTrackCondition(race.trackCondition, horse.preferredConditions),
    jockeyPerformance: scoreJockey(horse.jockey),
    trainerPerformance: scoreTrainer(horse.trainer),
    oddsMovement: scoreOddsMovement(horse.oddsChange),
    careerConsistency: scoreCareerConsistency(horse.winRate, horse.careerRaces),
  }

  const rawTotal =
    components.recentForm * SCORING_WEIGHTS.recentForm +
    components.distanceFit * SCORING_WEIGHTS.distanceFit +
    components.trackConditionFit * SCORING_WEIGHTS.trackConditionFit +
    components.jockeyPerformance * SCORING_WEIGHTS.jockeyPerformance +
    components.trainerPerformance * SCORING_WEIGHTS.trainerPerformance +
    components.oddsMovement * SCORING_WEIGHTS.oddsMovement +
    components.careerConsistency * SCORING_WEIGHTS.careerConsistency

  return { horse, components, rawTotal }
}

// Convertit les scores bruts en probabilités de victoire (softmax)
function computeWinProbabilities(scores: RawScore[]): Map<string, number> {
  const maxScore = Math.max(...scores.map(s => s.rawTotal))
  const exp = scores.map(s => ({ id: s.horse.id, e: Math.exp(s.rawTotal - maxScore) }))
  const total = exp.reduce((sum, e) => sum + e.e, 0)
  const probs = new Map<string, number>()
  exp.forEach(e => probs.set(e.id, (e.e / total) * 100))
  return probs
}

// Normalise un score brut (0-10) en score affiché (0-100)
function normalize(rawTotal: number): number {
  return Math.round(Math.min(100, Math.max(0, rawTotal * 10)))
}

function getConfidenceLevel(aiScore: number): Horse['confidenceLevel'] {
  if (aiScore >= 70) return 'fort'
  if (aiScore >= 50) return 'moyen'
  return 'faible'
}

const DISCLAIMER =
  "Ces prédictions sont générées par un algorithme d'analyse statistique et sont fournies à titre informatif uniquement. Elles ne constituent pas des conseils de paris et ne garantissent aucun résultat. Jouez de manière responsable."

// ─── Point d'entrée principal ─────────────────────────────────────────────
// À appeler après avoir récupéré les données réelles depuis l'API hippique.
// Signature identique à conserver lors de l'intégration d'un modèle ML externe.
export function generatePrediction(race: Race, horses: Horse[]): Prediction {
  if (!horses.length) {
    throw new Error(`Aucun cheval pour la course ${race.id}`)
  }

  const rawScores = horses.map(h => computeRawScore(h, race))
  const probabilities = computeWinProbabilities(rawScores)

  // Enrichit chaque cheval avec son score IA et sa probabilité
  const scored = rawScores
    .map(rs => ({
      ...rs,
      aiScore: normalize(rs.rawTotal),
      probability: probabilities.get(rs.horse.id) ?? 0,
    }))
    .sort((a, b) => b.aiScore - a.aiScore)

  // Top 3
  const top3: PredictionTop3Entry[] = scored.slice(0, 3).map((s, i) => ({
    horseId: s.horse.id,
    horseName: s.horse.name,
    rank: (i + 1) as 1 | 2 | 3,
    probability: Math.round(s.probability * 10) / 10,
    aiScore: s.aiScore,
    confidenceLevel: getConfidenceLevel(s.aiScore),
    keyStrengths: buildKeyStrengths(s.components),
  }))

  // Facteurs d'analyse agrégés sur toute la course
  const analysisFactors: AIAnalysisFactor[] = buildAnalysisFactors(
    rawScores,
    race
  )

  return {
    id: `pred-${race.id}-${Date.now()}`,
    raceId: race.id,
    generatedAt: new Date().toISOString(),
    top3,
    analysisFactors,
    raceAnalysis: buildRaceAnalysis(race, scored),
    disclaimer: DISCLAIMER,
    modelVersion: '1.0.0',
  }
}

function buildKeyStrengths(components: RawScore['components']): string[] {
  const strengths: string[] = []
  if (components.recentForm >= 8) strengths.push('Forme récente excellente')
  if (components.distanceFit >= 9) strengths.push('Distance idéale')
  if (components.trackConditionFit >= 9) strengths.push('Terrain parfaitement adapté')
  if (components.jockeyPerformance >= 9) strengths.push('Jockey de très haut niveau')
  if (components.trainerPerformance >= 9) strengths.push('Entraîneur en grande forme')
  if (components.oddsMovement === 9) strengths.push('Cote en forte baisse')
  if (components.careerConsistency >= 8) strengths.push('Régularité exemplaire en carrière')
  return strengths.length ? strengths : ['Profil complet et équilibré']
}

function buildAnalysisFactors(scores: RawScore[], race: Race): AIAnalysisFactor[] {
  const avg = (key: keyof RawScore['components']) =>
    scores.reduce((s, r) => s + r.components[key], 0) / scores.length

  return [
    {
      factor: 'Forme récente',
      score: Math.round(avg('recentForm') * 10) / 10,
      weight: SCORING_WEIGHTS.recentForm,
      description: `Analyse des 5 dernières courses des ${scores.length} partants.`,
      trend: avg('recentForm') >= 6 ? 'positive' : 'neutral',
    },
    {
      factor: 'Compatibilité distance',
      score: Math.round(avg('distanceFit') * 10) / 10,
      weight: SCORING_WEIGHTS.distanceFit,
      description: `Distance de ${race.distance}m vs. préférences des partants.`,
      trend: avg('distanceFit') >= 7 ? 'positive' : 'neutral',
    },
    {
      factor: 'Condition de terrain',
      score: Math.round(avg('trackConditionFit') * 10) / 10,
      weight: SCORING_WEIGHTS.trackConditionFit,
      description: `Terrain ${race.trackCondition} — impact sur les spécialistes.`,
      trend: avg('trackConditionFit') >= 7 ? 'positive' : 'negative',
    },
    {
      factor: 'Performance jockey',
      score: Math.round(avg('jockeyPerformance') * 10) / 10,
      weight: SCORING_WEIGHTS.jockeyPerformance,
      description: 'Qualité et forme récente des jockeys/drivers engagés.',
      trend: avg('jockeyPerformance') >= 7 ? 'positive' : 'neutral',
    },
    {
      factor: 'Performance entraîneur',
      score: Math.round(avg('trainerPerformance') * 10) / 10,
      weight: SCORING_WEIGHTS.trainerPerformance,
      description: 'Forme et palmarès des entraîneurs sur la période récente.',
      trend: avg('trainerPerformance') >= 7 ? 'positive' : 'neutral',
    },
    {
      factor: 'Évolution des cotes',
      score: Math.round(avg('oddsMovement') * 10) / 10,
      weight: SCORING_WEIGHTS.oddsMovement,
      description: 'Tendance des marchés des paris comme signal d\'information.',
      trend: avg('oddsMovement') >= 6 ? 'positive' : 'negative',
    },
    {
      factor: 'Régularité carrière',
      score: Math.round(avg('careerConsistency') * 10) / 10,
      weight: SCORING_WEIGHTS.careerConsistency,
      description: 'Taux de victoires en carrière et nombre de courses disputées.',
      trend: avg('careerConsistency') >= 6 ? 'positive' : 'neutral',
    },
  ]
}

function buildRaceAnalysis(
  race: Race,
  scored: Array<{ horse: Horse; aiScore: number; probability: number }>
): string {
  const [first, second, third] = scored
  if (!first || !second || !third) return 'Analyse indisponible.'
  return (
    `Le ${race.name} sur ${race.distance}m (${race.trackCondition}, ${race.weather}) ` +
    `présente ${race.numberOfRunners} partants. Notre modèle identifie ${first.horse.name} ` +
    `comme favori (score IA ${first.aiScore}/100, probabilité ${first.probability.toFixed(1)}%) ` +
    `devant ${second.horse.name} (${second.aiScore}/100) et ${third.horse.name} ` +
    `(${third.aiScore}/100). ${
      race.trackCondition === 'lourd' || race.trackCondition === 'très lourd'
        ? 'Les conditions de terrain lourdes favorisent les spécialistes identifiés.'
        : 'Les conditions sont standard et favorisent les chevaux en forme.'
    }`
  )
}
