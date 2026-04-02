import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/contexts/ProfileContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CheckCircle, XCircle } from 'lucide-react'
import { MyTeamSection } from './MyTeamSection'

export function SupervisorDashboard() {
  const profile = useProfile()
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    supabase.from('profiles').select('id').eq('parent_id', profile.id)
      .then(({ data: employees }) => {
        const ids = (employees ?? []).map(e => e.id)
        if (ids.length === 0) { setLoading(false); return }
        supabase.from('submissions')
          .select('*, profiles(first_name, last_name, telephone), forms(nom)')
          .in('user_id', ids)
          .order('created_at', { ascending: false })
          .limit(50)
          .then(({ data }) => { setSubmissions(data ?? []); setLoading(false) })
      })
  }, [profile])

  async function validate(id: string) {
    await supabase.from('submissions').update({ statut: 'valide' }).eq('id', id)
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, statut: 'valide' } : s))
    toast.success('Remontée validée')
  }

  async function reject(id: string) {
    await supabase.from('submissions').update({ statut: 'rejete' }).eq('id', id)
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, statut: 'rejete' } : s))
    toast.error('Remontée rejetée')
  }

  const pending = submissions.filter(s => s.statut === 'soumis')
  const recent = submissions.filter(s => s.statut !== 'soumis').slice(0, 10)

  if (loading) return <div className="p-4 text-gray-500">Chargement...</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-3">
          À valider
          {pending.length > 0 && (
            <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{pending.length}</span>
          )}
        </h2>
        {pending.length === 0 && (
          <p className="text-gray-500 text-sm">Aucune remontée en attente. ✓</p>
        )}
        <div className="space-y-2">
          {pending.map(s => (
            <Card key={s.id}>
              <CardContent className="pt-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {s.profiles?.first_name} {s.profiles?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {s.forms?.nom} · {new Date(s.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600"
                    onClick={() => reject(s.id)}>
                    <XCircle className="w-4 h-4 mr-1" /> Rejeter
                  </Button>
                  <Button size="sm" className="bg-green-500 hover:bg-green-600"
                    onClick={() => validate(s.id)}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Valider
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {recent.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">Traitées récemment</h2>
          <div className="divide-y border rounded-md bg-white">
            {recent.map(s => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{s.profiles?.first_name} {s.profiles?.last_name}</p>
                  <p className="text-xs text-gray-400">{s.forms?.nom}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.statut === 'valide' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {s.statut === 'valide' ? 'Validé' : 'Rejeté'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <MyTeamSection />
    </div>
  )
}
