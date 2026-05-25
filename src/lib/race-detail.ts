import type {
  Race, Horse, HorseFormEntry, TrackCondition, RaceType,
  ConfidenceLevel, FormRating, RaceStatus, WeatherCondition,
} from '@/types'
import type { DetailedPrediction, DetailedEntry, HorseFactorScores } from '@/types/prediction'
import { SCORING_WEIGHTS } from '@/types/prediction'
import { generatePrediction } from '@/lib/scoring/engine'
import {
  scoreRecentForm, scoreDistanceFit, scoreTrackCondition,
  scoreOddsMovement, scoreCareerConsistency, scoreJockey, scoreTrainer,
} from '@/lib/scoring/factors'
import { MOCK_RACES, getHorsesByRaceId } from '@/lib/mock-data'

// ─── PMU helpers ──────────────────────────────────────────────────────────────

const PMU_BASE = 'https://online.turfinfo.api.pmu.fr/rest/client/61/programme'

function pad(n: number) { return String(n).padStart(2, '0') }
function toDDMMYYYY(d: Date) { return `${pad(d.getDate())}${pad(d.getMonth() + 1)}${d.getFullYear()}` }

function toTitle(s: string): string {
  return s.toLowerCase().replace(/(?:^|[\s-])\S/g, c => c.toUpperCase()).trim()
}

// Normalise un nom d'entraîneur/jockey depuis les formats PMU ("D.ARTU (S)" → "D. Artu")
function normalizeName(raw: unknown): string {
  if (!raw || typeof raw !== 'string') return '—'
  // Retire les suffixes entre parenthèses "(S)", "(A)", etc.
  const clean = raw.replace(/\([^)]*\)/g, '').trim()
  return toTitle(clean)
}

async function pmuGet(url: string): Promise<unknown | null> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
      signal: ctrl.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return null
    return await res.json()
  } catch {
    clearTimeout(timer)
    return null
  }
}

const SPECIALITE_MAP: Record<string, RaceType> = {
  TROT_ATTELE: 'trot', TROT_MONTE: 'trot', ATTELE: 'trot', MONTE: 'trot',
  PLAT: 'plat',
  HAIES: 'obstacle',
  CROSS: 'steeplechase', STEEPLECHASE: 'steeplechase', CROSS_COUNTRY: 'steeplechase',
  OBSTACLE: 'obstacle',
}

const CONDITION_MAP: Record<string, TrackCondition> = {
  BON: 'bon', 'BON SOUPLE': 'souple', BON_SOUPLE: 'souple',
  SOUPLE: 'souple', LEGER: 'léger', LOURD: 'lourd',
  'TRES LOURD': 'très lourd', TRES_LOURD: 'très lourd',
}

const STATUS_MAP: Record<string, RaceStatus> = {
  PROGRAMMEE: 'upcoming', DEPART_IMMINENT: 'live', EN_COURS: 'live',
  ARRIVEE: 'completed', ARRIVEE_DEFINITIVE: 'completed',
}

const METEO_MAP: Record<string, WeatherCondition> = {
  BEAU_TEMPS: 'ensoleillé', SOLEIL: 'ensoleillé', BEAU: 'ensoleillé',
  NUAGEUX: 'nuageux', COUVERT: 'nuageux',
  PLUIE: 'pluvieux', PLUVIEUX: 'pluvieux', AVERSES: 'pluvieux',
  VENT: 'venteux', VENTEUX: 'venteux',
}

// ─── Parsing musique PMU ──────────────────────────────────────────────────────
//
// Format PMU: chaque caractère = un résultat de course (du plus récent au plus ancien)
//   1-9  = position exacte
//   p/P  = placé (2e ou 3e, non explicité — estimé à 2.5)
//   0    = non classé / hors des premières positions → traité comme 11e
//   a/A  = absent (non partant) → ignoré (ne compte pas)
//   D/d  = disqualifié → position 0 (mauvais)
//   T/t  = tombé (obstacles) → position 0
//   N/n  = non partant → ignoré

