/* Tension Masters — price/sale settings API (Vercel serverless function)

   GET  /api/settings            → { settings, updatedAt }   (public)
   POST /api/settings            → save settings             (admin only)
        Authorization: Bearer <ADMIN_PASSWORD>
        body: { settings }  or  { check: true } to log in (returns private costs)

   Storage (whichever is connected in Vercel → Storage):
     • Neon Postgres — sets DATABASE_URL (used first if present)
     • Upstash Redis — sets KV_REST_API_URL / KV_REST_API_TOKEN
   Env: ADMIN_PASSWORD (optional — overrides the built-in password). */

const crypto = require('crypto');
const COSTS = require('./_costs.js');

const KEY = 'tm:settings';
// Vercel may add a custom prefix when connecting storage (e.g. STORAGE_KV_REST_API_URL),
// so accept any env var ending in the standard names.
function env(...suffixes) {
  for (const sfx of suffixes) if (process.env[sfx]) return process.env[sfx];
  const keys = Object.keys(process.env);
  for (const sfx of suffixes) {
    const k = keys.find((key) => key.endsWith('_' + sfx) && process.env[key]);
    if (k) return process.env[k];
  }
  return undefined;
}
const PG_URL = env('DATABASE_URL', 'POSTGRES_URL');
const REDIS_URL = env('KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL');
const REDIS_TOKEN = env('KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN');

// Local testing only: TM_DEV_MEMORY_STORE=1 keeps settings in memory.
let memory = null;
const useMemory = !PG_URL && !REDIS_URL && process.env.TM_DEV_MEMORY_STORE === '1';

/* ---------- Neon Postgres ---------- */
let sql = null;
let tableReady = null;
function pg() {
  if (!sql) sql = require('@neondatabase/serverless').neon(PG_URL);
  if (!tableReady) {
    tableReady = sql`CREATE TABLE IF NOT EXISTS tm_settings (
      id text PRIMARY KEY,
      doc jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`.catch((e) => { tableReady = null; throw e; });
  }
  return tableReady.then(() => sql);
}

async function redis(command) {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command)
  });
  if (!res.ok) throw new Error(`Redis ${res.status}`);
  return (await res.json()).result;
}

async function load() {
  if (useMemory) return memory;
  if (PG_URL) {
    const db = await pg();
    const rows = await db`SELECT doc FROM tm_settings WHERE id = 'main'`;
    return rows.length ? rows[0].doc : null;
  }
  const raw = await redis(['GET', KEY]);
  return raw ? JSON.parse(raw) : null;
}

async function save(doc) {
  if (useMemory) { memory = doc; return; }
  if (PG_URL) {
    const db = await pg();
    await db`INSERT INTO tm_settings (id, doc, updated_at) VALUES ('main', ${JSON.stringify(doc)}::jsonb, now())
             ON CONFLICT (id) DO UPDATE SET doc = EXCLUDED.doc, updated_at = now()`;
    return;
  }
  await redis(['SET', KEY, JSON.stringify(doc)]);
}

// Built-in admin password, stored only as a salted scrypt hash.
// Setting ADMIN_PASSWORD in Vercel overrides it.
const PW_SALT = '41c45115417d4c17ebe87089643baca1';
const PW_HASH = '05baa3e27d4a9b6fa2bbb9b99125cd3e12d2627511fdde69a6972b3607c74614';

function passwordOk(header) {
  if (!header || !header.startsWith('Bearer ')) return false;
  const given = header.slice(7);
  if (!given || given.length > 200) return false;
  if (process.env.ADMIN_PASSWORD) {
    const a = crypto.createHash('sha256').update(given).digest();
    const b = crypto.createHash('sha256').update(process.env.ADMIN_PASSWORD).digest();
    return crypto.timingSafeEqual(a, b);
  }
  const a = crypto.scryptSync(given, PW_SALT, 32, { N: 16384, r: 8, p: 1 });
  return crypto.timingSafeEqual(a, Buffer.from(PW_HASH, 'hex'));
}

/* ---------- Validation: only accept the shape the site understands ---------- */
const ID = /^(BG65|BG80|[a-z0-9-]{1,60})$/;

function money(n, max) {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 0 || v > max) return null;
  return Math.round(v * 100) / 100;
}

function idList(list) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.filter((x) => typeof x === 'string' && ID.test(x)))].slice(0, 200);
}

function clean(input) {
  if (!input || typeof input !== 'object') throw new Error('Missing settings');
  const out = { prices: {}, fees: {}, hidden: [], popular: [], sale: {} };

  const prices = input.prices && typeof input.prices === 'object' ? input.prices : {};
  for (const [id, value] of Object.entries(prices).slice(0, 200)) {
    if (!ID.test(id)) continue;
    const v = money(value, 500);
    if (v !== null) out.prices[id] = v;
  }

  const fees = input.fees || {};
  out.fees.fourKnot = money(fees.fourKnot, 100) ?? 4.23;
  out.fees.ownStrings = fees.ownStrings === null || fees.ownStrings === '' ? null : money(fees.ownStrings, 200);

  out.hidden = idList(input.hidden);
  out.popular = idList(input.popular);

  const sale = input.sale || {};
  const scope = ['all', 'standard', 'custom', 'selected'].includes(sale.scope) ? sale.scope : 'all';
  out.sale = {
    active: sale.active === true,
    label: String(sale.label || '').slice(0, 60),
    percent: Math.min(90, Math.max(0, Math.round(Number(sale.percent) || 0))),
    scope,
    items: idList(sale.items),
    endsAt: /^\d{4}-\d{2}-\d{2}$/.test(sale.endsAt || '') ? sale.endsAt : ''
  };
  return out;
}

module.exports = async function handler(req, res) {
  res.setHeader('X-Robots-Tag', 'noindex');
  const configured = useMemory || PG_URL || (REDIS_URL && REDIS_TOKEN);

  if (req.method === 'GET') {
    if (!configured) return res.status(200).json({ settings: null, configured: false });
    try {
      const doc = await load();
      res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=300');
      return res.status(200).json({ settings: doc ? doc.settings : null, updatedAt: doc ? doc.updatedAt : null, configured: true });
    } catch (e) {
      return res.status(200).json({ settings: null, error: 'storage unavailable' });
    }
  }

  if (req.method === 'POST') {
    res.setHeader('Cache-Control', 'no-store');
    if (!passwordOk(req.headers.authorization)) {
      await new Promise((r) => setTimeout(r, 800)); // slow down guessing
      return res.status(401).json({ error: 'Wrong password' });
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    if (body.check) return res.status(200).json({ ok: true, configured: !!configured, costs: COSTS });
    if (!configured) return res.status(503).json({ error: 'Storage not set up yet — connect Neon (or Upstash) in Vercel → Storage, then redeploy' });
    try {
      const doc = { settings: clean(body.settings), updatedAt: new Date().toISOString() };
      await save(doc);
      return res.status(200).json(doc);
    } catch (e) {
      console.error('settings save failed', e);
      return res.status(e.message === 'Missing settings' ? 400 : 500).json({ error: e.message === 'Missing settings' ? e.message : 'Could not save — check the database connection in Vercel' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
};
