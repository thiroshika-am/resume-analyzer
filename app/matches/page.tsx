'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Search, MapPin, Sliders, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, BookOpen, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import NavBar from '../../components/NavBar'
import { supabase } from '../../lib/supabaseClient'
import { JobMatch, ResumeSummary } from '../../types'

export default function MatchesPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400 animate-pulse font-semibold">Loading job matches...</p>
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
      <NavBar />

      <div className="mx-auto max-w-6xl px-6 mt-12">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8 border-white/5"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">
                AI Alignment Analysis
              </span>
              <h1 className="text-2xl font-semibold tracking-tight text-white mt-1">
                Personalized Job Matches
              </h1>
              <p className="mt-2 text-xs text-slate-400 font-normal">
                Opportunities ranked by skill match score using resume analysis {resume ? `for "${resume.filename}"` : ''}.
              </p>
            </div>
            <Link 
              href="/dashboard" 
              className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-white/[0.05] active:scale-95 duration-100 shadow-sm"
            >
              Back to Dashboard
            </Link>
          </div>
        </motion.div>

        {/* Filters Controls Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6 border-white/5 mt-8 grid gap-6 md:grid-cols-3 items-end shadow-md"
        >
          
          {/* Keyword Search */}
          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 pl-0.5">Search Roles & Companies</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Frontend, Synthetix..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/5 bg-white/[0.01] text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/10"
              />
            </div>
          </div>

          {/* Location Type Filter */}
          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 pl-0.5">Workplace Location</label>
            <div className="flex rounded-lg bg-white/[0.02] border border-white/5 p-1">
              {['All', 'Remote', 'Hybrid', 'On-site'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setLocationType(type)}
                  className={`flex-1 py-1.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all ${
                    locationType === type
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-405 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Match Score Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-0.5">
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Min Match Score</label>
              <span className="text-xs font-bold text-white">{minScore}%</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={minScore}
                onChange={(e) => setMinScore(parseInt(e.target.value, 10))}
                className="flex-1 accent-white cursor-pointer h-1.5 bg-white/[0.04] rounded-lg border border-white/5"
              />
            </div>
          </div>

        </motion.div>

        {/* Job Matches Feed */}
        <section className="mt-8 space-y-4">
          {loading ? (
            <div className="space-y-4">
              <div className="h-32 rounded-2xl animate-shimmer border border-white/5" />
              <div className="h-32 rounded-2xl animate-shimmer border border-white/5" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-6 text-xs text-slate-300 font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-slate-400 shrink-0" />
              {error}
            </div>
          ) : filteredMatches.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card rounded-2xl p-12 text-center shadow-md"
            >
              <Sliders className="h-8 w-8 text-slate-500 mx-auto" />
              <h3 className="mt-6 text-sm font-bold text-white uppercase tracking-wider">No matches found</h3>
              <p className="mt-2 text-xs text-slate-450 max-w-md mx-auto leading-relaxed font-normal">
                Adjust your filters. If you haven&apos;t uploaded a resume, upload one first.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              layout 
              className="space-y-4"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
            >
              {filteredMatches.map((job) => {
                const score = Math.round(job.match_percentage ?? job.score)
                const isExpanded = expandedJobId === job.id
                
                const allResumeSkills = resume?.skills || []
                const missingSkillsList = job.missing_skills || []
                
                const descLower = (job.description || '').toLowerCase()
                const titleLower = job.title.toLowerCase()
                const matchingSkills = allResumeSkills.filter(
                  (skill) => 
                    (descLower.includes(skill.toLowerCase()) || titleLower.includes(skill.toLowerCase())) &&
                    !missingSkillsList.some((m) => m.toLowerCase() === skill.toLowerCase())
                )

                return (
                  <motion.article 
                    layout="position"
                    key={job.id} 
                    variants={{
                      hidden: { y: 15, opacity: 0 },
                      visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 90, damping: 18 } }
                    }}
                    className={`glass-card rounded-2xl border border-white/5 transition-all duration-300 shadow-sm overflow-hidden ${
                      isExpanded ? 'border-white/20' : 'hover:border-white/10'
                    }`}
                  >
                    <div 
                      onClick={() => toggleExpand(job.id)}
                      className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <h2 className="text-base font-bold text-white truncate">{job.title}</h2>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-400 items-center">
                          <span className="font-bold">{job.company}</span>
                          <span className="text-white/10">•</span>
                          <span className="flex items-center gap-1 font-normal text-slate-400">
                            <MapPin className="h-3.5 w-3.5" />
                            {job.location || 'Remote'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end md:self-auto shrink-0">
                        <MiniMatchDial score={score} />
                        
                        <div className="text-slate-400 bg-white/[0.02] border border-white/5 p-2 rounded-lg active:scale-95 duration-100">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        </div>
                      </div>
                    </div>

                    {/* Drawer Content */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="border-t border-white/5 bg-white/[0.005] rounded-b-2xl"
                        >
                          <div className="p-6 space-y-6">
                            {/* Description */}
                            <div className="space-y-2.5">
                              <h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-400 border-b border-white/5 pb-2">Job Description</h4>
                              <p className="text-xs leading-relaxed text-slate-300 font-normal whitespace-pre-line">
                                {job.description}
                              </p>
                            </div>

                            {/* Skills Alignment */}
                            <div className="grid gap-6 md:grid-cols-2">
                              
                              {/* Matching Skills */}
                              <div className="space-y-3.5">
                                <h4 className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 text-slate-300">
                                  <CheckCircle2 className="h-4 w-4 text-slate-405" />
                                  Matching Skills ({matchingSkills.length})
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                  {matchingSkills.length > 0 ? (
                                    matchingSkills.map((skill) => (
                                      <span 
                                        key={skill} 
                                        className="rounded bg-white/[0.03] border border-white/10 px-2.5 py-1 text-xs font-bold text-slate-300 shadow-sm"
                                      >
                                        {skill}
                                      </span>
                                    ))
                                  ) : (
                                    <p className="text-xs text-slate-500 italic">No matching skills identified.</p>
                                  )}
                                </div>
                              </div>

                              {/* Missing Skills */}
                              <div className="space-y-3.5">
                                <h4 className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 text-slate-300">
                                  <AlertTriangle className="h-4 w-4 text-slate-500" />
                                  Missing Skills ({missingSkillsList.length})
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                  {missingSkillsList.length > 0 ? (
                                    missingSkillsList.map((skill) => (
                                      <span 
                                        key={skill} 
                                        className="rounded bg-white/[0.02] border border-white/5 px-2.5 py-1 text-xs font-bold text-slate-405 shadow-sm"
                                      >
                                        {skill}
                                      </span>
                                    ))
                                  ) : (
                                    <p className="text-xs text-slate-400 italic font-bold">All skills matched! Perfect alignment.</p>
                                  )}
                                </div>
                              </div>

                            </div>

                            {/* Learning Recommendations */}
                            {job.learning_recommendations && job.learning_recommendations.length > 0 && (
                              <div className="space-y-4 pt-2">
                                <h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 pl-0.5 border-b border-white/5 pb-2">
                                  <BookOpen className="h-4 w-4" />
                                  Target Learning Roadmap
                                </h4>
                                <div className="space-y-2">
                                  {job.learning_recommendations.map((rec, i) => {
                                    const key = `${job.id}-${i}`
                                    const isChecked = !!checkedRoadmapItems[key]
                                    return (
                                      <div 
                                        key={i} 
                                        onClick={() => handleToggleRoadmap(key)}
                                        className="flex gap-3 items-center border border-white/5 p-3.5 rounded-lg text-xs bg-white/[0.01] hover:border-white/10 transition-all duration-200 cursor-pointer select-none"
                                      >
                                        <input 
                                          type="checkbox" 
                                          checked={isChecked}
                                          onChange={() => {}} 
                                          className="h-4 w-4 rounded border-white/10 text-white focus:ring-slate-500 cursor-pointer bg-white/[0.01]" 
                                        />
                                        <div className={`font-semibold transition-all ${
                                          isChecked 
                                            ? 'text-slate-500 line-through' 
                                            : 'text-slate-300'
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
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </motion.article>
                )
              })}
            </motion.div>
          )}
        </section>

      </div>
    </main>
  )
}

function MiniMatchDial({ score }: { score: number }) {
  const [currentScore, setCurrentScore] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentScore(score)
    }, 100)
    return () => clearTimeout(timer)
  }, [score])

  const radius = 16
  const strokeDash = 2 * Math.PI * radius
  const offset = strokeDash - (currentScore / 100) * strokeDash

  return (
    <div className="relative h-11 w-11 flex items-center justify-center shrink-0 bg-white/[0.02] rounded-full border border-white/5 shadow-inner">
      <svg className="h-full w-full -rotate-90 scale-90">
        <circle cx="22" cy="22" r={radius} className="stroke-white/5 fill-transparent" strokeWidth="2" />
        <circle
          cx="22"
          cy="22"
          r={radius}
          className="fill-transparent stroke-white transition-all duration-1000 ease-out"
          strokeWidth="2"
          strokeDasharray={strokeDash}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[9px] font-bold text-white">
          {score}%
        </span>
      </div>
    </div>
  )
}
