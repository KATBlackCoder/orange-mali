import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/contexts/ProfileContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardList, ChevronRight } from 'lucide-react'
import type { Tables } from '@/lib/database.types'

const statutColors: Record<string, string> = {
  brouillon: 'bg-gray-100 text-gray-600',
  soumis: 'bg-blue-100 text-blue-700',
  valide: 'bg-green-100 text-green-700',
  rejete: 'bg-red-100 text-red-700',
}

const statutLabel: Record<string, string> = {
  brouillon: 'Brouillon',
  soumis: 'Soumis',
  valide: 'Validé',
  rejete: 'Rejeté',
}

export function EmployeeDashboard() {
  const profile = useProfile()
  const [forms, setForms] = useState<Tables<'forms'>[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])

  useEffect(() => {
    supabase.from('forms').select('*').eq('actif', true)
      .then(({ data }) => setForms(data ?? []))
  }, [])

  useEffect(() => {
    if (!profile) return
    supabase.from('submissions')
      .select('*, forms(nom)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setSubmissions(data ?? []))
  }, [profile])

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-orange-500" />
            Nouvelle remontée
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {forms.length === 0 && (
            <p className="text-gray-500 text-sm">Aucun formulaire disponible.</p>
          )}
          {forms.map(f => (
            <Link key={f.id} to={`/submit/${f.id}`}>
              <Button variant="outline" className="w-full justify-between">
                <span>{f.nom}</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Button>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mes dernières remontées</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 && (
            <p className="text-gray-500 text-sm">Aucune remontée pour l'instant.</p>
          )}
          <div className="divide-y">
            {submissions.map(s => (
              <div key={s.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-sm">{(s.forms as any)?.nom}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(s.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statutColors[s.statut ?? 'brouillon']}`}>
                  {statutLabel[s.statut ?? 'brouillon']}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
