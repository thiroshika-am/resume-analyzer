'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabaseClient'
import NavBar from '../../components/NavBar'
import { ResumeSummary } from '../../types'
import { Send, ArrowLeft, Loader2, Sparkles, Award, Compass, HelpCircle, Code, User, Bot } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function CareerCoachPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [resumes, setResumes] = useState<ResumeSummary[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<number | ''>('')
  const [targetRole, setTargetRole] = useState<string>('')
  
  // Chat States
  const [isChatActive, setIsChatActive] = useState<boolean>(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error || !data.session) {
          router.push('/auth')
          return
        }
        setSession(data.session)
        await loadResumes(data.session.access_token)
      } catch (err) {
        console.error('Auth check failed:', err)
        router.push('/auth')
      } finally {
        setIsPageLoading(false)
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (isChatActive) {
      scrollToBottom()
    }
  }, [messages, isChatActive, isLoading])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadResumes = async (token: string) => {
    try {
      const response = await fetch('/api/user/resumes', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          setResumes(data)
          if (data.length > 0) {
            setSelectedResumeId(data[0].id)
          }
        }
      }
    } catch (err) {
      console.error('Error loading resumes:', err)
    }
  }

  const handleStartCoaching = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedResumeId || !targetRole.trim() || !session) return

    setIsChatActive(true)
    setIsLoading(true)
    setMessages([])

    try {
      const response = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          resume_id: selectedResumeId,
          target_role: targetRole,
          messages: [],
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to load initial advisor content')
      }

      const data = await response.json()
      setMessages([{ role: 'assistant', content: data.response }])
    } catch (err) {
      console.error('Failed to start chat session:', err)
      setMessages([
        {
          role: 'assistant',
          content: '### ⚠️ Error\n\nI was unable to load your career roadmap. Please verify your connection and try again.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (contentToSend: string) => {
    if (!contentToSend.trim() || isLoading || !session || !selectedResumeId) return

    const updatedMessages: ChatMessage[] = [...messages, { role: 'user', content: contentToSend }]
    setMessages(updatedMessages)
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          resume_id: selectedResumeId,
          target_role: targetRole,
          messages: updatedMessages,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to retrieve response')
      }

      const data = await response.json()
      setMessages([...updatedMessages, { role: 'assistant', content: data.response }])
    } catch (err) {
      console.error('Failed to send message:', err)
      setMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          content: '### ⚠️ Error\n\nSorry, I encountered an error processing that request. Please try again.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const parseMarkdown = (text: string) => {
    if (!text) return null
    const lines = text.split('\n')
    return lines.map((line, idx) => {
      let content = line.trim()
      
      // Match markdown headers
      if (content.startsWith('### ')) {
        return <h3 key={idx} className="text-xs font-bold mt-5 mb-3 text-white border-b border-white/5 pb-1 uppercase tracking-wider">{content.slice(4)}</h3>
      }
      if (content.startsWith('#### ')) {
        return <h4 key={idx} className="text-xs font-bold mt-4 mb-2 text-slate-205">{content.slice(5)}</h4>
      }
      if (content.startsWith('## ')) {
        return <h2 key={idx} className="text-sm font-bold mt-6 mb-4 text-white uppercase tracking-widest">{content.slice(3)}</h2>
      }

      // Match lists
      if (content.startsWith('- ')) {
        return (
          <li key={idx} className="ml-5 list-disc my-1.5 text-slate-300 text-xs leading-relaxed font-semibold">
            {formatInlineMarkup(content.slice(2))}
          </li>
        )
      }
      if (content.startsWith('* ')) {
        return (
          <li key={idx} className="ml-5 list-disc my-1.5 text-slate-300 text-xs leading-relaxed font-semibold">
            {formatInlineMarkup(content.slice(2))}
          </li>
        )
      }

      if (content === '') {
        return <div key={idx} className="h-3" />
      }

      return (
        <p key={idx} className="my-2 text-slate-300 text-xs leading-relaxed font-semibold">
          {formatInlineMarkup(content)}
        </p>
      )
    })
  }

  const formatInlineMarkup = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-extrabold text-white bg-white/[0.04] px-1 py-0.5 rounded">{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index} className="italic text-slate-200 font-bold">{part.slice(1, -1)}</em>
      }
      return part
    })
  }

  const quickReplies = [
    { text: 'How long will this take?', icon: Compass },
    { text: 'Which skill to learn first?', icon: Code },
    { text: 'Rewrite my resume bullet points', icon: Award },
    { text: 'What courses do you recommend?', icon: HelpCircle },
    { text: 'Am I ready to apply?', icon: Sparkles },
  ]

  if (isPageLoading) {
    return (
      <main className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col justify-center items-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-450" />
      </main>
    )
  }

  return (
    <main className="min-h-screen relative overflow-hidden pb-12 flex flex-col justify-between">
      <NavBar />
      
      <div className="flex-1 flex items-center justify-center mx-auto w-full max-w-4xl px-6">
        {!isChatActive ? (
          /* STAGE 1: SETUP FORM */
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xl py-12"
          >
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1 text-[9px] font-bold text-slate-300 tracking-wider uppercase">
                Interactive Career Advisor
              </span>
              <h1 className="text-3xl font-semibold tracking-tight mt-3 text-white">
                Meet <span className="text-slate-400">CareerCoach</span>
              </h1>
              <p className="mt-3 text-xs text-slate-400 font-normal max-w-sm mx-auto leading-relaxed">
                Select your base resume and target role. Our AI agent will draft targeted roadmaps and answer your questions.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-8 border-white/5 shadow-2xl relative overflow-hidden">
              {resumes.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-450 mb-6 font-semibold">No resumes uploaded yet. Upload a resume to get started.</p>
                  <Link href="/upload" className="inline-flex items-center gap-1.5 rounded-lg bg-white px-6 py-3 text-xs font-bold text-slate-950 transition hover:bg-slate-100">
                    Upload Resume
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleStartCoaching} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="resume-select" className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 pl-0.5">
                      1. Select Base Resume
                    </label>
                    <select
                      id="resume-select"
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(Number(e.target.value))}
                      className="w-full glass-input focus:ring-1 focus:ring-white/10 text-xs font-bold"
                      required
                    >
                      {resumes.map((r) => (
                        <option key={r.id} value={r.id} className="bg-slate-950 text-white">
                          {r.filename} ({new Date(r.uploaded_at).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="target-role" className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 pl-0.5">
                      2. Target Career Role
                    </label>
                    <input
                      id="target-role"
                      type="text"
                      placeholder="e.g., Senior React Developer, ML Engineer"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="w-full glass-input text-xs font-bold"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedResumeId || !targetRole.trim()}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-white hover:bg-slate-100 py-3.5 text-xs font-bold text-slate-950 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-95 duration-100 group"
                  >
                    Start Advisory Session
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        ) : (
          /* STAGE 2: ACTIVE CHAT SCREEN */
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex flex-col h-[78vh] glass-card border-white/5 rounded-2xl shadow-2xl overflow-hidden mt-6"
          >
            {/* Header info */}
            <div className="flex items-center justify-between px-6 py-4 bg-white/[0.01] border-b border-white/5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsChatActive(false)}
                  className="p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] text-slate-400 transition hover:text-white"
                  title="Back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h2 className="text-sm font-bold text-white">CareerCoach</h2>
                  <p className="text-[9px] text-slate-400 flex items-center gap-1 font-bold uppercase tracking-wide">
                    Roadmap for <span className="font-bold text-white">{targetRole}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/5 px-3 py-1 rounded-lg text-slate-350">
                <Sparkles className="h-3 w-3" />
                <span className="text-[9px] font-bold uppercase tracking-widest">Advisor Agent</span>
              </div>
            </div>

            {/* Scrollable chat messages area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin">
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="h-8 w-8 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-center text-slate-400 shrink-0">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] md:max-w-[75%] rounded-xl px-5 py-4 shadow-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-white text-slate-950 rounded-tr-none'
                          : 'bg-white/[0.01] border border-white/5 text-slate-300 rounded-tl-none'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p className="text-xs font-bold whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="space-y-1">
                          {parseMarkdown(msg.content)}
                        </div>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="h-8 w-8 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-center text-slate-400 shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <div className="flex justify-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-center text-slate-450 shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-white/[0.01] border border-white/5 rounded-xl rounded-tl-none px-5 py-4 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-slate-450 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-450 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-450 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies */}
            {messages.length > 0 && !isLoading && (
              <div className="px-6 py-3 bg-white/[0.01] border-t border-white/5 overflow-x-auto whitespace-nowrap flex gap-2 scrollbar-none shrink-0">
                {quickReplies.map((qr) => {
                  const Icon = qr.icon
                  return (
                    <button
                      key={qr.text}
                      onClick={() => handleSendMessage(qr.text)}
                      className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-lg border border-white/5 bg-white/[0.01] hover:border-white/10 text-[9px] font-bold uppercase tracking-wider text-slate-350 transition hover:text-white cursor-pointer active:scale-95 duration-100 shadow-sm"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {qr.text}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Message input area */}
            <div className="px-6 py-4 bg-white/[0.01] border-t border-white/5 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage(inputValue)
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask follow-up questions..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 rounded-lg border border-white/5 bg-white/[0.01] px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-white/10 text-xs font-semibold disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="rounded-lg bg-white hover:bg-slate-100 px-5 py-3.5 text-slate-950 transition disabled:opacity-50 flex items-center justify-center shadow-md active:scale-95 duration-100"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  )
}
