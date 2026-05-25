import { NextRequest, NextResponse } from 'next/server'
import { MOCK_RACES } from '@/lib/mock-data'
// import { createClient } from '@/lib/supabase/server'
// TODO: Remplacer MOCK_RACES par:
//   const supabase = await createClient()
//   const { data, error } = await supabase
//     .from('races')
//     .select('*')
//     .eq('race_date', date)
//     .order('start_time', { ascending: true })

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0]
    const status = searchParams.get('status') // 'upcoming' | 'live' | 'completed'
    const raceType = searchParams.get('type') // 'plat' | 'trot' | 'obstacle' | 'steeplechase'

    let races = MOCK_RACES.filter(r => r.date === date)

    if (status) {
      races = races.filter(r => r.status === status)
    }

    if (raceType) {
      races = races.filter(r => r.raceType === raceType)
    }

    return NextResponse.json({
      data: races,
      total: races.length,
      date,
    })
  } catch (error) {
    console.error('[GET /api/races]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
