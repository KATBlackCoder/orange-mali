import { supabase } from './supabase'

const toEmail = (tel: string) => `${tel.replace(/\s/g, '')}@orangemali.local`

export async function signIn(telephone: string, password: string) {
  return supabase.auth.signInWithPassword({
    email: toEmail(telephone),
    password,
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}
