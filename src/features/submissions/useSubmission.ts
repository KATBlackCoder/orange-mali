import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export type RowData = Record<string, string> // field_id → valeur

export function useSubmission(formId: string, userId: string) {
  const [rows, setRows] = useState<RowData[]>([{}])
  const [saving, setSaving] = useState(false)

  function addRow() {
    setRows(prev => [...prev, {}])
  }

  function addRows(n: number) {
    setRows(prev => [...prev, ...Array(n).fill({})])
  }

  function updateCell(rowIndex: number, fieldId: string, value: string) {
    setRows(prev => prev.map((row, i) =>
      i === rowIndex ? { ...row, [fieldId]: value } : row
    ))
  }

  function removeRow(rowIndex: number) {
    setRows(prev => prev.filter((_, i) => i !== rowIndex))
  }

  async function saveDraft(): Promise<string> {
    setSaving(true)
    const { data: sub, error } = await supabase
      .from('submissions')
      .insert({ form_id: formId, user_id: userId, statut: 'brouillon' })
      .select().single()
    if (error || !sub) { setSaving(false); throw error }

    for (let i = 0; i < rows.length; i++) {
      const { data: row } = await supabase
        .from('submission_rows')
        .insert({ submission_id: sub.id, ordre: i })
        .select().single()
      if (!row) continue
      const values = Object.entries(rows[i]).map(([field_id, valeur]) => ({
        row_id: row.id, field_id, valeur
      }))
      if (values.length) await supabase.from('row_values').insert(values)
    }
    setSaving(false)
    return sub.id
  }

  async function submitSubmission(submissionId: string) {
    await supabase.from('submissions')
      .update({ statut: 'soumis', updated_at: new Date().toISOString() })
      .eq('id', submissionId)
  }

  return { rows, addRow, addRows, updateCell, removeRow, saveDraft, submit: submitSubmission, saving }
}
