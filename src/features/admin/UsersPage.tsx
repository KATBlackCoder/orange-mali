import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/contexts/ProfileContext'
import { Button } from '@/components/ui/button'
import { UserPlus, Pencil, UserX, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { UserFormDialog } from './UserFormDialog'
import type { Tables } from '@/lib/database.types'

type Profile = Tables<'profiles'>

const ROLE_LABELS: Record<string, string> = {
  chef: 'Chef',
  sous_chef: 'Sous-chef',
  superviseur: 'Superviseur',
  employe: 'Employé',
}

const ROLE_COLORS: Record<string, string> = {
  chef: 'bg-orange-100 text-orange-700',
  sous_chef: 'bg-yellow-100 text-yellow-700',
  superviseur: 'bg-blue-100 text-blue-700',
  employe: 'bg-gray-100 text-gray-700',
}

export function UsersPage() {
  const profile = useProfile()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editUser, setEditUser] = useState<Profile | null>(null)
  const [filterRole, setFilterRole] = useState('')

  const canManage = profile?.role === 'chef' || profile?.role === 'sous_chef'

  useEffect(() => {
    if (!canManage) return
    load()
  }, [])

  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('last_name')
    setUsers(data ?? [])
    setLoading(false)
  }

  async function toggleActif(user: Profile) {
    const newActif = !user.actif
    const { error } = await supabase.from('profiles').update({ actif: newActif }).eq('id', user.id)
    if (error) { toast.error(error.message); return }
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, actif: newActif } : u))
    toast.success(newActif ? 'Compte réactivé' : 'Compte désactivé')
  }

  if (!canManage) return (
    <div className="p-4 text-gray-500 text-sm">Accès réservé aux chefs et sous-chefs.</div>
  )

  if (loading) return <div className="p-4 text-gray-500">Chargement...</div>

  const supervisors = users.filter(u => u.role === 'superviseur' || u.role === 'sous_chef')
  const filtered = filterRole ? users.filter(u => u.role === filterRole) : users

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Utilisateurs</h2>
        <Button size="sm" className="bg-orange-500 hover:bg-orange-600"
          onClick={() => { setEditUser(null); setDialogOpen(true) }}>
          <UserPlus className="w-4 h-4 mr-1" /> Créer
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'chef', 'sous_chef', 'superviseur', 'employe'].map(r => (
          <button key={r}
            onClick={() => setFilterRole(r)}
            className={`text-xs px-3 py-1 rounded-full border transition ${filterRole === r ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'}`}>
            {r ? ROLE_LABELS[r] : 'Tous'}
          </button>
        ))}
      </div>

      <div className="divide-y border rounded-md bg-white">
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 p-4">Aucun utilisateur.</p>
        )}
        {filtered.map(u => (
          <div key={u.id} className={`flex items-center justify-between px-4 py-3 ${!u.actif ? 'opacity-50' : ''}`}>
            <div>
              <p className="text-sm font-medium">{u.first_name} {u.last_name}</p>
              <p className="text-xs text-gray-400">{u.telephone}{u.zone ? ` · ${u.zone}` : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role]}`}>
                {ROLE_LABELS[u.role]}
              </span>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                onClick={() => { setEditUser(u); setDialogOpen(true) }}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="ghost" className={`h-7 w-7 p-0 ${u.actif ? 'text-red-400 hover:text-red-600' : 'text-green-500 hover:text-green-700'}`}
                onClick={() => toggleActif(u)}>
                {u.actif ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <UserFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={load}
        editUser={editUser}
        supervisors={supervisors}
      />
    </div>
  )
}
