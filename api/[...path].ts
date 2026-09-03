import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/index';

// Vercel catch-all adapter for the Express API.
export default function handler(req: VercelRequest, res: VercelResponse) {
  const originalUrl = req.url || '/';
  if (!originalUrl.startsWith('/api/')) {
    req.url = `/api${originalUrl === '/' ? '' : originalUrl}`;
  }

  // The web app and API live on the same origin. Do not let the Express
  // CORS allowlist block the browser when Vercel does not inject CORS_ORIGINS.
  // External API consumers still remain subject to the Express CORS policy
  // when they call the server outside the Vercel same-origin entrypoint.
  delete req.headers.origin;

  return app(req, res);
}
