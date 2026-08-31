import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const secretKeysRaw = Deno.env.get('SUPABASE_SECRET_KEYS');
const serviceKey = secretKeysRaw ? JSON.parse(secretKeysRaw).default : Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const admin = createClient(supabaseUrl, serviceKey!, { auth: { autoRefreshToken: false, persistSession: false } });
const APP_URL = 'https://v2-manut.vercel.app/';
const escapeHtml = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]!));

Deno.serve(async (req) => {
  try {
    const expected = (await admin.rpc('get_biotrop_email_webhook_secret')).data;
    const received = req.headers.get('x-biotrop-webhook-secret') || '';
    if (!expected || received !== expected) return new Response('Unauthorized', { status: 401 });

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) return Response.json({ ok:false, error:'RESEND_API_KEY não configurada no Supabase.' }, { status:503 });

    const { data: pending, error } = await admin.from('notification_email_queue')
      .select('id,recipient_email,recipient_name,subject,body_text,attempts')
      .eq('status','pending').order('created_at',{ascending:true}).limit(20);
    if (error) throw error;

    let sent=0, failed=0;
    for (const item of pending || []) {
      const claim=await admin.from('notification_email_queue').update({status:'processing',attempts:Number(item.attempts||0)+1}).eq('id',item.id).eq('status','pending');
      if (claim.error) { failed++; continue; }
      const html=`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#17332b"><div style="background:#003c41;color:#fff;padding:22px;border-radius:14px 14px 0 0"><strong>BIOTROP · Plataforma de Manutenção</strong></div><div style="padding:22px;border:1px solid #e4ece8;border-top:0;border-radius:0 0 14px 14px"><h2 style="color:#003c41">${escapeHtml(item.subject)}</h2><p style="white-space:pre-line;line-height:1.6">${escapeHtml(item.body_text)}</p><p style="margin-top:22px"><a href="${APP_URL}" style="display:inline-block;background:#003c41;color:#fff;text-decoration:none;padding:11px 16px;border-radius:999px;font-weight:700">Abrir Plataforma</a></p></div></div>`;
      const mail=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${resendKey}`,'Content-Type':'application/json'},body:JSON.stringify({from:Deno.env.get('MAIL_FROM')||'BIOTROP Manutenção <onboarding@resend.dev>',to:[item.recipient_email],subject:item.subject,html})});
      if(mail.ok){await admin.from('notification_email_queue').update({status:'sent',sent_at:new Date().toISOString(),last_error:null}).eq('id',item.id);sent++;}
      else{const text=await mail.text();await admin.from('notification_email_queue').update({status:'failed',last_error:text}).eq('id',item.id);failed++;}
    }
    return Response.json({ok:true,processed:(pending||[]).length,sent,failed});
  } catch(e){console.error(e);return Response.json({ok:false,error:e instanceof Error?e.message:'Erro interno'},{status:500});}
});