import type { NextFunction, Request, Response } from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

declare global {
  namespace Express {
    interface Request {
      authUserId?: string;
      authAccessToken?: string;
      userSupabase?: SupabaseClient;
    }
  }
}

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

function configured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function createUserClient(token: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!configured()) {
    return res.status(503).json({ error: 'SUPABASE_URL e SUPABASE_ANON_KEY não configurados no servidor.' });
  }

  const header = req.header('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return res.status(401).json({ error: 'Token de autenticação ausente.' });

  const userClient = createUserClient(token);
  const { data, error } = await userClient.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: 'Sessão inválida ou expirada.' });

  req.authUserId = data.user.id;
  req.authAccessToken = token;
  req.userSupabase = userClient;
  return next();
}

export function requirePermission(permissionCode: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.userSupabase || !req.authUserId) {
      return res.status(401).json({ error: 'Sessão não validada.' });
    }

    const { data, error } = await req.userSupabase.rpc('has_permission', {
      p_permission_code: permissionCode,
      p_user_id: req.authUserId
    });
    if (error) return res.status(503).json({ error: `Falha ao validar permissão: ${error.message}` });
    if (!data) return res.status(403).json({ error: `Permissão necessária: ${permissionCode}.` });
    return next();
  };
}
