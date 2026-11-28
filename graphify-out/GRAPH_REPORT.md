# Graph Report - moshi  (2026-11-28)

## Corpus Check
- 12 files · ~222,988 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 3, .example 1, .bat 1)

## Summary
- 77 nodes · 113 edges · 10 communities (7 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d72d1a17`
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
- CLAUDE.md
- .claude/CLAUDE.md
- Prospects Haute-Marne

## God Nodes (most connected - your core abstractions)
1. `handle()` - 11 edges
2. `main()` - 6 edges
3. `Prospects Haute-Marne` - 6 edges
4. `getJson()` - 5 edges
5. `fromRegistry()` - 5 edges
6. `templateSite()` - 5 edges
7. `norm()` - 4 edges
8. `osmWebsites()` - 4 edges
9. `google()` - 4 edges
10. `publish()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `handle()` --calls--> `publish()`  [EXTRACTED]
  server.mjs → publish.mjs
- `handle()` --calls--> `generateMessages()`  [EXTRACTED]
  server.mjs → sitegen.mjs
- `handle()` --calls--> `generateSite()`  [EXTRACTED]
  server.mjs → sitegen.mjs

## Import Cycles
- None detected.

## Communities (10 total, 3 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.20
Nodes (10): dependencies, @anthropic-ai/sdk@^1.12.0, name, private, scripts, collect, start, test (+2 more)

### Community 1 - "server.mjs"
Cohesion: 0.20
Nodes (5): DATA, SEED, STATUTS, SUIVI, TYPES

### Community 2 - "collect.test.mjs"
Cohesion: 0.24
Nodes (9): score(), cleanSuivi(), esc(), generateMessages(), generateSite(), PITCH, templateMessages(), templateSite() (+1 more)

### Community 3 - "Ponytail"
Cohesion: 0.40
Nodes (4): Before you write, Levels, Ponytail, The smallest complete change

### Community 4 - "handle"
Cohesion: 0.29
Nodes (7): body(), file(), handle(), load(), loadSuivi(), save(), send()

### Community 5 - "collect.mjs"
Cohesion: 0.25
Nodes (12): BRANCHES, branchOf(), EXCLUDED, fromRegistry(), getJson(), google(), GOOGLE_LIMIT, main() (+4 more)

### Community 10 - "Prospects Haute-Marne"
Cohesion: 0.29
Nodes (6): Démarrage, Génération de site, Outils d'agent installés, Prospects Haute-Marne, Sources de données, Suivi et démarchage

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@anthropic-ai/sdk` connect `package.json` to `collect.test.mjs`?**
  _High betweenness centrality (0.173) - this node is a cross-community bridge._
- **Why does `publish()` connect `publish.mjs` to `server.mjs`, `handle`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._