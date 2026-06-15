'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Sparkles, TrendingUp, Cpu, Award, Target, Bot, Check, HelpCircle, FileText, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import NavBar from '../components/NavBar'

export default function HomePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 90, damping: 20 },
    },
  }

  return (
    <main className="min-h-screen relative flex flex-col justify-between overflow-x-hidden">
      <NavBar />

      {/* 1. HERO SECTION */}
      <section className="mx-auto max-w-[1400px] w-full px-6 md:px-12 pt-20 pb-28 text-center flex flex-col items-center justify-center min-h-[90vh]">
        <motion.div 
          className="space-y-8 max-w-4xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <span className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-1.5 text-[10px] font-bold text-slate-300 tracking-widest uppercase">
              <span className="w-1.5 h-1.5 bg-white rounded-full inline-block animate-pulse" />
              Advanced Career Intelligence OS
            </span>
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-7xl lg:text-[92px] font-normal tracking-tighter text-white leading-[0.92] max-w-4xl mx-auto"
            variants={itemVariants}
          >
            Turn Your Resume Into<br />
            <span className="text-slate-400">Career Intelligence.</span>
          </motion.h1>

          <motion.p 
            className="text-base md:text-lg lg:text-xl leading-relaxed text-slate-400 font-normal max-w-2xl mx-auto"
            variants={itemVariants}
          >
            Get recruiter-level resume analysis powered by AI. Extract skills, diagnose ATS template issues, and synthesize direct target roadmaps in seconds.
          </motion.p>

          <motion.div 
            className="flex flex-wrap justify-center gap-4 pt-2"
            variants={itemVariants}
          >
            <Link 
              href="/auth" 
              className="group inline-flex items-center justify-center rounded-lg bg-white text-slate-950 px-7 py-3.5 text-xs font-bold transition hover:bg-slate-100 shadow-sm active:scale-95 duration-100"
            >
              Get Started
              <ArrowRight className="ml-2 h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </Link>
            <Link 
              href="/dashboard" 
              className="btn-silver inline-flex items-center justify-center rounded-lg px-7 py-3.5 text-xs font-bold active:scale-95 duration-100"
            >
              View Dashboard
            </Link>
          </motion.div>
        </motion.div>

        {/* 2. VISUAL CENTERPIECE: Animated Intelligence Pipeline */}
        <div className="w-full max-w-[1100px] mt-24">
          <PipelineVisualization />
        </div>
      </section>

      {/* 3. TRUSTED BY (SOCIAL PROOF) */}
      <section className="border-y border-white/[0.02] bg-white/[0.003] py-10 text-center">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-[9px] font-bold text-slate-500 tracking-widest uppercase mb-6">
            INTEGRATED WITH LEADING WORKPLACE PLATFORMS
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-6 text-sm font-black text-slate-500/50 uppercase tracking-widest select-none">
            <span>Stripe</span>
            <span>Vercel</span>
            <span>Linear</span>
            <span>Notion</span>
            <span>Anthropic</span>
            <span>Arc</span>
          </div>
        </div>
      </section>

      {/* 4. PLATFORM OVERVIEW / HOW IT WORKS */}
      <section className="mx-auto max-w-6xl w-full px-6 py-32 space-y-16">
        <div className="text-center space-y-4">
          <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">Platform Mechanics</span>
          <h2 className="text-3xl md:text-5xl font-normal text-white tracking-tight leading-none">
            Built for professional diagnostics.
          </h2>
          <p className="text-slate-400 text-xs md:text-sm max-w-md mx-auto">
            Our pipeline indexes, scores, and filters resumes against active job market parameters.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <OverviewCard 
            step="01"
            title="Metadata Parsing"
            description="Our custom parsers catalog technical and soft capability tags straight from your PDF."
          />
          <OverviewCard 
            step="02"
            title="ATS Diagnostics"
            description="Runs layout tests mapping structure, text sizing, and syntax against modern resume parsers."
          />
          <OverviewCard 
            step="03"
            title="Roadmap Generation"
            description="Synthesizes targeted project ideas, recommended credentials, and job matches based on gap models."
          />
        </div>
      </section>

      {/* 5. FEATURE SHOWCASE: ATS ANALYSIS */}
      <section className="border-t border-white/[0.02] py-32">
        <div className="mx-auto max-w-6xl px-6 grid gap-16 lg:grid-cols-2 items-center">
          <div className="space-y-6">
            <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">System Telemetry</span>
            <h2 className="text-3xl md:text-5xl font-normal text-white tracking-tight leading-tight">
              Detailed ATS scoring.<br />
              No guesswork.
            </h2>
            <p className="text-slate-455 text-xs leading-relaxed max-w-md font-semibold">
              Get detailed analysis on formatting, keywords alignment, and overall layout constraints. Detect weaknesses and receive optimizations designed to rank on recruiter dashboards.
            </p>
            <div className="pt-2">
              <Link href="/auth" className="inline-flex items-center gap-1 text-xs font-bold text-white hover:text-slate-300">
                Run ATS Diagnostics <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Interactive Showcase Mockup */}
          <div className="glass-card rounded-2xl p-6 border-white/5 shadow-2xl space-y-4 max-w-md mx-auto w-full">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Analysis Results</span>
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">Active Test</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-300">
                <span>ATS Structure Match</span>
                <span className="text-white">88%</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-white/80 w-[88%]" />
              </div>
            </div>
            <div className="space-y-2 text-xs font-semibold leading-relaxed border-t border-white/5 pt-3 text-slate-400">
              <p className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-white mt-0.5 shrink-0" /> Contact variables parsed correctly</p>
              <p className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-white mt-0.5 shrink-0" /> Primary technical skills index matched</p>
              <p className="flex items-start gap-2 text-slate-500"><span className="w-3.5 h-3.5 rounded-full bg-white/5 inline-block shrink-0" /> Missing target cloud deployment certificate tag</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FEATURE SHOWCASE: CAREER INSIGHTS */}
      <section className="border-t border-white/[0.02] py-32 bg-white/[0.002]">
        <div className="mx-auto max-w-6xl px-6 grid gap-16 lg:grid-cols-2 items-center">
          {/* Interactive Chat Mockup */}
          <div className="glass-card rounded-2xl border-white/5 shadow-2xl overflow-hidden max-w-md mx-auto w-full order-last lg:order-first">
            <div className="flex items-center justify-between px-5 py-3 bg-white/[0.01] border-b border-white/5">
              <span className="text-[9px] font-bold tracking-widest text-slate-405 uppercase">CareerCoach Chat</span>
              <span className="w-2 h-2 rounded-full bg-white inline-block" />
            </div>
            <div className="p-5 space-y-4 max-h-56 overflow-y-auto text-xs font-semibold leading-relaxed text-slate-350">
              <div className="bg-white/[0.02] border border-white/5 rounded-lg px-4 py-3 text-slate-300 rounded-tl-none">
                I&apos;ve analyzed your resume against Senior React developer roles. Here is your gap roadmap.
              </div>
              <div className="bg-white text-slate-950 rounded-lg px-4 py-3 rounded-tr-none font-bold self-end text-right ml-12">
                Which skill should I prioritize first?
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-lg px-4 py-3 text-slate-300 rounded-tl-none">
                Start with GraphQL and state managers. We detected high keyword presence in your target job descriptions.
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">Personal Advisor</span>
            <h2 className="text-3xl md:text-5xl font-normal text-white tracking-tight leading-tight">
              Interactive career coaching.
            </h2>
            <p className="text-slate-455 text-xs leading-relaxed max-w-md font-semibold">
              Leverage an inline AI advisor to rewrite bullet points, identify what skills to prioritize first, and receive customized roadmap recommendations.
            </p>
            <div className="pt-2">
              <Link href="/coach" className="inline-flex items-center gap-1 text-xs font-bold text-white hover:text-slate-300">
                Meet CareerCoach <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS */}
      <section className="border-t border-white/[0.02] py-32 text-center">
        <div className="mx-auto max-w-4xl px-6 space-y-8">
          <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">RECRUITER FEEDBACK</span>
          <blockquote className="text-xl md:text-2xl font-light text-slate-300 italic leading-relaxed">
            &ldquo;This is not another resume checker. It&apos;s a telemetry platform for career mapping. The skill-gap recommendations mapped exactly to what we hire for at Vercel.&rdquo;
          </blockquote>
          <div className="space-y-1">
            <p className="text-xs font-bold text-white uppercase tracking-wider">Marcus Vance</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Talent Director, Vercel</p>
          </div>
        </div>
      </section>

      {/* 8. CALL TO ACTION (CTA) */}
      <section className="mx-auto max-w-5xl w-full px-6 pb-32">
        <div className="glass-card rounded-[2rem] p-12 text-center border-white/5 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 animate-silver-sweep opacity-5 pointer-events-none" />
          <div className="space-y-6 max-w-md mx-auto relative z-10">
            <h2 className="text-3xl font-normal text-white tracking-tight">Deploy your resume today.</h2>
            <p className="text-slate-400 text-xs font-normal">
              Analyze your profile against the career alignment index and receive tailored feedback instantly.
            </p>
            <div className="pt-2">
              <Link 
                href="/auth" 
                className="inline-flex items-center justify-center rounded-lg bg-white text-slate-950 px-6 py-3 text-xs font-bold transition hover:bg-slate-100 active:scale-95 duration-100 shadow-sm"
              >
                Ingest Resume
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="border-t border-white/[0.02] bg-white/[0.001] py-16 text-xs text-slate-500 font-semibold uppercase tracking-wider">
        <div className="mx-auto max-w-6xl px-6 grid gap-12 sm:grid-cols-4">
          <div className="space-y-3">
            <span className="w-2.5 h-2.5 bg-white rounded-sm inline-block mb-1" />
            <p className="text-[10px] font-bold text-white">Career OS</p>
            <p className="text-[9px] text-slate-500 font-normal leading-relaxed">Built for professionals and talent recruiters.</p>
          </div>
          <div className="space-y-2.5">
            <p className="text-[10px] font-bold text-white">Platform</p>
            <Link href="/upload" className="block text-[9px] font-bold text-slate-500 hover:text-slate-350">Upload Ingestion</Link>
            <Link href="/matches" className="block text-[9px] font-bold text-slate-500 hover:text-slate-350">Matches Index</Link>
            <Link href="/insights" className="block text-[9px] font-bold text-slate-500 hover:text-slate-350">Insights Advisory</Link>
          </div>
          <div className="space-y-2.5">
            <p className="text-[10px] font-bold text-white">System</p>
            <Link href="/coach" className="block text-[9px] font-bold text-slate-500 hover:text-slate-350">CareerCoach Terminal</Link>
            <Link href="/auth" className="block text-[9px] font-bold text-slate-500 hover:text-slate-350">Security Gate</Link>
          </div>
          <div className="space-y-2.5">
            <p className="text-[10px] font-bold text-white">Legal</p>
            <p className="text-[9px] font-normal leading-relaxed text-slate-500 lowercase">standards secured. user data row protected.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

