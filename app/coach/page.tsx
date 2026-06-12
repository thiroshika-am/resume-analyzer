'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import NavBar from '../../components/NavBar'
import { ResumeSummary } from '../../types'
import { Send, ArrowLeft, Loader2, Sparkles, Award, Compass, HelpCircle, Code } from 'lucide-react'

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
        return <h3 key={idx} className="text-xl font-bold mt-5 mb-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 border-b border-slate-700/50 pb-1">{content.slice(4)}</h3>
      }
      if (content.startsWith('#### ')) {
        return <h4 key={idx} className="text-lg font-semibold mt-4 mb-2 text-slate-100">{content.slice(5)}</h4>
      }
      if (content.startsWith('## ')) {
        return <h2 key={idx} className="text-2xl font-extrabold mt-6 mb-4 text-white">{content.slice(3)}</h2>
      }

      // Match lists
      if (content.startsWith('- ')) {
        return (
          <li key={idx} className="ml-5 list-disc my-1.5 text-slate-300 text-sm md:text-base leading-relaxed">
            {formatInlineMarkup(content.slice(2))}
          </li>
        )
      }
      if (content.startsWith('* ')) {
        return (
          <li key={idx} className="ml-5 list-disc my-1.5 text-slate-300 text-sm md:text-base leading-relaxed">
            {formatInlineMarkup(content.slice(2))}
          </li>
        )
      }

      if (content === '') {
        return <div key={idx} className="h-3" />
      }

      return (
        <p key={idx} className="my-2 text-slate-300 text-sm md:text-base leading-relaxed">
          {formatInlineMarkup(content)}
        </p>
      )
    })
  }

  const formatInlineMarkup = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-white bg-slate-800/40 px-1 py-0.5 rounded">{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index} className="italic text-indigo-300">{part.slice(1, -1)}</em>
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
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <p className="text-slate-400 text-sm">Verifying session...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden relative pb-12">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none" />

      <NavBar />
      
      <div className="mx-auto max-w-4xl px-4 mt-6">
        {!isChatActive ? (
          /* STAGE 1: TARGET ROLE & RESUME SELECTION */
          <div className="max-w-xl mx-auto mt-12">
            <div className="text-center mb-8">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
                Interactive Career Advisor
              </span>
              <h1 className="text-4xl font-extrabold tracking-tight mt-3 text-white">
                Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">CareerCoach</span>
              </h1>
              <p className="mt-3 text-slate-400 text-base">
                Select your resume, target role, and let AI analyze your gaps, build a roadmap, and rewrite bullet points.
              </p>
            </div>

            <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 blur-2xl rounded-full" />
              
              {resumes.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-slate-300 mb-6">No resumes uploaded yet. You need a resume to get coaching advice.</p>
                  <Link href="/upload" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 font-semibold text-white transition hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-indigo-500/20">
                    Upload Resume
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleStartCoaching} className="space-y-6">
                  <div>
                    <label htmlFor="resume-select" className="block text-sm font-semibold text-slate-200 mb-2">
                      1. Select Your Base Resume
                    </label>
                    <select
                      id="resume-select"
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(Number(e.target.value))}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                      required
                    >
                      {resumes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.filename} ({new Date(r.uploaded_at).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="target-role" className="block text-sm font-semibold text-slate-200 mb-2">
                      2. Target Career Role
                    </label>
                    <input
                      id="target-role"
                      type="text"
                      placeholder="e.g., Senior React Developer, ML Engineer"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedResumeId || !targetRole.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 py-4 font-semibold text-white transition hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 mt-4 group"
                  >
                    Start AI Advisory Session
                    <Sparkles className="h-4 w-4 text-blue-200 group-hover:scale-110 transition-transform" />
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* STAGE 2: ACTIVE GLASSMORPHIC CHAT PANEL */
          <div className="flex flex-col h-[78vh] backdrop-blur-xl bg-slate-900/40 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900/80 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsChatActive(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition hover:text-white"
                  title="Back to Role Entry"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h2 className="text-base font-bold text-white">CareerCoach</h2>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    Roadmap for <span className="font-semibold text-indigo-400">{targetRole}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                <Sparkles className="h-3 w-3 text-indigo-400" />
                <span className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wide">Dynamic Coach</span>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-500/10'
                        : 'bg-slate-900/90 border border-slate-800/80 text-slate-100 rounded-tl-none shadow-md'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="text-sm md:text-base whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="text-sm whitespace-pre-wrap">
                        {parseMarkdown(msg.content)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl rounded-tl-none px-5 py-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies Panel */}
            {messages.length > 0 && !isLoading && (
              <div className="px-6 py-3 bg-slate-950/40 border-t border-slate-900/60 overflow-x-auto whitespace-nowrap flex gap-2 scrollbar-none">
                {quickReplies.map((qr) => {
                  const Icon = qr.icon
                  return (
                    <button
                      key={qr.text}
                      onClick={() => handleSendMessage(qr.text)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900 hover:bg-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 transition hover:text-white cursor-pointer active:scale-95 duration-100"
                    >
                      <Icon className="h-3.5 w-3.5 text-indigo-400" />
                      {qr.text}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Input Bar */}
            <div className="px-6 py-4 bg-slate-900/80 border-t border-slate-800/80">
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
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950/90 px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition text-sm disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-3 text-white transition disabled:opacity-50 flex items-center justify-center shadow-lg shadow-blue-500/10"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
