import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export function ExportButton({ formId, formName }: { formId: string; formName: string }) {
  async function handleExport() {
    const { data: fields } = await supabase
      .from('form_fields').select('*').eq('form_id', formId).order('ordre')
    const { data: submissions } = await supabase
      .from('submissions')
      .select('*, profiles(first_name, last_name, telephone), submission_rows(*, row_values(*))')
      .eq('form_id', formId)

    if (!fields || !submissions) return

    const headers = ['Employé', 'Téléphone', 'Date', 'Statut', ...fields.map(f => f.label)]
    const rows = submissions.flatMap(s =>
      ((s as any).submission_rows ?? []).map((row: any) => {
        const values = fields.map(f => {
          const v = row.row_values?.find((rv: any) => rv.field_id === f.id)
          return v?.valeur ?? ''
        })
        const p = (s as any).profiles
        return [
          p ? `${p.first_name} ${p.last_name}` : '',
          p?.telephone ?? '',
          new Date(s.created_at!).toLocaleDateString('fr-FR'),
          s.statut,
          ...values,
        ]
      })
    )

    const csv = [headers, ...rows].map(r => r.map((cell: unknown) => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${formName}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="w-4 h-4 mr-2" /> Exporter CSV
    </Button>
  )
}
