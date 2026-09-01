import { Router } from 'express';
import { requireAuth, requirePermission } from './authMiddleware';

const router = Router();

router.get('/workflow/service-requests', requireAuth, requirePermission('requests.view_all'), async (req, res) => {
  const { data, error } = await req.userSupabase!.from('service_requests').select('*').eq('active', true).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ data: data || [] });
});

router.get('/workflow/purchase-requests', requireAuth, requirePermission('requests.view_all'), async (req, res) => {
  const { data, error } = await req.userSupabase!.from('purchase_requests').select('*').eq('active', true).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ data: data || [] });
});

router.post('/workflow/service-requests/:id/status', requireAuth, requirePermission('requests.manage'), async (req, res) => {
  const status = String(req.body.status || '').trim();
  const note = req.body.note == null ? null : String(req.body.note).trim();
  const { data, error } = await req.userSupabase!.rpc('update_service_request_workflow', { p_request_id: req.params.id, p_status: status, p_note: note });
  if (error) return res.status(400).json({ error: error.message });
  return res.json({ data });
});

router.post('/workflow/purchase-requests/:id/status', requireAuth, requirePermission('requests.manage'), async (req, res) => {
  const status = String(req.body.status || '').trim();
  const note = req.body.note == null ? null : String(req.body.note).trim();
  const { data, error } = await req.userSupabase!.rpc('update_purchase_request_workflow', { p_request_id: req.params.id, p_status: status, p_note: note });
  if (error) return res.status(400).json({ error: error.message });
  return res.json({ data });
});

router.get('/workflow/leaders', requireAuth, requirePermission('users.view'), async (req, res) => {
  const { data, error } = await req.userSupabase!.from('approval_leaders').select('workflow,leader_user_id,updated_at').order('workflow');
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ data: data || [] });
});

router.get('/workflow/users', requireAuth, requirePermission('users.view'), async (req, res) => {
  const { data, error } = await req.userSupabase!.from('profiles').select('id,name,full_name,email,role_code,active').eq('active', true).order('name');
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ data: data || [] });
});

router.post('/workflow/leaders', requireAuth, requirePermission('users.manage'), async (req, res) => {
  const workflow = String(req.body.workflow || '').trim();
  const leaderUserId = String(req.body.leader_user_id || '').trim();
  if (!workflow || !leaderUserId) return res.status(400).json({ error: 'workflow e leader_user_id são obrigatórios.' });
  const { data, error } = await req.userSupabase!.from('approval_leaders').upsert({ workflow, leader_user_id: leaderUserId, updated_by: req.authUserId, updated_at: new Date().toISOString() }, { onConflict: 'workflow' }).select('*').single();
  if (error) return res.status(400).json({ error: error.message });
  return res.json({ data });
});

export default router;
