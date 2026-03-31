# Advanced Form Fields Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Ajouter les types de champs multi-sélection et les champs conditionnels (affichés selon la valeur d'un autre champ) dans le Form Builder et le tableau de saisie en masse.

**Architecture:** Deux tâches indépendantes sur les mêmes fichiers. Le multi-select ajoute un type `multiselect` stockant les valeurs séparées par `|` dans `row_values.valeur`. Les champs conditionnels nécessitent une migration SQL (colonne `condition jsonb` sur `form_fields`) et une évaluation par ligne dans `BulkEntryTable`.

**Tech Stack:** React 19 + TypeScript, Supabase PostgreSQL, shadcn/ui, @dnd-kit/sortable

---

## Prérequis

Compléter [Chunk 7: Export & Deploy](./2026-03-24-07-deploy.md) en premier.

---

## Fichiers impactés

| Fichier | Action | Rôle |
|---|---|---|
| `supabase/migrations/004_condition_field.sql` | Créer | Ajoute colonne `condition jsonb` à `form_fields` |
| `src/lib/database.types.ts` | Régénérer | Reflète la nouvelle colonne |
| `src/features/admin/FieldEditor.tsx` | Modifier | UI multiselect + builder de condition |
| `src/features/submissions/BulkEntryTable.tsx` | Modifier | Rendu multiselect + masquage conditionnel par ligne |

---

## Task 1: Champ multi-sélection (multiselect)

**Files:**
- Modify: `src/features/admin/FieldEditor.tsx`
- Modify: `src/features/submissions/BulkEntryTable.tsx`

### Comportement attendu
- Dans le FormBuilder : type `multiselect` avec les mêmes options qu'un `select` (liste de valeurs)
- Dans le tableau de saisie : affiche des checkboxes pour chaque option ; les valeurs cochées sont stockées séparées par `|` dans `row_values.valeur` (ex: `"Rouge|Bleu"`)
- Dans le dashboard superviseur : les valeurs s'affichent telles quelles (ex: `"Rouge|Bleu"`)

- [x] **Step 1: Ajouter `multiselect` à la liste des types dans `FieldEditor.tsx`**

Fichier : `src/features/admin/FieldEditor.tsx`

Trouver `const FIELD_TYPES` et ajouter l'entrée :

```ts
const FIELD_TYPES = [
  { value: 'text', label: 'Texte' },
  { value: 'tel', label: 'Téléphone' },
  { value: 'number', label: 'Nombre' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Liste déroulante (choix unique)' },
  { value: 'multiselect', label: 'Cases à cocher (choix multiple)' },
]
```

- [x] **Step 2: Afficher le textarea d'options pour `multiselect` aussi**

Dans `FieldEditor.tsx`, la condition qui affiche le textarea d'options est actuellement :
```tsx
{field.type === 'select' && (
```
La changer en :
```tsx
{(field.type === 'select' || field.type === 'multiselect') && (
```

- [x] **Step 3: Ajouter le rendu multiselect dans `BulkEntryTable.tsx`**

Dans `BulkEntryTable.tsx`, dans le bloc qui rend chaque cellule, après le bloc `select` et avant le bloc `Input` par défaut :

```tsx
) : f.type === 'multiselect' && Array.isArray(f.options) ? (
  <div className="flex flex-col gap-1 py-1 min-w-40">
    {(f.options as string[]).map(opt => {
      const current = (row[f.id ?? ''] ?? '').split('|').filter(Boolean)
      const checked = current.includes(opt)
      return (
        <label key={opt} className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={() => {
              const next = checked
                ? current.filter(v => v !== opt)
                : [...current, opt]
              onUpdate(i, f.id ?? '', next.join('|'))
            }}
          />
          {opt}
        </label>
      )
    })}
  </div>
```

Placer ce bloc entre le bloc `select` et le bloc `Input` par défaut. La structure complète devient :

```tsx
{f.type === 'select' && Array.isArray(f.options) ? (
  <Select ...>...</Select>
) : f.type === 'multiselect' && Array.isArray(f.options) ? (
  <div className="flex flex-col gap-1 py-1 min-w-40">
    {(f.options as string[]).map(opt => {
      const current = (row[f.id ?? ''] ?? '').split('|').filter(Boolean)
      const checked = current.includes(opt)
      return (
        <label key={opt} className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={() => {
              const next = checked
                ? current.filter(v => v !== opt)
                : [...current, opt]
              onUpdate(i, f.id ?? '', next.join('|'))
            }}
          />
          {opt}
        </label>
      )
    })}
  </div>
) : (
  <Input type={...} ... />
)}
```

