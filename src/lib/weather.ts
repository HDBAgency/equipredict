import type { WeatherCondition } from '@/types'

// Coordonnées GPS des principaux hippodromes français
const HIPPODROMES: Record<string, [number, number]> = {
  'longchamp':        [48.8588,  2.2430],
  'vincennes':        [48.8420,  2.4392],
  'chantilly':        [49.1847,  2.4681],
  'saint-cloud':      [48.8455,  2.2080],
  'auteuil':          [48.8565,  2.2632],
  'maisons-laffitte': [48.9493,  2.1495],
  'deauville':        [49.3548,  0.0792],
  'lyon':             [45.7278,  4.9012],
  'marseille':        [43.2693,  5.3748],
  'bordeaux':         [44.8378, -0.5792],
  'toulouse':         [43.6047,  1.4442],
  'strasbourg':       [48.5734,  7.7521],
  'le croisé':        [50.6292,  3.0573],
  'compiègne':        [49.4180,  2.8269],
  'caen':             [49.1829, -0.3707],
  'clairefontaine':   [49.3200, -0.1700],
  'nantes':           [47.2184, -1.5536],
  'le mans':          [47.9966,  0.1924],
  'pau':              [43.2951, -0.3708],
}

// Codes WMO → WeatherCondition
function wmoToCondition(code: number): WeatherCondition {
  if (code === 0 || code === 1) return 'ensoleillé'
  if (code <= 3)               return 'nuageux'
  if (code <= 49)              return 'nuageux'
  if (code <= 67)              return 'pluvieux'
  if (code <= 77)              return 'nuageux'
  if (code <= 82)              return 'pluvieux'
  if (code <= 99)              return 'pluvieux'
  return 'nuageux'
}

function findCoords(racecourse: string): [number, number] | null {
  const lower = racecourse.toLowerCase()
  for (const [key, coords] of Object.entries(HIPPODROMES)) {
    if (lower.includes(key)) return coords
  }
  return null
}

interface WeatherResult {
  condition: WeatherCondition
  temperature: number
}

const cache = new Map<string, { data: WeatherResult; ts: number }>()
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

export async function fetchWeather(racecourse: string): Promise<WeatherResult | null> {
  const coords = findCoords(racecourse)
  if (!coords) return null

  const cacheKey = `${coords[0]},${coords[1]}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data

  try {
    const [lat, lon] = coords
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&timezone=Europe/Paris`
    const res = await fetch(url, { next: { revalidate: 1800 } })
    if (!res.ok) return null
    const json = await res.json()
    const code: number = json.current?.weathercode ?? 0
    const temp: number = Math.round(json.current?.temperature_2m ?? 15)
    const data: WeatherResult = { condition: wmoToCondition(code), temperature: temp }
    cache.set(cacheKey, { data, ts: Date.now() })
    return data
  } catch {
    return null
  }
}
