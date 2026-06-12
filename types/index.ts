export interface ResumeSummary {
  id: number
  user_id: string
  filename: string
  extracted_text: string
  summary?: string
  uploaded_at: string
  skills: string[]
  status?: string
  processing_stage?: string
  progress?: number
  scores?: {
    ats_score: number
    skill_score: number
    project_score: number
    experience_score: number
    education_score: number
    overall_score: number
  }
  insights?: {
    strengths: string[]
    weaknesses: string[]
    missing_skills: string[]
    suggestions: string[]
    recommended_certifications: string[]
    recommended_projects: string[]
    internship_readiness_score: number
  }
}

export interface JobMatch {
  id: number
  job_id: string
  title: string
  company?: string
  location?: string
  description?: string
  score: number
  match_percentage?: number
  missing_skills?: string[]
  learning_recommendations?: string[]
  source?: string
}
