import test from 'node:test';
import assert from 'node:assert/strict';
import { branchOf, score } from './collect.mjs';
import { templateSite } from './sitegen.mjs';

test('branche : le préfixe NAF le plus long gagne', () => {
  assert.equal(branchOf('10.71C'), 'Métiers de bouche');
  assert.equal(branchOf('96.02A'), 'Coiffure & beauté');
  assert.equal(branchOf('96.01A'), 'Services à la personne');
  assert.equal(branchOf('99.99Z'), 'Autres');
});

test('score : bonne note + avis, zéro si déjà un site', () => {
  assert.ok(score({ google: { rating: 4.8, reviews: 120 } }) > score({ google: { rating: 4.8, reviews: 3 } }));
  assert.equal(score({ website: 'oui', google: { rating: 5, reviews: 99 } }), 0);
  assert.equal(score({}), 0);
});

test('modèle de site : échappe le HTML', () => {
  const html = templateSite({ name: '<script>x</script>', city: 'Langres', branch: 'Autres', address: '1 rue' });
  assert.ok(!html.includes('<script>x'));
});

test('exclusions : associations et holdings', async () => {
  const { EXCLUDED } = await import('./collect.mjs');
  assert.ok(EXCLUDED.test('94.99Z') && EXCLUDED.test('70.10Z'));
  assert.ok(!EXCLUDED.test('56.10A'));
});

test('suivi : valide statut, date et note', async () => {
  const { cleanSuivi } = await import('./server.mjs');
  assert.deepEqual(cleanSuivi({ statut: 'signe', relance: '2026-12-01', note: 'ok' }), { statut: 'signe', relance: '2026-12-01', note: 'ok' });
  assert.throws(() => cleanSuivi({ statut: 'pirate' }));
  assert.throws(() => cleanSuivi({ relance: '../x' }));
  assert.equal(cleanSuivi({ note: 'x'.repeat(9000) }).note.length, 5000);
});

test('messages modèle : mentionne le lien de la maquette', async () => {
  const { templateMessages } = await import('./sitegen.mjs');
  const m = templateMessages({ name: 'CHEZ PAUL', city: 'LANGRES' }, 'https://x.netlify.app');
  assert.ok(m.email.includes('https://x.netlify.app') && m.sms.length <= 200);
});
