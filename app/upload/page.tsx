'use client'

import { useMemo, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UploadCloud, Loader2, CheckCircle2, AlertTriangle, User, Mail, Phone, MapPin, Award, CheckCircle, ArrowRight, Zap, Target, BookOpen } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import NavBar from '../../components/NavBar'
import { UploadResumeResponse, ResumeAnalysis } from '../../types/resume'
import { getSessionAndUser } from '../../lib/auth'

export default function UploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<UploadResumeResponse | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  const canUpload = !!file && !loading && !sessionLoading && !!userEmail
  const uploadLabel = loading ? (statusMessage || 'Analyzing Document…') : 'Upload Resume'

  const validateFile = (selected: File) => {
    const allowedExtensions = ['.pdf', '.docx']
    const fileName = selected.name.toLowerCase()
    const isValidType = allowedExtensions.some((ext) => fileName.endsWith(ext))

    if (!isValidType) {
      setError('Please upload a PDF or DOCX file.')
      setFile(null)
      return false
    }

    if (selected.size > 8 * 1024 * 1024) {
      setError('Resume must be smaller than 8MB.')
      setFile(null)
      return false
    }

    setFile(selected)
    return true
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    setSuccess(null)
    const selected = event.target.files?.[0] ?? null
    if (selected) {
      validateFile(selected)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)
    setError('')
    setSuccess(null)

    const selected = event.dataTransfer.files?.[0] ?? null
    if (selected) {
      validateFile(selected)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)
  }

  useEffect(() => {
    const loadAuth = async () => {
      setSessionLoading(true)
      const { session, user, error } = await getSessionAndUser()

      if (error) {
        setError('Failed to retrieve authentication session.')
        setSessionLoading(false)
        return
      }

      if (!session) {
        router.push('/auth')
        return
      }

      setUserEmail(user?.email ?? null)
      setSessionLoading(false)
    }

    loadAuth()
  }, [router])

  useEffect(() => {
    if (loading) {
      window.dispatchEvent(new CustomEvent('bg-state', { detail: { state: 'scanning' } }))
    }
  }, [loading])

  const pollResumeStatus = (resumeId: number, token: string) => {
    const pollInterval = 2000
    let consecutiveErrors = 0

    const poll = async () => {
      try {
        const response = await fetch(`/api/resumes/${resumeId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch processing status.')
        }

        const resumeData = await response.json()
        consecutiveErrors = 0

        setProgress(resumeData.progress ?? 30)
        setStatusMessage(resumeData.processing_stage || 'Processing resume...')

        if (resumeData.status === 'completed') {
          window.dispatchEvent(new CustomEvent('bg-state', { detail: { state: 'success' } }))
          setSuccess(resumeData)
          setLoading(false)
          setStatusMessage('')
        } else if (resumeData.status === 'failed') {
          window.dispatchEvent(new CustomEvent('bg-state', { detail: { state: 'idle' } }))
          setError(resumeData.processing_stage || 'Failed to process resume.')
          setLoading(false)
          setStatusMessage('')
        } else {
          setTimeout(poll, pollInterval)
        }
      } catch (err: any) {
        console.error('Error during polling:', err)
        consecutiveErrors++
        if (consecutiveErrors >= 5) {
          window.dispatchEvent(new CustomEvent('bg-state', { detail: { state: 'idle' } }))
          setError('Lost connection to server while processing resume.')
          setLoading(false)
          setStatusMessage('')
        } else {
          setTimeout(poll, pollInterval)
        }
      }
    }

    setTimeout(poll, pollInterval)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess(null)

    if (!file) {
      setError('Please select a PDF resume to upload.')
      return
    }

    setLoading(true)
    setProgress(10)
    setStatusMessage('Uploading resume...')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const sessionResult = await getSessionAndUser()
      if (!sessionResult.session) {
        router.push('/auth')
        return
      }

      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${sessionResult.session.access_token}`,
        },
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        setError(body?.detail || 'Resume upload failed. Please try again.')
        setLoading(false)
        setProgress(0)
        setStatusMessage('')
        return
      }

      const data = await response.json()
      setProgress(25)
      setStatusMessage('Upload complete. Starting background analysis...')
      pollResumeStatus(data.resume_id, sessionResult.session.access_token)
    } catch (err: any) {
      console.error('Upload failed', err)
      setError(err?.message || 'Network error while uploading resume.')
      setProgress(0)
      setLoading(false)
      setStatusMessage('')
    }
  }

  const analysis = useMemo<ResumeAnalysis | null>(() => success?.analysis ?? null, [success])

  return (
    <main className="min-h-screen relative overflow-hidden pb-16">
      <NavBar />

      <div className="mx-auto max-w-4xl px-6 mt-12">
        <motion.div 
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="glass-card rounded-2xl p-8 md:p-10 shadow-xl relative overflow-hidden"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                Document Ingestion
              </span>
              <h1 className="text-2xl font-semibold tracking-tight text-white mt-1">Upload Resume</h1>
              <p className="mt-2 text-xs text-slate-400 font-normal">
                Drop your PDF or DOCX file here. Analysis is secure and maps metadata parameters instantly.
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.02] border border-white/5 px-4 py-2 text-xs text-slate-300 font-bold max-w-xs truncate">
              {file ? file.name : 'No file selected'}
            </div>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <label
              htmlFor="resume-upload"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative group block cursor-pointer rounded-xl border border-dashed px-6 py-14 text-center transition-all duration-350 overflow-hidden ${
                dragActive 
                  ? 'border-white/40 bg-white/[0.02] shadow-sm' 
                  : 'border-white/10 hover:border-white/20 bg-white/[0.01] hover:bg-white/[0.02]'
              }`}
            >
              {/* Silver scanning sweep */}
              {loading && (
                <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent animate-thin-scan pointer-events-none" />
              )}

              <UploadCloud className="mx-auto h-10 w-10 text-slate-500 group-hover:text-white transition-colors duration-200" />
              <p className="mt-4 text-xs font-bold text-white uppercase tracking-wider">
                Drag and drop your file here
              </p>
              <p className="mt-2 text-xs text-slate-500 font-normal">
                PDF and DOCX supported. Max size 8MB.
              </p>
              <input id="resume-upload" type="file" accept=".pdf,.docx" onChange={handleFileChange} className="sr-only" />
            </label>

            <AnimatePresence>
              {progress > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2.5"
                >
                  <div className="overflow-hidden rounded-full bg-white/[0.02] p-0.5 border border-white/5">
                    <motion.div 
                      className="h-1 rounded-full bg-white/80"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  {statusMessage && (
                    <p className="text-center text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                      {statusMessage} ({progress}%)
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 text-xs font-semibold text-slate-300 flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-slate-400" /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!canUpload}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-white text-slate-950 hover:bg-slate-100 py-3.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 active:scale-95 duration-100 shadow-sm"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              {uploadLabel}
            </button>
          </form>
        </motion.div>

        {/* Results Overview */}
        <AnimatePresence>
          {success && analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 90, damping: 18 }}
              className="mt-10 space-y-8"
            >
              {/* Success Banner */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 flex gap-4 items-start shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-white shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Analysis Complete</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400 font-normal">
                    Parsing parameters successfully indexed. Document data metrics have been categorized below.
                  </p>
                </div>
              </div>

              {/* Muted Silver Score Dials */}
              <div className="grid gap-4 sm:grid-cols-3">
                <ScoreCard label="ATS Structure Score" value={success.scores?.ats_score ?? 0} />
                <ScoreCard label="Skill Alignment" value={success.scores?.skill_score ?? 0} />
                <ScoreCard label="Overall Benchmark" value={success.scores?.overall_score ?? 0} />
              </div>

              {/* Grid Content */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="glass-card rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b border-white/5 pb-2">
                    <User className="h-4 w-4" />
                    Identity Parameters
                  </h3>
                  <div className="space-y-3 text-xs text-slate-300 font-normal">
                    <p className="flex justify-between"><span>Name:</span> <span className="font-bold text-white">{analysis.name || 'N/A'}</span></p>
                    <p className="flex justify-between"><span>Email:</span> <span className="font-bold text-white">{analysis.email || 'N/A'}</span></p>
                    <p className="flex justify-between"><span>Phone:</span> <span className="font-bold text-white">{analysis.phone || 'N/A'}</span></p>
                    <p className="flex justify-between"><span>Location:</span> <span className="font-bold text-white">{analysis.location || 'N/A'}</span></p>
                    <p className="flex justify-between"><span>LinkedIn:</span> <span className="font-bold text-white">{analysis.linkedin || 'N/A'}</span></p>
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b border-white/5 pb-2">
                    <Zap className="h-4 w-4" />
                    Primary Indexed Skills ({analysis.skills.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                    {analysis.skills.length ? (
                      analysis.skills.map((skill) => (
                        <span key={skill} className="rounded bg-white/[0.03] border border-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No skills indexed.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Blocks */}
              <div className="grid gap-6 md:grid-cols-2">
                <ResumeDataCard title="Education Credentials" items={analysis.education?.map((item) => item.text) ?? []} />
                <ResumeDataCard title="Key Projects" items={analysis.projects?.map((item) => item.text) ?? []} />
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid gap-6 md:grid-cols-2">
                <InsightCard title="ATS Design Strengths" items={success.insights?.strengths ?? []} type="info" />
                <InsightCard title="ATS Structural Gaps" items={success.insights?.weaknesses ?? []} type="warning" />
              </div>

              {/* Missing Skills & Recommendations */}
              <div className="grid gap-6 md:grid-cols-2">
                <InsightCard title="Missing Skill Tags" items={success.insights?.missing_skills ?? []} type="warning" />
                <InsightCard title="Advisor Recommendations" items={success.insights?.suggestions ?? []} type="info" />
              </div>

              {/* Career Roadmaps */}
              <div className="grid gap-6 md:grid-cols-2">
                <InsightCard title="Target Certifications" items={success.insights?.recommended_certifications ?? []} type="info" />
                <InsightCard title="Suggested Projects" items={success.insights?.recommended_projects ?? []} type="info" />
              </div>

              {/* Job Recommendations CTA */}
              <div className="glass-card rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-white/5">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Ranked Job Opportunities</h3>
                  <p className="text-xs text-slate-400 mt-1 font-normal">
                    AI matching indices have generated open alignment matches for your resume.
                  </p>
                </div>
                <Link
                  href={`/matches?id=${success.id}`}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-white hover:bg-slate-100 px-5 py-3 text-xs font-bold text-slate-950 transition active:scale-95 duration-100 shadow-sm"
                >
                  View Open Matches
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}

function ResumeDataCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="glass-card rounded-2xl p-6 shadow-sm space-y-4">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-white/5 pb-2">{title}</h3>
      <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-semibold">
        {items.length ? items.map((item, index) => <p key={`${title}-${index}`} className="pb-3 border-b border-white/[0.02] last:border-b-0 last:pb-0">{item}</p>) : <p className="italic text-slate-500">No records parsed.</p>}
      </div>
    </div>
  )
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass-card rounded-2xl p-6 shadow-sm flex flex-col justify-between items-center text-center">
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <div className="mt-4 text-3xl font-bold text-white">
        <AnimatedNumber value={value} />
      </div>
    </div>
  )
}

function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    let start = 0
    const end = value
    if (start === end) return

    const totalMs = duration
    const stepMs = 30
    const totalSteps = totalMs / stepMs
    const increment = (end - start) / totalSteps

    let step = 0
    const timer = setInterval(() => {
      step++
      if (step >= totalSteps) {
        setCurrent(end)
        clearInterval(timer)
      } else {
        setCurrent(Math.floor(start + increment * step))
      }
    }, stepMs)

    return () => clearInterval(timer)
  }, [value, duration])

  return <span>{current}</span>
}

function InsightCard({ title, items, type }: { title: string; items: string[]; type: 'warning' | 'info' }) {
  const containerStyles = 'rounded-2xl border border-white/5 bg-white/[0.01] p-6 shadow-sm'

  return (
    <div className={containerStyles}>
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-white/5 pb-2 mb-3.5">{title}</h4>
      <div className="space-y-2 text-xs font-semibold leading-relaxed text-slate-300">
        {items.length ? items.map((item, idx) => (
          <p key={idx} className="flex gap-2 items-start opacity-90">
            <span className="text-slate-500 shrink-0">•</span> <span>{item}</span>
          </p>
        )) : <p className="italic text-slate-500">No data generated.</p>}
      </div>
    </div>
  )
}
