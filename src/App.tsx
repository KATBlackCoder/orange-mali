import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { useAuth } from '@/features/auth/useAuth'
import { useProfile } from '@/contexts/ProfileContext'
import { ProfileProvider } from '@/contexts/ProfileContext'
import { LoginPage } from '@/features/auth/LoginPage'
import { SubmissionPage } from '@/features/submissions/SubmissionPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const profile = useProfile()
  if (loading || (user && !profile)) return (
    <div className="flex items-center justify-center min-h-screen text-gray-500">Chargement...</div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/submit/:formId" element={
        <ProtectedRoute><SubmissionPage /></ProtectedRoute>
      } />
      <Route path="/*" element={
        <ProtectedRoute>
          <div className="p-4">Dashboard (à venir)</div>
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ProfileProvider>
        <AppRoutes />
        <Toaster />
      </ProfileProvider>
    </BrowserRouter>
  )
}
