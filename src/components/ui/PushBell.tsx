'use client'

import { useEffect, useState, useTransition } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { subscribePush, unsubscribePush } from '@/app/actions/push'

export default function PushBell({ plan }: { plan: string }) {
  const [state, setState] = useState<'unknown' | 'denied' | 'subscribed' | 'unsubscribed'>('unknown')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('denied')
      return
    }
    if (Notification.permission === 'denied') { setState('denied'); return }

    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription()
    ).then(sub => {
      setState(sub ? 'subscribed' : 'unsubscribed')
    }).catch(() => setState('unsubscribed'))
  }, [])

  if (plan !== 'premium' && plan !== 'pro') return null
  if (state === 'unknown' || state === 'denied') return null

  async function toggle() {
    startTransition(async () => {
      if (state === 'subscribed') {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        await sub?.unsubscribe()
        await unsubscribePush()
        setState('unsubscribed')
        return
      }

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setState('denied'); return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })

      const json = sub.toJSON() as { endpoint: string; keys: { auth: string; p256dh: string } }
      const result = await subscribePush(json)
      if (!result?.error) setState('subscribed')
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      title={state === 'subscribed' ? 'Désactiver les notifications' : 'Activer les notifications courses'}
      className={`lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50 ${
        state === 'subscribed'
          ? 'bg-eq-green/15 border-eq-green/30 text-eq-green'
          : 'bg-eq-card border-eq-border text-eq-muted hover:border-eq-border-bright hover:text-eq-text'
      }`}
    >
      {state === 'subscribed'
        ? <><Bell className="w-3.5 h-3.5" /> Notifs actives</>
        : <><BellOff className="w-3.5 h-3.5" /> Notifier</>
      }
    </button>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)))
}
