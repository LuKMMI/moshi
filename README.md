# Prospects Haute-Marne

Trouve les commerces, artisans et PME de Haute-Marne (52) **sans site web**, les classe **par métier** et **par avis Google**, et crée en un clic un site vitrine pour chacun.

## Démarrage

**Windows :** double-cliquez sur `lancer.bat` (installe, demande les clés une fois, ouvre l'interface).

```bash
npm install
cp .env.example .env      # renseignez les clés (optionnelles)
npm run collect           # récupère / met à jour data/prospects.json
npm start                 # http://localhost:3000
```

## Sources de données

| Étape | Source | Coût | Ce qu'elle apporte |
|---|---|---|---|
| 1 | [API Recherche d'entreprises](https://recherche-entreprises.api.gouv.fr) (État) | gratuit | tous les établissements actifs du 52, code NAF → branche de métier, adresse, GPS |
| 2 | OpenStreetMap (Overpass) | gratuit | commerces qui déclarent déjà un site → exclus |
| 3 | Google Places API (New), `GOOGLE_PLACES_API_KEY` | payant | note, nombre d'avis, téléphone, **site web réel** |

Filtres appliqués : grands groupes, ETI et réseaux de plus de 5 établissements exclus ; les entreprises qui ont **refusé la prospection commerciale** ou dont les données ne sont pas diffusables sont exclues (RGPD).

Google Places facture chaque recherche (le champ site web relève du tarif « Pro/Enterprise »). `GOOGLE_LIMIT` (300 par défaut) plafonne les appels par exécution, et les résultats sont mis en cache dans `data/prospects.json` : relancer `npm run collect` ne revérifie que les nouveaux.

Statut « site web » : `non` = fiche Google trouvée sans site (prospect confirmé), `inconnu` = pas encore vérifié, `oui` = a déjà un site.

**Score** = note Google × log10(1 + nombre d'avis) : un commerce bien noté avec beaucoup d'avis et sans site est le meilleur prospect.

## Génération de site

Le bouton **Créer le site** écrit `sites/<siret>/index.html` :
- avec `ANTHROPIC_API_KEY` : Claude (`claude-opus-5-5`) conçoit une page sur mesure (repli serveur automatique si la requête est refusée) ;
- sans clé : modèle HTML intégré, adapté à la branche de métier.

Les informations inconnues (horaires, prix, etc.) sont marquées `[À compléter]` : rien n'est inventé.

## Outils d'agent installés

- `.claude/skills/ponytail` : [Ponytail](https://github.com/DietrichGebert/ponytail) (MIT), règles du « développeur senior paresseux ».
- `.claude/skills/graphify` : [Graphify](https://github.com/Graphify-Labs/graphify), graphe de connaissances du code dans `graphify-out/` (`pip install graphifyy`, puis `graphify update .`).
