import type { Horse, HorseFormEntry, TrackCondition } from '@/types'

// ─── Facteurs individuels du moteur de scoring ─────────────────────────────
// Chaque fonction retourne un score entre 0 et 10.

const RECENCY_WEIGHTS = [1.0, 0.85, 0.70, 0.55, 0.40]

function positionScore(position: number, totalRunners: number): number {
  if (position <= 0)  return 0   // non classé / disqualifié / absent
  if (position === 1) return 10
  if (position === 2) return 7.5
  if (position === 3) return 5.5
  const relativePos = position / Math.max(totalRunners, 1)
  if (relativePos <= 0.3) return 3.5
  if (relativePos <= 0.5) return 2
  if (relativePos <= 0.7) return 1
  return 0.5
}

export function scoreRecentForm(form: HorseFormEntry[]): number {
  if (!form.length) return 5 // pas d'historique → neutre, pas pénalisé
  const total = form.slice(0, 5).reduce((acc, entry, i) => {
    const raw = positionScore(entry.position, entry.opponents)
    return acc + raw * (RECENCY_WEIGHTS[i] ?? 0.4)
  }, 0)
  const maxPossible = RECENCY_WEIGHTS.slice(0, Math.min(form.length, 5)).reduce((a, w) => a + 10 * w, 0)
  return maxPossible > 0 ? (total / maxPossible) * 10 : 5
}

export function scoreDistanceFit(
  raceDistance: number,
  preferredMin: number,
  preferredMax: number
): number {
  if (raceDistance >= preferredMin && raceDistance <= preferredMax) return 10
  const gap = Math.min(
    Math.abs(raceDistance - preferredMin),
    Math.abs(raceDistance - preferredMax)
  )
  if (gap <= 150) return 8.5
  if (gap <= 300) return 7
  if (gap <= 500) return 5
  if (gap <= 800) return 3
  return 1.5
}

export function scoreTrackCondition(
  currentCondition: TrackCondition,
  preferredConditions: TrackCondition[]
): number {
  if (preferredConditions.includes(currentCondition)) return 10
  const proximity: Record<TrackCondition, TrackCondition[]> = {
    'bon':        ['léger', 'souple'],
    'léger':      ['bon'],
    'souple':     ['bon', 'léger', 'lourd'],
    'lourd':      ['souple', 'très lourd'],
    'très lourd': ['lourd'],
  }
  const neighbors = proximity[currentCondition] ?? []
  if (preferredConditions.some(c => neighbors.includes(c))) return 5.5
  return 2
}

export function scoreOddsMovement(oddsChange: Horse['oddsChange']): number {
  if (oddsChange === 'down')   return 9   // cote baisse = intérêt des insiders
  if (oddsChange === 'stable') return 5
  return 2                                // cote monte = méfiance
}

export function scoreCareerConsistency(winRate: number, careerRaces: number): number {
  if (careerRaces < 3) return 5
  if (winRate >= 50)   return 10
  if (winRate >= 35)   return 8.5
  if (winRate >= 25)   return 7
  if (winRate >= 15)   return 5.5
  if (winRate >= 8)    return 4
  return 2.5
}

// ─── Jockeys / Drivers élite ──────────────────────────────────────────────────

const ELITE_JOCKEYS_GALOP = new Set([
  // France top
  'pierre-charles boudot', 'christophe soumillon', 'maxime guyon',
  'olivier peslier', 'stéphane pasquier', 'alexis badel',
  'mickael barzalona', 'cristian demuro', 'antoine hamelin',
  'théo bachelot', 'mickael forest', 'hugo besnier',
  'clément lecoeuvre', 'antoine lecorre', 'ronan thomas',
  'pierre guignard', 'ioritz mendizabal', 'franck blondel',
  'gerald mossé', 'vincent cheminaud',
  // International (courses en France)
  'ryan moore', 'william buick', 'frankie dettori', 'florent geroux',
  'james doyle', 'colm o\'donoghue', 'wayne lordan',
  'tom marquand', 'daniel tudhope', 'ben coen', 'rossa ryan',
])

const ELITE_DRIVERS_TROT = new Set([
  'jean-michel bazire', 'matthieu abrivard', 'éric raffin', 'frank nivard',
  'alexandre abrivard', 'joé wrona', 'pierre vercruysse',
  'jean-philippe monclin', 'yannick lebourgeois', 'gabriel gelormini',
  'clément duvaldestin', 'björn lindqvist', 'nicolas bazire',
  'jean-luc dersoir', 'adrien lamy-lapoulain', 'thomas duvaldestin',
  'damien bonne', 'sébastien mottier', 'anthony barrier',
  'charles-henri tirmont', 'benoît goop', 'örjan kihlström',
])

