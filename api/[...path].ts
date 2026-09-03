import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/index';

// Vercel strips the /api function prefix before invoking this catch-all.
// Restore it because the Express application defines routes under /api/*.
export default function handler(req: VercelRequest, res: VercelResponse) {
  const originalUrl = req.url || '/';
  if (!originalUrl.startsWith('/api/')) {
    req.url = `/api${originalUrl === '/' ? '' : originalUrl}`;
  }

  // Calls from the deployed frontend to /api are same-origin. Express has
  // an allowlist-based CORS middleware for external clients, but the Vercel
  // adapter must not reject a same-origin browser request just because
  // CORS_ORIGINS is not configured in the project environment.
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (origin && host) {
    try {
      if (new URL(origin).host === host) delete req.headers.origin;
    } catch {
      // Leave the header untouched; Express will handle an invalid origin.
    }
  }

  return app(req, res);
}
