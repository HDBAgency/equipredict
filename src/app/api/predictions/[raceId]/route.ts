import { NextRequest, NextResponse } from 'next/server'
import { MOCK_RACES, MOCK_PREDICTIONS, getHorsesByRaceId } from '@/lib/mock-data'
import { generatePrediction } from '@/lib/scoring/engine'
// import { createClient } from '@/lib/supabase/server'

// TODO: Intégrer la vérification du plan d'abonnement
// const supabase = await createClient()
// const { data: { user } } = await supabase.auth.getUser()
// const { data: sub } = await supabase.from('subscriptions').select('plan').eq('user_id', user.id).single()
// if (sub.plan === 'free') return NextResponse.json({ error: 'Abonnement Premium requis' }, { status: 403 })

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ raceId: string }> }
) {
  try {
    const { raceId } = await params

    // Vérifie que la course existe
    const race = MOCK_RACES.find(r => r.id === raceId)
    if (!race) {
      return NextResponse.json({ error: 'Course introuvable' }, { status: 404 })
    }

    // Cherche une prédiction mockée existante
    const cached = MOCK_PREDICTIONS.find(p => p.raceId === raceId)
    if (cached) {
      return NextResponse.json({ data: cached })
    }

    // Sinon génère dynamiquement via le moteur de scoring
    // TODO: Remplacer par une récupération depuis la BDD + mise en cache
    const horses = getHorsesByRaceId(raceId)
    if (!horses.length) {
      return NextResponse.json({ error: 'Aucun partant pour cette course' }, { status: 404 })
    }

    const prediction = generatePrediction(race, horses)

    return NextResponse.json({ data: prediction })
  } catch (error) {
    console.error('[GET /api/predictions/[raceId]]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
