# Claude Code skills for this project

Skills come from the [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills)
and [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills)
marketplaces, wired up in `settings.json`. Claude Code fetches the marketplace on
session start, so nothing is vendored into this repo.

## What's enabled

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
| `andrej-karpathy-skills` | 1 | Karpathy's coding guidelines: think first, keep it simple, surgical changes, verify |

That's ~186 skills. The claude-skills marketplace has 99 plugins / 388 skills total — the rest
are off to keep session context lean.

## Adding more

```bash
/plugin install <plugin-name>@claude-code-skills
```

Browse everything with `/plugin marketplace` or check the
[upstream README](https://github.com/alirezarezvani/claude-skills#skills-overview).

## Removing one

Delete its line from `enabledPlugins` in `settings.json`.
