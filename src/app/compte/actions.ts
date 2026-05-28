'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitReview(stars: number, text: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non connecté' }

  if (stars < 1 || stars > 5) return { error: 'Note invalide' }
  if (text.trim().length < 10) return { error: 'Avis trop court (min. 10 caractères)' }
  if (text.trim().length > 500) return { error: 'Avis trop long (max. 500 caractères)' }

  const { error } = await supabase
    .from('reviews')
    .upsert(
      { user_id: session.user.id, stars, text: text.trim() },
      { onConflict: 'user_id' }
    )

  if (error) return { error: error.message }

  revalidatePath('/compte')
  return { success: true }
}
