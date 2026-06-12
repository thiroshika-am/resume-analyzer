'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Search, MapPin, Sliders, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, BookOpen, ArrowRight } from 'lucide-react'
import NavBar from '../../components/NavBar'
import { supabase } from '../../lib/supabaseClient'
import { JobMatch, ResumeSummary } from '../../types'

export default function MatchesPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500 animate-pulse font-semibold">Loading Job Matches...</p>
      </main>
    }>
      <MatchesPageContent />
    </Suspense>
  )
}

function MatchesPageContent() {
  const searchParams = useSearchParams()
  const queryId = searchParams.get('id')

  const [matches, setMatches] = useState<JobMatch[]>([])
  const [resume, setResume] = useState<ResumeSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [locationType, setLocationType] = useState<string>('All')
  const [minScore, setMinScore] = useState<number>(50)
  
  // Accordion Expand State
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null)
  
  // Checkbox tracker for learning recommendations
  const [checkedRoadmapItems, setCheckedRoadmapItems] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const session = await supabase.auth.getSession()
        const jwt = session.data.session?.access_token
        if (!jwt) throw new Error('Please sign in to view job matches.')

        const resumeResponse = await fetch('/api/user/resumes', {
          headers: { Authorization: `Bearer ${jwt}` },
        })
        if (!resumeResponse.ok) {
          throw new Error('Failed to load user resumes.')
        }
        const userResumes = await resumeResponse.json()
        if (!Array.isArray(userResumes) || !userResumes.length) {
          setMatches([])
          return
        }

        let selectedResume = userResumes[0]
        if (queryId) {
          const matched = userResumes.find((r: any) => r.id === parseInt(queryId, 10))
          if (matched) selectedResume = matched
        }
        setResume(selectedResume)

        const response = await fetch(`/api/jobs/${selectedResume.id}/matches`, {
          headers: { Authorization: `Bearer ${jwt}` },
        })
        if (!response.ok) {
          const payload = await response.json()
          throw new Error(payload.detail || 'Failed to load job matches.')
        }
        const data = await response.json()
        if (Array.isArray(data)) {
          setMatches(data)
        } else {
          setMatches([])
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [queryId])

  const toggleExpand = (jobId: number) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId)
  }

  const handleToggleRoadmap = (key: string) => {
    setCheckedRoadmapItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // Derived filtered matches
  const filteredMatches = useMemo(() => {
    return matches.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.description || '').toLowerCase().includes(searchQuery.toLowerCase())

      const matchesLocation =
        locationType === 'All' ||
        (locationType === 'Remote' && (job.location || '').toLowerCase().includes('remote')) ||
        (locationType === 'Hybrid' && (job.location || '').toLowerCase().includes('hybrid')) ||
        (locationType === 'On-site' &&
          !(job.location || '').toLowerCase().includes('remote') &&
          !(job.location || '').toLowerCase().includes('hybrid'))

      const matchesScore = (job.match_percentage ?? job.score) >= minScore

      return matchesSearch && matchesLocation && matchesScore
    })
  }, [matches, searchQuery, locationType, minScore])

  return (
    <main className="min-h-screen relative overflow-hidden pb-16">
      {/* Background radial blurs */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-indigo-500/5 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-72 w-72 rounded-full bg-sky-500/5 blur-[120px]" />

      <NavBar />

      <div className="mx-auto max-w-6xl px-6 mt-8">
        
        {/* Header Section */}
        <div className="glass-card rounded-[2rem] p-8 shadow-card border-slate-200/50 dark:border-slate-800/40">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="text-xs font-semibold text-indigo-600 dark:text-sky-400 tracking-wider uppercase">
                AI Alignment Analysis
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
                Personalized Job Matches
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Opportunities ranked by skill match score using resume analysis {resume ? `for "${resume.filename}"` : ''}.
              </p>
            </div>
            <Link 
              href="/dashboard" 
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-xs font-semibold text-slate-950 transition hover:bg-slate-50 dark:border-slate-850 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-950 self-start lg:self-auto"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Filters Controls Panel */}
        <div className="glass-card rounded-3xl p-6 border-slate-200/50 dark:border-slate-800/40 mt-8 grid gap-6 md:grid-cols-3 items-end">
          
          {/* Keyword Search */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Search Roles & Companies</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Frontend, Synthetix..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Location Type Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Workplace Location</label>
            <div className="flex rounded-xl bg-slate-50/60 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 p-1">
              {['All', 'Remote', 'Hybrid', 'On-site'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setLocationType(type)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    locationType === type
                      ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-900 dark:text-white'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Match Score Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Min Match Score</label>
              <span className="text-xs font-black text-indigo-600 dark:text-sky-400">{minScore}%</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={minScore}
                onChange={(e) => setMinScore(parseInt(e.target.value, 10))}
                className="flex-1 accent-indigo-600 cursor-pointer h-1 bg-slate-200 rounded-lg dark:bg-slate-800"
              />
            </div>
          </div>

        </div>

        {/* Job Matches Feed */}
        <section className="mt-8 space-y-4">
          {loading ? (
            <div className="space-y-4">
              <div className="h-32 rounded-3xl animate-shimmer border border-slate-200/50 dark:border-slate-800/40" />
              <div className="h-32 rounded-3xl animate-shimmer border border-slate-200/50 dark:border-slate-800/40" />
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-500/5 p-8 text-xs text-rose-700 dark:text-rose-300 font-medium">
              {error}
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="glass-card rounded-[2rem] p-12 text-center border-slate-200/50 dark:border-slate-800/40">
              <Sliders className="h-10 w-10 text-slate-400 mx-auto" />
              <h3 className="mt-6 text-base font-bold text-slate-900 dark:text-white">No matching opportunities found</h3>
              <p className="mt-2 text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Adjust your filters or query strings. If you haven&apos;t uploaded a resume, proceed to the upload page first.
              </p>
            </div>
          ) : (
            filteredMatches.map((job) => {
              const score = Math.round(job.match_percentage ?? job.score)
              const isExpanded = expandedJobId === job.id
              
              // Calculate matching skills: intersection of resume skills and job requirements.
              // Since the API sends missing skills, any skills in the job description or title
              // that are also on the resume are matching.
              const allResumeSkills = resume?.skills || []
              const missingSkillsList = job.missing_skills || []
              
              // Deduce matching skills
              const descLower = (job.description || '').toLowerCase()
              const titleLower = job.title.toLowerCase()
              const matchingSkills = allResumeSkills.filter(
                (skill) => 
                  (descLower.includes(skill.toLowerCase()) || titleLower.includes(skill.toLowerCase())) &&
                  !missingSkillsList.some((m) => m.toLowerCase() === skill.toLowerCase())
              )

              return (
                <article 
                  key={job.id} 
                  className={`glass-card rounded-3xl border border-slate-200/50 dark:border-slate-800/40 transition-all ${
                    isExpanded ? 'ring-1 ring-indigo-500/30' : 'hover:border-slate-350 dark:hover:border-slate-700/60'
                  }`}
                >
                  <div 
                    onClick={() => toggleExpand(job.id)}
                    className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
                  >
                    <div className="space-y-1">
                      <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{job.title}</h2>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 items-center">
                        <span className="font-semibold">{job.company}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location || 'Remote'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end md:self-auto">
                      {/* Match Dial Mini Progress Bar */}
                      <div className="text-right">
                        <span className={`inline-block rounded-lg px-2.5 py-1 text-xs font-black ${
                          score >= 80 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                            : score >= 65 
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                          {score}% Match
                        </span>
                        
                        {/* Progress Bar Container */}
                        <div className="w-24 bg-slate-100 dark:bg-slate-950 rounded-full h-1 mt-2">
                          <div 
                            className={`h-1 rounded-full ${
                              score >= 80 
                                ? 'bg-emerald-500' 
                                : score >= 65 
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-slate-400">
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Drawer Content */}
                  {isExpanded && (
                    <div className="border-t border-slate-200/40 dark:border-slate-850/50 p-6 bg-slate-50/20 dark:bg-slate-950/20 rounded-b-3xl space-y-6 animate-fadeIn">
                      
                      {/* Description */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Job Description</h4>
                        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
                          {job.description}
                        </p>
                      </div>

                      {/* Skills Alignment */}
                      <div className="grid gap-6 md:grid-cols-2">
                        
                        {/* Matching Skills */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-4.5 w-4.5" />
                            Matching Skills ({matchingSkills.length})
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {matchingSkills.length > 0 ? (
                              matchingSkills.map((skill) => (
                                <span 
                                  key={skill} 
                                  className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300"
                                >
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <p className="text-xs text-slate-400 italic">No exact matching skills found.</p>
                            )}
                          </div>
                        </div>

                        {/* Missing Skills */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 text-rose-600 dark:text-rose-450">
                            <AlertTriangle className="h-4.5 w-4.5" />
                            Missing Skills ({missingSkillsList.length})
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {missingSkillsList.length > 0 ? (
                              missingSkillsList.map((skill) => (
                                <span 
                                  key={skill} 
                                  className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-350"
                                >
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <p className="text-xs text-emerald-600 dark:text-emerald-450 italic font-semibold">All skills matched! Excellent alignment.</p>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Learning Recommendations */}
                      {job.learning_recommendations && job.learning_recommendations.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                            <BookOpen className="h-4.5 w-4.5 text-indigo-500" />
                            Bridge the Skills Gap (Roadmap)
                          </h4>
                          <div className="space-y-2">
                            {job.learning_recommendations.map((rec, i) => {
                              const key = `${job.id}-${i}`
                              const isChecked = !!checkedRoadmapItems[key]
                              return (
                                <div 
                                  key={i} 
                                  onClick={() => handleToggleRoadmap(key)}
                                  className="flex gap-3 items-start border border-slate-200/40 dark:border-slate-850 p-3.5 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-350 dark:hover:border-slate-800 transition cursor-pointer select-none"
                                >
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked}
                                    onChange={() => {}} // handled by click container
                                    className="mt-0.5 rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                                  />
                                  <div className={`font-semibold transition ${
                                    isChecked 
                                      ? 'text-slate-400 dark:text-slate-550 line-through' 
                                      : 'text-slate-700 dark:text-slate-300'
                                  }`}>
                                    {rec}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                </article>
              )
            })
          )}
        </section>

      </div>
    </main>
  )
}

