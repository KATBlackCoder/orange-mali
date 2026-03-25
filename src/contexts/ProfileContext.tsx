import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/useAuth'
import type { Tables } from '@/lib/database.types'

type Profile = Tables<'profiles'>
const ProfileContext = createContext<Profile | null>(null)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    if (!user) { setProfile(null); return }
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => setProfile(data))
  }, [user])

  return <ProfileContext.Provider value={profile}>{children}</ProfileContext.Provider>
}

export const useProfile = () => useContext(ProfileContext)
