// Interface web : prospects, suivi commercial, sites, messages, devis. Aucune dépendance serveur.
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { extname } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { generateSite, generateMessages } from './sitegen.mjs';
import { publish } from './publish.mjs';

const file = p => new URL(p, import.meta.url);
const DATA = file('./data/prospects.json'), SEED = file('./data/seed.json'), SUIVI = file('./data/suivi.json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.js': 'text/javascript', '.css': 'text/css' };
export const STATUTS = ['', 'contacte', 'interesse', 'devis', 'signe', 'refuse'];
let collecting = false;

const load = async () => JSON.parse(await readFile(DATA, 'utf8').catch(() => readFile(SEED, 'utf8')));
const loadSuivi = async () => JSON.parse(await readFile(SUIVI, 'utf8').catch(() => '{}'));
const save = (url, obj) => writeFile(url, JSON.stringify(obj, null, 1));
const send = (res, code, obj) => res.writeHead(code, { 'Content-Type': 'application/json' }).end(JSON.stringify(obj));
async function body(req) {
  let s = '';
  for await (const c of req) if ((s += c).length > 1e5) throw new Error('requête trop grosse');
  return s ? JSON.parse(s) : {};
}

// Valide une mise à jour du suivi venant du navigateur.
export function cleanSuivi(b) {
  const out = {};
  if ('statut' in b) { if (!STATUTS.includes(b.statut)) throw new Error('statut invalide'); out.statut = b.statut; }
  if ('note' in b) out.note = String(b.note).slice(0, 5000);
  if ('relance' in b) { if (b.relance && !/^\d{4}-\d{2}-\d{2}$/.test(b.relance)) throw new Error('date invalide'); out.relance = b.relance; }
  return out;
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://x');
  const [, action, id] = url.pathname.match(/^\/api\/(sites|suivi|publish|message|prospect)\/(\d{14})$/) || [];
  const post = req.method === 'POST';

  if (action) {
    const db = await load(), p = db.prospects.find(x => x.id === id);
    if (!p) return send(res, 404, { error: 'prospect inconnu' });
    const suivi = await loadSuivi(), s = suivi[id] ??= {};
    const siteFile = file(`./sites/${id}/index.html`);

    if (action === 'prospect') return send(res, 200, { ...p, suivi: s });
    if (action === 'sites' && post) {
      const { html, engine } = await generateSite(p);
      await mkdir(file(`./sites/${id}/`), { recursive: true });
      await writeFile(siteFile, html);
      p.siteGenerated = { at: new Date().toISOString(), engine };
      await save(DATA, db);
      return send(res, 200, { url: `/sites/${id}/`, engine });
    }
    if (action === 'suivi' && post) {
      Object.assign(s, cleanSuivi(await body(req)), { maj: new Date().toISOString() });
      await save(SUIVI, suivi);
      return send(res, 200, s);
    }
    if (action === 'publish' && post) {
      const html = await readFile(siteFile, 'utf8').catch(() => null);
      if (!html) return send(res, 400, { error: 'créez d’abord le site' });
      Object.assign(s, await publish(html, s.siteId));
      await save(SUIVI, suivi);
      return send(res, 200, { url: s.url });
    }
    if (action === 'message' && post) return send(res, 200, await generateMessages(p, s.url));
    return send(res, 405, { error: 'méthode non permise' });
  }

  if (url.pathname === '/api/collect' && post) {
    if (collecting) return send(res, 409, { error: 'collecte déjà en cours' });
    collecting = true;
    // La collecte tourne dans son propre processus ; les clés du .env sont héritées.
    try { await promisify(execFile)(process.execPath, ['collect.mjs'], { cwd: file('.'), maxBuffer: 1 << 26 }); }
    finally { collecting = false; }
    return send(res, 200, { ok: true });
  }
  if (url.pathname === '/api/prospects') return send(res, 200, { ...(await load()), suivi: await loadSuivi() });

  // Fichiers statiques : interface (public/) et sites générés (sites/<siret>/).
  const path = url.pathname === '/' ? '/public/index.html'
    : /^\/sites\/\d{14}\/$/.test(url.pathname) ? `${url.pathname}index.html`
    : /^\/[\w-]+\.(html|js|css)$/.test(url.pathname) ? `/public${url.pathname}` : null;
  if (!path) return send(res, 404, { error: 'introuvable' });
  try {
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] }).end(await readFile(file(`.${path}`)));
  } catch { send(res, 404, { error: 'introuvable' }); }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = process.env.PORT || 3000;
  createServer((req, res) => handle(req, res).catch(e => { console.error(e); send(res, 500, { error: e.message }); }))
    .listen(port, () => console.log(`Prospects Haute-Marne : http://localhost:${port}`));
}
