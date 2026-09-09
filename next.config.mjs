import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// The sandbox sets NEXT_ADAPTER_PATH to a platform adapter that may not exist
// in this project (it began as an Express app). Fall back to a local no-op
// adapter so `next dev`/`next build` boot instead of crashing on a missing
// module.
const envAdapter = process.env.NEXT_ADAPTER_PATH
const localAdapter = fileURLToPath(new URL('./v0-next-adapter.mjs', import.meta.url))
const adapterPath = envAdapter && existsSync(envAdapter) ? envAdapter : localAdapter

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  adapterPath,
  typescript: { ignoreBuildErrors: true },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
