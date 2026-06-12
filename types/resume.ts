export interface ResumeEducation {
  text: string
  degree?: string
  institution?: string
  year?: string
  cgpa?: string
}

export interface ResumeProject {
  text: string
  name?: string
  technologies?: string
  github?: string
}

export interface ResumeExperience {
  text: string
}

export interface ResumeCertification {
  name?: string
  organization?: string
  year?: string
  text?: string
}

export interface ResumeAnalysis {
  name?: string
  email?: string
  phone?: string
  linkedin?: string
  github?: string
  portfolio?: string
  location?: string
  skills: string[]
  education: ResumeEducation[]
  projects: ResumeProject[]
  experience: ResumeExperience[]
  certifications: ResumeCertification[]
  summary?: string
}

export interface ResumeScores {
  ats_score: number
  skill_score: number
  project_score: number
  experience_score: number
  education_score: number
  overall_score: number
}

export interface ResumeInsights {
  strengths: string[]
  weaknesses: string[]
  missing_skills: string[]
  suggestions: string[]
  recommended_certifications: string[]
  recommended_projects: string[]
  internship_readiness_score: number
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

export interface UploadResumeResponse {
  id: number
  user_id: string
  filename: string
  extracted_text: string
  summary?: string
  uploaded_at: string
  skills: string[]
  analysis: ResumeAnalysis
  scores: ResumeScores
  insights: ResumeInsights
  job_matches: JobMatch[]
}
