'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { subscribePush, unsubscribePush } from '@/app/actions/push'

export default function PushBell() {
  const [state, setState] = useState<'loading' | 'denied' | 'subscribed' | 'unsubscribed'>('loading')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('denied'); return
    }
    if (Notification.permission === 'denied') { setState('denied'); return }

    navigator.serviceWorker.ready
      .then(reg => reg.pushManager.getSubscription())
      .then(sub => setState(sub ? 'subscribed' : 'unsubscribed'))
      .catch(() => setState('unsubscribed'))
  }, [])

  if (state === 'denied' || state === 'loading') return null

  async function toggle() {
    if (busy) return
    setBusy(true)
    try {
      if (state === 'subscribed') {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        await sub?.unsubscribe()
        await unsubscribePush()
        setState('unsubscribed')
        return
      }

      // iOS exige que requestPermission soit appelé directement depuis le geste
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setState('denied'); return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })

      const json = sub.toJSON() as { endpoint: string; keys: { auth: string; p256dh: string } }
      const result = await subscribePush(json)
      if (!result?.error) setState('subscribed')
    } catch (err) {
      console.error('PushBell error', err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      title={state === 'subscribed' ? 'Désactiver les notifications' : 'Activer les notifications courses'}
      className={`lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50 ${
        state === 'subscribed'
          ? 'bg-eq-green/15 border-eq-green/30 text-eq-green'
          : 'bg-eq-card border-eq-border text-eq-muted hover:border-eq-border-bright hover:text-eq-text'
      }`}
    >
      {busy
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : state === 'subscribed'
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
