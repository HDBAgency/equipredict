'use server'

import { createClient } from '@/lib/supabase/server'

export async function subscribePush(sub: {
  endpoint: string
  keys: { auth: string; p256dh: string }
}) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non connecté' }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: session.user.id,
      endpoint: sub.endpoint,
      auth: sub.keys.auth,
      p256dh: sub.keys.p256dh,
      last_active_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error) return { error: error.message }
  return { success: true }
}

export async function unsubscribePush() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non connecté' }

  await supabase.from('push_subscriptions').delete().eq('user_id', session.user.id)
  return { success: true }
}

export async function pingActive() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return

  await supabase
    .from('push_subscriptions')
    .update({ last_active_at: new Date().toISOString() })
    .eq('user_id', session.user.id)
}

export async function saveFavorite(race: {
  raceId: string
  raceName: string
  hippodrome: string
  startTime: string
}) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return

  await supabase.from('favorites').upsert(
    {
      user_id: session.user.id,
      race_id: race.raceId,
      race_name: race.raceName,
      hippodrome: race.hippodrome,
      start_time: race.startTime,
    },
    { onConflict: 'user_id,race_id' }
  )
}

export async function removeFavorite(raceId: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return

  await supabase.from('favorites').delete()
    .eq('user_id', session.user.id)
    .eq('race_id', raceId)
}

export async function loadFavorites(): Promise<string[]> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []

  const { data } = await supabase
    .from('favorites')
    .select('race_id')
    .eq('user_id', session.user.id)

  return data?.map(r => r.race_id) ?? []
}
