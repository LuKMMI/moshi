# Graph Report - moshi  (2026-11-28)

## Corpus Check
- 11 files · ~220,676 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 3, .example 1, .bat 1)

## Summary
- 61 nodes · 81 edges · 11 communities (8 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `21e630fd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- package.json
- server.mjs
- sitegen.mjs
- Ponytail
- collect.test.mjs
- collect.mjs
- main
- fromRegistry
- CLAUDE.md
- .claude/CLAUDE.md
- Prospects Haute-Marne

## God Nodes (most connected - your core abstractions)
1. `main()` - 6 edges
2. `templateSite()` - 5 edges
3. `fromRegistry()` - 5 edges
4. `getJson()` - 5 edges
5. `Prospects Haute-Marne` - 5 edges
6. `handle()` - 4 edges
7. `generateSite()` - 4 edges
8. `google()` - 4 edges
9. `norm()` - 4 edges
10. `osmWebsites()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `handle()` --calls--> `generateSite()`  [EXTRACTED]
  server.mjs → sitegen.mjs

## Import Cycles
- None detected.

## Communities (11 total, 3 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.20
Nodes (10): dependencies, @anthropic-ai/sdk@^1.12.0, name, private, scripts, collect, start, test (+2 more)

### Community 1 - "server.mjs"
Cohesion: 0.22
Nodes (5): DATA, handle(), load(), send(), TYPES

### Community 2 - "sitegen.mjs"
Cohesion: 0.53
Nodes (5): esc(), generateSite(), PITCH, templateSite(), title()

### Community 3 - "Ponytail"
Cohesion: 0.40
Nodes (4): Before you write, Levels, Ponytail, The smallest complete change

### Community 5 - "collect.mjs"
Cohesion: 0.40
Nodes (4): BRANCHES, EXCLUDED, GOOGLE_LIMIT, OUT

### Community 6 - "main"
Cohesion: 0.83
Nodes (4): google(), main(), norm(), osmWebsites()

### Community 7 - "fromRegistry"
Cohesion: 1.00
Nodes (3): fromRegistry(), getJson(), sleep()

### Community 10 - "Prospects Haute-Marne"
Cohesion: 0.33
Nodes (5): Démarrage, Génération de site, Outils d'agent installés, Prospects Haute-Marne, Sources de données

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@anthropic-ai/sdk` connect `package.json` to `sitegen.mjs`?**
  _High betweenness centrality (0.194) - this node is a cross-community bridge._
- **Why does `templateSite()` connect `sitegen.mjs` to `collect.test.mjs`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._