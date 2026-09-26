# Claude Code skills for this project

Skills come from two marketplaces, wired up in `settings.json`:

- [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills)
- [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)

Claude Code fetches them on session start, so nothing is vendored into this repo.

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
| `ui-ux-pro-max` | 7 | UI/UX design: styles, palettes, font pairings, UX rules, design systems, banners, slides |

That's ~192 skills. The claude-skills marketplace has 99 plugins / 388 skills total — the rest
are off to keep session context lean.

## Adding more

```bash
/plugin install <plugin-name>@claude-code-skills
```

Browse everything with `/plugin marketplace` or check the
[upstream README](https://github.com/alirezarezvani/claude-skills#skills-overview).

## Removing one

Delete its line from `enabledPlugins` in `settings.json`.

## MCP servers

`.mcp.json` at the repo root adds the [21st.dev](https://21st.dev) MCP server
(UI component generation). It reads the API key from the `TWENTY_FIRST_API_KEY`
environment variable, so the key never lives in the repo. Set that variable in
your environment (for Claude Code on the web: environment settings → environment
variables), and allow `21st.dev` in the network access settings.