function parseMusiquePositions(musique: string | undefined): number[] {
  if (!musique) return []
  // Retire les groupes entre parenthèses (infos de course dans le trot : "(2100a)")
  const clean = musique.replace(/\([^)]*\)/g, '').trim()
  const positions: number[] = []

  for (const ch of clean) {
    if (positions.length >= 10) break
    if (ch === 'p' || ch === 'P') {
      // Placé (2e ou 3e) — on estime à 2 pour le scoring
      positions.push(2)
    } else if (ch >= '1' && ch <= '9') {
      positions.push(parseInt(ch))
    } else if (ch === '0') {
      // Non classé → mauvais résultat (11e par convention)
      positions.push(11)
    } else if ('DdTt'.includes(ch)) {
      // Disqualifié / Tombé → 0 = cas spécial (traité comme pire)
      positions.push(0)
    } else if ('AaNn '.includes(ch)) {
      // Absent / Non partant → on ne compte pas cette sortie
    }
    // Autres caractères (séparateurs éventuels) ignorés
  }
  return positions
}

function buildFormFromMusique(
  positions: number[],
  raceDistance: number,
  raceCondition: TrackCondition,
  raceType: RaceType,
): HorseFormEntry[] {
  return positions.map((pos, idx) => ({
    position: pos,
    date: new Date(Date.now() - (idx + 1) * 21 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    racecourse: 'Inconnu',
    distance: raceDistance,
    trackCondition: raceCondition,
    raceType,
    opponents: 10,
  }))
}

// Dérive une plage de distance préférée à partir des stats de carrière.
// Sans historique détaillé des distances, on utilise le taux de victoire comme proxy :
// un cheval qui gagne souvent est probablement adapté ; sinon on élargit la plage.
function derivePreferredDistance(
  currentDistance: number,
  winRate: number,
  careerRaces: number,
): { min: number; max: number } {
  if (careerRaces < 3) return { min: currentDistance * 0.80, max: currentDistance * 1.20 }
  if (winRate >= 30) return { min: currentDistance * 0.88, max: currentDistance * 1.12 }
  if (winRate >= 15) return { min: currentDistance * 0.82, max: currentDistance * 1.18 }
  // Faible taux de victoire : le cheval est peut-être hors de sa distance optimale
  return { min: currentDistance * 0.75, max: currentDistance * 1.25 }
}

// ─── PMU participant → Horse ──────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseParticipantToHorse(p: any, raceId: string, idx: number, race: Race): Horse & { pmuComment?: string } {
  const numPmu: number = Number(p.numPmu ?? idx + 1)

  // ── Cotes : comparaison direct vs référence pour l'évolution réelle ─────────
  const drr = p.dernierRapportDirect
  const drRef = p.dernierRapportReference
  const directOdds: number = typeof drr?.rapport === 'number' && drr.rapport > 0 ? drr.rapport : 99
  const refOdds: number    = typeof drRef?.rapport === 'number' && drRef.rapport > 0 ? drRef.rapport : directOdds

  const odds: number = directOdds < 90 ? directOdds : 99
  const oddsChange: 'up' | 'down' | 'stable' =
    directOdds < refOdds * 0.93 ? 'down' :
    directOdds > refOdds * 1.07 ? 'up' : 'stable'

  // ── Jockey / Driver / Entraîneur ─────────────────────────────────────────────
  const jockeyRaw: string = p.driver ?? p.jockey ?? p.nomDriver ?? p.nomJockey ?? '—'
  const trainerRaw = p.entraineur  // string dans l'API PMU ("D.ARTU (S)")

  // ── Carrière ─────────────────────────────────────────────────────────────────
  const careerWins: number   = Number(p.nombreVictoires ?? 0)
  const careerPlaces: number = Number(p.nombrePlaces ?? 0)     // total classements (inclut victoires)
  const careerRaces: number  = Number(p.nombreCourses ?? 0) || Math.max(careerWins * 5, 5)
  const winRate: number      = Math.round((careerWins / careerRaces) * 100)
  const placeRate: number    = Math.round((careerPlaces / careerRaces) * 100)

  // ── Forme (musique) ───────────────────────────────────────────────────────────
  const positions = parseMusiquePositions(p.musique)
  const recentForm: HorseFormEntry[] = buildFormFromMusique(positions, race.distance, race.trackCondition, race.raceType)

  const firstPos = positions[0] ?? -1
  const formRating: FormRating =
    firstPos === 1               ? 'excellent' :
    firstPos > 0 && firstPos <= 3 ? 'bon' :
    firstPos > 3 && firstPos < 11 ? 'moyen' : 'mauvais'

  // ── Distance préférée ─────────────────────────────────────────────────────────
  const { min: prefMin, max: prefMax } = derivePreferredDistance(race.distance, winRate, careerRaces)

  // ── Terrain préféré ───────────────────────────────────────────────────────────
  // Heuristique : si bon taux de place, on suppose polyvalence ; sinon on restreint
  const preferredConditions: TrackCondition[] = placeRate >= 35
    ? ['bon', 'léger', 'souple', race.trackCondition]
    : [race.trackCondition]

  // ── Gains (indicateur de classe) ─────────────────────────────────────────────
  const gains = p.gainsParticipant
  const earningsCareer: number = Number(gains?.gainsCarriere ?? 0)

  // ── Commentaire GENY post-course ─────────────────────────────────────────────
  const pmuComment: string | undefined = p.commentaireApresCourse?.texte

  return {
    id: `${raceId}-h${numPmu}`,
    raceId,
    number: numPmu,
    name: toTitle(p.nom ?? `Partant ${numPmu}`),
    jockey: normalizeName(jockeyRaw),
    trainer: normalizeName(trainerRaw),
    owner: normalizeName(p.proprietaire),
    age: Number(p.age ?? 4),
    weight: Number(p.poidsConditionMonte ?? p.handicapPoids ?? 600),
    odds,
    oddsChange,
    recentForm,
    formRating,
    careerWins,
    careerRaces,
    winRate,
    earnings: earningsCareer,
    preferredDistanceMin: Math.round(prefMin),
    preferredDistanceMax: Math.round(prefMax),
    preferredConditions: [...new Set(preferredConditions)],
    similarTrackWins: 0,
    similarTrackRaces: 0,
    aiScore: 50,
    winProbability: 0,
    confidenceLevel: 'moyen',
    isRecommended: false,
    pmuComment,
  }
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function computeHorseFactorScores(horse: Horse, race: Race): HorseFactorScores {
  const recentForm   = scoreRecentForm(horse.recentForm)
  const distanceFit  = scoreDistanceFit(race.distance, horse.preferredDistanceMin, horse.preferredDistanceMax)
  const trackCondFit = scoreTrackCondition(race.trackCondition, horse.preferredConditions)
  const jockeyPerf   = scoreJockey(horse.jockey)
  const trainerPerf  = scoreTrainer(horse.trainer)
  const oddsMov      = scoreOddsMovement(horse.oddsChange)
  const careerCons   = scoreCareerConsistency(horse.winRate, horse.careerRaces)

  const weighted =
    recentForm   * SCORING_WEIGHTS.recentForm +
    distanceFit  * SCORING_WEIGHTS.distanceFit +
    trackCondFit * SCORING_WEIGHTS.trackConditionFit +
    jockeyPerf   * SCORING_WEIGHTS.jockeyPerformance +
    trainerPerf  * SCORING_WEIGHTS.trainerPerformance +
    oddsMov      * SCORING_WEIGHTS.oddsMovement +
    careerCons   * SCORING_WEIGHTS.careerConsistency

  return {
    recentForm:         Math.round(recentForm   * 10) / 10,
    distanceFit:        Math.round(distanceFit  * 10) / 10,
    trackConditionFit:  Math.round(trackCondFit * 10) / 10,
    jockeyPerformance:  Math.round(jockeyPerf   * 10) / 10,
    trainerPerformance: Math.round(trainerPerf  * 10) / 10,
    oddsMovement:       Math.round(oddsMov      * 10) / 10,
    careerConsistency:  Math.round(careerCons   * 10) / 10,
    weighted:           Math.round(weighted     * 10) / 10,
  }
}

function computeAllScores(race: Race, horses: Horse[]): Horse[] {
  const rawScores = horses.map(h => {
    const f = computeHorseFactorScores(h, race)
    return { horse: h, rawTotal: f.weighted }
  })

  const maxScore = Math.max(...rawScores.map(s => s.rawTotal))
  const exps = rawScores.map(s => Math.exp((s.rawTotal - maxScore) * 2))
  const total = exps.reduce((a, b) => a + b, 0)

  const withScores = rawScores.map((s, i) => ({
    id: s.horse.id,
    aiScore: Math.round(Math.min(100, Math.max(0, s.rawTotal * 10))),
    winProbability: Math.round((exps[i] / total) * 1000) / 10,
  }))

  const best = withScores.reduce((a, b) => a.aiScore >= b.aiScore ? a : b)

  return horses.map(h => {
    const scored = withScores.find(s => s.id === h.id)!
    return {
      ...h,
      aiScore: scored.aiScore,
      winProbability: scored.winProbability,
      confidenceLevel: (scored.aiScore >= 70 ? 'fort' : scored.aiScore >= 50 ? 'moyen' : 'faible') as ConfidenceLevel,
      isRecommended: scored.id === best.id,
    }
  })
}

function buildHorseStrengths(factors: HorseFactorScores, horse: Horse): string[] {
  const s: string[] = []
  if (factors.recentForm >= 7.5)       s.push('Excellente forme récente')
  else if (factors.recentForm >= 6)    s.push('Bonne forme récente')
  if (factors.distanceFit >= 9)        s.push('Distance idéale')
  else if (factors.distanceFit >= 7)   s.push('Distance favorable')
  if (factors.trackConditionFit >= 9)  s.push('Terrain parfaitement adapté')
  if (factors.jockeyPerformance >= 9)  s.push("Jockey d'élite")
  if (factors.trainerPerformance >= 9) s.push('Entraîneur de haut niveau')
  if (factors.oddsMovement >= 9)       s.push('Cote en forte baisse')
  if (factors.careerConsistency >= 8)  s.push('Excellent bilan carrière')
  if (horse.winRate >= 30 && horse.careerRaces >= 5) s.push(`Taux de victoire élevé (${horse.winRate}%)`)
  return s.length ? s : ['Profil équilibré, sans point faible majeur']
}

function buildHorseWarnings(factors: HorseFactorScores): string[] {
  const w: string[] = []
  if (factors.recentForm < 3)         w.push('Forme récente très insuffisante')
  else if (factors.recentForm < 5)    w.push('Forme récente décevante')
  if (factors.distanceFit < 4)        w.push('Distance hors de ses préférences')
  if (factors.trackConditionFit < 4)  w.push('Terrain inadapté')
  if (factors.oddsMovement <= 2)      w.push('Cote en hausse — méfiance des experts')
  if (factors.careerConsistency < 3)  w.push('Faible régularité en carrière')
  return w
}

function buildHorseReasoning(
  horse: Horse & { pmuComment?: string },
  factors: HorseFactorScores,
): string {
  const parts: string[] = []
  const positions = horse.recentForm.map(f => f.position).filter(p => p > 0 && p < 11).slice(0, 5)

  if (positions.length >= 2) {
    const avg = positions.reduce((a, b) => a + b, 0) / positions.length
    if (avg <= 1.5)
      parts.push(`Grande forme récente : ${positions.map(p => `${p}e`).join(', ')} sur ses dernières sorties.`)
    else if (avg <= 3)
      parts.push(`Forme solide avec un podium moyen de ${avg.toFixed(1)} sur les récentes courses.`)
    else
      parts.push(`Performances récentes irrégulières (${positions.map(p => `${p}e`).join(', ')}).`)
  } else if (positions.length === 1) {
    parts.push(`Dernier résultat connu : ${positions[0]}e place.`)
  } else {
    parts.push('Historique de course non disponible ou cheval avec peu de sorties.')
  }

  if (factors.distanceFit >= 9)      parts.push('La distance est parfaitement dans ses cordes.')
  else if (factors.distanceFit < 5)  parts.push("La distance de cette course n'est pas son point fort.")

  if (factors.trackConditionFit >= 9)     parts.push('Le terrain actuel lui est particulièrement favorable.')
  else if (factors.trackConditionFit < 4) parts.push('Le terrain du jour lui est défavorable.')

  if (factors.jockeyPerformance >= 9)  parts.push(`${horse.jockey} est l'un des meilleurs du peloton.`)
  if (factors.trainerPerformance >= 9) parts.push(`${horse.trainer} est un entraîneur de premier plan.`)

  if (factors.oddsMovement >= 9)
    parts.push('La nette baisse de cote traduit la confiance des parieurs informés.')
  else if (factors.oddsMovement <= 2)
    parts.push('La montée de cote indique une certaine méfiance des experts.')

  if (horse.careerRaces >= 5 && horse.careerWins > 0)
    parts.push(`Bilan carrière : ${horse.careerWins}V / ${horse.careerRaces} sorties (${horse.winRate}% victoires).`)

  // Commentaire GENY si disponible (dernière course)
  if (horse.pmuComment && horse.pmuComment.length > 20) {
    parts.push(`Dernière course (source GENY) : « ${horse.pmuComment.trim()} »`)
  }

  return parts.join(' ')
}

function buildBetAdvice(
  top3: DetailedEntry[],
): Array<{ type: string; description: string; confidence: ConfidenceLevel }> {
  const advice: Array<{ type: string; description: string; confidence: ConfidenceLevel }> = []

  if (top3[0]) {
    advice.push({
      type: 'Simple gagnant',
      description: `${top3[0].horseName} (cote ${top3[0].odds < 90 ? top3[0].odds.toFixed(1) + 'x' : 'N/A'}) — Score IA ${top3[0].aiScore}/100, probabilité estimée ${top3[0].probability.toFixed(1)}%.`,
      confidence: top3[0].confidenceLevel,
    })
  }
  if (top3[0] && top3[1]) {
    advice.push({
      type: 'Couplé gagnant',
      description: `${top3[0].horseName} / ${top3[1].horseName}. Bon équilibre rendement/risque selon le modèle.`,
      confidence: top3[1].confidenceLevel,
    })
  }
  if (top3.length >= 3) {
    advice.push({
      type: "Tiercé dans l'ordre",
      description: `${top3.map(h => h.horseName).join(' → ')}. Sélection complète du modèle IA.`,
      confidence: 'faible',
    })
  }
  return advice
}

function buildDetailedPrediction(race: Race, horses: (Horse & { pmuComment?: string })[]): DetailedPrediction {
  const prediction = generatePrediction(race, horses)

  const detailedTop3: DetailedEntry[] = prediction.top3.map(entry => {
    const horse = horses.find(h => h.id === entry.horseId)
    if (!horse) throw new Error(`Horse not found: ${entry.horseId}`)
    const factors   = computeHorseFactorScores(horse, race)
    const strengths = buildHorseStrengths(factors, horse)
    const warnings  = buildHorseWarnings(factors)
    const reasoning = buildHorseReasoning(horse, factors)
    return {
      ...entry,
      jockey: horse.jockey,
      trainer: horse.trainer,
      odds: horse.odds,
      oddsChange: horse.oddsChange,
      age: horse.age,
      careerWins: horse.careerWins,
      careerRaces: horse.careerRaces,
      winRate: horse.winRate,
      formPositions: horse.recentForm.map(f => f.position),
      factors,
      strengths,
      warnings,
      reasoning,
    }
  })

  return { ...prediction, detailedTop3, betAdvice: buildBetAdvice(detailedTop3) }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface RaceDetailResult {
  race: Race
  horses: Horse[]
  prediction: DetailedPrediction
}

export async function fetchRaceDetail(id: string): Promise<RaceDetailResult | null> {
  if (!id.startsWith('pmu-')) {
    const race = MOCK_RACES.find(r => r.id === id)
    if (!race) return null
    const rawHorses = getHorsesByRaceId(id)
    if (!rawHorses.length) return null
    const horses = computeAllScores(race, rawHorses)
    const prediction = buildDetailedPrediction(race, horses)
    return { race, horses, prediction }
  }

  const match = id.match(/^pmu-R(\d+)-C(\d+)$/)
  if (!match) return null
  const [, rNum, cNum] = match

  const today = new Date()
  const ddmmyyyy = toDDMMYYYY(today)
  const todayISO = today.toISOString().slice(0, 10)

  const progData = await pmuGet(`${PMU_BASE}/${ddmmyyyy}`)
  if (!progData) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prog = progData as any
  const reunions: unknown[] | null = prog?.programme?.reunions ?? prog?.reunions ?? null
  if (!Array.isArray(reunions)) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reunion = reunions.find((r: any) => String(r.numOfficiel) === rNum) as any
  if (!reunion) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const course = (reunion.courses ?? [] as any[]).find((c: any) => String(c.numOrdre ?? c.numExterne) === cNum) as any
  if (!course) return null

  const partData = await pmuGet(`${PMU_BASE}/${ddmmyyyy}/R${rNum}/C${cNum}/participants`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parts: any[] = (partData as any)?.participants ?? (partData as any)?.partants ?? course.participants ?? []
  if (!parts.length) return null

  const discipline   = (course.specialite ?? course.discipline ?? '').toUpperCase()
  const raceType: RaceType = SPECIALITE_MAP[discipline] ?? 'plat'
  const condRaw      = (course.etatPiste ?? course.terrain ?? '').toUpperCase().replace(/\s/g, ' ')
  const trackCondition: TrackCondition = CONDITION_MAP[condRaw] ?? 'bon'
  const meteoRaw     = (reunion.meteo?.libelle ?? reunion.meteo?.temps ?? '').toUpperCase()
  const weather: WeatherCondition = METEO_MAP[meteoRaw] ?? 'nuageux'
  const hippoRaw: string =
    course.hippodrome?.libelleLong ?? reunion.hippodrome?.libelleLong ?? reunion.hippodrome?.libelleCourt ?? 'Hippodrome'
  const racecourse = toTitle(hippoRaw.replace(/^HIPPODROME DE /i, ''))
  const startTime = typeof course.heureDepart === 'number' && course.heureDepart > 1_000_000_000_000
    ? new Date(course.heureDepart).toISOString()
    : `${todayISO}T00:00:00.000Z`

  const race: Race = {
    id,
    name: toTitle(course.libelle ?? `Course ${cNum}`),
    racecourse,
    startTime,
    raceType,
    distance: course.distance ?? 2000,
    trackCondition,
    weather,
    temperature: reunion.meteo?.temperature ?? 15,
    numberOfRunners: course.nombreDeclaresPartants ?? parts.length,
    prize: course.montantPrix ?? 0,
    date: todayISO,
    status: STATUS_MAP[(course.statut ?? '').toUpperCase()] ?? 'upcoming',
    raceNumber: parseInt(cNum),
    category: course.categorieParticularite ?? course.conditions ?? '',
  }

  try {
    const rawHorses = parts.map((p, i) => parseParticipantToHorse(p, id, i, race))
    const horses = computeAllScores(race, rawHorses)
    const prediction = buildDetailedPrediction(race, rawHorses as (Horse & { pmuComment?: string })[])
    return { race, horses, prediction }
  } catch {
    return null
  }
}
