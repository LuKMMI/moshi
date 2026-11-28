// Interface web : prospects, suivi commercial, sites, messages, devis. Aucune dépendance serveur.
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, copyFile, readdir, rm } from 'node:fs/promises';
import { extname } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { generateSite, generateMessages } from './sitegen.mjs';
import { publish } from './publish.mjs';

const file = p => new URL(p, import.meta.url);
const DATA = file('./data/prospects.json'), SEED = file('./data/seed.json'), SUIVI = file('./data/suivi.json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
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
  if ('montant' in b) { const m = Number(b.montant); if (!(m >= 0)) throw new Error('montant invalide'); out.montant = m; }
  if ('relance' in b) { if (b.relance && !/^\d{4}-\d{2}-\d{2}$/.test(b.relance)) throw new Error('date invalide'); out.relance = b.relance; }
  return out;
}

// Nom de domaine probable : "Boulangerie Dupont" -> "boulangerie-dupont".
export const slug = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 63);

// CSV lisible par Excel en français : séparateur ";", BOM UTF-8, guillemets échappés.
export const toCsv = rows => '\ufeff' + rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');

// RDAP : registre officiel des noms de domaine. 404 = libre.
async function domainFree(d) {
  const url = d.endsWith('.fr') ? `https://rdap.nic.fr/domain/${d}` : `https://rdap.verisign.com/com/v1/domain/${d}`;
  const r = await fetch(url).catch(() => null);
  return r?.status === 404 ? 'libre' : r?.ok ? 'pris' : 'inconnu';
}

// PageSpeed Insights (gratuit) : note mobile de performance et de référencement d'un site existant.
async function audit(siteUrl) {
  const q = new URLSearchParams({ url: siteUrl, strategy: 'mobile' });
  q.append('category', 'PERFORMANCE'); q.append('category', 'SEO');
  if (process.env.GOOGLE_PLACES_API_KEY) q.set('key', process.env.GOOGLE_PLACES_API_KEY);
  const r = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${q}`);
  const d = await r.json();
  if (!r.ok) throw new Error(d.error?.message || `PageSpeed ${r.status}`);
  const c = d.lighthouseResult.categories;
  return { perf: Math.round(c.performance.score * 100), seo: Math.round(c.seo.score * 100), at: new Date().toISOString() };
}

// Sauvegarde du suivi à chaque démarrage ; on garde les 30 dernières.
async function backup() {
  const dir = file('./data/sauvegardes/');
  await mkdir(dir, { recursive: true });
  await copyFile(SUIVI, new URL(`suivi-${new Date().toISOString().slice(0, 10)}.json`, dir)).catch(() => {});
  for (const old of (await readdir(dir)).sort().reverse().slice(30)) await rm(new URL(old, dir));
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://x');
  const [, action, id] = url.pathname.match(/^\/api\/(sites|suivi|publish|message|prospect|audit|domaine)\/(\d{14})$/) || [];
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
    if (action === 'audit' && post) {
      if (p.website !== 'oui' || !/^https?:\/\//.test(p.websiteUrl || '')) return send(res, 400, { error: 'adresse du site inconnue' });
      s.audit = await audit(p.websiteUrl);
      await save(SUIVI, suivi);
      return send(res, 200, s.audit);
    }
    if (action === 'domaine') {
      const base = slug(p.name);
      const [fr, com] = await Promise.all([domainFree(`${base}.fr`), domainFree(`${base}.com`)]);
      return send(res, 200, { [`${base}.fr`]: fr, [`${base}.com`]: com });
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
  if (url.pathname === '/api/export.csv') {
    const [db, suivi] = await Promise.all([load(), loadSuivi()]);
    const rows = db.prospects.filter(p => suivi[p.id] || url.searchParams.has('tout')).map(p => {
      const s = suivi[p.id] || {};
      return [p.name, p.branch, p.address, p.google?.phone, p.google?.rating, p.google?.reviews, p.website, s.statut, s.relance, s.montant, s.note, s.url, p.id];
    });
    res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="prospects.csv"' });
    return res.end(toCsv([['Nom', 'Métier', 'Adresse', 'Téléphone', 'Note Google', 'Avis', 'Site web', 'Statut', 'Relance', 'Montant signé (€)', 'Notes', 'Site publié', 'SIRET'], ...rows]));
  }
  if (url.pathname === '/api/prospects') return send(res, 200, { ...(await load()), suivi: await loadSuivi() });

  // Fichiers statiques : interface (public/) et sites générés (sites/<siret>/).
  const path = url.pathname === '/' ? '/public/index.html'
    : /^\/sites\/\d{14}\/$/.test(url.pathname) ? `${url.pathname}index.html`
    : /^\/leaflet\/(leaflet\.(js|css)|images\/[\w-]+\.png)$/.test(url.pathname) ? `/node_modules/leaflet/dist${url.pathname.slice(8)}`
    : /^\/[\w-]+\.(html|js|css)$/.test(url.pathname) ? `/public${url.pathname}` : null;
  if (!path) return send(res, 404, { error: 'introuvable' });
  try {
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] }).end(await readFile(file(`.${path}`)));
  } catch { send(res, 404, { error: 'introuvable' }); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = process.env.PORT || 3000;
  await backup();
  // Accessible uniquement depuis cet ordinateur : personne d'autre sur le Wi-Fi n'utilise vos clés.
  createServer((req, res) => handle(req, res).catch(e => { console.error(e); send(res, 500, { error: e.message }); }))
    .listen(port, '127.0.0.1', () => console.log(`Prospects Haute-Marne : http://localhost:${port}`));
}
