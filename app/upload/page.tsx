'use client'

import { useMemo, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
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
  const uploadLabel = loading ? (statusMessage || 'Processing resume…') : 'Upload resume'

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

      console.log('Session:', session)
      console.log('User:', user)
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
          setSuccess(resumeData)
          setLoading(false)
          setStatusMessage('')
        } else if (resumeData.status === 'failed') {
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
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <NavBar />
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Upload your resume</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Drag and drop or browse a PDF resume to extract skills, experience, and insights.</p>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700 dark:bg-slate-950 dark:text-slate-200">
            {file ? file.name : 'No file selected'}
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <label
            htmlFor="resume-upload"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`group block cursor-pointer rounded-3xl border border-dashed px-6 py-16 text-center transition ${dragActive ? 'border-slate-500 bg-slate-100 dark:border-slate-500 dark:bg-slate-900' : 'border-slate-300 bg-slate-50 hover:border-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-500 dark:hover:bg-slate-900'}`}
          >
            <UploadCloud className="mx-auto h-10 w-10 text-slate-500 transition group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-slate-100" />
            <p className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Drag & drop your PDF or DOCX resume</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Only PDF and DOCX files are supported. Max size 8MB.</p>
            <input id="resume-upload" type="file" accept=".pdf,.docx" onChange={handleFileChange} className="sr-only" />
          </label>

          {progress > 0 && (
            <div className="overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="h-2 rounded-full bg-slate-900 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          )}

          {loading && statusMessage && (
            <p className="text-center text-sm font-medium text-slate-600 dark:text-slate-400 mt-2">
              {statusMessage}
            </p>
          )}

          {error && (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
              <AlertTriangle className="mr-2 inline-block h-4 w-4" /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canUpload}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {uploadLabel}
          </button>
        </form>

        {success && analysis && (
          <section className="mt-10 space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <p className="font-semibold">Resume processed successfully.</p>
              </div>
              <p className="mt-3 text-slate-600 dark:text-slate-400">Below is the structured data extracted from your resume.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <ScoreCard label="ATS Score" value={success.scores?.ats_score ?? 0} />
              <ScoreCard label="Skill Score" value={success.scores?.skill_score ?? 0} />
              <ScoreCard label="Overall Score" value={success.scores?.overall_score ?? 0} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">Contact</h2>
                <p className="mt-3 text-slate-600 dark:text-slate-400">Name: {analysis.name || 'N/A'}</p>
                <p className="mt-2 text-slate-600 dark:text-slate-400">Email: {analysis.email || 'N/A'}</p>
                <p className="mt-2 text-slate-600 dark:text-slate-400">Phone: {analysis.phone || 'N/A'}</p>
                <p className="mt-2 text-slate-600 dark:text-slate-400">LinkedIn: {analysis.linkedin || 'N/A'}</p>
                <p className="mt-2 text-slate-600 dark:text-slate-400">GitHub: {analysis.github || 'N/A'}</p>
                <p className="mt-2 text-slate-600 dark:text-slate-400">Portfolio: {analysis.portfolio || 'N/A'}</p>
                <p className="mt-2 text-slate-600 dark:text-slate-400">Location: {analysis.location || 'N/A'}</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">Skills</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {analysis.skills.length ? (
                    analysis.skills.map((skill) => (
                      <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-slate-600 dark:text-slate-400">No skills extracted.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <ResumeDataCard title="Education" items={analysis.education?.map((item) => item.text) ?? []} />
              <ResumeDataCard title="Projects" items={analysis.projects?.map((item) => item.text) ?? []} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <ResumeDataCard title="Experience" items={analysis.experience?.map((item) => item.text) ?? []} />
              <ResumeDataCard title="Certifications" items={analysis.certifications?.map((item) => item.name || item.text || '') ?? []} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <InsightCard title="Strengths" items={success.insights?.strengths ?? []} />
              <InsightCard title="Weaknesses" items={success.insights?.weaknesses ?? []} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <InsightCard title="Missing Skills" items={success.insights?.missing_skills ?? []} />
              <InsightCard title="Suggestions" items={success.insights?.suggestions ?? []} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <InsightCard title="Recommended Certifications" items={success.insights?.recommended_certifications ?? []} />
              <InsightCard title="Recommended Projects" items={success.insights?.recommended_projects ?? []} />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">Job Matches</h2>
              <div className="mt-4 space-y-4">
                {success.job_matches?.length ? (
                  success.job_matches.map((job) => (
                    <div key={job.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold text-slate-950 dark:text-slate-100">{job.title}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{job.company || 'Unknown Company'} · {job.location || 'Remote'}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">{job.score}</span>
                      </div>
                      <p className="mt-3 text-slate-600 dark:text-slate-400">{job.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-600 dark:text-slate-400">No job matches were generated yet.</p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

function ResumeDataCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">{title}</h2>
      <div className="mt-4 space-y-3 text-slate-600 dark:text-slate-400">
        {items.length ? items.map((item, index) => <p key={`${title}-${index}`}>{item}</p>) : <p>No data found.</p>}
      </div>
    </div>
  )
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-4 text-3xl font-bold text-slate-950 dark:text-slate-100">{value}</p>
    </div>
  )
}

function InsightCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">{title}</h2>
      <div className="mt-4 space-y-3 text-slate-600 dark:text-slate-400">
        {items.length ? items.map((item, index) => <p key={`${title}-${index}`}>{item}</p>) : <p>No insights available.</p>}
      </div>
    </div>
  )
}
