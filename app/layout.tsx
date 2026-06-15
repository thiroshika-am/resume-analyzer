import '../styles/globals.css'
import type { Metadata } from 'next'
import InteractiveBackground from '../components/InteractiveBackground'

export const metadata: Metadata = {
  title: 'Resume AI Matcher',
  description: 'Upload your resume, extract skill insights, and discover ranked job matches.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="relative min-h-screen text-slate-900 dark:text-slate-100 overflow-x-hidden antialiased">
        <InteractiveBackground />
        <div className="relative z-10 min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  )
}
