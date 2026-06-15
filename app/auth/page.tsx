'use client'

import { type FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import NavBar from '../../components/NavBar'
import { AlertTriangle } from 'lucide-react'

function formatAuthError(error: { message?: string; status?: number; code?: string } | null) {
  if (!error) return 'An unknown Supabase authentication error occurred.'
  return `${error.message ?? 'Authentication failed.'}${error.code ? ` (${error.code})` : ''}${error.status ? ` [${error.status}]` : ''}`
}

export default function AuthPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'success' | ''>('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        if (!isSupabaseConfigured) {
          setCheckingSession(false)
          return
        }

        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Supabase session retrieval error:', error)
        }
        if (data?.session) {
          router.replace('/dashboard')
          return
        }
      } catch (err) {
        console.error('Unhandled session check exception:', err)
      } finally {
        setCheckingSession(false)
      }
    }

    checkSession()
  }, [router])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setMessageType('')

    if (!isSupabaseConfigured) {
      console.error('Supabase configuration is missing or invalid.', {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      })
      setMessage('Supabase is not configured. Update frontend/.env.local with a valid NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
      setMessageType('error')
      return
    }

    setLoading(true)

    try {
      const response = isSignup
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password })

      if (response.error) {
        setMessage(formatAuthError(response.error))
        setMessageType('error')
        return
      }

      if (isSignup) {
        setMessage('Sign-up successful. Check your email to confirm your account.')
        setMessageType('success')
      } else {
        setMessage('Login successful. Redirecting to dashboard...')
        setMessageType('success')
        router.push('/dashboard')
      }
    } catch (error: any) {
      setMessage(error?.message ?? 'An unexpected error occurred. Please try again.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col justify-center items-center">
        <p className="text-xs font-semibold text-slate-400 animate-pulse">Verifying credentials session…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen relative overflow-hidden pb-16">
      <NavBar />
      
      <div className="mx-auto mt-12 max-w-2xl px-6">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8 md:p-10 shadow-2xl relative overflow-hidden"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-6">
            <div>
              <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-[9px] font-bold text-slate-350 uppercase tracking-wide">
                Security Gateway
              </span>
              <h1 className="text-2xl font-semibold tracking-tight text-white mt-2">
                {isSignup ? 'Create Account' : 'Sign In'}
              </h1>
              <p className="mt-1.5 text-xs text-slate-450 font-normal">
                Authorized access to resume analytics & career advisor tools.
              </p>
            </div>
            
            <div className="inline-flex rounded-lg bg-white/[0.02] p-1 border border-white/5 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => { setIsSignup(false); setMessage(''); setMessageType(''); }}
                className={`rounded px-4.5 py-2 text-[10px] font-bold transition-all uppercase tracking-wider ${
                  !isSignup 
                    ? 'bg-white text-slate-950 shadow-sm' 
                    : 'text-slate-450 hover:text-white'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => { setIsSignup(true); setMessage(''); setMessageType(''); }}
                className={`rounded px-4.5 py-2 text-[10px] font-bold transition-all uppercase tracking-wider ${
                  isSignup 
                    ? 'bg-white text-slate-955 shadow-sm' 
                    : 'text-slate-450 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 pl-0.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full glass-input text-xs font-semibold"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 pl-0.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full glass-input text-xs font-semibold"
                placeholder="Enter password"
              />
            </div>

            <AnimatePresence>
              {message && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`text-xs font-semibold leading-relaxed p-3.5 rounded-lg border flex gap-2.5 items-center ${
                    messageType === 'error' 
                      ? 'border-white/10 bg-white/[0.01] text-slate-300' 
                      : 'border-white/10 bg-white/[0.01] text-white'
                  }`}
                >
                  {messageType === 'error' && <AlertTriangle className="h-4 w-4 text-slate-400 shrink-0" />}
                  <p>{message}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-white text-slate-950 hover:bg-slate-100 py-3.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 shadow-md active:scale-95 duration-100"
            >
              {loading ? 'Processing credentials…' : isSignup ? 'Create Account' : 'Authenticate Session'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs font-semibold text-slate-500">
            <p>
              {isSignup ? 'Already have an account? Select Login.' : "Don't have an account? Select Register."}
            </p>
            <Link href="/" className="text-slate-400 hover:text-white flex items-center gap-1 active:scale-95 duration-100">
              Return to Landing Page
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
