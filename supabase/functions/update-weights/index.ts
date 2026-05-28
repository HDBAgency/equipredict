import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// EMA learning rate — 0.15 = 15% de mise à jour par nuit
// Faible pour stabilité, assez élevé pour apprendre en ~2 semaines
const LR = 0.15

// Plages autorisées pour chaque poids (évite les dérives)
const BOUNDS: Record<string, [number, number]> = {
  w_form:      [0.15, 0.45],
  w_odds_rank: [0.12, 0.40],
  w_consist:   [0.05, 0.25],
  w_placement: [0.04, 0.22],
  w_mvt:       [0.04, 0.22],
  w_age:       [0.02, 0.18],
  w_earnings:  [0.02, 0.15],
}

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

  // 1. Charger les poids actuels
  const { data: wRow, error: wErr } = await supabase
    .from('model_weights')
    .select('*')
    .single()
  if (wErr || !wRow) return new Response(`weights error: ${wErr?.message}`, { status: 500 })

  // 2. Récupérer les résultats des 7 derniers jours non encore traités
  //    (on prend toujours la même fenêtre, l'upsert évite les doublons)
  const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const { data: outcomes, error: oErr } = await supabase
    .from('race_outcomes')
    .select('race_id, horse_number, finish_pos, raw_form, raw_odds_rank, raw_consist, raw_placement, raw_mvt, raw_age, raw_earnings')
    .gte('race_date', since)
  if (oErr) return new Response(`outcomes error: ${oErr.message}`, { status: 500 })
  if (!outcomes?.length) return new Response(JSON.stringify({ updated: false, reason: 'no data' }))

  // 3. Grouper par course
  const races = new Map<string, typeof outcomes>()
  for (const r of outcomes) {
    if (!races.has(r.race_id)) races.set(r.race_id, [])
    races.get(r.race_id)!.push(r)
  }

  // 4. Pour chaque course, calculer le gradient signal :
  //    - Le gagnant (finish_pos=1) devrait avoir les raw_* les plus élevés
  //    - On mesure : pour chaque facteur f, grad_f = mean(f_winner) - mean(f_others)
  //    - Un grad positif signifie que le facteur discrimine bien → augmenter le poids
  const factors = ['raw_form','raw_odds_rank','raw_consist','raw_placement','raw_mvt','raw_age','raw_earnings'] as const
  const keys =    ['w_form',  'w_odds_rank',  'w_consist',  'w_placement',  'w_mvt',  'w_age',  'w_earnings'] as const

  const gradSum: Record<string, number> = {}
  for (const k of keys) gradSum[k] = 0
  let raceCount = 0

  for (const [, horses] of races) {
    const winner = horses.find(h => h.finish_pos === 1)
    const others = horses.filter(h => h.finish_pos !== 1)
    if (!winner || others.length < 2) continue

    for (let i = 0; i < factors.length; i++) {
      const f = factors[i]
      const k = keys[i]
      const wVal = winner[f] ?? 5
      const oAvg = others.reduce((s, h) => s + (h[f] ?? 5), 0) / others.length
      gradSum[k] += (wVal - oAvg)  // positif si facteur aide à trouver le gagnant
    }
    raceCount++
  }

  if (raceCount === 0) return new Response(JSON.stringify({ updated: false, reason: 'no complete races' }))

  // 5. Normaliser les gradients et mettre à jour les poids via EMA
  const newWeights: Record<string, number> = {}
  const rawUpdated: Record<string, number> = {}

  // Convertir le gradient en signal de direction puis clamp + normalize
  const gradMax = Math.max(...Object.values(gradSum).map(Math.abs), 0.001)

  for (const k of keys) {
    const grad = gradSum[k] / raceCount        // gradient moyen par course
    const signal = grad / gradMax              // normalisé -1..+1
    const current = wRow[k] as number
    // EMA : déplace le poids vers la direction du signal
    const nudge = signal * 0.03                // max 3% de déplacement par nuit
    const updated = current + nudge
    rawUpdated[k] = updated
  }

  // 6. Appliquer les bornes individuelles
  for (const k of keys) {
    const [lo, hi] = BOUNDS[k]
    rawUpdated[k] = Math.max(lo, Math.min(hi, rawUpdated[k]))
  }

  // 7. Re-normaliser pour que la somme = 1.0
  const total = Object.values(rawUpdated).reduce((s, v) => s + v, 0)
  for (const k of keys) {
    newWeights[k] = rawUpdated[k] / total
  }

  // 8. Calculer les métriques top-1 et top-3 accuracy avec les nouveaux poids
  let top1Hits = 0, top3Hits = 0, totalRaces = 0
  for (const [, horses] of races) {
    if (horses.length < 2) continue
    // Score IA avec les nouveaux poids
    const scored = horses.map(h => ({
      finish_pos: h.finish_pos,
      aiScore: (h.raw_form ?? 5)       * newWeights['w_form']
             + (h.raw_odds_rank ?? 5)  * newWeights['w_odds_rank']
             + (h.raw_consist ?? 5)    * newWeights['w_consist']
             + (h.raw_placement ?? 5)  * newWeights['w_placement']
             + (h.raw_mvt ?? 5)        * newWeights['w_mvt']
             + (h.raw_age ?? 5)        * newWeights['w_age']
             + (h.raw_earnings ?? 5)   * newWeights['w_earnings'],
    })).sort((a, b) => b.aiScore - a.aiScore)

    const predicted1st = scored[0]?.finish_pos
    if (predicted1st === 1 || predicted1st === 2) top1Hits++
    if (scored.slice(0, 3).some(h => h.finish_pos <= 3)) top3Hits++
    totalRaces++
  }

  const top1Acc = totalRaces > 0 ? top1Hits / totalRaces : null
  const top3Acc = totalRaces > 0 ? top3Hits / totalRaces : null

  // 9. Sauvegarder les nouveaux poids
  const { error: updErr } = await supabase.from('model_weights').update({
    ...newWeights,
    sample_count: wRow.sample_count + raceCount,
    last_updated: new Date().toISOString(),
  }).eq('id', true)

  if (updErr) return new Response(`update error: ${updErr.message}`, { status: 500 })

  // 10. Logger la performance
  await supabase.from('prediction_performance').insert({
    race_date: new Date().toISOString().slice(0, 10),
    total_races: totalRaces,
    total_horses: outcomes.length,
    top1_accuracy: top1Acc,
    top3_accuracy: top3Acc,
    weights_snapshot: newWeights,
  })

  return new Response(JSON.stringify({
    updated: true,
    races_processed: raceCount,
    top1_accuracy: top1Acc ? Math.round(top1Acc * 100) + '%' : null,
    top3_accuracy: top3Acc ? Math.round(top3Acc * 100) + '%' : null,
    new_weights: Object.fromEntries(keys.map(k => [k, Math.round(newWeights[k] * 1000) / 1000])),
  }))
})
