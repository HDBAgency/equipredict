import { NextResponse } from 'next/server'
import { MOCK_RACES, MOCK_HORSES } from '@/lib/mock-data'
import type { RaceType, TrackCondition, RaceStatus, WeatherCondition } from '@/types'
import type { LiveHorse, LiveRace, LiveResponse } from '@/types/live'
import { fetchWeather } from '@/lib/weather'
import { scoreJockey, scoreTrainer } from '@/lib/scoring/factors'

// ─── Poids du modèle IA — 9 facteurs (chargés depuis Supabase) ───────────────

// ─── Poids du modèle IA — 12 facteurs (chargés depuis Supabase) ──────────────

type ModelWeights = {
  w_form: number; w_odds_rank: number; w_consist: number
  w_placement: number; w_mvt: number; w_age: number; w_earnings: number
  w_jockey_wr: number; w_trainer_wr: number
  w_weight_penalty: number; w_form_x_signal: number; w_jockey_x_trainer: number
  w_distance_fit: number; w_track_fit: number; w_jockey_track: number
}

const DEFAULT_WEIGHTS: ModelWeights = {
  w_form: 0.09, w_odds_rank: 0.07, w_consist: 0.07,
  w_placement: 0.07, w_mvt: 0.04, w_age: 0.04, w_earnings: 0.09,
  w_jockey_wr: 0.07, w_trainer_wr: 0.06,
  w_weight_penalty: 0.04, w_form_x_signal: 0.08, w_jockey_x_trainer: 0.05,
  w_distance_fit: 0.08, w_track_fit: 0.08, w_jockey_track: 0.07,
}

