# Claude Code skills for this project

Skills come from the [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills)
marketplace, wired up in `settings.json`. Claude Code fetches the marketplace on
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

That's ~185 skills. The marketplace has 99 plugins / 388 skills total — the rest
are off to keep session context lean.

## Adding more

```bash
/plugin install <plugin-name>@claude-code-skills
```

Browse everything with `/plugin marketplace` or check the
[upstream README](https://github.com/alirezarezvani/claude-skills#skills-overview).

## Removing one

Delete its line from `enabledPlugins` in `settings.json`.

## Agent Reach (web sessions)

`hooks/session-start.sh` reinstalls [Agent Reach](https://github.com/Panniantong/Agent-Reach)
at the start of every Claude Code on the web session, since the container is
wiped between sessions. It installs into `~/.agent-reach-venv` (outside the repo),
adds `gh`, `mcporter` + Exa search and `yt-dlp`, and registers the `agent-reach`
skill. It does nothing on local machines.

Run `agent-reach doctor` to see which channels are working. Some sites (Jina
Reader, Exa, V2EX, Bilibili) need to be allowed in the environment's network
settings first.
