'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import { authFetch } from '../../utils/auth'
import { Session } from '../../types'

type Language = 'german' | 'english'
type TranslationSegment = { id: string; german: string; english: string }

export default function ListenerSessionPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [segments, setSegments] = useState<TranslationSegment[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('english')
  const [isLive, setIsLive] = useState(false)
  const [showEndedToast, setShowEndedToast] = useState(false)
  const [toastTitle, setToastTitle] = useState<string | null>(null)
  const [toastBody, setToastBody] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  
  const socketRef = useRef<Socket | null>(null)

  // Fetch active session on mount and when SSE updates occur
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await authFetch('/api/sessions')
        if (res.ok) {
          const sessions = await res.json()
          // For now, just grab the first active session to join
          const active = sessions.find((s: Session) => s.isActive)
          if (active) {
            setSession(active)
            // Join session to receive push notifications on end
            await authFetch(`/api/sessions/${active.id}/join`, { method: 'POST' })
          } else {
            setSession(null)
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
    
    fetchSession()
    // Poll for active session every 15 seconds
    const interval = setInterval(() => {
      fetchSession()
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    socketRef.current = io('http://localhost:3001')

    socketRef.current.on('translation', (data: { id?: string; original: string; german: string; english: string }) => {
      setSegments(prev => {
        const newSegment = {
          id: data.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          german: data.german.trim(),
          english: data.english.trim()
        }

        if (!newSegment.german && !newSegment.english) return prev

        const updated = [...prev, newSegment]
        if (updated.length > 4) {
          return updated.slice(updated.length - 4)
        }
        return updated
      })
      setIsLive(true)
    })

    socketRef.current.on('translationUpdate', (data: { id: string; german?: string; english?: string }) => {
      setSegments(prev => prev.map(segment => {
        if (segment.id !== data.id) return segment
        return {
          ...segment,
          german: data.german?.trim() || segment.german,
          english: data.english?.trim() || segment.english
        }
      }))
    })

    socketRef.current.on('sessionStatus', (data) => {
      setIsLive(data.active)
    })

    socketRef.current.on('sessionEnded', () => {
      setIsLive(false)
      setSegments([])
      router.push('/listener?ended=true')
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const handler = (event: MessageEvent) => {
        const data = event.data
        if (data && data.type === 'push' && data.payload) {
          setToastTitle(data.payload.title || null)
          setToastBody(data.payload.body || null)
          setShowEndedToast(true)
        }
      }

      navigator.serviceWorker.addEventListener('message', handler)
      return () => navigator.serviceWorker.removeEventListener('message', handler)
    }
  }, [])

  useEffect(() => {
    if (showEndedToast && !isMobile) {
      const timer = setTimeout(() => {
        setShowEndedToast(false)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [showEndedToast, isMobile])

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F8F5] px-8 py-8 relative">
      {/* Top Logo */}
      <div className="absolute top-8 left-0 right-0 flex justify-center pointer-events-none">
        <h1 className="font-serif text-2xl font-bold tracking-[-0.04em] text-[#288C49]">
          Zermon
        </h1>
      </div>

      {/* Header Container */}
      <div className="mx-auto w-full max-w-4xl pt-20 mb-12">
        {/* Back Button */}
        <button
          onClick={() => router.push('/listener')}
          className="mb-8 w-max text-[#288C49] hover:text-[#1a6632] transition-colors"
          aria-label="Go back"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        {/* Info Row */}
        <div className="flex items-center justify-between text-sm font-medium text-[#288C49]">
          <div className="w-1/3 truncate">
            {session ? session.title : 'Loading...'}
          </div>
          <div className="w-1/3 text-center flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-600 animate-pulse' : 'bg-gray-400'}`}></div>
            Live translation
          </div>
          <div className="w-1/3 text-right truncate">
            {session && session.imam ? session.imam.name : 'Imam'}
          </div>
        </div>
      </div>

      {/* Main Transcript Content */}
      <div className="mx-auto flex flex-1 w-full max-w-4xl flex-col justify-end pb-24 relative overflow-hidden">
        <div className="flex flex-col gap-6 w-full font-serif text-[#144f2d]">
          {segments.length === 0 && (
            <p className="text-4xl sm:text-5xl font-bold text-[#144f2d]/30 text-center animate-pulse">
              Waiting for live translation...
            </p>
          )}

          {/* Level 4 (Oldest) */}
          {segments.length >= 4 && (
            <p className="text-sm font-medium leading-relaxed opacity-40 transition-all duration-500">
              {segments[segments.length - 4][selectedLanguage]}
            </p>
          )}

          {/* Level 3 */}
          {segments.length >= 3 && (
            <p className="text-xl font-medium leading-relaxed opacity-60 transition-all duration-500">
              {segments[segments.length - 3][selectedLanguage]}
            </p>
          )}

          {/* Level 2 */}
          {segments.length >= 2 && (
            <p className="text-3xl font-semibold leading-tight opacity-80 transition-all duration-500">
              {segments[segments.length - 2][selectedLanguage]}
            </p>
          )}

          {/* Level 1 (Current) */}
          {segments.length >= 1 && (
            <p className="text-5xl sm:text-6xl font-bold leading-[1.1] tracking-tight opacity-100 transition-all duration-500">
              {segments[segments.length - 1][selectedLanguage]}
            </p>
          )}
        </div>
      </div>

      {/* Language Switcher */}
      <div className="flex justify-center pb-8 mt-auto">
        <div className="flex items-center gap-6 font-serif text-lg">
          <button
            onClick={() => setSelectedLanguage('german')}
            className={`transition-colors duration-150 ${
              selectedLanguage === 'german' 
                ? 'font-bold text-[#0c3b28]' 
                : 'font-medium text-[#4c6e4e] hover:text-[#288C49]'
            }`}
          >
            Deutsch
          </button>
          <button
            onClick={() => setSelectedLanguage('english')}
            className={`transition-colors duration-150 ${
              selectedLanguage === 'english' 
                ? 'font-bold text-[#0c3b28]' 
                : 'font-medium text-[#4c6e4e] hover:text-[#288C49]'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {showEndedToast && (
        <>
          {isMobile ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0c3b28]/60 backdrop-blur-sm p-6 transition-all duration-300">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-[#288C49]/10 text-center animate-in fade-in zoom-in duration-200">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#eef7ec] text-[#288C49]">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-serif text-xl font-bold text-[#0c3b28]">{toastTitle ?? 'Session Ended'}</h3>
                <p className="mt-2 text-sm text-[#4c6e4e] leading-relaxed">
                  {toastBody ?? 'The imam has ended the current live session.'}
                </p>
                <button
                  onClick={() => setShowEndedToast(false)}
                  className="mt-6 w-full rounded-xl bg-[#288C49] py-3 text-sm font-semibold text-white shadow-md shadow-[#288C49]/20 transition-all hover:bg-[#1a6632] active:scale-[0.98]"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : (
            <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center justify-between gap-4 rounded-xl bg-[#0c3b28] px-6 py-4 text-white shadow-2xl border border-[#288C49]/20 min-w-[320px] max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300">
              <div className="flex items-center gap-2.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#288C49] text-white">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-serif font-medium text-sm tracking-wide text-emerald-50">
                  {toastBody ?? 'The sermon ended'}
                </span>
              </div>
              <button
                onClick={() => setShowEndedToast(false)}
                className="rounded-lg p-1 text-emerald-200/75 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Dismiss notification"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
