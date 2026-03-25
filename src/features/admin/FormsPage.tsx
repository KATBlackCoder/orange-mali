import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/contexts/ProfileContext'
import { Button } from '@/components/ui/button'
import { Plus, Pencil } from 'lucide-react'
import { ExportButton } from './ExportButton'
import type { Tables } from '@/lib/database.types'

type Form = Tables<'forms'>

export function FormsPage() {
  const profile = useProfile()
  const navigate = useNavigate()
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)

  const canManage = profile?.role === 'chef' || profile?.role === 'sous_chef'

  useEffect(() => {
    supabase.from('forms').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setForms(data ?? []); setLoading(false) })
  }, [])

  if (!canManage) return <div className="p-4 text-gray-500 text-sm">Accès réservé aux chefs et sous-chefs.</div>
  if (loading) return <div className="p-4 text-gray-500">Chargement...</div>

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Formulaires</h2>
        <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={() => navigate('/forms/new')}>
          <Plus className="w-4 h-4 mr-1" /> Nouveau
        </Button>
      </div>

      <div className="divide-y border rounded-md bg-white">
        {forms.length === 0 && <p className="text-sm text-gray-400 p-4">Aucun formulaire.</p>}
        {forms.map(f => (
          <div key={f.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium">{f.nom}</p>
              {f.description && <p className="text-xs text-gray-400">{f.description}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {f.actif ? 'Actif' : 'Inactif'}
              </span>
              <ExportButton formId={f.id} formName={f.nom} />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/forms/${f.id}/edit`)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
