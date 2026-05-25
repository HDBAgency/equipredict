import type { NextConfig } from "next";

const securityHeaders = [
  // Empêche le chargement dans une iframe (clickjacking)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Bloque la détection automatique de type MIME (XSS)
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Force HTTPS pendant 1 an, sous-domaines inclus
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Contrôle les infos envoyées au referrer
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Désactive les fonctionnalités navigateur inutiles
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Protection XSS pour navigateurs anciens
  { key: 'X-XSS-Protection', value: '1; mode=block' },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig;
