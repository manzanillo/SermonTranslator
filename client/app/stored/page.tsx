'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '../components/dashboard/AppShell'
import { authFetch, getCachedUser, setCachedUser } from '../utils/auth'
import { Session, User } from '../types'

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function calculateSessionDuration(session: Session) {
  if (session.translations && session.translations.length > 0) {
    const start = new Date(session.createdAt).getTime()
    const lastT = session.translations[session.translations.length - 1]
    const end = new Date(lastT.createdAt).getTime()
    return formatDuration(Math.max(0, end - start))
  }
  // Mock duration for testing/design if no translations exist
  return '00:02:51'
}

export default function StoredSermonsPage() {
  const [user, setUser] = useState<User | null>(() => getCachedUser())
  const [loading, setLoading] = useState(() => !getCachedUser())
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [uiLanguage, setUiLanguage] = useState<'german' | 'english'>('english')
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      try {
        const authRes = await authFetch('http://localhost:3001/api/auth/me')
        if (!authRes.ok) throw new Error('Not authorized')
        const authData = await authRes.json()
        setUser(authData.user)
        setCachedUser(authData.user)

        const sessRes = await authFetch('http://localhost:3001/api/sessions')
        if (sessRes.ok) {
          const allSessions: Session[] = await sessRes.json()
          // Filter only INACTIVE sessions for the "Stored Sermons" page
          setSessions(allSessions.filter(s => !s.isActive))
        }
      } catch (err) {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router])

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFDEB]">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#288C49] border-t-transparent" />
        </div>
      </div>
    )
  }

  const handleLookAt = () => {
    if (selectedSessionId) {
      router.push(`/stored/${selectedSessionId}`)
    }
  }

  return (
    <AppShell user={user}>
      <div className="flex flex-col min-h-[calc(100vh-2rem)] py-8 px-12 relative max-w-5xl mx-auto">
        
        {/* Header Row */}
        <div className="flex items-center justify-between mb-12 h-10">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-[#0c3b28]">
            Stored sermons
          </h1>
          {selectedSessionId && (
            <button
              onClick={handleLookAt}
              className="bg-[#288C49] text-white px-8 py-2 rounded-lg font-semibold shadow-sm hover:bg-[#1a6632] transition-colors"
            >
              Look at
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 flex flex-col gap-2">
          {sessions.length === 0 ? (
            <p className="text-[#4c6e4e] font-medium text-lg">No stored sermons available.</p>
          ) : (
            sessions.map((session) => {
              const isSelected = selectedSessionId === session.id
              let desc = session.description || ''
              if (desc.length > 25) {
                desc = desc.substring(0, 25) + '...'
              } else if (desc.length > 0) {
                desc = desc + '...'
              }

              return (
                <div
                  key={session.id}
                  onClick={() => setSelectedSessionId(session.id)}
                  className={`flex items-center justify-between px-6 py-6 cursor-pointer rounded-xl transition-colors duration-150 ${
                    isSelected ? 'bg-[#dbeade]' : 'hover:bg-[#eef7ec]/50'
                  }`}
                >
                  <div>
                    <h2 className="font-serif text-3xl font-bold text-[#0c3b28] mb-1">
                      {session.title}
                    </h2>
                    <p className="text-[#4c6e4e] font-sans text-sm">
                      {desc || 'Description...'}
                    </p>
                  </div>
                  <div className="text-[#4c6e4e] font-sans text-sm">
                    {calculateSessionDuration(session)}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer Language Switcher */}
        <div className="flex justify-center mt-12 pb-8">
          <div className="flex items-center gap-6 font-serif text-lg">
            <button
              onClick={() => setUiLanguage('german')}
              className={`transition-colors duration-150 ${
                uiLanguage === 'german' 
                  ? 'font-bold text-[#0c3b28]' 
                  : 'font-medium text-[#4c6e4e] hover:text-[#288C49]'
              }`}
            >
              Deutsch
            </button>
            <button
              onClick={() => setUiLanguage('english')}
              className={`transition-colors duration-150 ${
                uiLanguage === 'english' 
                  ? 'font-bold text-[#0c3b28]' 
                  : 'font-medium text-[#4c6e4e] hover:text-[#288C49]'
              }`}
            >
              English
            </button>
          </div>
        </div>

      </div>
    </AppShell>
  )
}
