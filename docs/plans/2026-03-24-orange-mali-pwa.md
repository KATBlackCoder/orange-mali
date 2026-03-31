# Orange Mali PWA — Index des plans

**Goal:** Remplacer Google Forms par une PWA mobile-first permettant aux employés de terrain de soumettre des remontées en masse avec gestion hiérarchique des rôles.

**Architecture:** React SPA avec Supabase comme backend (Auth + PostgreSQL + Row Level Security). La saisie en masse se fait via un composant tableau (une ligne = une remontée). Les formulaires sont configurables dynamiquement par le chef sans toucher au code.

**Tech Stack:** React 19 + TypeScript + Vite, Tailwind CSS v4, shadcn/ui, Supabase (Auth + DB + RLS), Vercel, Vite PWA Plugin

---

## Plans d'implémentation

| # | Fichier | Contenu | Livrable |
|---|---------|---------|----------|
| 1 | [2026-03-24-01-setup.md](./2026-03-24-01-setup.md) | Setup & Infrastructure — Vite, Tailwind v4, shadcn/ui, client Supabase | App qui démarre + DB connectée |
| 2 | [2026-03-24-02-database.md](./2026-03-24-02-database.md) | Base de données & RLS — schéma PostgreSQL, politiques Row Level Security, types TypeScript | Tables sécurisées |
| 3 | [2026-03-24-03-auth.md](./2026-03-24-03-auth.md) | Authentification — connexion par numéro de téléphone, routing protégé | Connexion par téléphone |
| 4 | [2026-03-24-04-bulk-entry.md](./2026-03-24-04-bulk-entry.md) | Saisie en masse — contexte profil, hook useSubmission, tableau de saisie BulkEntryTable | **Core feature** — tableau de saisie |
| 5 | [2026-03-24-05-dashboards.md](./2026-03-24-05-dashboards.md) | Dashboards — layout, EmployeeDashboard, SupervisorDashboard, DashboardRouter par rôle | Vues par rôle |
| 6 | [2026-03-24-06-admin.md](./2026-03-24-06-admin.md) | Gestion utilisateurs & Form Builder — CRUD utilisateurs, form builder drag-and-drop, Edge Function création compte | Gestion utilisateurs + formulaires |
| 7 | [2026-03-24-07-deploy.md](./2026-03-24-07-deploy.md) | Export & Deploy — export CSV, déploiement Vercel | App en production ✅ |
| 8 | [2026-03-25-form-fields-advanced.md](./2026-03-25-form-fields-advanced.md) | Champs avancés — multiselect + champs conditionnels | Formulaires enrichis ✅ |
| 9 | [2026-03-31-historique-equipe.md](./2026-03-31-historique-equipe.md) | Historique soumissions + détail + vue équipe superviseur | Consultation complète |

---

## Ordre d'exécution

Chaque plan doit être complété dans l'ordre. Chaque fichier indique son prérequis et le plan suivant.

```
01-setup → 02-database → 03-auth → 04-bulk-entry → 05-dashboards → 06-admin → 07-deploy → 08-form-fields-advanced → 09-historique-equipe
```
