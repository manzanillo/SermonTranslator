'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import { authFetch } from '../../utils/auth'
import { Session } from '../../types'

type Language = 'german' | 'english'
type TranslationSegment = { german: string; english: string }

export default function ListenerSessionPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [segments, setSegments] = useState<TranslationSegment[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('english')
  const [isLive, setIsLive] = useState(false)
  
  const socketRef = useRef<Socket | null>(null)

  // Fetch active session on mount
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
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchSession()
  }, [])

  // Initialize Socket
  useEffect(() => {
    socketRef.current = io('')

    socketRef.current.on('translation', (data: { original: string; german: string; english: string }) => {
      setSegments(prev => {
        const newSegment = { german: data.german.trim(), english: data.english.trim() }
        if (!newSegment.german && !newSegment.english) return prev
        
        const updated = [...prev, newSegment]
        if (updated.length > 4) {
          return updated.slice(updated.length - 4)
        }
        return updated
      })
      setIsLive(true)
    })

    socketRef.current.on('sessionStatus', (data) => {
      setIsLive(data.active)
    })

    socketRef.current.on('sessionEnded', () => {
      setIsLive(false)
      setSegments([])
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [])

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
    </div>
  )
}
