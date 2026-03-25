import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { useAuth } from '@/features/auth/useAuth'
import { useProfile, useProfileLoaded, ProfileProvider } from '@/contexts/ProfileContext'
import { LoginPage } from '@/features/auth/LoginPage'
import { ChangePasswordPage } from '@/features/auth/ChangePasswordPage'
import { DashboardRouter } from '@/features/dashboard/DashboardRouter'
import { Layout } from '@/components/Layout'
import { SubmissionPage } from '@/features/submissions/SubmissionPage'
import { UsersPage } from '@/features/admin/UsersPage'
import { FormsPage } from '@/features/admin/FormsPage'
import { FormBuilder } from '@/features/admin/FormBuilder'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const profile = useProfile()
  const profileLoaded = useProfileLoaded()
  if (loading || !profileLoaded) return (
    <div className="flex items-center justify-center min-h-screen text-gray-500">Chargement...</div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (profile?.must_change_password) return <ChangePasswordPage />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/users" element={
        <ProtectedRoute>
          <Layout><UsersPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/forms" element={
        <ProtectedRoute>
          <Layout><FormsPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/forms/new" element={
        <ProtectedRoute>
          <Layout><FormBuilder /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/forms/:formId/edit" element={
        <ProtectedRoute>
          <Layout><FormBuilder /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/submit/:formId" element={
        <ProtectedRoute>
          <Layout><SubmissionPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/*" element={
        <ProtectedRoute><DashboardRouter /></ProtectedRoute>
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
