# Historique, Détail Soumission & Vue Équipe — Chunk 9

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter l'historique complet des soumissions avec filtres, une page de détail par soumission, et une vue "mes employés" pour les superviseurs.

**Architecture:** Trois fonctionnalités indépendantes sur les mêmes routes React. `HistoryPage` et `SubmissionDetailPage` sont de nouvelles pages. `MyTeamSection` est un composant inséré dans `SupervisorDashboard`. Les données viennent de Supabase directement (pas de hook partagé — chaque page gère son propre état local).

**Tech Stack:** React 19 + TypeScript, react-router-dom v7, Supabase JS v2, shadcn/ui (Select, Badge, Card), lucide-react

---

## Prérequis

Compléter [Chunk 8: Champs avancés](./2026-03-25-form-fields-advanced.md) en premier.

---

## Fichiers impactés

| Fichier | Action | Rôle |
|---|---|---|
| `src/features/submissions/HistoryPage.tsx` | Créer | Liste paginée des soumissions avec filtres date/statut/formulaire |
| `src/features/submissions/SubmissionDetailPage.tsx` | Créer | Détail d'une soumission : toutes les lignes et valeurs |
| `src/features/dashboard/MyTeamSection.tsx` | Créer | Liste des employés rattachés au superviseur connecté |
| `src/features/dashboard/SupervisorDashboard.tsx` | Modifier | Intégrer `MyTeamSection` sous la section "Traitées récemment" |
| `src/App.tsx` | Modifier | Ajouter routes `/history` et `/submissions/:id` |
| `src/components/Layout.tsx` | Modifier | Ajouter lien "Historique" visible par chef/sous_chef/superviseur |

---

## Task 1: Page historique des soumissions

**Files:**
- Create: `src/features/submissions/HistoryPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/Layout.tsx`

### Comportement attendu
- Accessible via `/history` par les rôles : `chef`, `sous_chef`, `superviseur`
- Liste toutes les soumissions (chef/sous_chef voient tout, superviseur voit uniquement ses employés)
- Filtres : formulaire (select), statut (select), date de début + date de fin
- Chaque ligne cliquable → navigue vers `/submissions/:id`
- Pagination simple : bouton "Charger plus" (50 par page)

