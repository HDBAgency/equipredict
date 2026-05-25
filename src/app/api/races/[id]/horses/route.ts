import { NextRequest, NextResponse } from 'next/server'
import { MOCK_RACES, getHorsesByRaceId } from '@/lib/mock-data'
// import { createClient } from '@/lib/supabase/server'
// TODO: const { data } = await supabase.from('horses').select('*').eq('race_id', id).order('number')

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Vérifie que la course existe
    const race = MOCK_RACES.find(r => r.id === id)
    if (!race) {
      return NextResponse.json({ error: 'Course introuvable' }, { status: 404 })
    }

    const horses = getHorsesByRaceId(id)

    return NextResponse.json({
      data: horses,
      total: horses.length,
      raceId: id,
    })
  } catch (error) {
    console.error('[GET /api/races/[id]/horses]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
