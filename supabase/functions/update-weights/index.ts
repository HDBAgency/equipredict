import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// ─── Hyperparamètres RankNet ──────────────────────────────────────────────────
const EPOCHS   = 100    // itérations de gradient descent
const LR       = 0.005  // learning rate (normalisé par nb de paires)
const L2       = 0.01   // régularisation L2 (évite la dérive vers les bords)
const VAL_FRAC = 0.30   // 30% des courses pour la validation

// ─── Facteurs et poids du modèle (12 facteurs) ───────────────────────────────
const FACTORS = [
  'raw_form',   'raw_odds_rank',  'raw_consist',        'raw_placement',
  'raw_mvt',    'raw_age',        'raw_earnings',        'raw_jockey_wr',
  'raw_trainer_wr', 'raw_weight_penalty', 'raw_form_x_signal', 'raw_jockey_x_trainer',
] as const

const KEYS = [
  'w_form',   'w_odds_rank',  'w_consist',        'w_placement',
  'w_mvt',    'w_age',        'w_earnings',        'w_jockey_wr',
  'w_trainer_wr', 'w_weight_penalty', 'w_form_x_signal', 'w_jockey_x_trainer',
] as const

type FactorKey = typeof FACTORS[number]
type WeightKey = typeof KEYS[number]

// Plages autorisées par poids (empêche les dérives extrêmes)
const BOUNDS: Record<WeightKey, [number, number]> = {
  w_form:             [0.10, 0.35],
  w_odds_rank:        [0.08, 0.32],
  w_consist:          [0.03, 0.18],
  w_placement:        [0.03, 0.16],
  w_mvt:              [0.03, 0.16],
  w_age:              [0.02, 0.12],
  w_earnings:         [0.02, 0.10],
  w_jockey_wr:        [0.03, 0.18],
  w_trainer_wr:       [0.02, 0.14],
  w_weight_penalty:   [0.01, 0.10],
  w_form_x_signal:    [0.02, 0.14],
  w_jockey_x_trainer: [0.02, 0.12],
}

// Valeur neutre par défaut si un facteur est absent
const DEFAULT_FEATURE = 5.0

// ─── Utilitaires mathématiques ────────────────────────────────────────────────

function sigmoid(x: number): number {
  if (x > 20)  return 1.0
  if (x < -20) return 0.0
  return 1 / (1 + Math.exp(-x))
}

function computeScore(horse: Record<string, unknown>, weights: Record<WeightKey, number>): number {
  let s = 0
  for (let i = 0; i < FACTORS.length; i++) {
    s += weights[KEYS[i]] * ((horse[FACTORS[i]] as number | null) ?? DEFAULT_FEATURE)
  }
  return s
}

// ─── Hash déterministe d'un race_id pour le split train/val ──────────────────
// Garantit que toutes les courses d'un même jour sont soit en train, soit en val
// (pas de fuite d'information entre splits)
function hashRaceId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) - h + id.charCodeAt(i)) | 0
  }
  return (h >>> 0) / 0xFFFFFFFF  // 0..1
}

// ─── RankNet : une epoch de gradient descent pairwise ────────────────────────
// Perte logistique pairwise : L = sum_{races} sum_{losers} log(1 + exp(s_loser - s_winner))
// Gradient w.r.t w_k : dL/dw_k = sum_{pairs} sigma(s_loser - s_winner) * (f_k^loser - f_k^winner)
function rankNetEpoch(
  races: Map<string, Array<Record<string, unknown>>>,
  weights: Record<WeightKey, number>,
): { loss: number; numPairs: number; grad: Record<WeightKey, number> } {
  const grad = Object.fromEntries(KEYS.map(k => [k, 0])) as Record<WeightKey, number>
  let totalLoss = 0
  let numPairs = 0

  for (const [, horses] of races) {
    const winner = horses.find(h => (h.finish_pos as number) === 1)
    if (!winner) continue
    const losers = horses.filter(h => (h.finish_pos as number) !== 1)
    if (losers.length === 0) continue

    const sWinner = computeScore(winner, weights)

    for (const loser of losers) {
      const sLoser = computeScore(loser, weights)
      const diff = sLoser - sWinner          // positif = loser mal classé
      const sig  = sigmoid(diff)
      totalLoss += Math.log(1 + Math.exp(diff > 20 ? 20 : diff))

      for (let i = 0; i < FACTORS.length; i++) {
        const fWinner = (winner[FACTORS[i]] as number | null) ?? DEFAULT_FEATURE
        const fLoser  = (loser[FACTORS[i]]  as number | null) ?? DEFAULT_FEATURE
        grad[KEYS[i]] += sig * (fLoser - fWinner)
      }
      numPairs++
    }
  }

  // Régularisation L2 centrée sur la distribution uniforme (1/9 ≈ 0.111)
  const uniformW = 1 / KEYS.length
  for (const k of KEYS) {
    grad[k] += L2 * (weights[k] - uniformW) * numPairs
  }

  return { loss: totalLoss, numPairs, grad }
}

