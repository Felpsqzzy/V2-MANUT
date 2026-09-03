import type { NextFunction, Request, Response } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { query } from './db';

declare global { namespace Express { interface Request { authUserId?: string; authSessionId?: string; authUser?: { id:string; name:string; email:string; active:boolean }; } } }
const COOKIE='bt_session';
const SESSION_DAYS=Math.max(Number(process.env.SESSION_DAYS||7),1);
const hashToken=(token:string)=>crypto.createHash('sha256').update(token).digest('hex');

function tokenFrom(req:Request){const cookie=req.cookies?.[COOKIE];if(cookie)return String(cookie);const h=req.header('authorization')||'';return h.startsWith('Bearer ')?h.slice(7).trim():''}
export async function createSession(userId:string,req:Request){const raw=crypto.randomBytes(48).toString('base64url');await query("insert into sessions(user_id,token_hash,expires_at,user_agent,ip_address) values($1,$2,now()+($3||' days')::interval,$4,$5::inet)",[userId,hashToken(raw),SESSION_DAYS,req.get('user-agent')||null,req.ip||null]);return raw}
export function setSessionCookie(res:Response,token:string){res.cookie(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:SESSION_DAYS*86400000})}
export function clearSessionCookie(res:Response){res.clearCookie(COOKIE,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/'})}
export async function requireAuth(req:Request,res:Response,next:NextFunction){try{const token=tokenFrom(req);if(!token)return res.status(401).json({error:'Sessão não autenticada.'});const r=await query<{session_id:string;user_id:string;name:string;email:string;active:boolean}>(`select s.id session_id,u.id user_id,u.name,u.email,u.active from sessions s join app_users u on u.id=s.user_id where s.token_hash=$1 and s.expires_at>now() and u.active=true limit 1`,[hashToken(token)]);if(!r.rowCount){clearSessionCookie(res);return res.status(401).json({error:'Sessão inválida ou expirada.'})}const u=r.rows[0];req.authUserId=u.user_id;req.authSessionId=u.session_id;req.authUser={id:u.user_id,name:u.name,email:u.email,active:u.active};await query('update sessions set last_seen_at=now() where id=$1',[u.session_id]);next()}catch(e){next(e)}}
export function requirePermission(permissionCode:string){return async(req:Request,res:Response,next:NextFunction)=>{try{if(!req.authUserId)return res.status(401).json({error:'Sessão não autenticada.'});const r=await query<{allowed:boolean}>('select has_permission($1,$2) allowed',[req.authUserId,permissionCode]);if(!r.rows[0]?.allowed)return res.status(403).json({error:'Acesso não autorizado.'});next()}catch(e){next(e)}}}
export async function authenticatePassword(email:string,password:string){const r=await query<{id:string;name:string;email:string;password_hash:string;active:boolean}>('select id,name,email,password_hash,active from app_users where lower(email)=lower($1) limit 1',[email]);if(!r.rowCount)return null;const u=r.rows[0];if(!u.active||!(await bcrypt.compare(password,u.password_hash)))return null;return{id:u.id,name:u.name,email:u.email,active:u.active}}
export async function revokeSession(req:Request){if(req.authSessionId)await query('delete from sessions where id=$1',[req.authSessionId])}
