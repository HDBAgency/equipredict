import { NextResponse } from 'next/server'

function pad(n: number) { return String(n).padStart(2, '0') }

export async function GET() {
  const today = new Date()
  const ddmmyyyy = `${pad(today.getDate())}${pad(today.getMonth() + 1)}${today.getFullYear()}`
  const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, '')

  const urls = [
    `https://offline.turfinfo.api.pmu.fr/rest/client/7/programme/${ddmmyyyy}`,
    `https://online.turfinfo.api.pmu.fr/rest/client/61/programme/${ddmmyyyy}`,
    `https://online.pmu.fr/rest/client/1/programme/${yyyymmdd}`,
  ]

  const results = await Promise.all(urls.map(async url => {
    const start = Date.now()
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 8000)
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: ctrl.signal,
      })
      clearTimeout(t)

      const ms = Date.now() - start
      const text = await res.text()
      let parsed: unknown = null
      let shape: unknown = null

      try {
        parsed = JSON.parse(text)
        shape = inspect(parsed as Record<string, unknown>)
      } catch {
        shape = { rawPreview: text.slice(0, 300) }
      }

      return { url, status: res.status, ms, shape }
    } catch (err) {
      return { url, error: err instanceof Error ? err.message : String(err), ms: Date.now() - start }
    }
  }))

  return NextResponse.json({ date: { ddmmyyyy, yyyymmdd }, results })
}

function inspect(obj: Record<string, unknown>, depth = 0): unknown {
  if (depth > 3) return '...'
  if (Array.isArray(obj)) {
    return `Array(${obj.length})` + (obj.length > 0 ? ` → ${inspect(obj[0] as Record<string, unknown>, depth + 1)}` : '')
  }
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      if (Array.isArray(v)) {
        out[k] = `Array(${v.length})` + (v.length > 0 ? ` → ${JSON.stringify(inspect(v[0] as Record<string, unknown>, depth + 1)).slice(0, 120)}` : '')
      } else if (v && typeof v === 'object') {
        out[k] = inspect(v as Record<string, unknown>, depth + 1)
      } else {
        out[k] = v
      }
    }
    return out
  }
  return obj
}
