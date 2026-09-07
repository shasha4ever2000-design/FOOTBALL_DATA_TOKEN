# Claude Code skills and plugins for this project

Everything is wired up in `settings.json` via two marketplaces. Claude Code
fetches them on session start, so nothing is vendored into this repo.

| Marketplace | Source |
| --- | --- |
| `claude-code-skills` | [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) |
| `ruflo` | [ruvnet/ruflo](https://github.com/ruvnet/ruflo) |

## Skill bundles (`claude-code-skills`)

| Plugin | Skills | Covers |
| --- | --- | --- |
| `engineering-skills` | 34 | Core engineering: testing, debugging, CI, code review |
| `engineering-advanced-skills` | 38 | Docker, Terraform, Kubernetes, SLOs, chaos engineering |
| `product-skills` | 13 | PRDs, user research, roadmaps |
| `pm-skills` | 9 | Sprint planning, delivery tracking |
| `marketing-skills` | 48 | Content, SEO/AEO, CRO, growth, sales enablement |
| `c-level-skills` | 34 | CFO/CMO/CTO-style advisory personas |
| `finance-skills` | 4 | Modelling, investment analysis |
| `business-growth-skills` | 5 | Positioning, pricing, GTM |

That's ~185 skills. The marketplace has 99 plugins / 388 skills total — the rest
are off to keep session context lean.

## Agent harness (`ruflo`)

Ruflo is an agent meta-harness: swarm coordination, background workers,
persistent memory, and specialised agents layered on top of Claude Code.

| Plugin | Skills | Covers |
| --- | --- | --- |
| `ruflo-core` | 5 | Foundation — registers the `ruflo` MCP server, 4 generalist agents, plugin discovery |
| `ruflo-swarm` | 2 | Agent teams, swarm coordination, monitor streams, worktree isolation |
| `ruflo-loop-workers` | 2 | Cache-aware `/loop` workers and cron background automation |
| `ruflo-sparc` | 3 | SPARC methodology — spec, pseudocode, architecture, refinement, completion |
| `ruflo-testgen` | 3 | Test gap detection, coverage analysis, TDD workflows |
| `ruflo-security-audit` | 2 | Security review, dependency scanning, CVE monitoring |
| `ruflo-docs` | 2 | Doc generation, drift detection, API docs |
| `ruflo-rag-memory` | 2 | RuVector memory with HNSW search and semantic retrieval |

8 of ruflo's 39 plugins, ~21 skills. The other 31 cover more specialised
ground (browser automation, cost tracking, knowledge graphs, federation,
market data, DDD, ADRs, and more) — enable them as needed.

**Note:** `ruflo-core` ships its own `.mcp.json` and starts a local Node MCP
server (300+ tools). The other ruflo plugins are skills, commands, and agent
definitions only.

## Adding more

```bash
/plugin install <plugin-name>@claude-code-skills
/plugin install <plugin-name>@ruflo
```

Browse everything with `/plugin marketplace`, or check the upstream lists:
[claude-skills](https://github.com/alirezarezvani/claude-skills#skills-overview)
and [ruflo](https://github.com/ruvnet/ruflo#quick-start).

## Removing one

Delete its line from `enabledPlugins` in `settings.json`.
