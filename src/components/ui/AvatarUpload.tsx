'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  initialUrl: string | null
  initials: string
}

export default function AvatarUpload({ userId, initialUrl, initials }: Props) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialUrl)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Fichier trop volumineux (max 5 Mo)'); return }
    if (!file.type.startsWith('image/')) { setError('Format non supporté'); return }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const path = `${userId}/avatar.jpg`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = `${data.publicUrl}?t=${Date.now()}`

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', userId)

      if (dbError) throw dbError

      setAvatarUrl(url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="relative w-20 h-20 rounded-full overflow-hidden group focus:outline-none"
        title="Changer la photo de profil"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-2xl font-black text-white"
            style={{ background: 'linear-gradient(135deg, #064E3B, #10B981)' }}
          >
            {initials}
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {loading
            ? <Loader2 className="w-6 h-6 text-white animate-spin" />
            : <Camera className="w-6 h-6 text-white" />
          }
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {error && (
        <p className="mt-2 text-xs text-red-400 text-center">{error}</p>
      )}

      <p className="mt-2 text-xs text-eq-muted">Cliquer pour changer la photo</p>
    </div>
  )
}
