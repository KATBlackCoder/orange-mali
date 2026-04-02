import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProfile, useRefreshProfile } from '@/contexts/ProfileContext'

export function ChangePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const profile = useProfile()
  const refreshProfile = useRefreshProfile()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return }
    if (password.length < 8) { setError('Minimum 8 caractères'); return }
    setLoading(true)
    const { error: authError } = await supabase.auth.updateUser({ password })
    if (authError) { setError(authError.message); setLoading(false); return }
    await supabase.from('profiles').update({ must_change_password: false }).eq('id', profile!.id)
    await refreshProfile()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-orange-600">Bienvenue !</CardTitle>
          <p className="text-sm text-gray-500">Veuillez définir un nouveau mot de passe pour sécuriser votre compte.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="pwd">Nouveau mot de passe</Label>
              <Input id="pwd" type="password" value={password}
                onChange={e => setPassword(e.target.value)} required minLength={8} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm">Confirmer</Label>
              <Input id="confirm" type="password" value={confirm}
                onChange={e => setConfirm(e.target.value)} required />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
