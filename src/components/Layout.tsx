import { useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth'
import { useProfile } from '@/contexts/ProfileContext'

const roleLabel: Record<string, string> = {
  chef: 'Chef',
  sous_chef: 'Sous-Chef',
  superviseur: 'Superviseur',
  employe: 'Employé',
}

export function Layout({ children }: { children: React.ReactNode }) {
  const profile = useProfile()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-orange-500 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">Orange Mali</span>
        </div>
        <div className="flex items-center gap-3">
          {profile && (
            <div className="flex items-center gap-2 text-sm opacity-90">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{profile.first_name} {profile.last_name}</span>
              <span className="text-xs opacity-75">· {roleLabel[profile.role]}</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-orange-600"
            onClick={() => signOut().then(() => navigate('/login'))}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>
      <main className="p-4">{children}</main>
    </div>
  )
}
