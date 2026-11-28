# Graph Report - moshi  (2026-11-28)

## Corpus Check
- 12 files · ~224,783 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 3, .example 1, .bat 1)

## Summary
- 88 nodes · 137 edges · 12 communities (8 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7d62cec5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- package.json
- server.mjs
- collect.test.mjs
- Ponytail
- handle
- collect.mjs
- publish.mjs
- collect.test.mjs
- CLAUDE.md
- .claude/CLAUDE.md
- Prospects Haute-Marne
- file

## God Nodes (most connected - your core abstractions)
1. `handle()` - 15 edges
2. `main()` - 7 edges
3. `Prospects Haute-Marne` - 7 edges
4. `templateSite()` - 6 edges
5. `generateSite()` - 6 edges
6. `getJson()` - 5 edges
7. `fromRegistry()` - 5 edges
8. `norm()` - 4 edges
9. `osmWebsites()` - 4 edges
10. `google()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `handle()` --calls--> `publish()`  [EXTRACTED]
  server.mjs → publish.mjs
- `handle()` --calls--> `generateMessages()`  [EXTRACTED]
  server.mjs → sitegen.mjs
- `handle()` --calls--> `generateSite()`  [EXTRACTED]
  server.mjs → sitegen.mjs

## Import Cycles
- None detected.

## Communities (12 total, 4 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.18
Nodes (12): dependencies, @anthropic-ai/sdk@^1.12.0, leaflet@^1.9.4, name, private, scripts, collect, start (+4 more)

### Community 1 - "server.mjs"
Cohesion: 0.17
Nodes (5): DATA, SEED, STATUTS, SUIVI, TYPES

### Community 2 - "collect.test.mjs"
Cohesion: 0.38
Nodes (9): esc(), generateMessages(), generateSite(), googleExtras(), mentions(), PITCH, templateMessages(), templateSite() (+1 more)

### Community 3 - "Ponytail"
Cohesion: 0.40
Nodes (4): Before you write, Levels, Ponytail, The smallest complete change

### Community 4 - "handle"
Cohesion: 0.25
Nodes (8): audit(), body(), domainFree(), handle(), load(), loadSuivi(), save(), send()

### Community 5 - "collect.mjs"
Cohesion: 0.27
Nodes (14): BRANCHES, branchOf(), EXCLUDED, fromRegistry(), getJson(), google(), GOOGLE_LIMIT, isSocial() (+6 more)

### Community 7 - "collect.test.mjs"
Cohesion: 0.33
Nodes (3): cleanSuivi(), slug(), toCsv()

### Community 10 - "Prospects Haute-Marne"
Cohesion: 0.25
Nodes (7): Autres fonctions, Démarrage, Génération de site, Outils d'agent installés, Prospects Haute-Marne, Sources de données, Suivi et démarchage

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@anthropic-ai/sdk` connect `package.json` to `collect.test.mjs`?**
  _High betweenness centrality (0.184) - this node is a cross-community bridge._
- **Why does `handle()` connect `handle` to `server.mjs`, `collect.test.mjs`, `publish.mjs`, `collect.test.mjs`, `file`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._