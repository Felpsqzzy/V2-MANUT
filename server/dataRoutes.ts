import { Router, type Request } from 'express';
import { query } from './db';
import { requireAuth, requirePermission } from './authMiddleware';

const router = Router();

type TableConfig = {
  source: string;
  select: string;
  readPermission?: string;
  writePermission?: string;
  selfColumn?: string;
  insert: Set<string>;
  update: Set<string>;
};

const configs: Record<string, TableConfig> = {
  profiles: { source:'v_active_profiles', select:'id,name,full_name,email,department,sector,avatar_url,active,role_code', readPermission:'users.view', selfColumn:'id', insert:new Set(), update:new Set(['name','full_name','phone','department','sector','avatar_url','theme','notifications_enabled']) },
  roles: { source:'roles', select:'id,code,name,description,active', readPermission:'roles.view', insert:new Set(), update:new Set() },
  permissions: { source:'permissions', select:'id,code,name,description,resource,action', readPermission:'roles.view', insert:new Set(), update:new Set() },
  role_permissions: { source:'role_permissions', select:'role_id,permission_id', readPermission:'roles.view', insert:new Set(), update:new Set() },
  user_roles: { source:'user_roles', select:'user_id,role_id,active,assigned_by,assigned_at,updated_at', readPermission:'users.view', selfColumn:'user_id', insert:new Set(), update:new Set() },
  industrial_units: { source:'industrial_units', select:'id,code,name,sort_order,active', readPermission:'meters.view', writePermission:'meters.manage', insert:new Set(['code','name','sort_order','active']), update:new Set(['code','name','sort_order','active']) },
  utility_meters: { source:'utility_meters', select:'id,unit_id,code,name,utility_type,location,unit,initial_reading,active', readPermission:'meters.view', writePermission:'meters.manage', insert:new Set(['unit_id','code','name','utility_type','location','unit','initial_reading','active','created_by','updated_by']), update:new Set(['unit_id','code','name','utility_type','location','unit','initial_reading','active','updated_by','updated_at']) },
  v_utility_meter_status: { source:'v_utility_meter_status', select:'*', readPermission:'meters.view', insert:new Set(), update:new Set() },
  utility_readings: { source:'utility_readings', select:'id,meter_id,user_id,reading_value,previous_reading,consumption,reading_date,server_timestamp,latitude,longitude,status,observation,inconsistent,correction_requested,photo_path,captured_at,active,created_at,updated_at', readPermission:'readings.view_all', selfColumn:'user_id', writePermission:'readings.create', insert:new Set(['meter_id','user_id','reading_value','previous_reading','consumption','reading_date','server_timestamp','latitude','longitude','status','observation','inconsistent','correction_requested','photo_path','captured_at','active']), update:new Set(['status','observation','inconsistent','correction_requested','photo_path','captured_at','active','updated_at']) },
  v_utility_reading_history: { source:'v_utility_reading_history', select:'*', readPermission:'readings.view_all', selfColumn:'user_id', insert:new Set(), update:new Set() },
  service_requests: { source:'service_requests', select:'*', readPermission:'requests.view_all', selfColumn:'requester_id', writePermission:'requests.create', insert:new Set(['request_number','requester_id','material_type_id','description','quantity','unit','justification','process_number','warehouse_note','status','active']), update:new Set(['material_type_id','description','quantity','unit','justification','process_number','warehouse_note','status','active','approved_by','approved_at','updated_at']) },
  purchase_requests: { source:'purchase_requests', select:'*', readPermission:'requests.view_all', selfColumn:'requester_id', writePermission:'requests.create', insert:new Set(['code','requester_id','description','team','urgency','cost_center','justification','approval_note','status','active']), update:new Set(['description','team','urgency','cost_center','justification','approval_note','status','active','approved_by','approved_at','updated_at']) },
  training_courses: { source:'training_courses', select:'*', readPermission:'trainings.view', writePermission:'trainings.manage', insert:new Set(['title','category','description','video_url','duration_seconds','mandatory','active','created_by']), update:new Set(['title','category','description','video_url','duration_seconds','mandatory','active','updated_at']) },
  training_progress: { source:'training_progress', select:'*', readPermission:'trainings.view', selfColumn:'user_id', writePermission:'trainings.view', insert:new Set(['training_id','user_id','percentage','completed_at']), update:new Set(['percentage','completed_at','updated_at']) },
  materials: { source:'materials', select:'id,user_id,title,description,category,file_url,file_type,file_mime,file_size_bytes,active,created_at,updated_at', readPermission:'requests.view_all', selfColumn:'user_id', writePermission:'requests.create', insert:new Set(['user_id','title','description','category','file_url','file_type','file_mime','file_size_bytes','active']), update:new Set(['title','description','category','active','updated_at']) },
  material_families: { source:'material_families', select:'id,code,name,fields,active,created_by,updated_by,created_at,updated_at', readPermission:'requests.view_all', writePermission:'requests.manage', insert:new Set(['code','name','fields','active','created_by','updated_by']), update:new Set(['code','name','fields','active','updated_by','updated_at']) }
};

