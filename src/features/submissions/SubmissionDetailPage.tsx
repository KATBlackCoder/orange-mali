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
