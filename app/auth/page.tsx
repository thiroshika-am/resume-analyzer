'use client'

import { type FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import Link from 'next/link'
import NavBar from '../../components/NavBar'

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
      if (!isSupabaseConfigured) {
        setCheckingSession(false)
        return
      }

      const { data } = await supabase.auth.getSession()
      if (data.session) {
        router.replace('/dashboard')
        return
      }

      setCheckingSession(false)
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
      <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
        <NavBar />
        <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <p className="text-center text-slate-700 dark:text-slate-300">Checking authentication status…</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <NavBar />
      <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">{isSignup ? 'Create your account' : 'Sign in to Resume Matcher'}</h1>
            <p className="mt-3 text-slate-600 dark:text-slate-400">Secure access for resume upload, insights, and job matches.</p>
          </div>
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-950">
            <button
              type="button"
              onClick={() => setIsSignup(false)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${!isSignup ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-950' : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsSignup(true)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${isSignup ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-950' : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-100 dark:focus:ring-slate-800"
              placeholder="you@example.com"
            />
          </label>

          <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-100 dark:focus:ring-slate-800"
              placeholder="Enter a secure password"
            />
          </label>

          {message && (
            <p className={`text-sm ${messageType === 'error' ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-slate-900 px-5 py-3 text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200"
          >
            {loading ? 'Processing…' : isSignup ? 'Sign up' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-600 dark:text-slate-400">
          <p className="text-slate-700 dark:text-slate-300">
            {isSignup ? 'Already have an account? Select Sign In.' : "Don't have an account? Select Sign Up."}
          </p>
          <Link href="/" className="text-sky-600 hover:text-sky-700 dark:text-sky-400">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}