const publicProjection = (cfg: TableConfig) => cfg.select;
const hasPermission = async (req: Request, permission: string) => {
  if (!req.authUserId) return false;
  const r = await query<{allowed:boolean}>('select has_permission($1,$2) allowed',[req.authUserId,permission]);
  return Boolean(r.rows[0]?.allowed);
};

function normalizeValue(value: unknown) {
  if (Array.isArray(value) || (value && typeof value === 'object')) return JSON.stringify(value);
  return value;
}

async function canRead(req: Request, cfg: TableConfig) {
  if (cfg.readPermission && await hasPermission(req, cfg.readPermission)) return true;
  return false;
}

router.get('/data/:table', requireAuth, async (req, res, next) => {
  try {
    const cfg = configs[req.params.table];
    if (!cfg) return res.status(404).json({error:'Recurso não disponível.'});
    const canGlobal = await canRead(req,cfg);
    if (!canGlobal && cfg.selfColumn) {
      const own = String(req.query[`eq_${cfg.selfColumn}`] ?? '');
      if (own !== String(req.authUserId)) return res.status(403).json({error:'Acesso não autorizado.'});
    } else if (!canGlobal) return res.status(403).json({error:'Acesso não autorizado.'});

    const filters: string[] = [];
    const params: unknown[] = [];
    const allowedFilterColumns = new Set(['id','user_id','requester_id','meter_id','role_id','training_id','course_id','path_id','active','status','code','email','unit_id','utility_type']);
    for (const [key,value] of Object.entries(req.query)) {
      if (!key.startsWith('eq_')) continue;
      const column = key.slice(3);
      if (!allowedFilterColumns.has(column)) continue;
      params.push(normalizeValue(value));
      filters.push(`${column} = $${params.length}`);
    }
    let sql = `select ${publicProjection(cfg)} from ${cfg.source}`;
    if (cfg.selfColumn && !canGlobal && !filters.some(x => x.startsWith(`${cfg.selfColumn} =`))) {
      params.push(req.authUserId); filters.push(`${cfg.selfColumn} = $${params.length}`);
    }
    if (filters.length) sql += ` where ${filters.join(' and ')}`;
    const order = String(req.query.order || '').replace(/[^a-zA-Z0-9_]/g,'');
    const direction = String(req.query.direction || 'asc').toLowerCase()==='desc'?'desc':'asc';
    if (order && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(order)) sql += ` order by ${order} ${direction}`;
    const limit = Math.min(Math.max(Number(req.query.limit)||100,1),500);
    params.push(limit); sql += ` limit $${params.length}`;
    const r = await query(sql,params);
    res.json({data:r.rows});
  } catch(e) { next(e); }
});

router.post('/data/:table', requireAuth, async (req,res,next) => {
  try {
    const cfg = configs[req.params.table];
    if (!cfg || !cfg.insert.size) return res.status(403).json({error:'Inserção não disponível neste recurso.'});
    if (!cfg.writePermission || !(await hasPermission(req,cfg.writePermission))) return res.status(403).json({error:'Acesso não autorizado.'});
    const input = req.body && typeof req.body === 'object' ? req.body : {};
    const keys = Object.keys(input).filter(k=>cfg.insert.has(k));
    if (!keys.length) return res.status(400).json({error:'Nenhum campo permitido.'});
    if (cfg.selfColumn && cfg.insert.has(cfg.selfColumn)) input[cfg.selfColumn]=req.authUserId;
    const finalKeys = keys;
    const values = finalKeys.map(k=>normalizeValue(input[k]));
    const placeholders = finalKeys.map((_,i)=>`$${i+1}`).join(',');
    const r = await query(`insert into ${cfg.source} (${finalKeys.join(',')}) values (${placeholders}) returning ${publicProjection(cfg)}`,values);
    res.status(201).json({data:r.rows});
  } catch(e) { next(e); }
});

router.patch('/data/:table/:id', requireAuth, async (req,res,next) => {
  try {
    const cfg = configs[req.params.table];
    if (!cfg || !cfg.update.size) return res.status(403).json({error:'Atualização não disponível neste recurso.'});
    if (!cfg.writePermission || !(await hasPermission(req,cfg.writePermission))) return res.status(403).json({error:'Acesso não autorizado.'});
    const input = req.body && typeof req.body === 'object' ? req.body : {};
    const keys = Object.keys(input).filter(k=>cfg.update.has(k));
    if (!keys.length) return res.status(400).json({error:'Nenhum campo permitido.'});
    const values = keys.map(k=>normalizeValue(input[k]));
    values.push(req.params.id);
    let sql = `update ${cfg.source} set ${keys.map((k,i)=>`${k}=$${i+1}`).join(',')} where id=$${values.length}`;
    if (cfg.selfColumn && cfg.selfColumn!=='id' && !(await hasPermission(req,cfg.readPermission||cfg.writePermission||''))) sql += ` and ${cfg.selfColumn}='${req.authUserId}'`;
    sql += ` returning ${publicProjection(cfg)}`;
    const r = await query(sql,values);
    if (!r.rowCount) return res.status(404).json({error:'Registro não encontrado.'});
    res.json({data:r.rows[0]});
  } catch(e) { next(e); }
});

export default router;
