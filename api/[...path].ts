import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/index';

// Vercel strips the /api function prefix before invoking this catch-all.
// Restore it because the Express application defines routes under /api/*.
export default function handler(req: VercelRequest, res: VercelResponse) {
  const originalUrl = req.url || '/';
  if (!originalUrl.startsWith('/api/')) {
    req.url = `/api${originalUrl === '/' ? '' : originalUrl}`;
  }
  return app(req, res);
}