- [x] **Step 4: Vérifier visuellement**

1. Aller dans `/forms`, créer un formulaire avec un champ "Produits" de type "Cases à cocher"
2. Ajouter les options : `Orange Money`, `Wave`, `Moov`
3. Enregistrer, puis ouvrir le formulaire en tant qu'employé
4. Vérifier que les checkboxes s'affichent et que plusieurs peuvent être cochées
5. Soumettre — vérifier dans Supabase que `row_values.valeur` contient `"Orange Money|Wave"` (exemple)

- [x] **Step 5: Commit**

```bash
git add src/features/admin/FieldEditor.tsx src/features/submissions/BulkEntryTable.tsx
git commit -m "feat: multiselect field type with pipe-separated storage"
```

---

## Task 2: Champs conditionnels

**Files:**
- Create: `supabase/migrations/004_condition_field.sql`
- Modify: `src/lib/database.types.ts` (régénérer)
- Modify: `src/features/admin/FieldEditor.tsx`
- Modify: `src/features/submissions/BulkEntryTable.tsx`

### Comportement attendu
- Dans le FormBuilder : une case "Afficher ce champ uniquement si..." permet de choisir un champ source et une valeur déclenchante
- La condition est stockée en base : `condition = { "fieldId": "uuid-du-champ-source", "value": "valeur-attendue" }`
- Dans le tableau de saisie : si un champ a une condition, sa colonne est masquée pour les lignes où la condition n'est pas remplie
- La valeur est effacée automatiquement si le champ devient masqué (évite de soumettre des données fantômes)

### Limitation de scope (YAGNI)
- Une seule condition par champ (pas de ET/OU)
- Opérateur unique : égalité (`=`)
- La condition ne peut porter que sur un champ de type `select` ou `multiselect` (valeurs prévisibles)

- [x] **Step 1: Migration SQL**

Créer `supabase/migrations/004_condition_field.sql` :

```sql
alter table form_fields add column if not exists condition jsonb;
```

Appliquer dans le dashboard Supabase (SQL Editor) ou via CLI :
```bash
pnpm dlx supabase db push --project-ref ibnscabashixestseais
```

- [x] **Step 2: Régénérer les types TypeScript**

```bash
pnpm dlx supabase gen types typescript --project-id ibnscabashixestseais > src/lib/database.types.ts
```

Vérifier que `form_fields.Row` contient maintenant `condition: Json | null`.

- [x] **Step 3: Ajouter le type `FieldCondition` et mettre à jour le type local**

Dans `FieldEditor.tsx`, ajouter en haut du fichier (après les imports) :

```ts
interface FieldCondition {
  fieldId: string
  value: string
}
```

- [x] **Step 4: Ajouter l'UI de condition dans `FieldEditor.tsx`**

Le composant `FieldEditor` reçoit déjà `field` et `onUpdate`. Il faut aussi lui passer la liste de tous les champs du formulaire pour pouvoir choisir le champ source.

**Modifier l'interface `Props` dans `FieldEditor.tsx` :**

```ts
interface Props {
  field: Field
  allFields: Field[]          // ← nouveau
  onUpdate: (id: string, updates: Partial<Field>) => void
  onRemove: (id: string) => void
}
```

**Ajouter l'UI de condition après la checkbox "obligatoire" :**

```tsx
{/* Condition */}
{(() => {
  const condition = field.condition as FieldCondition | null
  const triggerFields = allFields.filter(
    f => f.id !== field.id && (f.type === 'select' || f.type === 'multiselect')
  )
  if (triggerFields.length === 0) return null
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
        <input
          type="checkbox"
          checked={!!condition}
          onChange={e => onUpdate(field.id, {
            condition: e.target.checked
              ? { fieldId: triggerFields[0].id, value: '' }
              : null
          } as any)}
        />
        Afficher uniquement si...
      </label>
      {condition && (
        <div className="flex gap-2 items-center pl-4">
          <Select
            value={condition.fieldId}
            onValueChange={v => onUpdate(field.id, { condition: { ...condition, fieldId: v } } as any)}
          >
            <SelectTrigger className="h-7 text-xs w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {triggerFields.map(f => (
                <SelectItem key={f.id} value={f.id}>{f.label || '(sans label)'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-gray-400">=</span>
          <Input
            className="h-7 text-xs w-32"
            placeholder="valeur"
            value={condition.value}
            onChange={e => onUpdate(field.id, { condition: { ...condition, value: e.target.value } } as any)}
          />
        </div>
      )}
    </div>
  )
})()}
```

- [x] **Step 5: Passer `allFields` depuis `FormBuilder.tsx`**

