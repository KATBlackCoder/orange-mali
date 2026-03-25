import { useProfile } from '@/contexts/ProfileContext'
import { Layout } from '@/components/Layout'
import { EmployeeDashboard } from './EmployeeDashboard'
import { SupervisorDashboard } from './SupervisorDashboard'

export function DashboardRouter() {
  const profile = useProfile()
  if (!profile) return null

  const content = profile.role === 'employe'
    ? <EmployeeDashboard />
    : <SupervisorDashboard /> // superviseur, sous_chef, chef

  return <Layout>{content}</Layout>
}
