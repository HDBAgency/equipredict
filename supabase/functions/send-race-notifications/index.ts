import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_CONTACT = 'mailto:hmbt.hugo@gmail.com'

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

  const now = new Date()
  const from = new Date(now.getTime() + 4 * 60 * 1000).toISOString()
  const to   = new Date(now.getTime() + 6 * 60 * 1000).toISOString()
  const cutoff = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString()

  // Courses favorites démarrant dans ~5 min
  const { data: favorites } = await supabase
    .from('favorites')
    .select(`
      user_id, race_name, hippodrome, start_time,
      push_subscriptions!inner ( endpoint, auth, p256dh, last_active_at ),
      profiles!inner ( plan )
    `)
    .gte('start_time', from)
    .lte('start_time', to)
    .gte('push_subscriptions.last_active_at', cutoff)
    .in('profiles.plan', ['premium', 'pro'])

  if (!favorites?.length) return new Response('ok — no notifications')

  const sent: string[] = []
  for (const fav of favorites) {
    const sub = (fav as any).push_subscriptions
    if (!sub) continue

    const payload = JSON.stringify({
      title: `🏇 ${fav.race_name}`,
      body: `Départ dans 5 min — ${fav.hippodrome}`,
      raceId: `${fav.user_id}-${fav.start_time}`,
      url: '/dashboard-premium?type=favoris',
    })

    try {
      await sendWebPush(sub.endpoint, sub.auth, sub.p256dh, payload)
      sent.push(fav.user_id)
    } catch (e) {
      console.error('push error', fav.user_id, e)
    }
  }

  return new Response(JSON.stringify({ sent: sent.length }))
})

async function sendWebPush(endpoint: string, auth: string, p256dh: string, payload: string) {
  // Construction manuelle VAPID (compatible Deno sans dépendance externe)
  const { privateKey, publicKey } = await importVapidKeys()

  const now = Math.floor(Date.now() / 1000)
  const exp = now + 12 * 3600
  const audience = new URL(endpoint).origin

  const header = btoa64(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))
  const claims = btoa64(JSON.stringify({ aud: audience, exp, sub: VAPID_CONTACT }))
  const toSign = `${header}.${claims}`

  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(toSign)
  )
  const jwt = `${toSign}.${btoa64url(sig)}`

  // Chiffrement WebPush (ECE aes128gcm)
  const encrypted = await encryptPayload(p256dh, auth, payload)

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC}`,
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      TTL: '60',
    },
    body: encrypted,
  })

  if (!resp.ok && resp.status !== 201) {
    throw new Error(`Push failed: ${resp.status}`)
  }
}

function btoa64(str: string) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}
function btoa64url(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function importVapidKeys() {
  const privRaw = base64ToUint8(VAPID_PRIVATE)
  const pubRaw  = base64ToUint8(VAPID_PUBLIC)

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    toPkcs8(privRaw),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  )
  return { privateKey, publicKeyRaw: pubRaw }
}

function base64ToUint8(b64: string) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const s = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return new Uint8Array([...s].map(c => c.charCodeAt(0)))
}

function toPkcs8(rawPriv: Uint8Array) {
  // SEC1/PKCS#8 DER wrapper for P-256 raw private key (32 bytes)
  const prefix = new Uint8Array([
    0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06,
    0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01,
    0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03,
    0x01, 0x07, 0x04, 0x27, 0x30, 0x25, 0x02, 0x01,
    0x01, 0x04, 0x20,
  ])
  const out = new Uint8Array(prefix.length + rawPriv.length)
  out.set(prefix)
  out.set(rawPriv, prefix.length)
  return out.buffer
}

async function encryptPayload(p256dhB64: string, authB64: string, payload: string) {
  const recipPub = base64ToUint8(p256dhB64)
  const authSecret = base64ToUint8(authB64)
  const plaintext = new TextEncoder().encode(payload)

  // Generate sender ECDH key pair
  const senderPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  )
  const senderPubKey = await crypto.subtle.exportKey('raw', senderPair.publicKey)

  // Import recipient public key
  const recipKey = await crypto.subtle.importKey(
    'raw', recipPub,
    { name: 'ECDH', namedCurve: 'P-256' },
    false, []
  )

  // ECDH shared secret
  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: recipKey },
    senderPair.privateKey,
    256
  )

  // salt
  const salt = crypto.getRandomValues(new Uint8Array(16))

  // HKDF for content key and nonce (aes128gcm)
  const prk = await hkdf(authSecret, new Uint8Array(sharedBits), buildInfo('auth', new Uint8Array(senderPubKey), recipPub), 32)
  const contentKey = await hkdf(salt, prk, buildInfo('aesgcm128', new Uint8Array(senderPubKey), recipPub), 16)
  const nonce      = await hkdf(salt, prk, buildInfo('nonce', new Uint8Array(senderPubKey), recipPub), 12)

  const aesKey = await crypto.subtle.importKey('raw', contentKey, 'AES-GCM', false, ['encrypt'])

  // Pad plaintext (2 bytes length + plaintext + padding)
  const padded = new Uint8Array(2 + plaintext.length + 1)
  padded[0] = 0; padded[1] = 0
  padded.set(plaintext, 2)

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    aesKey, padded
  )

  // aes128gcm content-encoding record
  const rs = 4096
  const header = buildAesGcmHeader(salt, rs, new Uint8Array(senderPubKey))
  const out = new Uint8Array(header.length + ciphertext.byteLength)
  out.set(header)
  out.set(new Uint8Array(ciphertext), header.length)
  return out.buffer
}

function buildInfo(type: string, senderPub: Uint8Array, recipPub: Uint8Array) {
  const label = new TextEncoder().encode(`Content-Encoding: ${type}\0`)
  const out = new Uint8Array(label.length + 1 + 2 + senderPub.length + 2 + recipPub.length)
  let i = 0
  out.set(label, i); i += label.length
  out[i++] = 0x41 // P-256 key type
  out[i++] = (recipPub.length >> 8) & 0xff; out[i++] = recipPub.length & 0xff
  out.set(recipPub, i); i += recipPub.length
  out[i++] = (senderPub.length >> 8) & 0xff; out[i++] = senderPub.length & 0xff
  out.set(senderPub, i)
  return out
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, len: number) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    key, len * 8
  )
  return new Uint8Array(bits)
}

function buildAesGcmHeader(salt: Uint8Array, rs: number, senderPub: Uint8Array) {
  const h = new Uint8Array(21 + senderPub.length)
  h.set(salt, 0)
  h[16] = (rs >> 24) & 0xff
  h[17] = (rs >> 16) & 0xff
  h[18] = (rs >>  8) & 0xff
  h[19] = rs & 0xff
  h[20] = senderPub.length
  h.set(senderPub, 21)
  return h
}