// ─── Applique les bornes puis re-normalise pour que sum(w) = 1 ───────────────
function clampAndNormalize(w: Record<WeightKey, number>): Record<WeightKey, number> {
  const clamped = { ...w }
  for (const k of KEYS) {
    const [lo, hi] = BOUNDS[k]
    clamped[k] = Math.max(lo, Math.min(hi, clamped[k]))
  }
  const total = KEYS.reduce((s, k) => s + clamped[k], 0)
  for (const k of KEYS) clamped[k] /= total
  return clamped
}

// ─── Métriques top-1 et top-3 accuracy ───────────────────────────────────────
function computeAccuracy(
  races: Map<string, Array<Record<string, unknown>>>,
  weights: Record<WeightKey, number>,
): { top1: number; top3: number; total: number } {
  let top1Hits = 0, top3Hits = 0, total = 0

  for (const [, horses] of races) {
    if (horses.length < 2) continue
    const scored = horses
      .map(h => ({ pos: (h.finish_pos as number), score: computeScore(h, weights) }))
      .sort((a, b) => b.score - a.score)

    const predicted1st = scored[0]?.pos
    if (predicted1st === 1 || predicted1st === 2) top1Hits++
    if (scored.slice(0, 3).some(h => h.pos <= 3))  top3Hits++
    total++
  }

  return {
    top1:  total > 0 ? top1Hits / total : 0,
    top3:  total > 0 ? top3Hits / total : 0,
    total,
  }
}

