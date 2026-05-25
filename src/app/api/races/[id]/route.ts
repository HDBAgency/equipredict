import { NextRequest, NextResponse } from 'next/server'
import { MOCK_RACES } from '@/lib/mock-data'
// import { createClient } from '@/lib/supabase/server'
// TODO: const { data } = await supabase.from('races').select('*').eq('id', id).single()

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const race = MOCK_RACES.find(r => r.id === id)

    if (!race) {
      return NextResponse.json({ error: 'Course introuvable' }, { status: 404 })
    }

    return NextResponse.json({ data: race })
  } catch (error) {
    console.error('[GET /api/races/[id]]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
