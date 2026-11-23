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
