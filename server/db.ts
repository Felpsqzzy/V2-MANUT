import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
if (!process.env.DATABASE_URL) console.warn('[BIOTROP] DATABASE_URL não configurada.');
export const pool = new Pool({connectionString: process.env.DATABASE_URL,max:Number(process.env.DB_POOL_MAX||10),idleTimeoutMillis:30000,connectionTimeoutMillis:10000,ssl:process.env.DATABASE_SSL==='true'?{rejectUnauthorized:false}:undefined});
export async function query<T extends pg.QueryResultRow=pg.QueryResultRow>(text:string,params:unknown[]=[]){return pool.query<T>(text,params)}
export async function withTransaction<T>(fn:(client:pg.PoolClient)=>Promise<T>):Promise<T>{const client=await pool.connect();try{await client.query('BEGIN');const result=await fn(client);await client.query('COMMIT');return result}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}}
