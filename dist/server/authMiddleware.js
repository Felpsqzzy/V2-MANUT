"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserClient = createUserClient;
exports.requireAuth = requireAuth;
exports.requirePermission = requirePermission;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
function configured() {
    return Boolean(supabaseUrl && supabaseAnonKey);
}
function createUserClient(token) {
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } }
    });
}
async function requireAuth(req, res, next) {
    if (!configured()) {
        return res.status(503).json({ error: 'SUPABASE_URL e SUPABASE_ANON_KEY não configurados no servidor.' });
    }
    const header = req.header('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token)
        return res.status(401).json({ error: 'Token de autenticação ausente.' });
    const userClient = createUserClient(token);
    const { data, error } = await userClient.auth.getUser(token);
    if (error || !data.user)
        return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    req.authUserId = data.user.id;
    req.authAccessToken = token;
    req.userSupabase = userClient;
    return next();
}
function requirePermission(permissionCode) {
    return async (req, res, next) => {
        if (!req.userSupabase || !req.authUserId) {
            return res.status(401).json({ error: 'Sessão não validada.' });
        }
        const { data, error } = await req.userSupabase.rpc('has_permission', {
            p_permission_code: permissionCode,
            p_user_id: req.authUserId
        });
        if (error)
            return res.status(503).json({ error: `Falha ao validar permissão: ${error.message}` });
        if (!data)
            return res.status(403).json({ error: `Permissão necessária: ${permissionCode}.` });
        return next();
    };
}
