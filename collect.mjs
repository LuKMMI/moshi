// Collecte des prospects de Haute-Marne (52) sans site web.
// Sources : annuaire officiel des entreprises (gratuit), OpenStreetMap (gratuit), Google Places (clé, payant).
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const DEPT = '52';
const OUT = new URL('./data/prospects.json', import.meta.url);
const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY;
// shortcut: Google Places facture chaque recherche, on plafonne par exécution ; le cache évite de repayer.
const GOOGLE_LIMIT = Number(process.env.GOOGLE_LIMIT ?? 300);

// Branche de métier à partir du code NAF (le préfixe le plus long gagne).
const BRANCHES = [
  ['10.1', 'Métiers de bouche'], ['10.7', 'Métiers de bouche'], ['47.2', 'Métiers de bouche'], ['47.11', 'Métiers de bouche'],
  ['56', 'Restaurants & cafés'], ['55', 'Hôtels & hébergements'],
  ['45', 'Garages & automobile'], ['41', 'Bâtiment & artisans'], ['42', 'Bâtiment & artisans'], ['43', 'Bâtiment & artisans'],
  ['96.02', 'Coiffure & beauté'], ['96.04', 'Coiffure & beauté'], ['96', 'Services à la personne'],
  ['47.7', 'Boutiques & mode'], ['47.6', 'Boutiques & mode'], ['47.5', 'Maison & déco'], ['47.4', 'High-tech & téléphonie'],
  ['47.3', 'Garages & automobile'], ['47', 'Commerce de détail'], ['46', 'Commerce de gros'],
  ['81.30', 'Paysagistes & jardins'], ['81', 'Nettoyage & entretien'], ['85.53', 'Auto-écoles'],
  ['93', 'Sport & loisirs'], ['95', 'Réparation'], ['75', 'Vétérinaires & animaux'], ['96.09', 'Services à la personne'],
];
// Associations, syndicats, holdings, location de biens propres : pas de vitrine à vendre.
export const EXCLUDED = /^(94|70\.10|68\.20|35\.11)/;

export function branchOf(naf = '') {
  let best = ['', 'Autres'];
  for (const b of BRANCHES) if (naf.startsWith(b[0]) && b[0].length > best[0].length) best = b;
  return best[1];
}

// Note de priorité : bonne réputation Google + beaucoup d'avis = client crédible qui gagne à avoir un site.
// Un commerce "Facebook seulement" sait déjà que le web compte : prospect chaud, bonus x1,5.
export function score(p) {
  if (p.website === 'oui') return 0;
  const g = p.google, s = g?.rating ? g.rating * Math.log10(1 + g.reviews) : 0;
  return Math.round(s * (p.website === 'facebook' ? 1.5 : 1) * 10) / 10;
}

export const isSocial = url => /^https?:\/\/([\w-]+\.)?(facebook|fb|instagram|linktr)\.(com|me|ee)\b/i.test(url || '');

const norm = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getJson(url, init, tries = 10) {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(url, init);
      if (r.ok) return await r.json();
      if (r.status !== 429 && r.status < 500) throw new Error(`${r.status} ${await r.text()}`);
    } catch (e) { if (i >= tries) throw e; }
    if (i >= tries) throw new Error(`échec après ${tries} essais : ${url}`);
    await sleep(Math.min(1000 * i, 8000));
  }
}

// 1. Annuaire des entreprises : commerces, artisans, restauration, services en Haute-Marne.
async function fromRegistry() {
  const queries = ['section_activite_principale=F', 'section_activite_principale=G', 'section_activite_principale=I',
    'section_activite_principale=S', 'activite_principale=10.71A,10.71B,10.71C,10.71D,10.13B,81.30Z,85.53Z,93.13Z,75.00Z'];
  const out = new Map();
  for (const q of queries) {
    for (let page = 1; ; page++) {
      const d = await getJson(`https://recherche-entreprises.api.gouv.fr/search?departement=${DEPT}&${q}&etat_administratif=A&per_page=25&page=${page}&limite_matching_etablissements=20`);
      for (const u of d.results) {
        // Les chaînes et grands groupes ont déjà un site ; l'opposition à la prospection est respectée.
        if (u.opposition_diffusion_commerciale || u.statut_diffusion !== 'O') continue;
        if (u.categorie_entreprise === 'GE' || u.categorie_entreprise === 'ETI' || u.nombre_etablissements_ouverts > 5) continue;
        for (const e of u.matching_etablissements || []) {
          if (e.etat_administratif !== 'A' || !e.code_postal?.startsWith(DEPT)) continue;
          const name = e.liste_enseignes?.[0] || e.nom_commercial || u.nom_complet;
          const naf = e.activite_principale || u.activite_principale;
          if (EXCLUDED.test(naf)) continue;
          out.set(e.siret, {
            id: e.siret, name, legalName: u.nom_complet, naf, branch: branchOf(naf),
            address: e.adresse, city: e.libelle_commune, lat: +e.latitude || null, lon: +e.longitude || null,
            created: e.date_creation, staff: u.tranche_effectif_salarie, website: 'inconnu',
          });
        }
      }
      process.stdout.write(`\rAnnuaire ${q.slice(0, 40)} page ${page}/${d.total_pages}   `);
      if (page >= d.total_pages || page * 25 >= 10000) break;
      await sleep(160); // limite de l'API : 7 requêtes/s
    }
  }
  console.log(`\n${out.size} établissements trouvés dans l'annuaire`);
  return out;
}

