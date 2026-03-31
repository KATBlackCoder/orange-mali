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
Plans d'implémentation : `docs/plans/2026-03-24-orange-mali-pwa.md` (index) → 7 plans séquentiels + `docs/plans/2026-03-25-form-fields-advanced.md`.

**Stack :** React 19 + TypeScript + Vite 8, Tailwind CSS v4, shadcn/ui, Supabase, Vercel

**Supabase project :** `orange-mali` — ID `ibnscabashixestseais`

**Avancement :**
| Chunk | Statut | Contenu |
|-------|--------|---------|
| 01 Setup | ✅ | Vite + Tailwind v4 + shadcn + Supabase client |
| 02 Database | ✅ | Schéma PostgreSQL + RLS policies |
| 03 Auth | ✅ | Login par téléphone, routing protégé |
| 04 Saisie en masse | ✅ | BulkEntryTable, useSubmission, ProfileContext |
| 05 Dashboards | ✅ | Vues par rôle (employe, superviseur, chef) |
| 06 Admin | ✅ | CRUD users + Form Builder + Edge Function |
| 07 Deploy | ✅ | Export CSV + Vercel (https://orange-mali.vercel.app) |
| 08 Champs avancés | ✅ | Multiselect + champs conditionnels |
| 09 Historique & équipe | ✅ | HistoryPage `/history`, SubmissionDetailPage `/submissions/:id`, MyTeamSection superviseur |

**Conventions auth :**
- Email Supabase Auth interne : `telephone@orangemali.local`
- Login affiché : `telephone@last_name.org`
- Password par défaut : `ML` + telephone
- `must_change_password = true` à la création → page changement au 1er login
- Seuls `chef` et `sous_chef` créent des comptes (via Edge Function `create-user`)
- Edge Function déployée avec `--no-verify-jwt` (clé `sb_publishable_` incompatible avec vérification JWT standard)

**Types de champs formulaire :**
- `text`, `tel`, `number`, `date` — saisie directe
- `select` — liste déroulante, choix unique
- `multiselect` — cases à cocher, valeurs stockées séparées par `|` dans `row_values.valeur`
- Champs conditionnels : colonne `condition jsonb` sur `form_fields` — `{ fieldId, value }` — évaluée par ligne dans `BulkEntryTable`

**Commandes :**
```bash
pnpm dev          # Dev local
pnpm build        # Build production
pnpm dlx supabase gen types typescript --project-id ibnscabashixestseais > src/lib/database.types.ts
```

### hoshi-trans
Japanese game translation tooling. Répertoire : `/home/blackat/project/hoshi-trans/`
