'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Award, CheckCircle2, AlertTriangle, Lightbulb, BookOpen, Compass, ClipboardList, Star, ArrowRight } from 'lucide-react'
import NavBar from '../../components/NavBar'
import { supabase } from '../../lib/supabaseClient'
import { ResumeSummary } from '../../types'

export default function InsightsPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500 animate-pulse font-semibold">Loading Career Insights...</p>
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

  // Radial circle geometry calculations
  const readinessScore = useMemo(() => {
    return resume?.insights?.internship_readiness_score ?? 0
  }, [resume])

  const strokeDash = 2 * Math.PI * 45
  const offset = strokeDash - (readinessScore / 100) * strokeDash

  return (
    <main className="min-h-screen relative overflow-hidden pb-16">
      {/* Background radial blurs */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-indigo-500/5 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-72 w-72 rounded-full bg-sky-500/5 blur-[120px]" />

      <NavBar />

      <div className="mx-auto max-w-6xl px-6 mt-8">
        
        {/* Page Header */}
        <div className="glass-card rounded-[2rem] p-8 shadow-card border-slate-200/50 dark:border-slate-800/40">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="text-xs font-semibold text-indigo-600 dark:text-sky-400 tracking-wider uppercase">
                AI Career Advisor Insights
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
                Resume Insights & Roadmap
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Detailed feedback, skill alignment overview, and targeted next steps to match job requirements.
              </p>
            </div>
            <Link 
              href="/upload" 
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-xs font-semibold text-slate-950 transition hover:bg-slate-50 dark:border-slate-850 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-950 self-start lg:self-auto"
            >
              Analyze Another Resume
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="h-96 rounded-3xl animate-shimmer border border-slate-200/50 dark:border-slate-800/40 mt-8" />
        ) : !resume ? (
          <div className="glass-card rounded-[2rem] p-12 text-center border-slate-200/50 dark:border-slate-800/40 mt-8 max-w-xl mx-auto">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-950 text-slate-500 border border-slate-200/30 dark:border-slate-850/40">
              <ClipboardList className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-base font-bold text-slate-900 dark:text-white">No analyzed resume found</h3>
            <p className="mt-2 text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Upload your resume in PDF/DOCX format, wait for the processing to finish, and return here for insights.
            </p>
            <div className="mt-8">
              <Link href="/upload" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200">
                Upload Resume
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_1.9fr] items-start">
            
            {/* Left Column: Readiness Dial & Summary */}
            <div className="space-y-6">
              
              {/* Readiness Score Dial */}
              <div className="glass-card rounded-3xl p-6 border-slate-200/50 dark:border-slate-800/40 text-center flex flex-col items-center">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-4">
                  Internship Readiness Score
                </span>
                
                {/* SVG Dial */}
                <div className="relative h-36 w-36">
                  <svg className="h-full w-full -rotate-90">
                    <circle cx="72" cy="72" r="45" className="stroke-slate-100 dark:stroke-slate-950 fill-transparent" strokeWidth="9" />
                    <circle
                      cx="72"
                      cy="72"
                      r="45"
                      className="fill-transparent stroke-indigo-600 transition-all duration-500"
                      strokeWidth="9"
                      strokeDasharray={strokeDash}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">
                      {readinessScore}%
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 mt-0.5">READY</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-4 max-w-xs leading-relaxed">
                  This indicator models your alignment with entry-level job roles based on skills, project work, and degree profile.
                </p>
              </div>

              {/* AI Summary Card */}
              <div className="glass-card rounded-3xl p-6 border-slate-200/50 dark:border-slate-800/40">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-indigo-500" style={{ fill: 'currentColor' }} />
                  AI Summary
                </h3>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {resume.summary || 'An AI-extracted summary of your accomplishments and professional profile is processing.'}
                </p>
              </div>

            </div>

            {/* Right Column: Interactive Tabbed Details */}
            <div className="space-y-6">
              
              {/* Tab Switchers */}
              <div className="flex border-b border-slate-200 dark:border-slate-850 gap-2">
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
                      className={`pb-3 text-xs font-bold transition-all border-b-2 px-3 ${
                        isActive
                          ? 'border-indigo-600 text-indigo-600 dark:border-sky-400 dark:text-sky-400'
                          : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* Tab Content Panels */}
              <div className="space-y-6 animate-fadeIn">
                
                {/* Tab: ATS */}
                {activeTab === 'ats' && (
                  <div className="space-y-6">
                    {/* Strengths */}
                    <div className="rounded-2xl border border-emerald-200/40 bg-emerald-500/5 p-5 text-xs text-emerald-700 dark:text-emerald-300">
                      <h4 className="font-extrabold uppercase tracking-wider mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        Key Professional Strengths
                      </h4>
                      <ul className="space-y-2.5 font-medium">
                        {resume.insights?.strengths?.length ? (
                          resume.insights.strengths.map((str, i) => (
                            <li key={i} className="flex gap-2 items-start">
                              <span className="shrink-0">•</span>
                              <span>{str}</span>
                            </li>
                          ))
                        ) : (
                          <li className="opacity-60">No strengths observations available.</li>
                        )}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div className="rounded-2xl border border-amber-200/40 bg-amber-500/5 p-5 text-xs text-amber-700 dark:text-amber-300">
                      <h4 className="font-extrabold uppercase tracking-wider mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Areas for Improvement
                      </h4>
                      <ul className="space-y-2.5 font-medium">
                        {resume.insights?.weaknesses?.length ? (
                          resume.insights.weaknesses.map((weak, i) => (
                            <li key={i} className="flex gap-2 items-start">
                              <span className="shrink-0">•</span>
                              <span>{weak}</span>
                            </li>
                          ))
                        ) : (
                          <li className="opacity-60">No weaknesses observations available.</li>
                        )}
                      </ul>
                    </div>

                    {/* Suggestions */}
                    <div className="rounded-2xl border border-indigo-200/40 bg-indigo-500/5 p-5 text-xs text-indigo-700 dark:text-indigo-350">
                      <h4 className="font-extrabold uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-indigo-500" />
                        ATS Enhancement Suggestions
                      </h4>
                      <ul className="space-y-2.5 font-medium">
                        {resume.insights?.suggestions?.length ? (
                          resume.insights.suggestions.map((sug, i) => (
                            <li key={i} className="flex gap-2 items-start">
                              <span className="shrink-0">•</span>
                              <span>{sug}</span>
                            </li>
                          ))
                        ) : (
                          <li className="opacity-60">No formatting or phrasing suggestions.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Tab: Skills */}
                {activeTab === 'skills' && (
                  <div className="space-y-6">
                    {/* Extracted Skills */}
                    <div className="glass-card rounded-2xl p-5 border-slate-200/50 dark:border-slate-800/40">
                      <h4 className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400 mb-3 block">
                        Extracted Skill Tags
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {resume.skills?.length ? (
                          resume.skills.map((skill) => (
                            <span key={skill} className="rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200/30 dark:border-slate-850 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400">No skills parsed.</p>
                        )}
                      </div>
                    </div>

                    {/* Missing Skills Gap */}
                    <div className="rounded-2xl border border-rose-200/40 bg-rose-500/5 p-5 text-xs text-rose-700 dark:text-rose-300">
                      <h4 className="font-extrabold uppercase tracking-wider mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-rose-500" />
                        Identified Skill Gaps
                      </h4>
                      <p className="text-slate-500 mt-1 mb-4 leading-relaxed">
                        These skills are missing compared to popular target job profiles matching your experience level.
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {resume.insights?.missing_skills?.length ? (
                          resume.insights.missing_skills.map((skill) => (
                            <span key={skill} className="rounded-lg bg-rose-100 dark:bg-rose-950/40 border border-rose-200/30 px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-300">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <p className="text-emerald-600 dark:text-emerald-400 italic font-semibold">No critical skill gaps identified!</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Roadmap */}
                {activeTab === 'roadmap' && (
                  <div className="space-y-6">
                    {/* Recommended Projects */}
                    <div className="glass-card rounded-2xl p-5 border-slate-200/50 dark:border-slate-800/40">
                      <h4 className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400 mb-3 block">
                        Recommended Projects to Build
                      </h4>
                      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                        Add these practical project suggestions to your portfolio to showcase missing technical competencies.
                      </p>
                      <div className="space-y-3">
                        {resume.insights?.recommended_projects?.length ? (
                          resume.insights.recommended_projects.map((proj, i) => (
                            <div key={i} className="flex gap-3 items-start border border-slate-200/45 dark:border-slate-850 p-3.5 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-350 dark:hover:border-slate-800 transition">
                              <input type="checkbox" className="mt-0.5 rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500" />
                              <div className="font-semibold text-slate-700 dark:text-slate-300">
                                {proj}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400">No project suggestions generated.</p>
                        )}
                      </div>
                    </div>

                    {/* Recommended Certifications */}
                    <div className="glass-card rounded-2xl p-5 border-slate-200/50 dark:border-slate-800/40">
                      <h4 className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400 mb-3 block">
                        Recommended Certifications
                      </h4>
                      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                        Industry-recognized credentials that validate your skills on resume scanners.
                      </p>
                      <div className="space-y-3">
                        {resume.insights?.recommended_certifications?.length ? (
                          resume.insights.recommended_certifications.map((cert, i) => (
                            <div key={i} className="flex gap-3 items-start border border-slate-200/45 dark:border-slate-850 p-3.5 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-350 dark:hover:border-slate-800 transition">
                              <input type="checkbox" className="mt-0.5 rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500" />
                              <div className="font-semibold text-slate-700 dark:text-slate-300">
                                {cert}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400">No certification suggestions generated.</p>
                        )}
                      </div>
                    </div>

                  </div>
                )}

              </div>

              {/* Job matches CTA banner */}
              <div className="glass-card rounded-3xl p-6 border-slate-200/60 dark:border-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Explore Career Recommendations</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    See how your updated profile maps against ranked job matches.
                  </p>
                </div>
                <Link
                  href={`/matches?id=${resume.id}`}
                  className="shrink-0 inline-flex items-center gap-1 rounded-full bg-slate-900 px-5 py-3 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  View Ranked Jobs
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

            </div>

          </div>
        )}

      </div>
    </main>
  )
}

