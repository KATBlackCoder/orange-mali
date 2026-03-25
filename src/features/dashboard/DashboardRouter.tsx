import { useProfile } from '@/contexts/ProfileContext'
import { Layout } from '@/components/Layout'
import { EmployeeDashboard } from './EmployeeDashboard'
import { SupervisorDashboard } from './SupervisorDashboard'

export function DashboardRouter() {
  const profile = useProfile()

  if (!profile) return (
    <div className="flex items-center justify-center min-h-screen text-gray-500 text-sm">
      Profil introuvable. Contactez votre administrateur.
    </div>
  )

  const content = profile.role === 'employe'
    ? <EmployeeDashboard />
    : <SupervisorDashboard />

  return <Layout>{content}</Layout>
}
