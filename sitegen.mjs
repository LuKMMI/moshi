// Génère un site vitrine d'une page pour un prospect : Claude si une clé est configurée, sinon modèle intégré.
import Anthropic from '@anthropic-ai/sdk';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const title = s => String(s).toLowerCase().replace(/(^|[\s'-])\p{L}/gu, m => m.toUpperCase());

const PITCH = {
  'Métiers de bouche': ['Le goût du fait maison', 'Produits frais, savoir-faire artisanal et passion du métier, chaque jour.'],
  'Restaurants & cafés': ['Une table où l’on revient', 'Cuisine généreuse et accueil chaleureux au cœur de la Haute-Marne.'],
  'Hôtels & hébergements': ['Votre étape en Haute-Marne', 'Un séjour au calme, un accueil attentionné.'],
  'Garages & automobile': ['Votre véhicule entre de bonnes mains', 'Entretien, réparation et conseils honnêtes.'],
  'Bâtiment & artisans': ['Le travail bien fait', 'Des artisans locaux pour vos projets de construction et de rénovation.'],
  'Coiffure & beauté': ['Prenez soin de vous', 'Un moment de détente et des conseils personnalisés.'],
};

export function templateSite(p) {
  const [h, sub] = PITCH[p.branch] || ['Votre commerce de proximité', 'Un service de qualité, près de chez vous.'];
  const name = esc(title(p.name)), city = esc(title(p.city || ''));
  const phone = p.google?.phone ? `<a class="btn" href="tel:${esc(p.google.phone.replace(/\s/g, ''))}">Appeler le ${esc(p.google.phone)}</a>` : '';
  const rating = p.google?.rating ? `<p class="rating">★ ${esc(p.google.rating)} / 5 — ${esc(p.google.reviews)} avis Google</p>` : '';
  const map = p.lat ? `<iframe title="Plan d'accès" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${p.lon - 0.006},${p.lat - 0.004},${p.lon + 0.006},${p.lat + 0.004}&marker=${p.lat},${p.lon}"></iframe>` : '';
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${name} – ${city}</title><meta name="description" content="${name}, ${esc(p.branch)} à ${city}. ${esc(sub)}">
<style>:root{--c:#1f4e5f;--a:#e8a33d}*{box-sizing:border-box}body{margin:0;font:17px/1.6 system-ui,sans-serif;color:#222;background:#fafaf7}
header{background:linear-gradient(135deg,var(--c),#2d7486);color:#fff;padding:72px 20px;text-align:center}h1{margin:0 0 8px;font-size:clamp(2rem,6vw,3.2rem)}
.tag{opacity:.85;text-transform:uppercase;letter-spacing:.1em;font-size:.8rem}.btn{display:inline-block;margin-top:20px;background:var(--a);color:#222;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600}
main{max-width:900px;margin:auto;padding:40px 20px}section{margin-bottom:40px}h2{color:var(--c)}.rating{font-weight:600;color:#b07400}
iframe{width:100%;height:320px;border:0;border-radius:12px}footer{text-align:center;padding:24px;color:#777;font-size:.85rem}</style></head><body>
<header><div class="tag">${esc(p.branch)} · ${city}</div><h1>${name}</h1><p>${esc(h)}</p>${phone}</header>
<main><section><h2>Bienvenue</h2><p>${esc(sub)}</p>${rating}</section>
<section><h2>Nous trouver</h2><p>${esc(p.address)}</p>${map}</section>
<section><h2>Horaires</h2><p>[À compléter avec le commerçant]</p></section></main>
<footer>© ${new Date().getFullYear()} ${name}</footer></body></html>`;
}

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

export async function generateSite(p) {
  if (!client) return { html: templateSite(p), engine: 'modèle' };
  const facts = { nom: p.name, raison_sociale: p.legalName, metier: p.branch, code_naf: p.naf, adresse: p.address, ville: p.city,
    telephone: p.google?.phone, note_google: p.google?.rating, nombre_avis: p.google?.reviews, latitude: p.lat, longitude: p.lon };
  const msg = await client.beta.messages.stream({
    model: 'claude-opus-5-5', max_tokens: 64000,
    betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
    system: 'Tu es webdesigner pour les commerces de proximité en France. Tu réponds uniquement par un document HTML complet.',
    messages: [{ role: 'user', content: `Crée le site vitrine d'une page de ce commerce, en français :\n${JSON.stringify(facts, null, 1)}\n
Contraintes : un seul fichier HTML avec CSS intégré, responsive, accessible, design soigné adapté au métier, sections accueil / services / avis / accès (carte OpenStreetMap en iframe si coordonnées) / contact.
N'invente aucun fait vérifiable (prix, horaires, avis clients, diplômes) : mets des repères "[À compléter]" à la place. Pas de JavaScript externe ; seules les polices Google Fonts sont permises.` }],
  }).finalMessage();
  if (msg.stop_reason === 'refusal') return { html: templateSite(p), engine: 'modèle (Claude a refusé)' };
  const text = msg.content.filter(b => b.type === 'text').map(b => b.text).join('');
  const html = text.slice(text.search(/<!doctype|<html/i)).replace(/```\s*$/, '');
  return html.includes('</html>') ? { html, engine: 'Claude' } : { html: templateSite(p), engine: 'modèle (réponse incomplète)' };
}
