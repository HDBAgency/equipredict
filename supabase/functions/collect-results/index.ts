import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const PMU_BASE = 'https://online.turfinfo.api.pmu.fr/rest/client/61/programme'

function pad(n: number) { return String(n).padStart(2, '0') }
function toDDMMYYYY(d: Date) {
  return `${pad(d.getDate())}${pad(d.getMonth() + 1)}${d.getFullYear()}`
}

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

  const today = new Date()
  const dateStr = toDDMMYYYY(today)
  const raceDate = today.toISOString().slice(0, 10)

  // Récupérer le programme PMU du jour
  let programme: any
  try {
    const r = await fetch(`${PMU_BASE}/${dateStr}`)
    if (!r.ok) return new Response(`PMU fetch failed: ${r.status}`, { status: 500 })
    programme = await r.json()
  } catch (e) {
    return new Response(`PMU fetch error: ${e}`, { status: 500 })
  }

  const reunions = programme?.programme?.reunions ?? []
  const rows: any[] = []

  for (const reunion of reunions) {
    const reunionNum: number = reunion.numOrdre ?? reunion.numero
    const courses = reunion.courses ?? []

    for (const course of courses) {
      const courseNum: number = course.numOrdre ?? course.numero
      const statut: string = (course.statut ?? '').toUpperCase()

      // Uniquement les courses terminées avec résultats définitifs
      if (statut !== 'ARRIVEE' && statut !== 'ARRIVEE_DEFINITIVE') continue

      const raceId = `pmu-R${reunionNum}-C${courseNum}`
      const participants: any[] = course.participants ?? []

      // Calcul des facteurs bruts (identique à route.ts)
      const validOdds = participants.filter((p: any) => {
        const o = p.dernierRapportDirect?.rapportDirect ?? p.rapport ?? 0
        return o > 0 && o < 90
      })
      const oddsArr = validOdds.map((p: any) => p.dernierRapportDirect?.rapportDirect ?? p.rapport)
      const minOdds = Math.min(...(oddsArr.length ? oddsArr : [1]))
      const maxOdds = Math.max(...(oddsArr.length ? oddsArr : [100]))
      const oddsRange = Math.max(maxOdds - minOdds, 1)

      const maxEarnings = Math.max(
        ...participants.map((p: any) => p.gainsCarriere ?? p.gains ?? 0),
        1
      )

      for (const p of participants) {
        const finishPos: number = p.ordreArrivee ?? 0
        if (!finishPos || finishPos <= 0) continue  // skip non-classé / NP

        const num: number = p.numPmu ?? p.numero
        const odds = p.dernierRapportDirect?.rapportDirect ?? p.rapport ?? 99

        // Forme (musique)
        const musicRaw: string = p.musique ?? ''
        let formScore = 5
        if (musicRaw) {
          const results = musicRaw.split('').filter((c: string) => /[0-9aAdDbBpPT]/.test(c))
          const recent = results.slice(0, 5)
          const pts = recent.reduce((acc: number, c: string) => {
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

        // Rang odds (signal marché)
        const oddsRank = odds < 90 ? (1 - (odds - minOdds) / oddsRange) * 10 : 5

        // Statistiques carrière
        const careerRaces: number = p.nombreCourses ?? 0
        const wins: number = p.nombreVictoires ?? 0
        const places: number = (p.nombreVictoires ?? 0) + (p.nombrePlaces ?? 0)
        const winRate = careerRaces >= 3 ? (wins / careerRaces) * 100 : 0
        const placeRate = careerRaces >= 3 ? (places / careerRaces) * 100 : 0

        const consist = careerRaces >= 3 ? Math.min(10, winRate / 10) : 5
        const placement = careerRaces >= 3 ? Math.min(10, placeRate / 10) : 5

        // Mouvement de cote
        const prevOdds = p.dernierRapportReference?.rapportDirect ?? odds
        const ratio = odds > 0 ? (prevOdds - odds) / prevOdds : 0
        const mvt = Math.max(0, Math.min(10, 5 + ratio * 25))

        // Âge
        const age: number = p.age ?? 0
        const raceType: string = (reunion.specialite ?? '').toLowerCase()
        let ageScore = 5
        if (age > 0) {
          if (raceType.includes('plat')) ageScore = age >= 3 && age <= 6 ? 9 : age <= 8 ? 6 : 3
          else if (raceType.includes('trot')) ageScore = age >= 4 && age <= 7 ? 9 : age <= 9 ? 6 : 3
          else ageScore = age >= 5 && age <= 9 ? 9 : age <= 11 ? 6 : 3
        }

        // Gains carrière normalisés
        const careerEarnings: number = p.gainsCarriere ?? p.gains ?? 0
        const earnings = maxEarnings > 0 ? Math.min(10, (careerEarnings / maxEarnings) * 10) : 5

        rows.push({
          race_id: raceId,
          race_date: raceDate,
          horse_number: num,
          finish_pos: finishPos,
          raw_form: formScore,
          raw_odds_rank: oddsRank,
          raw_consist: consist,
          raw_placement: placement,
          raw_mvt: mvt,
          raw_age: ageScore,
          raw_earnings: earnings,
        })
      }
    }
  }

  if (!rows.length) return new Response(JSON.stringify({ collected: 0 }))

  const { error } = await supabase.from('race_outcomes').upsert(rows, {
    onConflict: 'race_id,horse_number',
    ignoreDuplicates: true,
  })

  if (error) return new Response(`DB error: ${error.message}`, { status: 500 })

  return new Response(JSON.stringify({ collected: rows.length }))
})
