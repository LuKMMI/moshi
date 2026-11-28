// Publication d'un site sur Netlify (gratuit) via l'API "file digest" : pas de zip, pas de dépendance.
import { createHash } from 'node:crypto';

const API = 'https://api.netlify.com/api/v1';

async function call(path, init) {
  const r = await fetch(API + path, { ...init, headers: { Authorization: `Bearer ${process.env.NETLIFY_TOKEN}`, ...init.headers } });
  if (!r.ok) throw new Error(`Netlify ${r.status} : ${await r.text()}`);
  return r.json();
}

// Réutilise le site Netlify du prospect s'il existe déjà, pour garder la même adresse.
export async function publish(html, siteId) {
  if (!process.env.NETLIFY_TOKEN) throw new Error('ajoutez NETLIFY_TOKEN dans le fichier .env (voir README)');
  const json = { 'Content-Type': 'application/json' };
  const site = siteId ? await call(`/sites/${siteId}`, { method: 'GET', headers: {} })
    : await call('/sites', { method: 'POST', headers: json, body: '{}' });
  const sha1 = createHash('sha1').update(html).digest('hex');
  const deploy = await call(`/sites/${site.id}/deploys`, { method: 'POST', headers: json, body: JSON.stringify({ files: { '/index.html': sha1 } }) });
  if (deploy.required?.includes(sha1))
    await call(`/deploys/${deploy.id}/files/index.html`, { method: 'PUT', headers: { 'Content-Type': 'application/octet-stream' }, body: html });
  return { siteId: site.id, url: site.ssl_url || site.url };
}
