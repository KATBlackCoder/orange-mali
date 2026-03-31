import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { GripVertical, Trash2 } from 'lucide-react'
import type { Tables } from '@/lib/database.types'

type Field = Tables<'form_fields'>

interface FieldCondition {
  fieldId: string
  value: string
}

const FIELD_TYPES = [
  { value: 'text', label: 'Texte' },
  { value: 'tel', label: 'Téléphone' },
  { value: 'number', label: 'Nombre' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Liste déroulante (choix unique)' },
  { value: 'multiselect', label: 'Cases à cocher (choix multiple)' },
]

interface Props {
  field: Field
  allFields: Field[]
  onUpdate: (id: string, updates: Partial<Field>) => void
  onRemove: (id: string) => void
}

export function FieldEditor({ field, allFields, onUpdate, onRemove }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const options = Array.isArray(field.options) ? (field.options as string[]) : []

  return (
    <div ref={setNodeRef} style={style}
      className="bg-white border rounded-md p-3 flex gap-2 items-start">
      <button {...attributes} {...listeners}
        className="mt-2 text-gray-300 hover:text-gray-500 cursor-grab touch-none">
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <Input
            className="flex-1"
            placeholder="Label du champ"
            value={field.label}
            onChange={e => onUpdate(field.id, { label: e.target.value })}
          />
          <Select value={field.type} onValueChange={v => onUpdate(field.id, { type: v as string })}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {(field.type === 'select' || field.type === 'multiselect') && (
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Options (une par ligne)</p>
            <textarea
              className="w-full text-sm border rounded px-2 py-1 min-h-15 resize-y"
              value={options.join('\n')}
              onChange={e => onUpdate(field.id, { options: e.target.value.split('\n').filter(Boolean) as string[] })}
              placeholder="Option 1&#10;Option 2&#10;Option 3"
            />
          </div>
        )}

        <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
          <input type="checkbox" checked={field.requis ?? false}
            onChange={e => onUpdate(field.id, { requis: e.target.checked })} />
          Champ obligatoire
        </label>

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
                  } as Partial<Field>)}
                />
                Afficher uniquement si...
              </label>
              {condition && (
                <div className="flex gap-2 items-center pl-4">
                  <Select
                    value={condition.fieldId}
                    onValueChange={v => onUpdate(field.id, { condition: { ...condition, fieldId: v } } as Partial<Field>)}
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
                    onChange={e => onUpdate(field.id, { condition: { ...condition, value: e.target.value } } as Partial<Field>)}
                  />
                </div>
              )}
            </div>
          )
        })()}
      </div>

      <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 h-8 w-8 mt-1"
        onClick={() => onRemove(field.id)}>
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}
