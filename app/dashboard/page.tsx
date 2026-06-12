'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import NavBar from '../../components/NavBar'
import { ResumeSummary } from '../../types'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [resumes, setResumes] = useState<ResumeSummary[]>([])

  useEffect(() => {
    const initialize = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Supabase session retrieval failed', error)
        }
        if (data.session?.user) {
          setUser(data.session.user)
        }
      } catch (error) {
        console.error('Error while retrieving Supabase session', error)
      }

      await loadResumes()
    }
    initialize()
  }, [])

  const loadResumes = async () => {
    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session) {
        console.warn('No active Supabase session; skipping resume fetch')
        return
      }

      const jwt = session.data.session.access_token
      const response = await fetch('/api/user/resumes', {
        headers: { Authorization: `Bearer ${jwt}` },
      })

      if (!response.ok) {
        const body = await response.text()
        console.error('Resume fetch failed', { status: response.status, body })
        return
      }

      const data = await response.json()
      if (Array.isArray(data)) {
        setResumes(data)
      } else {
        console.error('Expected resumes array, got:', data)
        setResumes([])
      }
    } catch (error) {
      console.error('Error loading resumes', error)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <NavBar />
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Dashboard</h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">Manage resumes, view insights, and discover job matches.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/upload" className="rounded-full bg-slate-900 px-5 py-3 text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200">
                Upload resume
              </Link>
              <Link href="/matches" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-slate-900 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                View matches
              </Link>
            </div>
          </div>
        </div>

        <section className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resumes.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card dark:border-slate-800 dark:bg-slate-900">
              <p className="text-slate-600 dark:text-slate-400">Upload your first resume to see skills and job matches.</p>
            </div>
          ) : (
            resumes.map((resume) => (
              <article key={resume.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">{resume.filename}</h2>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Uploaded {new Date(resume.uploaded_at).toLocaleDateString()}</p>
                <p className="mt-4 text-slate-700 dark:text-slate-300">{resume.summary || 'Resume summary will appear after processing.'}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {resume.skills?.slice(0, 6).map((skill) => (
                    <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                      {skill}
                    </span>
                  ))}
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  )
}