async function loadModelWeights(): Promise<ModelWeights> {
  try {
    const cols = Object.keys(DEFAULT_WEIGHTS).join(',')
    const url  = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/model_weights?select=${cols}&limit=1`
    const res  = await fetch(url, {
      headers: {
        apikey:        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      },
      // 10 min : rafraîchissement intra-journalier après chaque cycle RankNet
      next: { revalidate: 600 },
    })
    if (!res.ok) return DEFAULT_WEIGHTS
    const rows = await res.json() as Partial<ModelWeights>[]
    const row  = rows?.[0]
    if (!row) return DEFAULT_WEIGHTS
    return { ...DEFAULT_WEIGHTS, ...row }
  } catch {
    return DEFAULT_WEIGHTS
  }
}

// ─── Stats jockey / entraîneur (chargées depuis Supabase, cache 4h) ──────────

type RiderStat = { win_rate: number; total_races: number }

type TrackStat = { win_rate: number; total_races: number }

async function loadAllStats(): Promise<{
  jockeys:      Map<string, RiderStat>
  trainers:     Map<string, RiderStat>
  horseDist:    Map<string, TrackStat>
  horseTrack:   Map<string, TrackStat>
  jockeyTrack:  Map<string, TrackStat>
}> {
  const empty = {
    jockeys: new Map<string, RiderStat>(), trainers: new Map<string, RiderStat>(),
    horseDist: new Map<string, TrackStat>(), horseTrack: new Map<string, TrackStat>(),
    jockeyTrack: new Map<string, TrackStat>(),
  }
  try {
    const base    = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const headers = { apikey: anon, Authorization: `Bearer ${anon}` }
    const cache4h = { next: { revalidate: 14400 } }

    const [jRes, tRes, hdRes, htRes, jtRes] = await Promise.all([
      fetch(`${base}/rest/v1/jockey_stats?select=jockey_name,win_rate,total_races`, { headers, ...cache4h }),
      fetch(`${base}/rest/v1/trainer_stats?select=trainer_name,win_rate,total_races`, { headers, ...cache4h }),
      fetch(`${base}/rest/v1/horse_distance_stats?select=horse_name,distance_range,win_rate,total_races`, { headers, ...cache4h }),
      fetch(`${base}/rest/v1/horse_track_stats?select=horse_name,hippodrome_code,win_rate,total_races`, { headers, ...cache4h }),
      fetch(`${base}/rest/v1/jockey_track_stats?select=jockey_name,hippodrome_code,win_rate,total_races`, { headers, ...cache4h }),
    ])

    const jockeys     = new Map<string, RiderStat>()
    const trainers    = new Map<string, RiderStat>()
    const horseDist   = new Map<string, TrackStat>()
    const horseTrack  = new Map<string, TrackStat>()
    const jockeyTrack = new Map<string, TrackStat>()

    if (jRes.ok) for (const r of await jRes.json() as Array<{jockey_name:string;win_rate:number;total_races:number}>)
      jockeys.set(r.jockey_name.toLowerCase(), { win_rate: r.win_rate, total_races: r.total_races })
    if (tRes.ok) for (const r of await tRes.json() as Array<{trainer_name:string;win_rate:number;total_races:number}>)
      trainers.set(r.trainer_name.toLowerCase(), { win_rate: r.win_rate, total_races: r.total_races })
    if (hdRes.ok) for (const r of await hdRes.json() as Array<{horse_name:string;distance_range:string;win_rate:number;total_races:number}>)
      horseDist.set(`${r.horse_name.toLowerCase()}_${r.distance_range}`, { win_rate: r.win_rate, total_races: r.total_races })
    if (htRes.ok) for (const r of await htRes.json() as Array<{horse_name:string;hippodrome_code:string;win_rate:number;total_races:number}>)
      horseTrack.set(`${r.horse_name.toLowerCase()}_${r.hippodrome_code}`, { win_rate: r.win_rate, total_races: r.total_races })
    if (jtRes.ok) for (const r of await jtRes.json() as Array<{jockey_name:string;hippodrome_code:string;win_rate:number;total_races:number}>)
      jockeyTrack.set(`${r.jockey_name.toLowerCase()}_${r.hippodrome_code}`, { win_rate: r.win_rate, total_races: r.total_races })

    return { jockeys, trainers, horseDist, horseTrack, jockeyTrack }
  } catch {
    return empty
  }
}

// ─── PMU API base ─────────────────────────────────────────────────────────────

const PMU_BASE = 'https://online.turfinfo.api.pmu.fr/rest/client/61/programme'

function pad(n: number) { return String(n).padStart(2, '0') }

function toDDMMYYYY(d: Date) {
  return `${pad(d.getDate())}${pad(d.getMonth() + 1)}${d.getFullYear()}`
}

// ─── Field maps ───────────────────────────────────────────────────────────────

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

// PMU sends "INCONNU" for unknown categories; underscores replace spaces
const CATEGORY_MAP: Record<string, string> = {
  INCONNU: '',
  A_RECLAMER: 'À Réclamer',
  HANDICAP_A_RECLAMER: 'Handicap à Réclamer',
  HANDICAP_DE_CATEGORIE: 'Handicap de Catégorie',
  COURSE_A_CONDITIONS: 'Course à Conditions',
  COURSE_A_CONDITION_QUALIF_HP: 'Qualification HP',
  APPRENTIS_LADS_JOCKEYS: 'Apprentis / Lads',
  EUROPEENNE: 'Européenne',
  INTERNATIONALE: 'Internationale',
  AMATEURS: 'Amateurs',
  HANDICAP: 'Handicap',
  AUTOSTART: 'Autostart',
}

function parseCategory(raw: unknown): string {
  if (!raw || typeof raw !== 'string') return ''
  const key = raw.toUpperCase().replace(/\s/g, '_')
  if (key in CATEGORY_MAP) return CATEGORY_MAP[key]
  // Convert remaining underscores to spaces and title-case
  return toTitle(raw.replace(/_/g, ' '))
}

const METEO_MAP: Record<string, WeatherCondition> = {
  BEAU_TEMPS: 'ensoleillé', SOLEIL: 'ensoleillé', BEAU: 'ensoleillé',
  NUAGEUX: 'nuageux', COUVERT: 'nuageux',
  PLUIE: 'pluvieux', PLUVIEUX: 'pluvieux', AVERSES: 'pluvieux',
  VENT: 'venteux', VENTEUX: 'venteux',
}

const STATUS_MAP: Record<string, RaceStatus> = {
  PROGRAMMEE: 'upcoming', DEPART_IMMINENT: 'live', EN_COURS: 'live',
  ARRIVEE: 'completed', ARRIVEE_DEFINITIVE: 'completed',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/(?:^|[\s-])\S/g, c => c.toUpperCase())
    .trim()
}

function parseHeureDepart(ts: unknown, fallbackISO: string): string {
  if (typeof ts === 'number' && ts > 1_000_000_000_000) {
    // Unix timestamp in ms
    return new Date(ts).toISOString()
  }
  // Fallback
  return `${fallbackISO}T00:00:00.000Z`
}

// ─── PMU fetch helpers ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function pmuGet(url: string): Promise<any | null> {
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

// ─── Musique parsing (format PMU) ─────────────────────────────────────────────
// Chaque caractère = un résultat : 1-9=position, p=placé(≈2e), 0=non classé, a/A/N=absent, D/T=disq/tombé

function parseMusiqueScore(musique: string | undefined): number {
  if (!musique) return 5
  const clean = musique.replace(/\([^)]*\)/g, '')
  const RECENCY = [1.0, 0.85, 0.70, 0.55, 0.40, 0.30, 0.20, 0.15, 0.10, 0.08]
  let score = 0; let weight = 0; let count = 0
  for (const ch of clean) {
    if (count >= 10) break
    let pts = -1
    if (ch === 'p' || ch === 'P') pts = 7.5
    else if (ch === '1') pts = 10
    else if (ch === '2') pts = 8
    else if (ch === '3') pts = 6
    else if (ch >= '4' && ch <= '5') pts = 3
    else if (ch >= '6' && ch <= '9') pts = 1
    else if (ch === '0') pts = 0
    else if ('DdTt'.includes(ch)) pts = 0
    else if ('AaNn '.includes(ch)) continue // absent — ignoré
    if (pts >= 0) { score += pts * RECENCY[count]; weight += 10 * RECENCY[count]; count++ }
  }
  if (weight === 0) return 5
  return (score / weight) * 10
}

// ─── Parse one participant ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseParticipant(p: any, raceId: string, idx: number): LiveHorse {
  const drr  = p.dernierRapportDirect
  const drRef = p.dernierRapportReference
  const directOdds: number = typeof drr?.rapport  === 'number' && drr.rapport  > 0 ? drr.rapport  : 99
  const refOdds: number    = typeof drRef?.rapport === 'number' && drRef.rapport > 0 ? drRef.rapport : directOdds
  const odds = directOdds

  const oddsChange: 'up' | 'down' | 'stable' =
    directOdds < refOdds * 0.93 ? 'down' :
    directOdds > refOdds * 1.07 ? 'up' : 'stable'

  const isFavorite: boolean = drr?.favoris === true
  const jockeyRaw: string = p.driver ?? p.jockey ?? p.nomDriver ?? p.nomJockey ?? '—'

  // Données carrière
  const careerWins   = Number(p.nombreVictoires ?? 0)
  const careerPlaces = Number(p.nombrePlaces ?? 0)
  const careerRaces  = Number(p.nombreCourses ?? 0) || Math.max(careerWins * 5, 1)
  const winRate      = (careerWins / careerRaces) * 100
  const placeRate    = ((careerWins + careerPlaces) / careerRaces) * 100

  // Gains carrière (proxy de classe)
  const careerEarnings: number =
    Number(p.gainsParticipant?.gainsCarriere ?? p.gainsCarriere ?? 0)

  // Âge et entraîneur
  const age: number = Number(p.age ?? 0)
  const trainer: string = toTitle(p.entraineur?.nom ?? p.nomEntraineur ?? '')

  // Poids/handicap (en grammes ou kg selon PMU)
  const weight: number = Number(p.poidsConditionMonte ?? p.handicapPoids ?? p.poids ?? 0)

  // Forme depuis la musique (avec boost récence)
  const formScore = parseMusiqueScore(p.musique)

  return {
    id: `${raceId}-h${p.numPmu ?? idx + 1}`,
    name: toTitle(p.nom ?? `Partant ${idx + 1}`),
    number: Number(p.numPmu ?? idx + 1),
    jockey: toTitle(jockeyRaw),
    odds,
    previousOdds: refOdds,
    oddsChange,
    isFavorite,
    aiScore: 50,
    winProbability: 0,
    confidenceLevel: 'moyen' as const,
    isRecommended: false,
    _formScore: formScore,
    _winRate: winRate,
    _placeRate: placeRate,
    _careerRaces: careerRaces,
    _careerEarnings: careerEarnings,
    _age: age,
    _trainer: trainer,
    _weight: weight,
  } as LiveHorse & {
    _formScore: number; _winRate: number; _placeRate: number
    _careerRaces: number; _careerEarnings: number
    _age: number; _trainer: string; _weight: number
  }
}

// Convertit un win_rate (0–100%) en score 0–10
// Fiable seulement si assez de données (minRaces seuil)
function winRateToScore(stat: RiderStat | undefined, minRaces: number): number {
  if (!stat || stat.total_races < minRaces) return -1  // -1 = données insuffisantes
  return Math.min(10, stat.win_rate * 0.5)
}

// ─── Build LiveRace from PMU course + participants ─────────────────────────────

function distanceRange(dist: number): string {
  if (dist < 1400) return 'sprint'
  if (dist <= 2100) return 'mile'
  return 'long'
}

function statScore(map: Map<string, TrackStat>, key: string, minRaces: number): number {
  const s = map.get(key)
  if (!s || s.total_races < minRaces) return 5
  return Math.min(10, s.win_rate * 0.5)
}

function buildLiveRace(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  course: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reunion: any,
  todayISO: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  participants: any[],
  weights: ModelWeights = DEFAULT_WEIGHTS,
  jockeyStats:  Map<string, RiderStat>  = new Map(),
  trainerStats: Map<string, RiderStat>  = new Map(),
  horseDist:    Map<string, TrackStat>  = new Map(),
  horseTrack:   Map<string, TrackStat>  = new Map(),
  jockeyTrack:  Map<string, TrackStat>  = new Map(),
): LiveRace {
  const reunionNum: number = reunion.numOfficiel ?? 1
  const courseNum: number = course.numOrdre ?? course.numExterne ?? 1
  const raceId = `pmu-R${reunionNum}-C${courseNum}`
  const hippoCode: string = ((reunion.hippodrome?.code ?? course.hippodrome?.code ?? '') as string).toUpperCase()
  const raceDistance: number = (course.distance ?? 0) as number

  const discipline: string = (course.specialite ?? course.discipline ?? '').toUpperCase()
  const raceType: RaceType = SPECIALITE_MAP[discipline] ?? 'plat'

  const conditionRaw: string = (
    course.etatPiste ?? course.terrain ?? ''
  ).toUpperCase().replace(/\s/g, ' ')
  const trackCondition: TrackCondition = CONDITION_MAP[conditionRaw] ?? 'bon'

  const meteoRaw: string = (
    reunion.meteo?.libelle ?? reunion.meteo?.temps ?? ''
  ).toUpperCase()
  const weather: WeatherCondition = METEO_MAP[meteoRaw] ?? 'nuageux'
  const temperature: number = reunion.meteo?.temperature ?? 15

  const status: RaceStatus = STATUS_MAP[(course.statut ?? '').toUpperCase()] ?? 'upcoming'
  const startTime = parseHeureDepart(course.heureDepart, todayISO)

  const hippoRaw: string =
    course.hippodrome?.libelleLong ??
    reunion.hippodrome?.libelleLong ??
    reunion.hippodrome?.libelleCourt ??
    'Hippodrome'
  const racecourse = toTitle(hippoRaw.replace(/^HIPPODROME DE /i, ''))

  // Parse horses (with temp scoring fields)
  type RawFeatures = {
    raw_form: number; raw_odds_rank: number; raw_consist: number; raw_placement: number
    raw_mvt: number; raw_age: number; raw_earnings: number
    raw_jockey_wr: number; raw_trainer_wr: number
    raw_weight_penalty: number; raw_form_x_signal: number; raw_jockey_x_trainer: number
    raw_distance_fit: number; raw_track_fit: number; raw_jockey_track: number
  }
  type RichHorse = LiveHorse & {
    _formScore: number; _winRate: number; _placeRate: number
    _careerRaces: number; _careerEarnings: number
    _age: number; _trainer: string; _weight: number
    _rawFeatures: RawFeatures
  }
  const horses = participants.map((p, i) => parseParticipant(p, raceId, i)) as RichHorse[]

  // ── Probabilités marché (inverse-odds normalisé) — calculées maintenant ──────
  // Sera fusionné avec softmax IA après le scoring (probabilités calibrées)
  const validOdds = horses.filter(h => h.odds < 90)
  const sumInv    = validOdds.reduce((s, h) => s + 1 / h.odds, 0)
  horses.forEach(h => {
    h.winProbability = sumInv > 0 && h.odds < 90
      ? Math.round((1 / h.odds / sumInv) * 1000) / 10
      : Math.round(1000 / Math.max(1, horses.length)) / 10
  })

  // ── Scoring IA 9 facteurs ────────────────────────────────────────────────────
  const oddsValues = horses.filter(h => h.odds < 90).map(h => h.odds)
  const minOdds = Math.min(...(oddsValues.length ? oddsValues : [1]))
  const maxOdds = Math.max(...(oddsValues.length ? oddsValues : [100]))
  const oddsRange = Math.max(maxOdds - minOdds, 1)

  const maxEarnings = Math.max(...horses.map(h => h._careerEarnings), 1)

  horses.forEach(h => {
    // 1. Forme (musique) — 0-10
    const form = h._formScore

    // 2. Signal marché (rang par cotes) — 0-10
    const oddsRank = h.odds < 90 ? (1 - (h.odds - minOdds) / oddsRange) * 10 : 5

    // 3. Consistance victoires — 0-10
    const consist = h._careerRaces >= 3 ? Math.min(10, h._winRate / 10) : 5

    // 4. Taux placement (victoires + places) — 0-10
    const placement = h._careerRaces >= 3 ? Math.min(10, h._placeRate / 10) : 5

    // 5. Mouvement de cote (gradient) — 0-10
    const ratio = h.odds > 0 ? (h.previousOdds - h.odds) / h.previousOdds : 0
    const mvt = Math.max(0, Math.min(10, 5 + ratio * 25))

    // 6. Âge optimal par discipline — 0-10
    let age = 5
    if (h._age > 0) {
      if (raceType === 'plat')        age = h._age >= 3 && h._age <= 6 ? 9 : h._age <= 8 ? 6 : 3
      else if (raceType === 'trot')   age = h._age >= 4 && h._age <= 7 ? 9 : h._age <= 9 ? 6 : 3
      else /* obstacle/steeplechase */age = h._age >= 5 && h._age <= 9 ? 9 : h._age <= 11 ? 6 : 3
    }

    // 7. Classe du cheval (gains carrière normalisés) — 0-10
    const earnings = maxEarnings > 0 ? Math.min(10, (h._careerEarnings / maxEarnings) * 10) : 5

    // 8. Win rate jockey (dynamique DB, fallback listes élite) — 0-10
    const jockeyKey  = h.jockey.toLowerCase()
    const jStatScore = winRateToScore(jockeyStats.get(jockeyKey), 20)
    const jockeyWR   = jStatScore >= 0 ? jStatScore : scoreJockey(h.jockey)

    // 9. Win rate entraîneur (dynamique DB, fallback listes élite) — 0-10
    const trainerKey  = h._trainer.toLowerCase()
    const tStatScore  = winRateToScore(trainerStats.get(trainerKey), 15)
    const trainerWR   = tStatScore >= 0 ? tStatScore : scoreTrainer(h._trainer)

    // 10. Poids de monte / handicap — 0-10 (galop uniquement)
    let weightPenalty = 5
    if (h._weight > 0 && raceType === 'plat') {
      if      (h._weight <= 54) weightPenalty = 9.5
      else if (h._weight <= 57) weightPenalty = 8.0
      else if (h._weight <= 60) weightPenalty = 6.5
      else if (h._weight <= 63) weightPenalty = 4.5
      else                      weightPenalty = 2.5
    }

    // 11. Interaction forme × signal marché (double confirmation) — 0-10
    const formXSignal = (form * oddsRank) / 10

    // 12. Interaction jockey × trainer (effet duo élite) — 0-10
    const jockeyXTrainer = (jockeyWR * trainerWR) / 10

    // 13. Distance fit — taux victoire du cheval sur cette plage de distance — 0-10
    const horseName   = h.name.toLowerCase()
    const distKey     = `${horseName}_${distanceRange(raceDistance)}`
    const distanceFit = statScore(horseDist, distKey, 3)

    // 14. Track fit — taux victoire du cheval sur cet hippodrome — 0-10
    const trackKey  = hippoCode ? `${horseName}_${hippoCode}` : ''
    const trackFit  = trackKey ? statScore(horseTrack, trackKey, 2) : 5

    // 15. Jockey × hippodrome — taux victoire du jockey sur cet hippodrome — 0-10
    const jtKey      = hippoCode ? `${jockeyKey}_${hippoCode}` : ''
    const jockeyTrk  = jtKey ? statScore(jockeyTrack, jtKey, 5) : 5

    // Pondération finale — 15 facteurs, poids RankNet adaptatifs
    const raw = form          * weights.w_form
              + oddsRank      * weights.w_odds_rank
              + consist       * weights.w_consist
              + placement     * weights.w_placement
              + mvt           * weights.w_mvt
              + age           * weights.w_age
              + earnings      * weights.w_earnings
              + jockeyWR      * weights.w_jockey_wr
              + trainerWR     * weights.w_trainer_wr
              + weightPenalty * weights.w_weight_penalty
              + formXSignal   * weights.w_form_x_signal
              + jockeyXTrainer * weights.w_jockey_x_trainer
              + distanceFit   * weights.w_distance_fit
              + trackFit      * weights.w_track_fit
              + jockeyTrk     * weights.w_jockey_track

    h.aiScore = Math.round(Math.min(100, Math.max(0, raw * 10)))
    h.confidenceLevel = h.aiScore >= 70 ? 'fort' : h.aiScore >= 50 ? 'moyen' : 'faible'

    // Stocker les features brutes pour le service XGBoost
    ;(h as RichHorse)._rawFeatures = {
      raw_form: form, raw_odds_rank: oddsRank, raw_consist: consist,
      raw_placement: placement, raw_mvt: mvt, raw_age: age, raw_earnings: earnings,
      raw_jockey_wr: jockeyWR, raw_trainer_wr: trainerWR,
      raw_weight_penalty: weightPenalty, raw_form_x_signal: formXSignal,
      raw_jockey_x_trainer: jockeyXTrainer,
      raw_distance_fit: distanceFit, raw_track_fit: trackFit, raw_jockey_track: jockeyTrk,
    }
  })

  // ── Probabilités calibrées : 40% softmax IA + 60% signal marché ─────────────
  // Blend conservateur : le marché reste la référence, l'IA affine
  const validScored = horses.filter(h => h.odds < 90)
  if (validScored.length > 0) {
    // Softmax sur les scores IA (évite les underflows avec décalage)
    const maxAI   = Math.max(...validScored.map(h => h.aiScore))
    const expAI   = validScored.map(h => Math.exp((h.aiScore - maxAI) / 10))
    const sumExpAI = expAI.reduce((s, v) => s + v, 0)

    validScored.forEach((h, i) => {
      const pModel  = (expAI[i] / sumExpAI) * 100       // probabilité softmax IA
      const pMarket = h.winProbability                    // signal marché (déjà calculé)
      h.winProbability = Math.round((0.4 * pModel + 0.6 * pMarket) * 10) / 10
    })
  }

  // Marquer le meilleur score IA comme recommandé
  const best = horses.filter(h => h.odds < 90).reduce<RichHorse | null>(
    (a, b) => !a || b.aiScore > a.aiScore ? b : a, null
  )
  if (best) best.isRecommended = true

  // Favorite: prefer PMU's own favoris flag, else lowest odds
  let favorite: LiveRace['favorite'] = null
  const pmuFav = horses.find(h => h.isFavorite)
  const cheapest = horses.filter(h => h.odds < 90).reduce<LiveHorse | null>(
    (a, b) => !a || b.odds < a.odds ? b : a, null
  )
  const fav = pmuFav ?? cheapest
  if (fav) {
    if (!pmuFav && cheapest) cheapest.isFavorite = true
    favorite = { name: fav.name, number: fav.number, odds: fav.odds, oddsChange: fav.oddsChange }
  }

  return {
    id: raceId,
    name: toTitle(course.libelle ?? `Course ${courseNum}`),
    racecourse,
    startTime,
    raceType,
    distance: course.distance ?? 0,
    trackCondition,
    weather,
    temperature,
    numberOfRunners: course.nombreDeclaresPartants ?? horses.length,
    prize: course.montantPrix ?? 0,
    date: todayISO,
    status,
    raceNumber: courseNum,
    category: parseCategory(course.categorieParticularite ?? course.conditions),
    horses,
    favorite,
  }
}

// ─── Main PMU fetch ───────────────────────────────────────────────────────────

async function fetchPMURaces(
  today: Date,
  weights: ModelWeights,
  jockeyStats:  Map<string, RiderStat>,
  trainerStats: Map<string, RiderStat>,
  horseDist:    Map<string, TrackStat> = new Map(),
  horseTrack:   Map<string, TrackStat> = new Map(),
  jockeyTrack:  Map<string, TrackStat> = new Map(),
): Promise<LiveRace[] | null> {
  const ddmmyyyy = toDDMMYYYY(today)
  const todayISO = today.toISOString().slice(0, 10)

  const data = await pmuGet(`${PMU_BASE}/${ddmmyyyy}`)
  if (!data) return null

  const reunions = data?.programme?.reunions ?? data?.reunions ?? null
  if (!Array.isArray(reunions) || reunions.length === 0) return null

  const jobs: { reunion: Record<string, unknown>; course: Record<string, unknown> }[] = []
  for (const reunion of reunions) {
    for (const course of (reunion.courses ?? [])) {
      jobs.push({ reunion, course })
    }
  }

  // Fetch all participants in parallel (max 20 concurrent)
  const results = await Promise.all(
    jobs.map(async ({ reunion, course }) => {
      const r = (reunion as { numOfficiel?: number }).numOfficiel ?? 1
      const c = (course as { numOrdre?: number; numExterne?: number }).numOrdre ??
                (course as { numOrdre?: number; numExterne?: number }).numExterne ?? 1
      const partData = await pmuGet(`${PMU_BASE}/${ddmmyyyy}/R${r}/C${c}/participants`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const participants: any[] =
        partData?.participants ??
        partData?.partants ??
        (course as { participants?: unknown[] }).participants ??
        []
      return buildLiveRace(course, reunion, todayISO, participants, weights, jockeyStats, trainerStats, horseDist, horseTrack, jockeyTrack)
    })
  )

  return results.length > 0 ? results : null
}

// ─── Odds simulation fallback (mock data) ─────────────────────────────────────

function seededRandom(seed: number): number {
  let x = seed ^ (seed >>> 16)
  x = Math.imul(x, 0x45d9f3b) | 0
  return ((x ^ (x >>> 16)) >>> 0) / 0x100000000
}

function buildMockLiveRaces(): LiveRace[] {
  const minuteSeed = Math.floor(Date.now() / 60000)
  return MOCK_RACES.map(race => {
    const raceHorses = MOCK_HORSES.filter(h => h.raceId === race.id)
    const horses: LiveHorse[] = raceHorses.map(h => {
      const r = seededRandom(h.number * 1009 + minuteSeed)
      const rPrev = seededRandom(h.number * 1009 + minuteSeed - 1)
      const odds = Math.max(1.1, Math.round(h.odds * (0.92 + r * 0.16) * 10) / 10)
      const prev = Math.max(1.1, Math.round(h.odds * (0.92 + rPrev * 0.16) * 10) / 10)
      const diff = odds - prev
      return {
        id: h.id, name: h.name, number: h.number, jockey: h.jockey,
        odds, previousOdds: prev,
        oddsChange: Math.abs(diff) < 0.15 ? 'stable' : diff < 0 ? 'down' : 'up',
        isFavorite: false, aiScore: h.aiScore,
        winProbability: h.winProbability, confidenceLevel: h.confidenceLevel,
        isRecommended: h.isRecommended,
      }
    })
    let favorite: LiveRace['favorite'] = null
    if (horses.length > 0) {
      const fav = horses.reduce((a, b) => a.odds < b.odds ? a : b)
      fav.isFavorite = true
      favorite = { name: fav.name, number: fav.number, odds: fav.odds, oddsChange: fav.oddsChange }
    }
    return { ...race, horses, favorite }
  })
}

// ─── XGBoost blend ───────────────────────────────────────────────────────────
// Appelle le microservice Python pour chaque course (un appel par course),
// blende 65% XGBoost + 35% linéaire.
// Fallback gracieux : si le service est hors ligne, score linéaire inchangé.

type RawFeatures = {
  raw_form: number; raw_odds_rank: number; raw_consist: number; raw_placement: number
  raw_mvt: number; raw_age: number; raw_earnings: number
  raw_jockey_wr: number; raw_trainer_wr: number
  raw_weight_penalty: number; raw_form_x_signal: number; raw_jockey_x_trainer: number
  raw_distance_fit: number; raw_track_fit: number; raw_jockey_track: number
}

async function applyXGBoostScores(races: LiveRace[]): Promise<LiveRace[]> {
  const serviceUrl = process.env.XGBOOST_SERVICE_URL
  if (!serviceUrl) return races

  const racePromises = races.map(async race => {
    const richHorses = (race.horses as Array<LiveHorse & { _rawFeatures?: RawFeatures }>)
      .filter(h => h.odds < 90 && h._rawFeatures)

    if (richHorses.length < 2) return race

    const payload = {
      horses: richHorses.map(h => ({ id: h.id, ...h._rawFeatures! })),
    }

    try {
      const ctrl  = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 3000)  // timeout 3s
      const res   = await fetch(`${serviceUrl}/predict`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
        signal:  ctrl.signal,
      })
      clearTimeout(timer)
      if (!res.ok) return race

      const data = await res.json() as { scores: Array<{ id: string; xgb_score: number }> }
      const xgbMap = new Map(data.scores.map(s => [s.id, s.xgb_score]))

      // Blend : 65% XGBoost + 35% score linéaire
      const updatedHorses = race.horses.map(h => {
        const xgb = xgbMap.get(h.id)
        if (xgb === undefined) return h
        const blended = Math.round(0.65 * xgb + 0.35 * h.aiScore)
        return {
          ...h,
          aiScore: blended,
          confidenceLevel: (blended >= 70 ? 'fort' : blended >= 50 ? 'moyen' : 'faible') as LiveHorse['confidenceLevel'],
        }
      })

      // Recalculer isRecommended après blend
      const bestBlended = updatedHorses
        .filter(h => h.odds < 90)
        .reduce<LiveHorse | null>((a, b) => !a || b.aiScore > a.aiScore ? b : a, null)

      return {
        ...race,
        horses: updatedHorses.map(h => ({ ...h, isRecommended: h.id === bestBlended?.id })),
      }
    } catch {
      return race  // fallback silencieux
    }
  })

  return Promise.all(racePromises)
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function GET(): Promise<NextResponse<LiveResponse>> {
  const now = new Date()
  // Les 3 chargements sont parallèles — overhead minimal
  const [weights, { jockeys, trainers, horseDist, horseTrack, jockeyTrack }] = await Promise.all([
    loadModelWeights(),
    loadAllStats(),
  ])
  let races = await fetchPMURaces(now, weights, jockeys, trainers, horseDist, horseTrack, jockeyTrack)
  const source: 'pmu' | 'mock' = races ? 'pmu' : 'mock'
  if (!races) races = buildMockLiveRaces()

  // XGBoost blend — 65% XGB + 35% linéaire (no-op si XGBOOST_SERVICE_URL absent)
  races = await applyXGBoostScores(races)

  // Enrichit avec la météo réelle Open-Meteo (parallèle, dédupliqué par hippodrome)
  const uniqueCourses = [...new Set(races.map(r => r.racecourse))]
  const weatherMap = new Map<string, Awaited<ReturnType<typeof fetchWeather>>>()
  await Promise.all(uniqueCourses.map(async c => {
    const w = await fetchWeather(c)
    if (w) weatherMap.set(c, w)
  }))
  races = races.map(r => {
    const w = weatherMap.get(r.racecourse)
    if (!w) return r
    return { ...r, weather: w.condition, temperature: w.temperature }
  })

  races.sort((a, b) => a.startTime.localeCompare(b.startTime))

  return NextResponse.json({ races, updatedAt: now.toISOString(), source })
}
