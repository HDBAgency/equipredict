'use client'

import { useState, useTransition } from 'react'
import { Star } from 'lucide-react'
import { submitReview } from '@/app/compte/actions'

type Props = {
  existing?: { stars: number; text: string } | null
}

export default function ReviewForm({ existing }: Props) {
  const [stars, setStars] = useState(existing?.stars ?? 0)
  const [hover, setHover] = useState(0)
  const [text, setText] = useState(existing?.text ?? '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (stars === 0) { setError('Choisissez une note'); return }
    setError('')
    startTransition(async () => {
      const res = await submitReview(stars, text)
      if (res.error) setError(res.error)
      else setSuccess(true)
    })
  }

  if (success) {
    return (
      <div className="text-center py-6">
        <p className="text-eq-green font-bold text-sm">Merci pour votre avis !</p>
        <p className="text-eq-muted text-xs mt-1">Il sera visible prochainement.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-1 justify-center">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => setStars(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                n <= (hover || stars) ? 'text-eq-amber fill-eq-amber' : 'text-white/20'
              }`}
            />
          </button>
        ))}
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Partagez votre expérience avec EquiPredict..."
        rows={4}
        maxLength={500}
        className="w-full bg-eq-surface border border-eq-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-eq-muted resize-none focus:outline-none focus:border-eq-green/50 transition-colors"
      />
      <div className="text-xs text-eq-muted text-right">{text.length}/500</div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 rounded-xl font-bold text-sm text-white bg-eq-green/20 border border-eq-green/30 hover:bg-eq-green/30 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Envoi...' : existing ? 'Modifier mon avis' : 'Publier mon avis'}
      </button>
    </form>
  )
}