function OverviewCard({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.005] p-8 space-y-4 hover:border-white/10 transition duration-200">
      <span className="text-[10px] font-extrabold text-slate-505 dark:text-slate-400 tracking-wider uppercase block">{step}</span>
      <h3 className="text-base font-bold text-white uppercase tracking-wider">{title}</h3>
      <p className="text-xs leading-relaxed text-slate-400 font-normal">{description}</p>
    </div>
  )
}

// -------------------------------------------------------------
// Interactive SVG Pipeline Centerpiece
// -------------------------------------------------------------
function PipelineVisualization() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 6)
    }, 1800)
    return () => clearInterval(timer)
  }, [])

  const steps = [
    { label: 'Resume', desc: 'File Ingestion' },
    { label: 'ATS Analysis', desc: 'Syntax Diagnostic' },
    { label: 'Skill Extraction', desc: 'Capability Indexing' },
    { label: 'Gap Detection', desc: 'Gaps Modeling' },
    { label: 'Job Matching', desc: 'Scoring Benchmark' },
    { label: 'Career Roadmap', desc: 'Roadmap Synthesis' }
  ]

  const coordinates = [
    { x: 100, y: 100 },
    { x: 260, y: 100 },
    { x: 420, y: 100 },
    { x: 580, y: 100 },
    { x: 740, y: 100 },
    { x: 900, y: 100 }
  ]

  return (
    <div className="w-full glass-card border-white/5 rounded-2xl px-6 py-10 shadow-lg relative overflow-hidden">
      {/* Background blueprint elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.015)_0%,transparent_100%)] pointer-events-none" />

      {/* SVG canvas mapping nodes and paths */}
      <div className="w-full overflow-x-auto scrollbar-none">
        <svg 
          viewBox="0 0 1000 200" 
          className="w-full min-w-[768px] h-auto"
        >
          {/* Main thin baseline connector line */}
          <path 
            d="M 100 100 H 900" 
            stroke="rgba(255, 255, 255, 0.05)" 
            strokeWidth="1.2" 
            fill="none" 
          />

          {/* Glowing flow dashes moving along paths */}
          <path 
            d="M 100 100 H 900" 
            stroke="rgba(255, 255, 255, 0.28)" 
            strokeWidth="1.6" 
            fill="none" 
            className="animate-pipeline-flow" 
          />

          {/* Map links/nodes */}
          {coordinates.map((coord, i) => {
            const isActive = i === activeIndex
            const isCompleted = i < activeIndex
            
            return (
              <g key={i} className="cursor-default select-none">
                {/* Node outer ring */}
                <circle 
                  cx={coord.x} 
                  cy={coord.y} 
                  r={isActive ? 16 : 10} 
                  className="transition-all duration-500 fill-slate-950" 
                  stroke={isActive ? 'rgba(255, 255, 255, 0.6)' : isCompleted ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)'} 
                  strokeWidth={isActive ? 2 : 1.2} 
                />

                {/* Node center point */}
                <circle 
                  cx={coord.x} 
                  cy={coord.y} 
                  r={isActive ? 5.5 : 3} 
                  className="transition-all duration-500" 
                  fill={isActive ? '#FFFFFF' : isCompleted ? 'rgba(255,255,255,0.5)' : 'rgba(255, 255, 255, 0.15)'} 
                />

                {/* Step labels */}
                <text 
                  x={coord.x} 
                  y={60} 
                  textAnchor="middle" 
                  className={`text-[10px] uppercase tracking-wider select-none transition-all duration-300 font-bold ${
                    isActive ? 'fill-white font-extrabold text-[11px]' : 'fill-slate-500'
                  }`}
                >
                  {steps[i].label}
                </text>
                
                {/* Sub details description */}
                <text 
                  x={coord.x} 
                  y={150} 
                  textAnchor="middle" 
                  className={`text-[8.5px] uppercase tracking-widest select-none transition-all duration-300 ${
                    isActive ? 'fill-slate-300 font-bold' : 'fill-slate-650'
                  }`}
                >
                  {steps[i].desc}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
