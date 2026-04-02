# Corrections — Rôles, Scope Superviseur & Redirect — Chunk 10

**Goal:** Corriger trois problèmes identifiés après le déploiement du Chunk 9.

**Problèmes résolus :**
1. Routes admin accessibles à tous les utilisateurs connectés (pas de guard de rôle)
2. SupervisorDashboard et HistoryPage chargeaient **toutes** les soumissions (pas de filtre par équipe)
3. `ChangePasswordPage` ne redirige pas après changement de mot de passe (profil non rafraîchi dans le contexte)

---

## Fichiers impactés

| Fichier | Action | Rôle |
|---|---|---|
| `src/contexts/ProfileContext.tsx` | Modifier | Exporter `refreshProfile` + `useRefreshProfile` |
| `src/features/auth/ChangePasswordPage.tsx` | Modifier | Appeler `refreshProfile` avant `navigate('/')` |
| `src/App.tsx` | Modifier | Ajouter prop `roles` à `ProtectedRoute`, protéger routes admin |
| `src/features/dashboard/SupervisorDashboard.tsx` | Modifier | Filtrer soumissions par employés (`parent_id`) |
| `src/features/submissions/HistoryPage.tsx` | Modifier | Filtrer soumissions superviseur via `.in('user_id', employeeIds)` |

---

## Task 1: Refresh profil après changement de mot de passe

**Symptôme :** Après avoir soumis le nouveau mot de passe, la page ne change pas. L'utilisateur doit actualiser manuellement.

**Cause :** `ProfileContext` ne charge le profil que lors d'un changement de `user` (état Supabase Auth). Après `supabase.from('profiles').update({ must_change_password: false })`, le state React reste avec l'ancienne valeur `must_change_password: true`. Donc `ProtectedRoute` re-rend `ChangePasswordPage` au lieu de laisser passer.

### Fix

- [x] **Step 1: Ajouter `refreshProfile` dans `ProfileContext`**

Extraire la logique de chargement dans une fonction `loadProfile`, l'exposer via `refreshProfile` dans le contexte et `useRefreshProfile` hook :

```tsx
interface ProfileContextValue {
  profile: Profile | null
  profileLoaded: boolean
  refreshProfile: () => Promise<void>
}

// Dans ProfileProvider :
async function loadProfile(userId: string) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  setProfile(data)
  setProfileLoaded(true)
}

async function refreshProfile() {
  if (!user) return
  await loadProfile(user.id)
}

export const useRefreshProfile = () => useContext(ProfileContext).refreshProfile
```

- [x] **Step 2: Utiliser `refreshProfile` dans `ChangePasswordPage`**

```tsx
import { useProfile, useRefreshProfile } from '@/contexts/ProfileContext'

const refreshProfile = useRefreshProfile()

// Dans handleSubmit, après la mise à jour :
await supabase.from('profiles').update({ must_change_password: false }).eq('id', profile!.id)
await refreshProfile()
navigate('/')
```

---

## Task 2: Protection des routes admin par rôle

**Symptôme :** Un superviseur ou employé peut accéder à `/users`, `/forms`, `/forms/new`, `/forms/:formId/edit` en tapant l'URL directement.

**Fix**

- [x] **Ajouter prop `roles` à `ProtectedRoute` dans `src/App.tsx`**

```tsx
function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  // ...
  if (roles && profile && !roles.includes(profile.role)) return <Navigate to="/" replace />
  return <>{children}</>
}
```

- [x] **Protéger les routes admin avec `roles={['chef', 'sous_chef']}`**

```tsx
<Route path="/users" element={
  <ProtectedRoute roles={['chef', 'sous_chef']}>
    <Layout><UsersPage /></Layout>
  </ProtectedRoute>
} />
// idem pour /forms, /forms/new, /forms/:formId/edit
```

---

## Task 3: Scope superviseur — soumissions de ses employés uniquement

**Symptôme :** Le dashboard et l'historique d'un superviseur affichent toutes les soumissions de tous les employés.

**Cause :**
- `SupervisorDashboard` : aucun filtre `user_id`
- `HistoryPage` : filtre `.eq('profiles.parent_id', profile.id)` — filtrage sur table jointe non supporté par le SDK Supabase JS

**Fix — pattern correct :**
Récupérer d'abord les IDs des employés, puis filtrer avec `.in('user_id', ids)`.

- [x] **SupervisorDashboard**

```tsx
supabase.from('profiles').select('id').eq('parent_id', profile.id)
  .then(({ data: employees }) => {
    const ids = (employees ?? []).map(e => e.id)
    if (ids.length === 0) { setLoading(false); return }
    supabase.from('submissions')
      .select('...')
      .in('user_id', ids)
      // ...
  })
```

- [x] **HistoryPage**

Ajouter un state `employeeIds: string[] | null` (null = pas de filtre pour chef/sous_chef) :

```tsx
const [employeeIds, setEmployeeIds] = useState<string[] | null>(null)

useEffect(() => {
  if (!profile) return
  if (profile.role === 'superviseur') {
    supabase.from('profiles').select('id').eq('parent_id', profile.id)
      .then(({ data }) => setEmployeeIds((data ?? []).map(e => e.id)))
  } else {
    setEmployeeIds(null) // chef/sous_chef voient tout
  }
}, [profile])

// Dans l'effet de chargement des soumissions :
if (profile.role === 'superviseur' && employeeIds === null) return // attend la liste
if (employeeIds !== null) {
  if (employeeIds.length === 0) { setSubmissions([]); setLoading(false); return }
  query = query.in('user_id', employeeIds)
}
```

---

## Règles établies par ces corrections

- **Ne jamais filtrer sur une table jointe** avec `.eq('joined_table.column', value)` dans Supabase JS — ça ne fonctionne pas. Toujours faire une requête séparée pour obtenir les IDs, puis `.in('id_column', ids)`.
- **Toujours `refreshProfile()`** après toute mise à jour de `profiles` qui affecte le routing (ex: `must_change_password`, `role`).
- **Guards de rôle au niveau route** via `ProtectedRoute roles={[...]}` — ne pas se fier uniquement à l'absence de liens dans le UI.

---

## Suivant

Retour utilisateur terrain pour valider les workflows actuels avant d'ajouter des fonctionnalités supplémentaires (notifications, graphiques, etc.).
