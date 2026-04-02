import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/useAuth'
import type { Tables } from '@/lib/database.types'

type Profile = Tables<'profiles'>

interface ProfileContextValue {
  profile: Profile | null
  profileLoaded: boolean
  refreshProfile: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextValue>({ profile: null, profileLoaded: false, refreshProfile: async () => {} })

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
    setProfileLoaded(true)
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) { setProfile(null); setProfileLoaded(true); return }
    loadProfile(user.id)
  }, [user, authLoading])

  async function refreshProfile() {
    if (!user) return
    await loadProfile(user.id)
  }

  return (
    <ProfileContext.Provider value={{ profile, profileLoaded, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export const useProfile = () => useContext(ProfileContext).profile
export const useProfileLoaded = () => useContext(ProfileContext).profileLoaded
export const useRefreshProfile = () => useContext(ProfileContext).refreshProfile
