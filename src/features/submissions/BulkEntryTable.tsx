import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2 } from 'lucide-react'
import type { Tables } from '@/lib/database.types'
import type { RowData } from './useSubmission'

type FormField = Omit<Tables<'form_fields'>, 'id'> & { id: string }

interface Props {
  fields: Tables<'form_fields'>[]
  rows: RowData[]
  onUpdate: (rowIndex: number, fieldId: string, value: string) => void
  onAddRow: () => void
  onAddRows: (n: number) => void
  onRemoveRow: (rowIndex: number) => void
  onSave: () => void
  onSubmit: () => void
  saving: boolean
}

const sortedFields = (fields: FormField[]) => [...fields].sort((a, b) => a.ordre - b.ordre)

function isVisible(field: FormField, row: RowData): boolean {
  const condition = field.condition as { fieldId: string; value: string } | null
  if (!condition || !condition.fieldId || !condition.value) return true
  const sourceValue = row[condition.fieldId] ?? ''
  return sourceValue === condition.value || sourceValue.split('|').includes(condition.value)
}

export function BulkEntryTable({ fields, rows, onUpdate, onAddRow, onAddRows, onRemoveRow, onSave, onSubmit, saving }: Props) {
  const [bulkCount, setBulkCount] = useState(10)
  const ordered = sortedFields(fields)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={onAddRow}>
          <Plus className="w-4 h-4 mr-1" /> Ajouter 1 ligne
        </Button>
        <div className="flex items-center gap-1">
          <Input
            type="number" min={1} max={200}
            value={bulkCount}
            onChange={e => setBulkCount(Number(e.target.value))}
            className="w-20 h-8"
          />
          <Button variant="outline" size="sm" onClick={() => onAddRows(bulkCount)}>
            + {bulkCount} lignes
          </Button>
        </div>
        <Badge variant="secondary">{rows.length} ligne{rows.length > 1 ? 's' : ''}</Badge>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-8 px-2 py-2 text-left text-gray-500 font-normal">#</th>
              {ordered.map(f => (
                <th key={f.id} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                  {f.label}
                  {f.requis && <span className="text-red-500 ml-1">*</span>}
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="px-2 py-1 text-gray-400 text-xs">{i + 1}</td>
                {ordered.map(f => {
                  const visible = isVisible(f, row)
                  return (
                  <td key={f.id} className="px-1 py-1">
                    {!visible ? (
                      <div className="h-8 min-w-20 rounded border border-dashed border-gray-200 bg-gray-50" />
                    ) : f.type === 'select' && Array.isArray(f.options) ? (
                      <Select value={row[f.id ?? ''] ?? ''} onValueChange={v => {
                        onUpdate(i, f.id ?? '', v as string)
                        ordered.forEach(dep => {
                          const cond = dep.condition as { fieldId: string; value: string } | null
                          if (cond?.fieldId === f.id) {
                            const stillVisible = v === cond.value
                            if (!stillVisible) onUpdate(i, dep.id, '')
                          }
                        })
                      }}>
                        <SelectTrigger className="h-8 min-w-30">
                          <SelectValue placeholder="Choisir..." />
                        </SelectTrigger>
                        <SelectContent>
                          {(f.options as string[]).map(opt => (
                            <SelectItem key={opt} value={opt ?? ''}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                                  const joined = next.join('|')
                                  onUpdate(i, f.id ?? '', joined)
                                  ordered.forEach(dep => {
                                    const cond = dep.condition as { fieldId: string; value: string } | null
                                    if (cond?.fieldId === f.id) {
                                      const stillVisible = next.includes(cond.value)
                                      if (!stillVisible) onUpdate(i, dep.id, '')
                                    }
                                  })
                                }}
                              />
                              {opt}
                            </label>
                          )
                        })}
                      </div>
                    ) : (
                      <Input
                        type={f.type === 'number' ? 'number' : f.type === 'tel' ? 'tel' : f.type === 'date' ? 'date' : 'text'}
                        value={row[f.id ?? ''] ?? ''}
                        onChange={e => onUpdate(i, f.id ?? '', e.target.value)}
                        className="h-8 min-w-35"
                        placeholder={f.label}
                      />
                    )}
                  </td>
                  )
                })}
                <td className="px-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500"
                    onClick={() => onRemoveRow(i)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onSave} disabled={saving}>
          {saving ? 'Sauvegarde...' : 'Sauvegarder brouillon'}
        </Button>
        <Button className="bg-orange-500 hover:bg-orange-600" onClick={onSubmit} disabled={saving}>
          Soumettre
        </Button>
      </div>
    </div>
  )
}
