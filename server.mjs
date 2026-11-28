// Interface web : liste des prospects + génération de site en un clic. Aucune dépendance serveur.
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { extname } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { generateSite } from './sitegen.mjs';

const DATA = new URL('./data/prospects.json', import.meta.url);
const TYPES = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.js': 'text/javascript', '.css': 'text/css' };
let collecting = false;
const load = async () => JSON.parse(await readFile(DATA, 'utf8'));

async function handle(req, res) {
  const url = new URL(req.url, 'http://x');
  const site = url.pathname.match(/^\/api\/sites\/(\d{14})$/);
  if (site && req.method === 'POST') {
    const db = await load();
    const p = db.prospects.find(x => x.id === site[1]);
    if (!p) return send(res, 404, { error: 'prospect inconnu' });
    const { html, engine } = await generateSite(p);
    await mkdir(new URL(`./sites/${p.id}/`, import.meta.url), { recursive: true });
    await writeFile(new URL(`./sites/${p.id}/index.html`, import.meta.url), html);
    p.siteGenerated = { at: new Date().toISOString(), engine };
    await writeFile(DATA, JSON.stringify(db, null, 1));
    return send(res, 200, { url: `/sites/${p.id}/`, engine });
  }
  if (url.pathname === '/api/collect' && req.method === 'POST') {
    if (collecting) return send(res, 409, { error: 'collecte déjà en cours' });
    collecting = true;
    // La collecte tourne dans son propre processus ; les clés du .env sont héritées.
    try { await promisify(execFile)(process.execPath, ['collect.mjs'], { cwd: new URL('.', import.meta.url), maxBuffer: 1 << 26 }); }
    finally { collecting = false; }
    return send(res, 200, { ok: true });
  }
  if (url.pathname === '/api/prospects') return send(res, 200, await load());
  // Fichiers statiques : interface (public/) et sites générés (sites/<siret>/).
  const path = url.pathname === '/' ? '/public/index.html'
    : /^\/sites\/\d{14}\/$/.test(url.pathname) ? `${url.pathname}index.html`
    : /^\/[\w-]+\.(html|js|css)$/.test(url.pathname) ? `/public${url.pathname}` : null;
  if (!path) return send(res, 404, { error: 'introuvable' });
  try {
    const body = await readFile(new URL(`.${path}`, import.meta.url));
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] }).end(body);
  } catch { send(res, 404, { error: 'introuvable' }); }
}

const send = (res, code, obj) => res.writeHead(code, { 'Content-Type': 'application/json' }).end(JSON.stringify(obj));

const port = process.env.PORT || 3000;
createServer((req, res) => handle(req, res).catch(e => { console.error(e); send(res, 500, { error: e.message }); }))
  .listen(port, () => console.log(`Prospects Haute-Marne : http://localhost:${port}`));
