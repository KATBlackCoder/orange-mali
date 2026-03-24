# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repository Is

This is a **Claude Agent Skills Library** — a collection of reusable instruction modules ("skills") that can be loaded into Claude Code sessions to enforce best practices for specific development tasks. It is not a buildable application.

## Repository Structure

```
.claude/
  settings.local.json     # Permissions, MCP server config
  skills/                 # Skills available via .claude local path
.agents/
  skills/                 # Specialized skill modules
docs/
  plans/                  # Implementation plans for active projects
```

Each skill follows this structure:
```
<skill-name>/
  SKILL.md        # Primary instructions and patterns
  README.md       # Discovery metadata and quick reference
  references/     # Deep-dive docs (where applicable)
  rules/          # Detailed rule files (where applicable)
```

## Active Skills

| Skill | Purpose |
|-------|---------|
| `git-commit` | Conventional commits with intelligent staging |
| `shadcn` | shadcn component management |
| `frontend-design` | Production-grade, distinctive UI design |
| `tailwind-design-system` | Tailwind CSS v4 design systems |
| `vercel-react-best-practices` | React/Next.js patterns (30+ rules) |
| `security-best-practices` | OWASP Top 10, HTTPS, XSS, CSRF |
| `verification-before-completion` | Evidence-based quality gate |
| `writing-plans` | Task decomposition and TDD-based planning |
| `supabase-postgres-best-practices` | Postgres performance and schema best practices |

## How Skills Work

Skills are loaded into a Claude session by reading their `SKILL.md` (and optionally `rules/` files). They provide:
- Step-by-step workflows Claude must follow
- Critical rules and anti-patterns to avoid
- Context injection for project-specific behavior

When modifying or adding skills, maintain the existing structure: `SKILL.md` for instructions, `README.md` for metadata/discovery, and `references/` or `rules/` for supplementary detail.

## Active Projects

### Orange Mali PWA
PWA mobile-first remplaçant Google Forms pour un service terrain partenaire d'Orange Money Mali.
Plans d'implémentation : `docs/plans/2026-03-24-orange-mali-pwa.md` (index) → 7 plans séquentiels.

**Stack :** React 19 + TypeScript + Vite, Tailwind CSS v4, shadcn/ui, Supabase, Vercel

### hoshi-trans
Japanese game translation tooling. Répertoire : `/home/blackat/project/hoshi-trans/`
