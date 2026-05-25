import { NextResponse } from 'next/server'

function pad(n: number) { return String(n).padStart(2, '0') }

export async function GET() {
  const today = new Date()
  const ddmmyyyy = `${pad(today.getDate())}${pad(today.getMonth() + 1)}${today.getFullYear()}`

  async function get(url: string) {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 8000)
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
        signal: ctrl.signal,
      })
      clearTimeout(t)
      if (!res.ok) return { error: `HTTP ${res.status}` }
      return await res.json()
    } catch (e) {
      clearTimeout(t)
      return { error: String(e) }
    }
  }

  const base = `https://online.turfinfo.api.pmu.fr/rest/client/61/programme/${ddmmyyyy}`
  const data = await get(base)
  const reunions = data?.programme?.reunions ?? []
  const r0 = reunions[0]
  const c0 = r0?.courses?.[0]

  // Extract key numeric fields from course
  const courseNumbers = {
    numOrdre: c0?.numOrdre,
    numExterne: c0?.numExterne,
    numReunion: c0?.numReunion,
    numSocieteMere: c0?.numSocieteMere,
    reunion_numOfficiel: r0?.numOfficiel,
  }

  // Test participants URL variants
  const r = r0?.numOfficiel ?? 1
  const c = c0?.numOrdre ?? 1

  const partUrl1 = `${base}/R${r}/C${c}/participants`
  const partUrl2 = `${base}/R${r}/C${c0?.numExterne ?? c}/participants`

  const [part1, part2] = await Promise.all([get(partUrl1), get(partUrl2)])

  // Show participant fields if found
  const pList = part1?.participants ?? part1?.partants ?? part2?.participants ?? part2?.partants ?? []
  const p0 = pList[0] ?? null

  return NextResponse.json({
    date: ddmmyyyy,
    totalReunions: reunions.length,
    courseNumbers,
    heureDepart_parsed: c0?.heureDepart ? new Date(c0.heureDepart).toISOString() : null,
    participantsTest: {
      url1: { url: partUrl1, nbParticipants: pList.length, topKeys: p0 ? Object.keys(p0).slice(0, 20) : null },
      url2: { url: partUrl2 },
      participant0: p0 ? {
        numPmu: p0.numPmu,
        nom: p0.nom,
        driver: p0.driver,
        jockey: p0.jockey,
        entraineur: p0.entraineur,
        age: p0.age,
        rapportSimpleGagnant: p0.rapportSimpleGagnant,
        coteDirecte: p0.coteDirecte,
        cote: p0.cote,
        rapport: p0.rapport,
        dernierRapportDirect: p0.dernierRapportDirect,
      } : 'no participants',
    },
    // All reunions summary
    allReunions: reunions.slice(0, 4).map((r: Record<string, unknown>) => {
      const reunion = r as { numOfficiel?: number; hippodrome?: { libelleLong?: string }; courses?: Record<string, unknown>[] }
      return {
        R: reunion.numOfficiel,
        hippo: reunion.hippodrome?.libelleLong,
        courses: (reunion.courses ?? []).map(c => ({
          numOrdre: (c as { numOrdre?: number }).numOrdre,
          numExterne: (c as { numExterne?: number }).numExterne,
          libelle: (c as { libelle?: string }).libelle,
          heure: new Date((c as { heureDepart?: number }).heureDepart ?? 0).toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris' }),
          discipline: (c as { discipline?: string }).discipline,
          specialite: (c as { specialite?: string }).specialite,
          partants: (c as { nombreDeclaresPartants?: number }).nombreDeclaresPartants,
        })),
      }
    }),
  })
}