// 2. OpenStreetMap : noms des commerces du 52 qui déclarent un site web.
async function osmWebsites() {
  const q = `[out:json][timeout:120];area["ISO3166-2"="FR-${DEPT}"]->.a;nwr["name"][~"^(website|contact:website|url)$"~"."](area.a);out tags;`;
  try {
    const d = await getJson('https://overpass-api.de/api/interpreter', { method: 'POST', body: new URLSearchParams({ data: q }) }, 3);
    const names = new Set(d.elements.map(e => norm(e.tags.name)));
    console.log(`OpenStreetMap : ${names.size} commerces avec site connus`);
    return names;
  } catch (e) {
    console.warn('OpenStreetMap indisponible, étape ignorée :', e.message);
    return new Set();
  }
}

// 3. Google Places : note, nombre d'avis et site web réel.
async function google(p) {
  const body = { textQuery: `${p.name} ${p.city}`, languageCode: 'fr', regionCode: 'FR', pageSize: 1 };
  if (p.lat) body.locationBias = { circle: { center: { latitude: p.lat, longitude: p.lon }, radius: 3000 } };
  const d = await getJson('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST', body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json', 'X-Goog-Api-Key': GOOGLE_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.websiteUri,places.nationalPhoneNumber,places.googleMapsUri,places.businessStatus',
    },
  });
  const g = d.places?.[0];
  // Le premier résultat doit partager au moins un mot significatif avec le nom, sinon ce n'est pas le bon commerce.
  const words = norm(p.name).split(' ').filter(w => w.length > 2);
  if (!g || !words.some(w => norm(g.displayName?.text).includes(w))) return { found: false, checkedAt: Date.now() };
  return {
    found: true, placeId: g.id, name: g.displayName?.text, rating: g.rating ?? null, reviews: g.userRatingCount ?? 0,
    website: g.websiteUri ?? null, phone: g.nationalPhoneNumber ?? null, mapsUrl: g.googleMapsUri, status: g.businessStatus, checkedAt: Date.now(),
  };
}

async function main() {
  const prev = await readFile(OUT, 'utf8').catch(() => readFile(new URL('./data/seed.json', import.meta.url), 'utf8')).then(JSON.parse);
  const old = new Map(prev.prospects.map(p => [p.id, p]));
  // L'annuaire bouge peu : on ne le recharge (plusieurs minutes) qu'une fois par mois ou sur demande.
  const annuaireAt = prev.annuaireAt || prev.updatedAt;
  const refresh = process.argv.includes('--annuaire') || Date.now() - Date.parse(annuaireAt) > 30 * 864e5;
  const found = refresh ? await fromRegistry() : old;
  const osm = refresh ? await osmWebsites() : null;
  let calls = 0;
  // Le quota Google gratuit va d'abord aux métiers qui ont le plus besoin d'une vitrine.
  const first = ['Restaurants & cafés', 'Coiffure & beauté', 'Métiers de bouche', 'Boutiques & mode', 'Hôtels & hébergements', 'Garages & automobile'];
  const rank = p => (first.indexOf(p.branch) + first.length + 1) % (first.length + 1);
  for (const p of [...found.values()].sort((a, b) => rank(a) - rank(b))) {
    const before = old.get(p.id);
    if (before?.google) p.google = before.google;
    if (before?.siteGenerated) p.siteGenerated = before.siteGenerated;
    if (GOOGLE_KEY && !p.google && calls < GOOGLE_LIMIT) {
      calls++;
      try { p.google = await google(p); } catch (e) { console.warn(`Google ${p.name} :`, e.message); }
      process.stdout.write(`\rGoogle ${calls}/${GOOGLE_LIMIT}   `);
    }
    const url = p.google?.website, inOsm = osm ? osm.has(norm(p.name)) : p.websiteUrl === 'OpenStreetMap';
    p.website = url ? (isSocial(url) ? 'facebook' : 'oui') : inOsm ? 'oui' : p.google?.found ? 'non' : 'inconnu';
    p.websiteUrl = url || (inOsm ? 'OpenStreetMap' : undefined);
    p.score = score(p);
  }
  const prospects = [...found.values()].sort((a, b) => a.branch.localeCompare(b.branch) || b.score - a.score);
  await writeFile(OUT, JSON.stringify({ updatedAt: new Date().toISOString(), annuaireAt: refresh ? new Date().toISOString() : annuaireAt, department: DEPT, prospects }, null, 1));
  console.log(`\n${prospects.length} prospects écrits dans data/prospects.json (${calls} appels Google${refresh ? ', annuaire rechargé' : ''})`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
