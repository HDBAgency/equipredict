import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const PMU_BASE     = 'https://online.turfinfo.api.pmu.fr/rest/client/61/programme'

function pad(n: number) { return String(n).padStart(2, '0') }
function toDDMMYYYY(d: Date) {
  return `${pad(d.getDate())}${pad(d.getMonth() + 1)}${d.getFullYear()}`
}

function toTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/(?:^|[\s-])\S/g, c => c.toUpperCase())
    .trim()
}

function winRateToScore(winRate: number, minRaces: number, actualRaces: number): number {
  if (actualRaces < minRaces) return 5.0
  return Math.min(10, winRate * 0.5)
}

Deno.serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

  let daysBack = 1
  try {
    const body = await req.json().catch(() => ({}))
    if (body.days_back && typeof body.days_back === 'number') {
      daysBack = Math.min(Math.max(1, body.days_back), 30)
    }
  } catch { /* ignore */ }

  // ─── 1. Charger les stats jockey/trainer une seule fois ──────────────────────
  const [{ data: jockeyData }, { data: trainerData }] = await Promise.all([
    supabase.from('jockey_stats').select('jockey_name, win_rate, total_races'),
    supabase.from('trainer_stats').select('trainer_name, win_rate, total_races'),
  ])

  const jockeyMap  = new Map<string, { win_rate: number; total_races: number }>()
  const trainerMap = new Map<string, { win_rate: number; total_races: number }>()

  for (const j of jockeyData  ?? []) jockeyMap.set(j.jockey_name.toLowerCase(),  { win_rate: j.win_rate,  total_races: j.total_races })
  for (const t of trainerData ?? []) trainerMap.set(t.trainer_name.toLowerCase(), { win_rate: t.win_rate, total_races: t.total_races })

  // ─── 2. Récupérer les programmes PMU pour chaque jour ───────────────────────
  const allRows: Record<string, unknown>[] = []
  const dayResults: Record<string, number> = {}

  for (let d = daysBack - 1; d >= 0; d--) {
    const date     = new Date()
    date.setDate(date.getDate() - d)
    const dateStr  = toDDMMYYYY(date)
    const raceDate = date.toISOString().slice(0, 10)

    let programme: Record<string, unknown>
    try {
      const r = await fetch(`${PMU_BASE}/${dateStr}`)
      if (!r.ok) { dayResults[raceDate] = 0; continue }
      programme = await r.json()
    } catch { dayResults[raceDate] = 0; continue }

    const reunions = (programme?.programme as Record<string, unknown>)?.reunions
      ?? (programme as Record<string, unknown>)?.reunions
      ?? []
    const rows: Record<string, unknown>[] = []

    for (const reunion of (reunions as Record<string, unknown>[])) {
      const reunionNum = (reunion.numOfficiel ?? reunion.numOrdre ?? reunion.numExterne) as number
      const raceType   = ((reunion.specialite ?? '') as string).toLowerCase()
      const courses    = (reunion.courses ?? []) as Record<string, unknown>[]

      for (const course of courses) {
        const courseNum         = (course.numOrdre ?? course.numExterne) as number
        const arriveeDefinitive = course.arriveeDefinitive === true
        const statut            = ((course.statut ?? '') as string).toUpperCase()

        if (!arriveeDefinitive && statut !== 'ARRIVEE' && statut !== 'ARRIVEE_DEFINITIVE') continue

        const raceId = `pmu-R${reunionNum}-C${courseNum}`

        // Les participants avec ordreArrivee sont dans un endpoint séparé
        let participants: Record<string, unknown>[]
        try {
          const pr = await fetch(`${PMU_BASE}/${dateStr}/R${reunionNum}/C${courseNum}/participants`)
          if (!pr.ok) continue
          const pData = await pr.json()
          participants = (pData.participants ?? []) as Record<string, unknown>[]
        } catch { continue }

        const validOdds = participants.filter(p => {
          const o = ((p.dernierRapportDirect as Record<string,number>|null)?.rapportDirect ?? p.rapport ?? 0) as number
          return o > 0 && o < 90
        })
        const oddsArr   = validOdds.map(p => (p.dernierRapportDirect as Record<string,number>|null)?.rapportDirect ?? p.rapport as number)
        const minOdds   = Math.min(...(oddsArr.length ? oddsArr : [1]))
        const maxOdds   = Math.max(...(oddsArr.length ? oddsArr : [100]))
        const oddsRange = Math.max(maxOdds - minOdds, 1)

        const maxEarnings = Math.max(
          ...participants.map(p => ((p.gainsParticipant as Record<string,number>|null)?.gainsCarriere ?? p.gainsCarriere ?? p.gains ?? 0) as number),
          1,
        )

        for (const p of participants) {
          const finishPos = (p.ordreArrivee ?? 0) as number
          if (!finishPos || finishPos <= 0) continue

          const num  = (p.numPmu ?? p.numero) as number
          const odds = ((p.dernierRapportDirect as Record<string,number>|null)?.rapportDirect
                        ?? p.rapport
                        ?? 99) as number

          const jockeyRaw = toTitle(
            (p.driver ?? p.jockey ?? p.nomDriver ?? p.nomJockey ?? '') as string
          ).trim() || null

          const trainerRaw = toTitle(
            ((p.entraineur as string | null) ?? p.nomEntraineur ?? '') as string
          ).trim() || null

          const musicRaw = (p.musique ?? '') as string
          let formScore = 5
          if (musicRaw) {
            const chars  = musicRaw.split('').filter(c => /[0-9aAdDbBpPT]/.test(c))
            const recent = chars.slice(0, 5)
            const pts = recent.reduce((acc, c) => {
              if (c === '1') return acc + 10
              if (c === '2') return acc + 8
              if (c === '3') return acc + 6
              if (/[4-6]/.test(c)) return acc + 4
              if (/[7-9]/.test(c)) return acc + 2
              if (c.toLowerCase() === 'a') return acc + 1
              return acc
            }, 0)
            formScore = recent.length > 0 ? Math.min(10, pts / recent.length) : 5
          }

          const oddsRank = odds < 90 ? (1 - (odds - minOdds) / oddsRange) * 10 : 5

          const careerRaces = (p.nombreCourses  ?? 0) as number
          const wins        = (p.nombreVictoires ?? 0) as number
          const places      = wins + ((p.nombrePlaces ?? 0) as number)
          const winRate     = careerRaces >= 3 ? (wins / careerRaces) * 100 : 0
          const placeRate   = careerRaces >= 3 ? (places / careerRaces) * 100 : 0
          const consist     = careerRaces >= 3 ? Math.min(10, winRate / 10)   : 5
          const placement   = careerRaces >= 3 ? Math.min(10, placeRate / 10) : 5

          const prevOdds = ((p.dernierRapportReference as Record<string,number>|null)?.rapportDirect ?? odds) as number
          const ratio    = odds > 0 ? (prevOdds - odds) / prevOdds : 0
          const mvt      = Math.max(0, Math.min(10, 5 + ratio * 25))

          const age = (p.age ?? 0) as number
          let ageScore = 5
          if (age > 0) {
            if (raceType.includes('plat'))        ageScore = age >= 3 && age <= 6 ? 9 : age <= 8  ? 6 : 3
            else if (raceType.includes('trot'))   ageScore = age >= 4 && age <= 7 ? 9 : age <= 9  ? 6 : 3
            else                                  ageScore = age >= 5 && age <= 9 ? 9 : age <= 11 ? 6 : 3
          }

          const careerEarnings = ((p.gainsParticipant as Record<string,number>|null)?.gainsCarriere ?? p.gainsCarriere ?? p.gains ?? 0) as number
          const earnings       = maxEarnings > 0 ? Math.min(10, (careerEarnings / maxEarnings) * 10) : 5

          const jockeyKey  = jockeyRaw?.toLowerCase() ?? ''
          const trainerKey = trainerRaw?.toLowerCase() ?? ''
          const jStat = jockeyKey  ? jockeyMap.get(jockeyKey)  : undefined
          const tStat = trainerKey ? trainerMap.get(trainerKey) : undefined

          const rawJockeyWR  = winRateToScore(jStat?.win_rate ?? 0, 20, jStat?.total_races ?? 0)
          const rawTrainerWR = winRateToScore(tStat?.win_rate ?? 0, 15, tStat?.total_races ?? 0)

          const carryWeight = (p.poidsConditionMonte ?? p.handicapPoids ?? p.poids ?? 0) as number
          let weightPenalty = 5
          if (carryWeight > 0 && raceType.includes('plat')) {
            if (carryWeight <= 54)      weightPenalty = 9.5
            else if (carryWeight <= 57) weightPenalty = 8
            else if (carryWeight <= 60) weightPenalty = 6.5
            else if (carryWeight <= 63) weightPenalty = 4.5
            else                        weightPenalty = 2.5
          }

          const rawFormXSignal    = (formScore * oddsRank) / 10
          const rawJockeyXTrainer = (rawJockeyWR * rawTrainerWR) / 10

          rows.push({
            race_id:              raceId,
            race_date:            raceDate,
            horse_number:         num,
            finish_pos:           finishPos,
            jockey_name:          jockeyRaw,
            trainer_name:         trainerRaw,
            raw_form:             formScore,
            raw_odds_rank:        oddsRank,
            raw_consist:          consist,
            raw_placement:        placement,
            raw_mvt:              mvt,
            raw_age:              ageScore,
            raw_earnings:         earnings,
            raw_jockey_wr:        rawJockeyWR,
            raw_trainer_wr:       rawTrainerWR,
            raw_weight_penalty:   weightPenalty,
            raw_form_x_signal:    rawFormXSignal,
            raw_jockey_x_trainer: rawJockeyXTrainer,
          })
        }
      }
    }

    dayResults[raceDate] = rows.length
    allRows.push(...rows)
  }

  if (!allRows.length) return new Response(JSON.stringify({ collected: 0, days: dayResults }), {
    headers: { 'Content-Type': 'application/json' },
  })

  // ─── 3. Sauvegarder les résultats ────────────────────────────────────────────
  const { error } = await supabase.from('race_outcomes').upsert(allRows, {
    onConflict:       'race_id,horse_number',
    ignoreDuplicates: true,
  })
  if (error) return new Response(`DB error: ${error.message}`, { status: 500 })

  // ─── 4. Recalculer jockey_stats + trainer_stats ──────────────────────────────
  const { error: rpcErr } = await supabase.rpc('refresh_rider_stats')
  if (rpcErr) console.error('refresh_rider_stats error:', rpcErr.message)

  return new Response(JSON.stringify({
    collected:       allRows.length,
    days:            dayResults,
    jockey_stats_ok: !rpcErr,
    jockey_loaded:   jockeyMap.size,
    trainer_loaded:  trainerMap.size,
  }), { headers: { 'Content-Type': 'application/json' } })
})
