import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePermission } from './authMiddleware';
import meetingRoutes from './meetingRoutes';

const app = express();
const port = Number(process.env.PORT || 3000);
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
const maxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES || 100 * 1024 * 1024);
const allowedOrigins = new Set(String(process.env.CORS_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean));
fs.mkdirSync(uploadDir, { recursive: true });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const serviceSupabase = supabaseUrl && supabaseServiceRoleKey ? createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } }) : null;

app.use(cors({ credentials: true, origin(origin, callback) { if (!origin || allowedOrigins.has(origin)) return callback(null, true); return callback(new Error('Origem não autorizada pelo CORS.')); } }));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', requireAuth, express.static(uploadDir));
app.use('/api', meetingRoutes);

const storage = multer.diskStorage({ destination: (_req, _file, callback) => callback(null, uploadDir), filename: (_req, file, callback) => callback(null, `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`) });
const allowedMimeTypes = new Set(['image/jpeg','image/png','image/webp','video/mp4','video/quicktime','video/webm','application/pdf','text/plain','text/csv','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
const upload = multer({ storage, limits: { fileSize: maxUploadBytes }, fileFilter: (_req, file, callback) => allowedMimeTypes.has(file.mimetype) ? callback(null, true) : callback(new Error(`Tipo de arquivo não permitido: ${file.mimetype}.`)) });
function fileType(mime: string): string { if (mime.startsWith('image/')) return 'image'; if (mime.startsWith('video/')) return 'video'; if (mime === 'application/pdf') return 'pdf'; return 'document'; }
function parseNumber(value: unknown): number | null { if (value === null || value === undefined || value === '') return null; const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'biotrop-api', databaseConfigured: Boolean(serviceSupabase), time: new Date().toISOString() }));
app.get('/api/me/context', requireAuth, async (req, res) => { const { data, error } = await req.userSupabase!.rpc('get_my_access_context'); if (error) return res.status(503).json({ error: error.message }); return res.json({ data }); });
app.get('/api/meters', requireAuth, async (req, res) => { const { data, error } = await req.userSupabase!.from('v_utility_meter_status').select('*').order('unit_sort_order').order('utility_type').order('name'); if (error) return res.status(500).json({ error: error.message }); return res.json({ data: data || [] }); });
app.post('/api/meters', requireAuth, requirePermission('meters.manage'), async (req, res) => { const payload = { code: String(req.body.code || '').trim().toUpperCase(), name: String(req.body.name || '').trim(), utility_type: String(req.body.utility_type || '').trim(), unit_id: req.body.unit_id || null, location: req.body.location ? String(req.body.location).trim() : null, unit: String(req.body.unit || '').trim(), active: req.body.active !== false, created_by: req.authUserId, updated_by: req.authUserId }; if (!payload.code || !payload.name || !payload.unit) return res.status(400).json({ error: 'Código, nome e unidade são obrigatórios.' }); const { data, error } = await req.userSupabase!.from('utility_meters').insert(payload).select('*').single(); if (error) return res.status(400).json({ error: error.message }); return res.status(201).json({ data }); });
app.patch('/api/meters/:id', requireAuth, requirePermission('meters.manage'), async (req, res) => { const payload = { ...(req.body.code !== undefined ? { code: String(req.body.code).trim().toUpperCase() } : {}), ...(req.body.name !== undefined ? { name: String(req.body.name).trim() } : {}), ...(req.body.utility_type !== undefined ? { utility_type: String(req.body.utility_type).trim() } : {}), ...(req.body.unit_id !== undefined ? { unit_id: req.body.unit_id || null } : {}), ...(req.body.location !== undefined ? { location: req.body.location ? String(req.body.location).trim() : null } : {}), ...(req.body.unit !== undefined ? { unit: String(req.body.unit).trim() } : {}), ...(req.body.active !== undefined ? { active: Boolean(req.body.active), deleted_at: req.body.active ? null : new Date().toISOString() } : {}), updated_by: req.authUserId }; const { data, error } = await req.userSupabase!.from('utility_meters').update(payload).eq('id', req.params.id).select('*').single(); if (error) return res.status(400).json({ error: error.message }); return res.json({ data }); });
app.get('/api/readings', requireAuth, async (req, res) => { const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500); const { data, error } = await req.userSupabase!.from('v_utility_reading_history').select('*').order('server_timestamp', { ascending: false }).limit(limit); if (error) return res.status(500).json({ error: error.message }); return res.json({ data: data || [] }); });
app.post('/api/readings', requireAuth, requirePermission('readings.create'), async (req, res) => { const meterId = String(req.body.meter_id || '').trim(); const readingValue = parseNumber(req.body.reading_value); if (!meterId || readingValue === null || readingValue < 0) return res.status(400).json({ error: 'Medidor e leitura válida são obrigatórios.' }); const { data, error } = await req.userSupabase!.rpc('create_utility_reading', { p_meter_id: meterId, p_reading_value: readingValue, p_observation: req.body.observation ? String(req.body.observation).trim() : null, p_photo_path: req.body.photo_path ? String(req.body.photo_path).trim() : null, p_latitude: parseNumber(req.body.latitude), p_longitude: parseNumber(req.body.longitude) }); if (error) return res.status(400).json({ error: error.message }); return res.status(201).json({ data }); });
app.patch('/api/admin/users/:id/access', requireAuth, requirePermission('users.manage'), async (req, res) => { const roleCode = String(req.body.role_code || '').trim(); if (!roleCode) return res.status(400).json({ error: 'role_code é obrigatório.' }); const { data, error } = await req.userSupabase!.rpc('admin_set_user_access', { p_user_id: req.params.id, p_role_code: roleCode, p_active: req.body.active !== false }); if (error) return res.status(400).json({ error: error.message }); return res.json({ data }); });
app.post('/api/materials', requireAuth, requirePermission('requests.create'), upload.single('file'), async (req, res) => { if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo válido foi enviado.' }); if (!serviceSupabase) { fs.unlinkSync(req.file.path); return res.status(503).json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.' }); } const payload = { id: crypto.randomUUID(), user_id: req.authUserId, title: String(req.body.title || req.file.originalname).trim(), description: String(req.body.description || '').trim(), category: String(req.body.category || '').trim() || null, file_url: `/uploads/${req.file.filename}`, file_type: fileType(req.file.mimetype), file_mime: req.file.mimetype, file_size_bytes: req.file.size }; const { data, error } = await serviceSupabase.from('materials').insert(payload).select('*').single(); if (error) { fs.unlinkSync(req.file.path); return res.status(500).json({ error: error.message }); } return res.status(201).json({ message: 'Material registrado com sucesso.', data }); });

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => { const message = err instanceof Error ? err.message : 'Erro interno.'; if (message.includes('CORS')) return res.status(403).json({ error: message }); if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: `Arquivo excede o limite de ${maxUploadBytes} bytes.` }); return res.status(500).json({ error: message }); });
app.listen(port, () => console.log(`BIOTROP API ouvindo em http://localhost:${port}`));