const ELITE_JOCKEYS_OBSTACLE = new Set([
  'guillaume macaire', 'arthur de vries', 'kevin nabet',
  'felix de giles', 'arnaud fabre', 'nico arnoux',
  'james reveley', 'charlie deutsch', 'gabriel leenders',
  'dorin moutascu', 'mathieu abrivard', 'bertrand lestrade',
])

// dynamicWinRate : win_rate depuis jockey_stats (0–100), undefined = pas de données
// Si données suffisantes (>= 20 courses implicite dans l'appelant), utilisées en priorité
export function scoreJockey(jockeyName: string, dynamicWinRate?: number): number {
  if (dynamicWinRate !== undefined) {
    // 0% → 0, 10% → 5, 20%+ → 10 (calibré sur le taux réel des jockeys français)
    return Math.min(10, dynamicWinRate * 0.5)
  }
  const name = jockeyName.toLowerCase().trim()
  if (ELITE_JOCKEYS_GALOP.has(name)) return 9.5
  if (ELITE_DRIVERS_TROT.has(name))  return 9.5
  if (ELITE_JOCKEYS_OBSTACLE.has(name)) return 9
  const short = name.replace(/[-.']/g, ' ').split(' ').filter(Boolean).pop() ?? ''
  if (short.length >= 5) {
    for (const elite of [...ELITE_JOCKEYS_GALOP, ...ELITE_DRIVERS_TROT]) {
      if (elite.endsWith(short)) return 8.5
    }
  }
  return 6
}

// ─── Entraîneurs élite ────────────────────────────────────────────────────────

const ELITE_TRAINERS_GALOP = new Set([
  // France
  'andré fabre', 'francis-henri graffard', 'carlos laffon-parias',
  'alain de royer-dupré', 'jean-claude rouget', 'christophe ferland',
  'mikel delzangles', 'freddy head', 'nicolas clément', 'yann barberot',
  'jonathan pease', 'cédric rossi', 'pascal bary', 'henri-alex pantall',
  'olivier doleuze', 'jean-pierre gauvin', 'arnaud chaillé-chaillé',
  'matthieu palussière', 'didier guillemin', 'jerome reynier',
  'david smaga', 'marc clément', 'jean-paul gallorini',
  'henry-alex pantall', 'patrice cottier',
  // Entraîneurs étrangers en France
  'aidan o\'brien', 'john gosden', 'charlie appleby', 'roger varian',
  'william haggas', 'mark johnston', 'hugo palmer',
])

const ELITE_TRAINERS_TROT = new Set([
  'jean-michel bazire', 'sébastien guarato', 'richard westerink',
  'yves duvaldestin', 'paul cailleau', 'thierry duvaldestin',
  'jean-etienne dubois', 'dominique bary', 'eric bougoure',
  'pierre levesque', 'nicolas enfer', 'dominique james',
  'cyril baudouin', 'gilles allaire', 'franck nivard',
])

const ELITE_TRAINERS_OBSTACLE = new Set([
  'guillaume macaire', 'philippe allaire', 'yannick fouin',
  'emmanuel clayeux', 'bertrand lestrade', 'paul nicholls',
  'nicky henderson', 'willie mullins', 'gordon elliott',
  'gavin cromwell', 'henry de bromhead', 'jessica harrington',
])

// dynamicWinRate : win_rate depuis trainer_stats (0–100), undefined = pas de données
export function scoreTrainer(trainerName: string, dynamicWinRate?: number): number {
  if (dynamicWinRate !== undefined) {
    return Math.min(10, dynamicWinRate * 0.5)
  }
  const name = trainerName.toLowerCase().trim().replace(/\([^)]*\)/g, '').trim()
  if (ELITE_TRAINERS_GALOP.has(name))    return 9.5
  if (ELITE_TRAINERS_TROT.has(name))     return 9.5
  if (ELITE_TRAINERS_OBSTACLE.has(name)) return 9
  const lastName = name.split(/[\s.]+/).filter(Boolean).pop() ?? ''
  if (lastName.length >= 4) {
    for (const elite of [...ELITE_TRAINERS_GALOP, ...ELITE_TRAINERS_TROT]) {
      if (elite.includes(lastName)) return 8
    }
  }
  return 6
}
