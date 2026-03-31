import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/contexts/ProfileContext'
import type { Tables } from '@/lib/database.types'

type Profile = Tables<'profiles'>

export function MyTeamSection() {
  const profile = useProfile()
  const [employees, setEmployees] = useState<Profile[]>([])
  const [activeToday, setActiveToday] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return

    const today = new Date().toISOString().split('T')[0]

    Promise.all([
      supabase.from('profiles')
        .select('*')
        .eq('parent_id', profile.id)
        .eq('role', 'employe')
        .order('last_name'),
      supabase.from('submissions')
        .select('user_id')
        .gte('created_at', today + 'T00:00:00')
        .in('statut', ['soumis', 'valide']),
    ]).then(([{ data: emps }, { data: subs }]) => {
      setEmployees(emps ?? [])
      setActiveToday(new Set((subs ?? []).map(s => s.user_id).filter(Boolean) as string[]))
      setLoading(false)
    })
  }, [profile])

  if (loading) return null
  if (employees.length === 0) return null

  return (
    <div>
      <h2 className="text-lg font-bold mb-3">Mon équipe ({employees.length})</h2>
      <div className="divide-y border rounded-md bg-white">
        {employees.map(emp => (
          <div key={emp.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium">{emp.first_name} {emp.last_name}</p>
              <p className="text-xs text-gray-400">{emp.telephone}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${activeToday.has(emp.id) ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-xs text-gray-500">
                {activeToday.has(emp.id) ? "Actif aujourd'hui" : "Pas de remontée"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