- [ ] **Step 1: Créer `src/features/submissions/HistoryPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/contexts/ProfileContext'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Tables } from '@/lib/database.types'

const statutColors: Record<string, string> = {
  brouillon: 'bg-gray-100 text-gray-600',
  soumis: 'bg-blue-100 text-blue-700',
  valide: 'bg-green-100 text-green-700',
  rejete: 'bg-red-100 text-red-700',
}
const statutLabel: Record<string, string> = {
  brouillon: 'Brouillon', soumis: 'Soumis', valide: 'Validé', rejete: 'Rejeté',
}

export function HistoryPage() {
  const profile = useProfile()
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState<any[]>([])
  const [forms, setForms] = useState<Tables<'forms'>[]>([])
  const [loading, setLoading] = useState(true)
  const [filterForm, setFilterForm] = useState('all')
  const [filterStatut, setFilterStatut] = useState('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  useEffect(() => {
    supabase.from('forms').select('id, nom').then(({ data }) => setForms(data ?? []))
  }, [])

  useEffect(() => {
    if (!profile) return
    setLoading(true)
    let query = supabase
      .from('submissions')
      .select('id, created_at, statut, user_id, form_id, profiles(first_name, last_name, telephone), forms(nom)')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    // Superviseur : uniquement les soumissions de ses employés
    if (profile.role === 'superviseur') {
      query = query.eq('profiles.parent_id', profile.id)
    }
    if (filterForm !== 'all') query = query.eq('form_id', filterForm)
    if (filterStatut !== 'all') query = query.eq('statut', filterStatut)
    if (filterDateFrom) query = query.gte('created_at', filterDateFrom)
    if (filterDateTo) query = query.lte('created_at', filterDateTo + 'T23:59:59')

    query.then(({ data }) => {
      if (page === 0) setSubmissions(data ?? [])
      else setSubmissions(prev => [...prev, ...(data ?? [])])
      setLoading(false)
    })
  }, [profile, filterForm, filterStatut, filterDateFrom, filterDateTo, page])

  // Reset pagination when filters change
  function applyFilter(fn: () => void) { setPage(0); fn() }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h2 className="text-lg font-bold">Historique des remontées</h2>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 bg-white border rounded-md p-3">
        <Select value={filterForm} onValueChange={v => applyFilter(() => setFilterForm(v))}>
          <SelectTrigger className="h-8 w-44 text-sm"><SelectValue placeholder="Formulaire" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les formulaires</SelectItem>
            {forms.map(f => <SelectItem key={f.id} value={f.id}>{f.nom}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterStatut} onValueChange={v => applyFilter(() => setFilterStatut(v))}>
          <SelectTrigger className="h-8 w-36 text-sm"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="soumis">Soumis</SelectItem>
            <SelectItem value="valide">Validé</SelectItem>
            <SelectItem value="rejete">Rejeté</SelectItem>
            <SelectItem value="brouillon">Brouillon</SelectItem>
          </SelectContent>
        </Select>

        <Input type="date" className="h-8 w-36 text-sm"
          value={filterDateFrom}
          onChange={e => applyFilter(() => setFilterDateFrom(e.target.value))} />
        <Input type="date" className="h-8 w-36 text-sm"
          value={filterDateTo}
          onChange={e => applyFilter(() => setFilterDateTo(e.target.value))} />
      </div>

      {/* Liste */}
      {loading && page === 0 ? (
        <p className="text-gray-500 text-sm">Chargement...</p>
      ) : submissions.length === 0 ? (
        <p className="text-gray-500 text-sm">Aucune remontée trouvée.</p>
      ) : (
        <div className="divide-y border rounded-md bg-white">
          {submissions.map(s => (
            <div key={s.id}
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
              onClick={() => navigate(`/submissions/${s.id}`)}>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {s.profiles?.first_name} {s.profiles?.last_name}
                  <span className="text-gray-400 text-xs ml-2">{s.profiles?.telephone}</span>
                </p>
                <p className="text-xs text-gray-400">
                  {s.forms?.nom} · {new Date(s.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${statutColors[s.statut ?? 'brouillon']}`}>
                {statutLabel[s.statut ?? 'brouillon']}
              </span>
            </div>
          ))}
        </div>
      )}

      {submissions.length >= PAGE_SIZE * (page + 1) && (
        <Button variant="outline" className="w-full" onClick={() => setPage(p => p + 1)} disabled={loading}>
          {loading ? 'Chargement...' : 'Charger plus'}
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Ajouter la route `/history` dans `src/App.tsx`**

Ajouter l'import en haut :
```tsx
import { HistoryPage } from '@/features/submissions/HistoryPage'
```

Ajouter la route dans `AppRoutes` avant la route `/*` :
```tsx
<Route path="/history" element={
  <ProtectedRoute>
    <Layout><HistoryPage /></Layout>
  </ProtectedRoute>
} />
```

- [ ] **Step 3: Ajouter le lien "Historique" dans `src/components/Layout.tsx`**

Ajouter l'import `History` depuis `lucide-react` :
```tsx
import { LogOut, User, Users, FileText, History } from 'lucide-react'
```

Ajouter le lien après le lien "Formulaires", visible par `chef`, `sous_chef` **et** `superviseur` :
```tsx
{profile && ['chef', 'sous_chef', 'superviseur'].includes(profile.role) && (
  <Link to="/history" className="flex items-center gap-1 text-white text-sm opacity-80 hover:opacity-100">
    <History className="w-4 h-4" />
    <span className="hidden sm:inline">Historique</span>
  </Link>
)}
```

Note : le lien "Utilisateurs" et "Formulaires" reste réservé à `chef`/`sous_chef` uniquement.

- [ ] **Step 4: Vérifier visuellement**

1. Se connecter avec le compte chef → le lien "Historique" apparaît dans le header
2. Se connecter avec un superviseur → le lien "Historique" apparaît aussi
3. Se connecter avec un employé → pas de lien "Historique"
4. Vérifier que les filtres filtrent bien la liste
5. Vérifier que cliquer sur une ligne navigue vers `/submissions/:id` (page 404 pour l'instant, normal)

- [ ] **Step 5: Commit**

```bash
git add src/features/submissions/HistoryPage.tsx src/App.tsx src/components/Layout.tsx
git commit -m "feat: history page with filters for chef/sous-chef/superviseur"
```

---

## Task 2: Page détail d'une soumission

**Files:**
- Create: `src/features/submissions/SubmissionDetailPage.tsx`
- Modify: `src/App.tsx`

### Comportement attendu
- Accessible via `/submissions/:id`
- Affiche : nom de l'employé, formulaire, date, statut
- Tableau avec toutes les lignes de la soumission et leurs valeurs
- Boutons Valider / Rejeter visibles pour superviseur/chef/sous_chef si statut = `soumis`

- [ ] **Step 1: Créer `src/features/submissions/SubmissionDetailPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/contexts/ProfileContext'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { Tables } from '@/lib/database.types'

type FormField = Tables<'form_fields'>

export function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const profile = useProfile()
  const [submission, setSubmission] = useState<any>(null)
  const [fields, setFields] = useState<FormField[]>([])
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('submissions')
        .select('*, profiles(first_name, last_name, telephone), forms(nom, id)')
        .eq('id', id).single(),
      supabase.from('submission_rows')
        .select('*, row_values(*)')
        .eq('submission_id', id),
    ]).then(([{ data: sub }, { data: rowsData }]) => {
      setSubmission(sub)
      setRows(rowsData ?? [])
      if (sub?.forms?.id) {
        supabase.from('form_fields')
          .select('*').eq('form_id', sub.forms.id).order('ordre')
          .then(({ data }) => setFields(data ?? []))
      }
      setLoading(false)
    })
  }, [id])

  async function validate() {
    await supabase.from('submissions').update({ statut: 'valide' }).eq('id', id!)
    setSubmission((s: any) => ({ ...s, statut: 'valide' }))
    toast.success('Remontée validée')
  }

  async function reject() {
    await supabase.from('submissions').update({ statut: 'rejete' }).eq('id', id!)
    setSubmission((s: any) => ({ ...s, statut: 'rejete' }))
    toast.error('Remontée rejetée')
  }

  const statutColors: Record<string, string> = {
    brouillon: 'bg-gray-100 text-gray-600',
    soumis: 'bg-blue-100 text-blue-700',
    valide: 'bg-green-100 text-green-700',
    rejete: 'bg-red-100 text-red-700',
  }
  const statutLabel: Record<string, string> = {
    brouillon: 'Brouillon', soumis: 'Soumis', valide: 'Validé', rejete: 'Rejeté',
  }

  if (loading) return <div className="p-4 text-gray-500">Chargement...</div>
  if (!submission) return <div className="p-4 text-red-500">Remontée introuvable.</div>

  const canReview = ['chef', 'sous_chef', 'superviseur'].includes(profile?.role ?? '')
  const isPending = submission.statut === 'soumis'

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-bold">{submission.forms?.nom}</h2>
          <p className="text-sm text-gray-500">
            {submission.profiles?.first_name} {submission.profiles?.last_name} · {submission.profiles?.telephone} · {new Date(submission.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statutColors[submission.statut ?? 'brouillon']}`}>
          {statutLabel[submission.statut ?? 'brouillon']}
        </span>
      </div>

      {canReview && isPending && (
        <div className="flex gap-2 justify-end">
          <Button variant="outline" className="text-red-500 hover:text-red-600" onClick={reject}>
            <XCircle className="w-4 h-4 mr-1" /> Rejeter
          </Button>
          <Button className="bg-green-500 hover:bg-green-600" onClick={validate}>
            <CheckCircle className="w-4 h-4 mr-1" /> Valider
          </Button>
        </div>
      )}

      {/* Tableau des lignes */}
      {fields.length > 0 && rows.length > 0 ? (
        <div className="overflow-x-auto rounded-md border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-8 px-2 py-2 text-left text-gray-500 font-normal">#</th>
                {fields.map(f => (
                  <th key={f.id} className="px-3 py-2 text-left font-medium whitespace-nowrap">{f.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id} className="border-t">
                  <td className="px-2 py-2 text-gray-400 text-xs">{i + 1}</td>
                  {fields.map(f => {
                    const val = row.row_values?.find((rv: any) => rv.field_id === f.id)?.valeur ?? ''
                    return (
                      <td key={f.id} className="px-3 py-2 text-sm">
                        {val || <span className="text-gray-300">—</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">Aucune donnée dans cette remontée.</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Ajouter la route `/submissions/:id` dans `src/App.tsx`**

Ajouter l'import :
```tsx
import { SubmissionDetailPage } from '@/features/submissions/SubmissionDetailPage'
```

Ajouter la route avant la route `/*` :
```tsx
<Route path="/submissions/:id" element={
  <ProtectedRoute>
    <Layout><SubmissionDetailPage /></Layout>
  </ProtectedRoute>
} />
```

- [ ] **Step 3: Vérifier visuellement**

1. Aller sur `/history`, cliquer sur une remontée → page détail s'affiche
2. Vérifier que le tableau des lignes correspond aux données saisies
3. Si statut = `soumis` et connecté en chef/superviseur → boutons Valider/Rejeter visibles
4. Valider → statut passe à "Validé", boutons disparaissent
5. Bouton retour → revient à la page précédente

- [ ] **Step 4: Commit**

```bash
git add src/features/submissions/SubmissionDetailPage.tsx src/App.tsx
git commit -m "feat: submission detail page with validate/reject actions"
```

---

## Task 3: Vue "mes employés" pour superviseur

**Files:**
- Create: `src/features/dashboard/MyTeamSection.tsx`
- Modify: `src/features/dashboard/SupervisorDashboard.tsx`

### Comportement attendu
- Section affichée dans le dashboard du superviseur (sous "Traitées récemment")
- Liste les employés dont `parent_id = profile.id`
- Pour chaque employé : nom, téléphone, + indicateur "a soumis aujourd'hui" (point vert) ou "pas de remontée aujourd'hui" (point gris)
- Pas d'action — vue consultation uniquement

- [ ] **Step 1: Créer `src/features/dashboard/MyTeamSection.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/contexts/ProfileContext'
import type { Tables } from '@/lib/database.types'

type Profile = Tables<'profiles'>

export function MyTeamSection() {
  const profile = useProfile()
  const [employees, setEmployees] = useState<Profile[]>([])
  const [activeToday, setActiveToday] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return

    const today = new Date().toISOString().split('T')[0]

    Promise.all([
      supabase.from('profiles')
        .select('*')
        .eq('parent_id', profile.id)
        .eq('role', 'employe')
        .order('last_name'),
      supabase.from('submissions')
        .select('user_id')
        .gte('created_at', today + 'T00:00:00')
        .in('statut', ['soumis', 'valide']),
    ]).then(([{ data: emps }, { data: subs }]) => {
      setEmployees(emps ?? [])
      setActiveToday(new Set((subs ?? []).map(s => s.user_id).filter(Boolean) as string[]))
      setLoading(false)
    })
  }, [profile])

  if (loading) return null
  if (employees.length === 0) return null

  return (
    <div>
      <h2 className="text-lg font-bold mb-3">Mon équipe ({employees.length})</h2>
      <div className="divide-y border rounded-md bg-white">
        {employees.map(emp => (
          <div key={emp.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium">{emp.first_name} {emp.last_name}</p>
              <p className="text-xs text-gray-400">{emp.telephone}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${activeToday.has(emp.id) ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-xs text-gray-500">
                {activeToday.has(emp.id) ? "Actif aujourd'hui" : "Pas de remontée"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Intégrer `MyTeamSection` dans `src/features/dashboard/SupervisorDashboard.tsx`**

Ajouter l'import :
```tsx
import { MyTeamSection } from './MyTeamSection'
```

Ajouter le composant à la fin du JSX, après la section "Traitées récemment" :
```tsx
<MyTeamSection />
```

- [ ] **Step 3: Vérifier visuellement**

1. Se connecter avec le compte superviseur
2. Vérifier que la section "Mon équipe" apparaît avec les employés rattachés
3. Si un employé a soumis une remontée aujourd'hui → point vert + "Actif aujourd'hui"
4. Si aucun employé rattaché → section absente (pas d'erreur)

- [ ] **Step 4: Build final**

```bash
pnpm build
```

Attendu : `✓ built` sans erreur.

- [ ] **Step 5: Commit et push**

```bash
git add src/features/dashboard/MyTeamSection.tsx src/features/dashboard/SupervisorDashboard.tsx
git commit -m "feat: team overview section for superviseur dashboard"
git push
```

---

## Suivant

Ces trois fonctionnalités complètent les besoins fonctionnels de base identifiés lors de l'analyse de remplacement de Google Forms. Les graphiques (Chunk 10) restent optionnels selon le retour des utilisateurs terrain.
