import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { Tables } from '@/lib/database.types'

type Profile = Tables<'profiles'>
type UserRole = 'chef' | 'sous_chef' | 'superviseur' | 'employe'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editUser?: Profile | null
  supervisors: Profile[]
}

export function UserFormDialog({ open, onClose, onSaved, editUser, supervisors }: Props) {
  const [firstName, setFirstName] = useState(editUser?.first_name ?? '')
  const [lastName, setLastName] = useState(editUser?.last_name ?? '')
  const [telephone, setTelephone] = useState(editUser?.telephone ?? '')
  const [role, setRole] = useState<UserRole>((editUser?.role as UserRole) ?? 'employe')
  const [zone, setZone] = useState(editUser?.zone ?? '')
  const [parentId, setParentId] = useState(editUser?.parent_id ?? '')

  const [loading, setLoading] = useState(false)
  const [createdCreds, setCreatedCreds] = useState<{ login: string; password: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    if (editUser) {
      const { error } = await supabase.from('profiles').update({
        first_name: firstName,
        last_name: lastName,
        telephone,
        role,
        zone: zone || null,
        parent_id: parentId || null,
      }).eq('id', editUser.id)
      if (error) { toast.error(error.message); setLoading(false); return }
      toast.success('Utilisateur mis à jour')
      onSaved()
      onClose()
    } else {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          telephone,
          first_name: firstName,
          last_name: lastName,
          role,
          zone: zone || null,
          parent_id: parentId || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); setLoading(false); return }
      setCreatedCreds({ login: data.display_login, password: data.default_password })
      toast.success('Utilisateur créé')
      onSaved()
    }
    setLoading(false)
  }

  if (createdCreds) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-green-600">Compte créé</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mb-3">Communiquez ces identifiants à l'utilisateur :</p>
          <div className="bg-gray-50 rounded p-3 space-y-1 font-mono text-sm">
            <p><span className="text-gray-500">Login :</span> {createdCreds.login}</p>
            <p><span className="text-gray-500">Mot de passe :</span> {createdCreds.password}</p>
          </div>
          <p className="text-xs text-gray-400 mt-2">L'utilisateur devra changer son mot de passe à la première connexion.</p>
          <Button className="w-full mt-4 bg-orange-500 hover:bg-orange-600" onClick={onClose}>Fermer</Button>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editUser ? 'Modifier utilisateur' : 'Créer un utilisateur'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Prénom</Label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Nom</Label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Téléphone</Label>
            <Input value={telephone} onChange={e => setTelephone(e.target.value)} required
              disabled={!!editUser} placeholder="70000000" />
          </div>
          <div className="space-y-1">
            <Label>Rôle</Label>
            <Select value={role} onValueChange={v => setRole(v as UserRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="employe">Employé</SelectItem>
                <SelectItem value="superviseur">Superviseur</SelectItem>
                <SelectItem value="sous_chef">Sous-chef</SelectItem>
                <SelectItem value="chef">Chef</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Zone <span className="text-gray-400 text-xs">(optionnel)</span></Label>
            <Input value={zone} onChange={e => setZone(e.target.value)} placeholder="ex: Bamako Nord" />
          </div>
          {supervisors.length > 0 && (
            <div className="space-y-1">
              <Label>Superviseur rattaché <span className="text-gray-400 text-xs">(optionnel)</span></Label>
              <Select value={parentId} onValueChange={(v) => setParentId(v ?? '')}>
                <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun</SelectItem>
                  {supervisors.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={loading}>
            {loading ? 'Enregistrement...' : editUser ? 'Enregistrer' : 'Créer le compte'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
