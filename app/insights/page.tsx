'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Award, CheckCircle2, AlertTriangle, Lightbulb, BookOpen, Compass, ClipboardList, Star, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import NavBar from '../../components/NavBar'
import { supabase } from '../../lib/supabaseClient'
import { ResumeSummary } from '../../types'

export default function InsightsPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400 animate-pulse font-semibold">Loading insights...</p>
      </main>
    }>
      <InsightsPageContent />
    </Suspense>
  )
}

function InsightsPageContent() {
  const searchParams = useSearchParams()
  const queryId = searchParams.get('id')

  const [resume, setResume] = useState<ResumeSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'ats' | 'skills' | 'roadmap'>('ats')
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    const loadResume = async () => {
      try {
        setLoading(true)
        const session = await supabase.auth.getSession()
        const jwt = session.data.session?.access_token
        if (!jwt) return

        const response = await fetch('/api/user/resumes', {
          headers: { Authorization: `Bearer ${jwt}` },
        })
        if (response.ok) {
          const resumes = await response.json()
          if (Array.isArray(resumes)) {
            if (queryId) {
              const matched = resumes.find((r) => r.id === parseInt(queryId, 10))
              setResume(matched ?? resumes[0] ?? null)
            } else {
              setResume(resumes[0] ?? null)
            }
          }
        }
      } catch (err) {
        console.error('Error fetching resume for insights', err)
      } finally {
        setLoading(false)
      }
    }
    loadResume()
  }, [queryId])

  const readinessScore = useMemo(() => {
    return resume?.insights?.internship_readiness_score ?? 0
  }, [resume])

  useEffect(() => {
    if (readinessScore > 0) {
      const timer = setTimeout(() => {
        setAnimatedScore(readinessScore)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [readinessScore])

  const strokeDash = 2 * Math.PI * 45
  const offset = strokeDash - (animatedScore / 100) * strokeDash

  return (
    <main className="min-h-screen relative overflow-hidden pb-16">
      <NavBar />

      <div className="mx-auto max-w-6xl px-6 mt-12">
        
        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8 border-white/5 shadow-md"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">
                AI Career Advisor Insights
              </span>
              <h1 className="text-2xl font-semibold tracking-tight text-white mt-1">
                Resume Insights & Roadmap
              </h1>
              <p className="mt-2 text-xs text-slate-400 font-normal">
                Detailed feedback, skill alignment overview, and targeted next steps to match job requirements.
              </p>
            </div>
            <Link 
              href="/upload" 
              className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] px-5.5 py-3 text-xs font-bold text-white transition hover:bg-white/[0.05] self-start lg:self-auto active:scale-95 duration-100 shadow-sm"
            >
              Analyze Another Resume
            </Link>
          </div>
        </motion.div>

        {loading ? (
          <div className="h-96 rounded-2xl animate-shimmer border border-white/5 mt-8" />
        ) : !resume ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card rounded-2xl p-12 text-center border-white/5 mt-8 max-w-xl mx-auto shadow-md"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.02] border border-white/5">
              <ClipboardList className="h-5 w-5 text-slate-400" />
            </div>
            <h3 className="mt-6 text-sm font-bold text-white uppercase tracking-wider">No analyzed resume found</h3>
            <p className="mt-2 text-xs text-slate-450 max-w-md mx-auto leading-relaxed font-normal">
              Upload your resume in PDF/DOCX format, wait for the processing to finish, and return here for insights.
            </p>
            <div className="mt-8">
              <Link href="/upload" className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3.5 text-xs font-bold text-slate-950 transition hover:bg-slate-100 shadow-sm">
                Upload Resume
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_1.9fr] items-start">
            
            {/* Left Column: Readiness Dial & Summary */}
            <div className="space-y-6">
              
              {/* Readiness Score Dial */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-2xl p-6 border-white/5 text-center flex flex-col items-center shadow-lg"
              >
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-6 pl-0.5 block">
                  Internship Readiness Score
                </span>
                
                {/* SVG Dial */}
                <div className="relative h-36 w-36">
                  <svg className="h-full w-full -rotate-90">
                    <circle cx="72" cy="72" r="45" className="stroke-white/5 fill-transparent" strokeWidth="6" />
                    <circle
                      cx="72"
                      cy="72"
                      r="45"
                      className="fill-transparent stroke-white transition-all duration-1000 ease-out"
                      strokeWidth="6"
                      strokeDasharray={strokeDash}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                      {animatedScore}%
                    </span>
                    <span className="text-[8px] font-bold text-slate-450 mt-1 uppercase tracking-wider">Ready State</span>
                  </div>
                </div>

                <p className="text-xs text-slate-450 mt-5 max-w-xs leading-relaxed font-normal">
                  This indicator models your alignment with entry-level job roles based on skills, project work, and degree profile.
                </p>
              </motion.div>

              {/* AI Summary Card */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-2xl p-6 border-white/5 shadow-lg"
              >
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5 pl-0.5">
                  <Star className="h-4 w-4" />
                  AI Summary
                </h3>
                <p className="text-xs leading-relaxed text-slate-350 font-normal">
                  {resume.summary || 'An AI-extracted summary of your accomplishments and professional profile is processing.'}
                </p>
              </motion.div>

            </div>

            {/* Right Column: Interactive Tabbed Details */}
            <div className="space-y-6">
              
              {/* Tab Switchers */}
              <div className="flex border-b border-white/5 gap-2 pb-0.5">
                {[
                  { id: 'ats', label: 'ATS Analysis' },
                  { id: 'skills', label: 'Skills Profile' },
                  { id: 'roadmap', label: 'Career Roadmap' },
                ].map((tab) => {
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`pb-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 px-3 ${
                        isActive
                          ? 'border-white text-white font-bold'
                          : 'border-transparent text-slate-450 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* Tab Content Panels */}
              <div className="space-y-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    
                    {/* Tab: ATS */}
                    {activeTab === 'ats' && (
                      <div className="space-y-6">
                        {/* Strengths */}
                        <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 text-xs text-slate-300 shadow-sm">
                          <h4 className="font-bold uppercase tracking-widest text-slate-400 mb-3.5 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-slate-400" />
                            Key Professional Strengths
                          </h4>
                          <ul className="space-y-2.5 font-semibold leading-relaxed">
                            {resume.insights?.strengths?.length ? (
                              resume.insights.strengths.map((str, i) => (
                                <li key={i} className="flex gap-2 items-start opacity-90">
                                  <span className="text-slate-500 shrink-0">•</span>
                                  <span>{str}</span>
                                </li>
                              ))
                            ) : (
                              <li className="opacity-65">No strengths observations available.</li>
                            )}
                          </ul>
                        </div>

                        {/* Weaknesses */}
                        <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 text-xs text-slate-300 shadow-sm">
                          <h4 className="font-bold uppercase tracking-widest text-slate-400 mb-3.5 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-slate-400" />
                            Areas for Improvement
                          </h4>
                          <ul className="space-y-2.5 font-semibold leading-relaxed">
                            {resume.insights?.weaknesses?.length ? (
                              resume.insights.weaknesses.map((weak, i) => (
                                <li key={i} className="flex gap-2 items-start opacity-90">
                                  <span className="text-slate-500 shrink-0">•</span>
                                  <span>{weak}</span>
                                </li>
                              ))
                            ) : (
                              <li className="opacity-65">No weaknesses observations available.</li>
                            )}
                          </ul>
                        </div>

                        {/* Suggestions */}
                        <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 text-xs text-slate-300 shadow-sm">
                          <h4 className="font-bold uppercase tracking-widest text-slate-400 mb-3.5 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-slate-400" />
                            ATS Enhancement Suggestions
                          </h4>
                          <ul className="space-y-2.5 font-semibold leading-relaxed">
                            {resume.insights?.suggestions?.length ? (
                              resume.insights.suggestions.map((sug, i) => (
                                <li key={i} className="flex gap-2 items-start opacity-90">
                                  <span className="text-slate-500 shrink-0">•</span>
                                  <span>{sug}</span>
                                </li>
                              ))
                            ) : (
                              <li className="opacity-65">No formatting or phrasing suggestions.</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Tab: Skills */}
                    {activeTab === 'skills' && (
                      <div className="space-y-6">
                        {/* Extracted Skills */}
                        <div className="glass-card rounded-2xl p-5 border-white/5 shadow-md">
                          <h4 className="text-[9px] font-bold tracking-wider uppercase text-slate-400 mb-3 block pl-0.5">
                            Extracted Skill Tags
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {resume.skills?.length ? (
                              resume.skills.map((skill) => (
                                <span key={skill} className="rounded bg-white/[0.02] border border-white/5 px-2.5 py-1.5 text-xs font-bold text-slate-305 shadow-sm">
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <p className="text-xs text-slate-500 italic">No skills parsed.</p>
                            )}
                          </div>
                        </div>

                        {/* Missing Skills Gap */}
                        <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 text-xs text-slate-300 shadow-sm">
                          <h4 className="font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-slate-400" />
                            Identified Skill Gaps
                          </h4>
                          <p className="text-slate-450 mt-1 mb-4 leading-relaxed font-semibold">
                            These skills are missing compared to popular target job profiles matching your experience level.
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {resume.insights?.missing_skills?.length ? (
                              resume.insights.missing_skills.map((skill) => (
                                <span key={skill} className="rounded bg-white/[0.02] border border-white/5 px-2.5 py-1 text-xs font-bold text-slate-300">
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <p className="text-emerald-500 italic font-semibold">No critical skill gaps identified!</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab: Roadmap */}
                    {activeTab === 'roadmap' && (
                      <div className="space-y-6">
                        {/* Recommended Projects */}
                        <div className="glass-card rounded-2xl p-5 border-white/5 shadow-md">
                          <h4 className="text-[9px] font-bold tracking-wider uppercase text-slate-400 mb-2 block pl-0.5">
                            Recommended Projects to Build
                          </h4>
                          <p className="text-xs text-slate-450 mb-4 leading-relaxed font-semibold">
                            Add these practical project suggestions to your portfolio to showcase missing technical competencies.
                          </p>
                          <div className="space-y-2.5">
                            {resume.insights?.recommended_projects?.length ? (
                              resume.insights.recommended_projects.map((proj, i) => (
                                <div key={i} className="flex gap-3 items-center border border-white/5 p-3.5 rounded-lg text-xs bg-white/[0.01] hover:border-white/10 transition-all duration-200">
                                  <input type="checkbox" className="h-4 w-4 rounded border-white/10 text-white focus:ring-slate-500 cursor-pointer bg-white/[0.01]" />
                                  <div className="font-bold text-slate-300">
                                    {proj}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-slate-500 italic">No project suggestions generated.</p>
                            )}
                          </div>
                        </div>

                        {/* Recommended Certifications */}
                        <div className="glass-card rounded-2xl p-5 border-white/5 shadow-md">
                          <h4 className="text-[9px] font-bold tracking-wider uppercase text-slate-400 mb-2 block pl-0.5">
                            Recommended Certifications
                          </h4>
                          <p className="text-xs text-slate-455 mb-4 leading-relaxed font-semibold">
                            Industry-recognized credentials that validate your skills on resume scanners.
                          </p>
                          <div className="space-y-2.5">
                            {resume.insights?.recommended_certifications?.length ? (
                              resume.insights.recommended_certifications.map((cert, i) => (
                                <div key={i} className="flex gap-3 items-center border border-white/5 p-3.5 rounded-lg text-xs bg-white/[0.01] hover:border-white/10 transition-all duration-200">
                                  <input type="checkbox" className="h-4 w-4 rounded border-white/10 text-white focus:ring-slate-500 cursor-pointer bg-white/[0.01]" />
                                  <div className="font-bold text-slate-300">
                                    {cert}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-slate-505 italic">No certification suggestions generated.</p>
                            )}
                          </div>
                        </div>

                      </div>
                    )}
                    
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Job matches CTA banner */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass-card rounded-2xl p-6 border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 shadow-lg"
              >
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Explore Career Recommendations</h3>
                  <p className="text-xs text-slate-400 mt-1 font-normal">
                    See how your updated profile maps against ranked job matches.
                  </p>
                </div>
                <Link
                  href={`/matches?id=${resume.id}`}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-white hover:bg-slate-100 px-5.5 py-3.5 text-xs font-bold text-slate-950 transition active:scale-95 duration-100 shadow-md"
                >
                  View Ranked Jobs
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>

            </div>

          </div>
        )}

      </div>
    </main>
  )
}
