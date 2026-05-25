import { NextResponse } from 'next/server'

const PMU_BASE = 'https://online.turfinfo.api.pmu.fr/rest/client/61/programme'

function pad(n: number) { return String(n).padStart(2, '0') }
function toDDMMYYYY(d: Date) {
  return `${pad(d.getDate())}${pad(d.getMonth() + 1)}${d.getFullYear()}`
}

export async function GET() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const ddmmyyyy = toDDMMYYYY(tomorrow)

  try {
    const res = await fetch(`${PMU_BASE}/${ddmmyyyy}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
      next: { revalidate: 3600 },
    })

    if (!res.ok) throw new Error('PMU API unavailable')
    const data = await res.json()

    const reunions = data?.programme?.reunions ?? data?.reunions ?? []
    const allCourses: { heureDepart: number }[] = []

    for (const reunion of reunions) {
      for (const course of (reunion.courses ?? [])) {
        if (typeof course.heureDepart === 'number' && course.heureDepart > 1_000_000_000_000) {
          allCourses.push({ heureDepart: course.heureDepart })
        }
      }
    }

    allCourses.sort((a, b) => a.heureDepart - b.heureDepart)
    const first = allCourses[0]

    if (first) {
      return NextResponse.json({ firstRaceTime: new Date(first.heureDepart).toISOString() })
    }
  } catch {
    // fallback ci-dessous
  }

  // Fallback : 9h00 heure de Paris le lendemain
  const fallback = new Date(tomorrow)
  fallback.setHours(7, 0, 0, 0) // 9h Paris = 7h UTC
  return NextResponse.json({ firstRaceTime: fallback.toISOString() })
}
