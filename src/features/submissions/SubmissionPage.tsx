import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/contexts/ProfileContext'
import { useSubmission } from './useSubmission'
import { BulkEntryTable } from './BulkEntryTable'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { Tables } from '@/lib/database.types'

type FormField = Tables<'form_fields'>

export function SubmissionPage() {
  const { formId } = useParams<{ formId: string }>()
  const profile = useProfile()
  const navigate = useNavigate()
  const [fields, setFields] = useState<FormField[]>([])
  const [formName, setFormName] = useState('')
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const { rows, addRow, addRows, updateCell, removeRow, saveDraft, submit, saving } = useSubmission(
    formId!,
    profile?.id!
  )

  useEffect(() => {
    if (!formId) return
    supabase.from('forms').select('nom').eq('id', formId).single()
      .then(({ data }) => setFormName(data?.nom ?? ''))
    supabase.from('form_fields').select('*').eq('form_id', formId).order('ordre')
      .then(({ data }) => setFields(data ?? []))
  }, [formId])

  async function handleSave() {
    try {
      const id = await saveDraft()
      setSubmissionId(id)
      toast.success('Brouillon sauvegardé')
    } catch {
      toast.error('Erreur de sauvegarde')
    }
  }

  async function handleSubmit() {
    try {
      let id = submissionId
      if (!id) id = await saveDraft()
      await submit(id)
      setSubmitted(true)
      toast.success('Remontée soumise avec succès !')
    } catch {
      toast.error('Erreur lors de la soumission')
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <div className="text-green-500 text-5xl">✓</div>
        <h2 className="text-xl font-bold">Remontée soumise !</h2>
        <p className="text-gray-500 text-sm">Votre superviseur recevra votre rapport.</p>
        <Button onClick={() => navigate('/')} className="bg-orange-500 hover:bg-orange-600">
          Retour à l'accueil
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold">{formName}</h1>
      </div>
      <BulkEntryTable
        fields={fields}
        rows={rows}
        onUpdate={updateCell}
        onAddRow={addRow}
        onAddRows={addRows}
        onRemoveRow={removeRow}
        onSave={handleSave}
        onSubmit={handleSubmit}
        saving={saving}
      />
    </div>
  )
}