Dans `FormBuilder.tsx`, le rendu de `FieldEditor` devient :

```tsx
{fields.map(field => (
  <FieldEditor
    key={field.id}
    field={field}
    allFields={fields}        // ← ajouter
    onUpdate={updateField}
    onRemove={removeField}
  />
))}
```

- [x] **Step 6: Sauvegarder la condition dans `FormBuilder.tsx`**

Dans la fonction `save()`, les champs sont upsertés avec `fieldsToUpsert`. Ajouter `condition` à chaque champ :

```ts
const fieldsToUpsert = fields.map((f, i) => ({
  id: f._new ? undefined : f.id,
  form_id: id,
  label: f.label,
  type: f.type,
  requis: f.requis,
  options: f.options,
  condition: (f.condition as any) ?? null,   // ← ajouter
  ordre: i,
}))
```

- [x] **Step 7: Évaluer les conditions dans `BulkEntryTable.tsx`**

Ajouter une fonction utilitaire en haut du composant (avant le `return`) :

```ts
function isVisible(field: FormField, row: RowData): boolean {
  const condition = field.condition as { fieldId: string; value: string } | null
  if (!condition || !condition.fieldId || !condition.value) return true
  const sourceValue = row[condition.fieldId] ?? ''
  // Pour multiselect, vérifier si la valeur fait partie des sélectionnées
  return sourceValue === condition.value || sourceValue.split('|').includes(condition.value)
}
```

**Masquer les colonnes invisibles dans le `<thead>` :**

```tsx
{ordered.map(f => (
  <th key={f.id} className={`px-3 py-2 text-left font-medium whitespace-nowrap ${f.condition ? 'bg-blue-50' : ''}`}>
    {f.label}
    {f.requis && <span className="text-red-500 ml-1">*</span>}
  </th>
))}
```

Note: les colonnes conditionnelles restent visibles dans le header (pour que le tableau reste stable) mais les cellules sont masquées ou vides selon la condition.

**Dans chaque ligne, masquer la cellule si la condition n'est pas remplie :**

```tsx
{ordered.map(f => {
  const visible = isVisible(f, row)
  return (
    <td key={f.id} className="px-1 py-1">
      {!visible ? (
        <div className="h-8 min-w-20 bg-gray-50 rounded border border-dashed border-gray-200" />
      ) : f.type === 'select' ... }
    </td>
  )
})}
```

**Effacer la valeur quand le champ devient invisible** — dans le `onChange` des champs source (select/multiselect), après `onUpdate`, vérifier si des champs conditionnels dépendants deviennent invisibles et effacer leur valeur :

Cette logique est dans `useSubmission.ts` → fonction `updateCell`. Ajouter après la mise à jour de la valeur :

```ts
// Effacer les champs conditionnels qui ne sont plus visibles
// (appelé depuis BulkEntryTable via un callback optionnel onClearConditional)
```

Pour simplifier, passer un callback `onClearConditionals` optionnel à `BulkEntryTable` qui sera appelé lors d'un changement de champ source :

```ts
// Dans BulkEntryTable, dans le onChange d'un select/multiselect :
onUpdate(i, f.id ?? '', v)
// Effacer les dépendants
fields.forEach(dep => {
  const cond = dep.condition as { fieldId: string; value: string } | null
  if (cond?.fieldId === f.id) {
    const newVal = v
    const stillVisible = newVal === cond.value || newVal.split('|').includes(cond.value)
    if (!stillVisible) onUpdate(i, dep.id, '')
  }
})
```

Appliquer la même logique dans le onChange de multiselect.

- [x] **Step 8: Vérifier visuellement**

1. Créer un formulaire avec :
   - Champ "Produit" (select) : options `Orange Money`, `Wave`
   - Champ "Référence transaction" (text) : condition "Afficher si Produit = Orange Money"
2. Dans le tableau de saisie :
   - Ligne 1 : sélectionner "Orange Money" → le champ "Référence transaction" apparaît
   - Ligne 2 : sélectionner "Wave" → le champ "Référence transaction" reste grisé
3. Soumettre et vérifier en base que la valeur grisée est vide

- [x] **Step 9: Commit**

```bash
git add supabase/migrations/004_condition_field.sql src/lib/database.types.ts \
        src/features/admin/FieldEditor.tsx src/features/admin/FormBuilder.tsx \
        src/features/submissions/BulkEntryTable.tsx
git commit -m "feat: conditional fields — show/hide based on another field value"
```

---

## Suivant

Ces deux fonctionnalités sont indépendantes et peuvent être implémentées dans n'importe quel ordre après le Chunk 7.
