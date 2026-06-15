'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function NavBar() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [user, setUser] = useState<any>(null)
  const [currentPath, setCurrentPath] = useState<string>('')

  useEffect(() => {
    const stored = window.localStorage.getItem('theme') as 'light' | 'dark' | null
    const preferred = stored ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    setTheme(preferred)
    document.documentElement.classList.toggle('dark', preferred === 'dark')
    setCurrentPath(window.location.pathname)
  }, [])

  useEffect(() => {
    const loadSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        setUser(data.session?.user ?? null)
      } catch (error) {
        console.error('Failed to load Supabase session in NavBar', error)
        setUser(null)
      }
    }

    loadSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    window.localStorage.setItem('theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-50 w-full px-6 py-4 transition-all duration-300">
      <div className="mx-auto max-w-6xl rounded-xl glass-card border-white/5 px-6 py-3 flex items-center justify-between shadow-xl">
        <Link 
          href="/" 
          className="text-sm font-bold tracking-tight text-white flex items-center gap-2 transition hover:opacity-85"
        >
          <span className="w-2.5 h-2.5 bg-white rounded-sm inline-block" />
          Resume AI Matcher
        </Link>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-5">
            {[
              { label: 'Dashboard', path: '/dashboard' },
              { label: 'Upload', path: '/upload' },
              { label: 'Matches', path: '/matches' },
              { label: 'Insights', path: '/insights' },
              { label: 'Career Coach', path: '/coach' },
            ].map((link) => {
              const active = currentPath === link.path
              return (
                <Link 
                  key={link.path}
                  href={link.path} 
                  className={`text-[10px] font-bold tracking-widest uppercase transition-colors relative py-1.5 ${
                    active 
                      ? 'text-white' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-[1px] bg-white rounded-full" />
                  )}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-3 border-l border-white/5 pl-3">
            <button 
              type="button" 
              onClick={toggleTheme} 
              className="rounded-lg border border-white/5 p-2 text-slate-300 transition hover:bg-white/5 flex items-center justify-center active:scale-95 duration-100"
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
            
            {currentPath === '/auth' ? (
              <div className="rounded-lg bg-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-950 shadow-sm">
                Sign In
              </div>
            ) : user ? (
              <button 
                type="button" 
                onClick={handleSignOut} 
                className="rounded-lg bg-white hover:bg-slate-200 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-950 transition active:scale-95 duration-100 shadow-sm"
              >
                Sign out
              </button>
            ) : (
              <Link 
                href="/auth" 
                className="rounded-lg bg-white hover:bg-slate-200 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-950 transition active:scale-95 duration-100 shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
