'use client'

import { useEffect, useState } from 'react'
import { Session, User } from '../../types'
import { authFetch } from '../../utils/auth'
import SessionCard from './SessionCard'

interface SessionsListProps {
  currentUser: User
}

export default function SessionsList({ currentUser }: SessionsListProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchSessions = async () => {
    try {
      const res = await authFetch('/api/sessions')
      if (!res.ok) throw new Error('Failed to fetch')
      const data: Session[] = await res.json()
      setSessions(data.filter((s) => s.isActive))
      setError('')
    } catch {
      setError('Could not load sessions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()

    // Poll for sessions updates every 15 seconds
    const interval = setInterval(() => {
      fetchSessions()
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-[72px] animate-pulse rounded-2xl bg-white/60 border border-[#dbeade]" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-[#f5d0d0] bg-[#fff1f1] px-5 py-4 text-sm text-[#9b2c2c]">
        {error}
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-[#dbeade] bg-white/60 py-16 text-center w-full">
        <svg width="48" height="48" fill="none" stroke="#b6d8c0" strokeWidth="1.4" viewBox="0 0 24 24" className="mb-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <p className="font-serif text-lg text-[#0c3b28]">No live sermons right now</p>
        <p className="mt-1 text-sm text-[#4c6e4e]">Sessions will appear here when an Imam goes live.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} currentUser={currentUser} />
      ))}
    </div>
  )
}
