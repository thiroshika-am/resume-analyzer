'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import NavBar from '../../components/NavBar'
import { supabase } from '../../lib/supabaseClient'
import { JobMatch } from '../../types'

export default function MatchesPage() {
  const [matches, setMatches] = useState<JobMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const session = await supabase.auth.getSession()
        const jwt = session.data.session?.access_token
        if (!jwt) throw new Error('Please sign in to load job matches.')

        const resumeResponse = await fetch('/api/user/resumes', {
          headers: { Authorization: `Bearer ${jwt}` },
        })
        const userResumes = await resumeResponse.json()
        if (!userResumes.length) {
          setMatches([])
          return
        }

        const resumeId = userResumes[0].id
        const response = await fetch(`/api/jobs/${resumeId}/matches`, {
          headers: { Authorization: `Bearer ${jwt}` },
        })
        if (!response.ok) {
          const payload = await response.json()
          throw new Error(payload.detail || 'Failed to load job matches.')
        }
        const data = await response.json()
        setMatches(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadMatches()
  }, [])

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <NavBar />
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Job matches</h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">Ranked opportunities tailored to your resume and skills.</p>
            </div>
            <Link href="/dashboard" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-slate-900 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              Back to dashboard
            </Link>
          </div>
        </div>

        <section className="mt-8 space-y-4">
          {loading && <p className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-card dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">Loading job matches…</p>}
          {error && <p className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-rose-700 shadow-card dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">{error}</p>}

          {!loading && !matches.length && !error && (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card dark:border-slate-800 dark:bg-slate-900">
              <p className="text-slate-600 dark:text-slate-400">No matches found yet. Upload a resume and return to this page after processing.</p>
            </div>
          )}

          {matches.map((job) => (
            <article key={job.id} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">{job.title}</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{job.company} · {job.location || 'Remote'}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">Score {job.score}</span>
              </div>
              <p className="mt-4 text-slate-700 dark:text-slate-300">{job.description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
