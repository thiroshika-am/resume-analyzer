'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText, Plus, CheckCircle, Clock, Zap, ArrowRight, BookOpen } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import NavBar from '../../components/NavBar'
import { ResumeSummary } from '../../types'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [resumes, setResumes] = useState<ResumeSummary[]>([])
  const [loading, setLoading] = useState(true)

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
      setLoading(false)
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  }

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 90, damping: 18 } },
  }

  return (
    <main className="min-h-screen relative overflow-hidden pb-16">
      <NavBar />
      
      <div className="mx-auto max-w-6xl px-6 mt-12">
        {/* Header Hero Area */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8 md:p-10 shadow-xl relative overflow-hidden"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                User Console
              </span>
              <h1 className="text-2xl font-semibold tracking-tight text-white mt-1">Dashboard</h1>
              <p className="mt-2 text-xs text-slate-400 font-normal leading-relaxed">
                Review analyzed documents, match indices, and trace individual career roadmaps.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Link 
                href="/upload" 
                className="inline-flex items-center gap-1.5 rounded-lg bg-white text-slate-950 hover:bg-slate-150 px-5.5 py-3 text-xs font-bold transition active:scale-95 duration-100 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Upload Resume
              </Link>
              <Link 
                href="/matches" 
                className="btn-silver inline-flex items-center gap-1.5 rounded-lg px-5.5 py-3 text-xs font-bold active:scale-95 duration-100 shadow-sm"
              >
                View Matches
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Resumes Grid */}
        <div className="mt-12">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-450 mb-6 pl-1.5">
            Document Index ({resumes.length})
          </h2>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((num) => (
                <div key={num} className="h-44 rounded-xl animate-shimmer border border-white/5" />
              ))}
            </div>
          ) : resumes.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card rounded-2xl p-12 text-center shadow-lg"
            >
              <FileText className="h-10 w-10 text-slate-500 mx-auto" />
              <h3 className="mt-6 text-sm font-bold text-white uppercase tracking-wider">No Resumes Found</h3>
              <p className="mt-2 text-xs text-slate-450 max-w-sm mx-auto font-normal">
                Upload your first resume PDF, and our parsing models will index capability tags.
              </p>
              <div className="mt-6">
                <Link 
                  href="/upload" 
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white text-slate-950 hover:bg-slate-100 px-5 py-3 text-xs font-bold transition active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  Upload First Resume
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.section 
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {resumes.map((resume) => {
                const dateString = new Date(resume.uploaded_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
                
                return (
                  <motion.article 
                    key={resume.id} 
                    variants={itemVariants}
                    className="glass-card rounded-xl border p-6 shadow-md hover:border-white/10 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-sm font-bold text-white truncate max-w-[70%]">
                          {resume.filename}
                        </h3>
                        {resume.scores?.overall_score ? (
                          <span className="rounded bg-white/[0.04] border border-white/10 px-2 py-0.5 text-xs font-semibold text-slate-200 shrink-0">
                            {resume.scores.overall_score}%
                          </span>
                        ) : (
                          <span className="rounded bg-white/[0.02] border border-white/5 px-2 py-0.5 text-xs font-semibold text-slate-400 shrink-0 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            Pending
                          </span>
                        )}
                      </div>
                      
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                        INDEXED ON {dateString}
                      </p>
                      
                      <p className="text-xs leading-relaxed text-slate-400 line-clamp-3 font-normal">
                        {resume.summary || 'Summary processing... Click insights for details.'}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5 space-y-4">
                      {resume.skills && resume.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {resume.skills.slice(0, 3).map((skill) => (
                            <span key={skill} className="rounded bg-white/[0.02] border border-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                              {skill}
                            </span>
                          ))}
                          {resume.skills.length > 3 && (
                            <span className="rounded bg-white/[0.02] border border-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                              +{resume.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Link 
                          href={`/insights?id=${resume.id}`}
                          className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-slate-900 border border-white/5 py-2.5 text-[10px] font-bold text-slate-300 hover:bg-slate-950 uppercase tracking-wider transition active:scale-95 duration-100"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          Insights
                        </Link>
                        
                        <Link 
                          href={`/matches?id=${resume.id}`}
                          className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-white py-2.5 text-[10px] font-bold text-slate-950 hover:bg-slate-100 uppercase tracking-wider transition active:scale-95 duration-100"
                        >
                          <Zap className="h-3.5 w-3.5" />
                          Matches
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                )
              })}
            </motion.section>
          )}
        </div>
      </div>
    </main>
  )
}
