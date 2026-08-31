import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const APP_URL = 'https://v2-manut.vercel.app/';
const INKBOX_BASE = 'https://inkbox.ai/api/v1/mail';
const escapeHtml = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]!));

async function getSecret(name: 'inkbox'|'webhook'): Promise<string | null> {
  const rpc = name === 'inkbox' ? 'get_biotrop_inkbox_api_key' : 'get_biotrop_email_webhook_secret';
  const { data, error } = await admin.rpc(rpc);
  if (error) throw error;
  return data || null;
}

async function resolveInkboxMailbox(apiKey: string): Promise<string> {
  const explicit = Deno.env.get('INKBOX_MAILBOX')?.trim();
  if (explicit) return explicit;
  const r = await fetch(`${INKBOX_BASE}/mailboxes`, { headers: { 'X-API-Key': apiKey, Accept:'application/json' } });
  if (!r.ok) throw new Error(`Inkbox mailbox lookup failed (${r.status}): ${await r.text()}`);
  const data = await r.json();
  const list = Array.isArray(data) ? data : (data.mailboxes || data.data || []);
  const match = list.find((m:any) => String(m.email_address || m.email || '').toLowerCase().startsWith('manute@'));
  const address = match?.email_address || match?.email;
  if (!address) throw new Error('Mailbox Inkbox da identidade manute não encontrada.');
  return address;
}

async function sendInkbox(apiKey: string, mailbox: string, item:any) {
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#17332b"><div style="background:#003c41;color:#fff;padding:22px;border-radius:14px 14px 0 0"><strong>BIOTROP · Plataforma de Manutenção</strong></div><div style="padding:22px;border:1px solid #e4ece8;border-top:0;border-radius:0 0 14px 14px"><h2 style="color:#003c41;margin-top:0">${escapeHtml(item.subject)}</h2><p style="white-space:pre-line;line-height:1.65">${escapeHtml(item.body_text)}</p><a href="${APP_URL}" style="display:inline-block;background:#003c41;color:#fff;text-decoration:none;padding:11px 16px;border-radius:999px;font-weight:700">Abrir Plataforma</a></div></div>`;
  const payload = { recipients:{to:[item.recipient_email]}, subject:item.subject, body_text:item.body_text, body_html:html };
  const r = await fetch(`${INKBOX_BASE}/mailboxes/${encodeURIComponent(mailbox)}/messages`, { method:'POST', headers:{'X-API-Key':apiKey,'Content-Type':'application/json','Accept':'application/json'}, body:JSON.stringify(payload) });
  const text = await r.text();
  if (!r.ok) throw new Error(`Inkbox send failed (${r.status}): ${text}`);
  return text ? JSON.parse(text) : null;
}

Deno.serve(async (req) => {
  try {
    const expected = await getSecret('webhook');
    if (!expected || (req.headers.get('x-biotrop-webhook-secret') || '') !== expected) return new Response('Unauthorized',{status:401});
    const inkboxKey = await getSecret('inkbox');
    if (!inkboxKey) return Response.json({ok:false,error:'Chave Inkbox não configurada no Vault.'},{status:503});
    const body = await req.json().catch(()=>({}));
    const queueId = body?.queue_id || null;
    let query = admin.from('notification_email_queue').select('id,recipient_email,recipient_name,subject,body_text,attempts').eq('status','pending').order('created_at',{ascending:true}).limit(20);
    if(queueId) query=query.eq('id',queueId);
    const {data:pending,error}=await query;
    if(error) throw error;
    const mailbox=await resolveInkboxMailbox(inkboxKey);
    let sent=0,failed=0;
    for(const item of pending||[]){
      const claim=await admin.from('notification_email_queue').update({status:'processing',attempts:Number(item.attempts||0)+1}).eq('id',item.id).eq('status','pending').select('id');
      if(claim.error || !claim.data?.length){failed++;continue;}
      try{
        await sendInkbox(inkboxKey,mailbox,item);
        await admin.from('notification_email_queue').update({status:'sent',sent_at:new Date().toISOString(),last_error:null}).eq('id',item.id);
        sent++;
      }catch(e){
        const msg=e instanceof Error?e.message:String(e);
        await admin.from('notification_email_queue').update({status:'failed',last_error:msg}).eq('id',item.id);
        failed++;
      }
    }
    return Response.json({ok:true,mailbox,processed:(pending||[]).length,sent,failed});
  }catch(e){console.error(e);return Response.json({ok:false,error:e instanceof Error?e.message:'Erro interno'},{status:500});}
});
