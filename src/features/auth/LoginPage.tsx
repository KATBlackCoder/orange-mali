import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function LoginPage() {
  const [telephone, setTelephone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signIn(telephone, password)
    if (error) {
      setError('Numéro ou mot de passe incorrect')
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-orange-600 text-2xl">Orange Mali</CardTitle>
          <p className="text-center text-sm text-gray-500">Système de remontées</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="tel">Numéro de téléphone</Label>
              <Input id="tel" type="tel" placeholder="7X XX XX XX"
                value={telephone} onChange={e => setTelephone(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pwd">Mot de passe</Label>
              <Input id="pwd" type="password"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
