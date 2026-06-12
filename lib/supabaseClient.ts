import { createClient } from '@supabase/supabase-js'

const placeholderPatterns = [
  /your-project/i,
  /your-anon/i,
  /example\.com/i,
  /<.*>/,
  /your-project-ref/i,
]

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ''
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? ''

const isPlaceholderValue = (value: string) =>
  !value || placeholderPatterns.some((pattern) => pattern.test(value))

export const isSupabaseConfigured =
  Boolean(supabaseUrl && supabaseAnonKey) &&
  !isPlaceholderValue(supabaseUrl) &&
  !isPlaceholderValue(supabaseAnonKey)

if (typeof window !== 'undefined' && !isSupabaseConfigured) {
  console.warn(
    'Supabase is not configured correctly. Update frontend/.env.local with a real NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  )
  console.warn({ supabaseUrl, supabaseAnonKey })
}

const clientUrl = supabaseUrl || 'https://example.com'
const clientKey = supabaseAnonKey || 'invalid-anon-key'

export const supabase = createClient(clientUrl, clientKey)
