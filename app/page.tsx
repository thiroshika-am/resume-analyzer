import Link from 'next/link'
import { ArrowRight, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'
import NavBar from '../components/NavBar'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <NavBar />

      <section className="mx-auto max-w-6xl px-6 py-24 text-slate-950 dark:text-slate-50">
        <div className="grid gap-16 lg:grid-cols-[1.2fr_0.8fr] items-center">
          <div>
            <span className="inline-flex items-center rounded-full bg-sky-100 px-4 py-1 text-sm font-semibold text-sky-700 dark:bg-sky-900/40 dark:text-sky-200">
              AI-powered resume matching MVP
            </span>
            <h1 className="mt-8 text-5xl font-semibold tracking-tight sm:text-6xl">
              Turn resumes into ranked job opportunities.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 dark:text-slate-300">
              Upload a resume PDF, extract skills and experience with AI, and discover the best job recommendations from your profile.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/auth" className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200">
                Get started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/dashboard" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:border-slate-300 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700">
                View dashboard
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-card dark:border-slate-800 dark:bg-slate-900">
            <div className="space-y-6">
              <div className="rounded-3xl bg-slate-950/5 p-6 dark:bg-slate-50/5">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Resume insights</p>
                <h2 className="mt-4 text-2xl font-semibold text-slate-950 dark:text-slate-100">Analyze skills, projects, and experience instantly.</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FeatureCard title="Smart skill extraction" description="Identify technical and soft skills from any PDF resume." />
                <FeatureCard title="Job matching" description="Score and rank job listings against your profile." />
                <FeatureCard title="Career recommendations" description="See next-step suggestions based on missing skills." />
                <FeatureCard title="Secure auth" description="Sign in with Supabase Auth and keep your resume data private." />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
      <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-100">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  )
}