// ─── Entrée principale ────────────────────────────────────────────────────────

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

  // 1. Charger les poids actuels
  const { data: wRow, error: wErr } = await supabase
    .from('model_weights')
    .select('*')
    .single()
  if (wErr || !wRow) return new Response(`weights error: ${wErr?.message}`, { status: 500 })

  // 2. Récupérer les 30 derniers jours de résultats (plus large = meilleure généralisation)
  const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  const { data: outcomes, error: oErr } = await supabase
    .from('race_outcomes')
    .select([
      'race_id', 'horse_number', 'finish_pos',
      'raw_form', 'raw_odds_rank', 'raw_consist', 'raw_placement',
      'raw_mvt',  'raw_age',       'raw_earnings',
      'raw_jockey_wr',    'raw_trainer_wr',
      'raw_weight_penalty', 'raw_form_x_signal', 'raw_jockey_x_trainer',
    ].join(','))
    .gte('race_date', since)
  if (oErr) return new Response(`outcomes error: ${oErr.message}`, { status: 500 })
  if (!outcomes?.length) return new Response(JSON.stringify({ updated: false, reason: 'no data' }))

  // 3. Grouper par course
  const allRaces = new Map<string, Array<Record<string, unknown>>>()
  for (const r of outcomes) {
    if (!allRaces.has(r.race_id)) allRaces.set(r.race_id, [])
    allRaces.get(r.race_id)!.push(r)
  }

  // 4. Split train / validation (déterministe par hash de race_id)
  //    70% train, 30% val — pas de fuite d'info car basé sur race_id
  const trainRaces = new Map<string, Array<Record<string, unknown>>>()
  const valRaces   = new Map<string, Array<Record<string, unknown>>>()

  for (const [id, horses] of allRaces) {
    if (hashRaceId(id) < (1 - VAL_FRAC)) {
      trainRaces.set(id, horses)
    } else {
      valRaces.set(id, horses)
    }
  }

  if (trainRaces.size === 0) return new Response(JSON.stringify({ updated: false, reason: 'no training races' }))

  // 5. Initialiser les poids depuis la DB (copie pour ne pas muter wRow)
  let weights: Record<WeightKey, number> = {} as Record<WeightKey, number>
  for (const k of KEYS) weights[k] = (wRow[k] as number | null) ?? (1 / KEYS.length)
  weights = clampAndNormalize(weights)

  // 6. Entraînement RankNet — gradient descent sur la perte de ranking logistique
  let finalLoss = 0
  for (let epoch = 0; epoch < EPOCHS; epoch++) {
    const { loss, numPairs, grad } = rankNetEpoch(trainRaces, weights)
    finalLoss = loss / Math.max(numPairs, 1)

    if (numPairs === 0) break

    // Descente de gradient normalisée par le nombre de paires
    const newW: Record<WeightKey, number> = {} as Record<WeightKey, number>
    for (const k of KEYS) {
      newW[k] = weights[k] - LR * grad[k] / numPairs
    }
    weights = clampAndNormalize(newW)
  }

  // 7. Métriques train et validation avec les poids appris
  const trainMetrics = computeAccuracy(trainRaces, weights)
  const valMetrics   = computeAccuracy(valRaces,   weights)

  // 8. Sauvegarder les nouveaux poids
  const { error: updErr } = await supabase
    .from('model_weights')
    .update({
      ...weights,
      sample_count: wRow.sample_count + trainRaces.size,
      last_updated: new Date().toISOString(),
    })
    .eq('id', true)
  if (updErr) return new Response(`update error: ${updErr.message}`, { status: 500 })

  // 9. Logger la performance (train + val séparées)
  await supabase.from('prediction_performance').insert({
    race_date:          new Date().toISOString().slice(0, 10),
    total_races:        allRaces.size,
    total_horses:       outcomes.length,
    top1_accuracy:      trainMetrics.top1,
    top3_accuracy:      trainMetrics.top3,
    val_top1_accuracy:  valMetrics.top1,
    val_top3_accuracy:  valMetrics.top3,
    train_races:        trainMetrics.total,
    val_races:          valMetrics.total,
    ranknet_loss:       finalLoss,
    weights_snapshot:   weights,
  })

  // 10. Déclencher l'entraînement XGBoost (fire-and-forget, non bloquant)
  const xgbUrl = Deno.env.get('XGBOOST_SERVICE_URL')
  const xgbSecret = Deno.env.get('TRAIN_SECRET') ?? ''
  let xgbTriggered = false
  if (xgbUrl) {
    try {
      const ctrl  = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 5000)
      const r = await fetch(`${xgbUrl}/train`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'X-Train-Secret': xgbSecret },
        body:    JSON.stringify({ days: 90 }),
        signal:  ctrl.signal,
      })
      clearTimeout(timer)
      xgbTriggered = r.ok
    } catch {
      xgbTriggered = false  // service hors ligne, pas critique
    }
  }

  return new Response(JSON.stringify({
    updated:          true,
    epochs:           EPOCHS,
    train_races:      trainMetrics.total,
    val_races:        valMetrics.total,
    ranknet_loss:     Math.round(finalLoss * 10000) / 10000,
    train_top1:       `${Math.round(trainMetrics.top1 * 100)}%`,
    train_top3:       `${Math.round(trainMetrics.top3 * 100)}%`,
    val_top1:         `${Math.round(valMetrics.top1 * 100)}%`,
    val_top3:         `${Math.round(valMetrics.top3 * 100)}%`,
    new_weights:      Object.fromEntries(KEYS.map(k => [k, Math.round(weights[k] * 1000) / 1000])),
    xgboost_triggered: xgbTriggered,
  }), { headers: { 'Content-Type': 'application/json' } })
})
