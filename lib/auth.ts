import { supabase } from './supabaseClient'
import type { Session, User } from '@supabase/supabase-js'

export type AuthResult = {
  session: Session | null
  user: User | null
  error: Error | null
}

export async function getSessionAndUser(): Promise<AuthResult> {
  try {
    const sessionResult = await supabase.auth.getSession()
    const userResult = await supabase.auth.getUser()

    const session = sessionResult.data.session ?? null
    const user = userResult.data.user ?? null
    const error = sessionResult.error || userResult.error || null

    console.log('Session:', session)
    console.log('User:', user)

    return { session, user, error }
  } catch (error: any) {
    console.error('Error fetching Supabase auth session/user', error)
    return { session: null, user: null, error }
  }
}
