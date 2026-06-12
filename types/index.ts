export interface ResumeSummary {
  id: number
  user_id: string
  filename: string
  extracted_text: string
  summary?: string
  uploaded_at: string
  skills: string[]
}

export interface JobMatch {
  id: number
  job_id: string
  title: string
  company?: string
  location?: string
  description?: string
  score: number
  source?: string
}
