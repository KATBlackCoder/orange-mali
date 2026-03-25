import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, ArrowLeft } from 'lucide-react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { FieldEditor } from './FieldEditor'
import type { Tables } from '@/lib/database.types'

type Field = Tables<'form_fields'> & { _new?: boolean }

export function FormBuilder() {
  const { formId } = useParams<{ formId?: string }>()
  const navigate = useNavigate()
  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [actif, setActif] = useState(true)
  const [fields, setFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(!!formId)
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor))

  useEffect(() => {
    if (!formId) return
    Promise.all([
      supabase.from('forms').select('*').eq('id', formId).single(),
      supabase.from('form_fields').select('*').eq('form_id', formId).order('ordre'),
    ]).then(([{ data: form }, { data: fieldsData }]) => {
      if (form) { setNom(form.nom); setDescription(form.description ?? ''); setActif(form.actif ?? true) }
      if (fieldsData) setFields(fieldsData)
      setLoading(false)
    })
  }, [formId])

  function addField() {
    const newField: Field = {
      id: crypto.randomUUID(),
      form_id: formId ?? null,
      label: '',
      type: 'text',
      requis: false,
      options: null,
      ordre: fields.length,
      created_at: null,
      _new: true,
    }
    setFields(prev => [...prev, newField])
  }

  function updateField(id: string, updates: Partial<Field>) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  function removeField(id: string) {
    setFields(prev => prev.filter(f => f.id !== id))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setFields(prev => {
      const oldIndex = prev.findIndex(f => f.id === active.id)
      const newIndex = prev.findIndex(f => f.id === over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  async function save() {
    if (!nom.trim()) { toast.error('Nom du formulaire requis'); return }
    setSaving(true)

    let id = formId
    if (!id) {
      const { data, error } = await supabase.from('forms').insert({ nom, description: description || null, actif }).select().single()
      if (error) { toast.error(error.message); setSaving(false); return }
      id = data.id
    } else {
      await supabase.from('forms').update({ nom, description: description || null, actif }).eq('id', id)
    }

    // Sync fields: delete removed, upsert remaining
    if (formId) {
      await supabase.from('form_fields').delete().eq('form_id', id!).not('id', 'in', `(${fields.map(f => `'${f.id}'`).join(',')})`)
    }

    const fieldsToUpsert = fields.map((f, i) => ({
      id: f._new ? undefined : f.id,
      form_id: id,
      label: f.label,
      type: f.type,
      requis: f.requis,
      options: f.options,
      ordre: i,
    }))

    if (fieldsToUpsert.length > 0) {
      const { error } = await supabase.from('form_fields').upsert(
        fieldsToUpsert.map(f => ({ ...f, id: f.id ?? crypto.randomUUID() }))
      )
      if (error) { toast.error(error.message); setSaving(false); return }
    }

    toast.success(formId ? 'Formulaire mis à jour' : 'Formulaire créé')
    navigate('/forms')
  }

  if (loading) return <div className="p-4 text-gray-500">Chargement...</div>

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/forms')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-bold">{formId ? 'Modifier le formulaire' : 'Nouveau formulaire'}</h2>
      </div>

      <div className="bg-white border rounded-md p-4 space-y-3">
        <div className="space-y-1">
          <Label>Nom du formulaire</Label>
          <Input value={nom} onChange={e => setNom(e.target.value)} placeholder="ex: Remontée journalière" required />
        </div>
        <div className="space-y-1">
          <Label>Description <span className="text-gray-400 text-xs">(optionnel)</span></Label>
          <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Instructions..." />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="actif" checked={actif} onChange={e => setActif(e.target.checked)} className="rounded" />
          <Label htmlFor="actif" className="cursor-pointer">Formulaire actif (visible par les employés)</Label>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm text-gray-700">Champs</h3>
          <Button size="sm" variant="outline" onClick={addField}>
            <Plus className="w-4 h-4 mr-1" /> Ajouter un champ
          </Button>
        </div>

        {fields.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6 border rounded-md bg-white">
            Aucun champ. Cliquez sur "Ajouter un champ".
          </p>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
            {fields.map(field => (
              <FieldEditor key={field.id} field={field} onUpdate={updateField} onRemove={removeField} />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={save} disabled={saving}>
        {saving ? 'Enregistrement...' : 'Enregistrer le formulaire'}
      </Button>
    </div>
  )
}
