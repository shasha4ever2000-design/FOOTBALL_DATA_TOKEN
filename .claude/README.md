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

## Vendored skills

These live in `.claude/skills/` and load automatically. Copied from
[TreyDong/banana-skills](https://github.com/TreyDong/banana-skills) (MIT, see `skills/BANANA_LICENSE`).

| Skill | Covers |
| --- | --- |
| `banana-skill-finder` | Finds and suggests other skills for a task |
| `banana-sync-to-notion` | Syncs local Markdown files to Notion (needs `NOTION_TOKEN` + `NOTION_ROOT_PAGE_ID` in a `.env`, and `npm install` in its folder) |
| `banana-claude-codex-import` | Imports Claude Code / Codex chat history into OpenClaw memory |
