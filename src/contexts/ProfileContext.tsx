import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/useAuth'
import type { Tables } from '@/lib/database.types'

type Profile = Tables<'profiles'>

interface ProfileContextValue {
  profile: Profile | null
  profileLoaded: boolean
}

const ProfileContext = createContext<ProfileContextValue>({ profile: null, profileLoaded: false })

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { setProfile(null); setProfileLoaded(true); return }
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => { setProfile(data); setProfileLoaded(true) })
  }, [user, authLoading])

  return (
    <ProfileContext.Provider value={{ profile, profileLoaded }}>
      {children}
    </ProfileContext.Provider>
  )
}

export const useProfile = () => useContext(ProfileContext).profile
export const useProfileLoaded = () => useContext(ProfileContext).profileLoaded
