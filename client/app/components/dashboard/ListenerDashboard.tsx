'use client'

import { User } from '../../types'
import SessionsList from './SessionsList'

interface ListenerDashboardProps {
  user: User
}

function getGreeting(name: string) {
  const h = new Date().getHours()
  const period = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'
  return `Good ${period}, ${name.split(' ')[0]}`
}

export default function ListenerDashboard({ user }: ListenerDashboardProps) {
  return (
    <div className="px-8 py-10 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-black tracking-[-0.03em] text-[#0c3b28]">
          {getGreeting(user.name)}
        </h1>
        <p className="mt-2 text-base text-[#4c6e4e]">
          Join a live sermon session and follow along with real-time translations.
        </p>
      </div>

      {/* Info banner */}
      <div className="mb-8 flex items-center gap-4 rounded-2xl border border-[#dbeade] bg-white/95 p-5 shadow-[0_4px_24px_rgba(17,45,22,0.07)]">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#eef7ec]">
          <svg width="18" height="18" fill="none" stroke="#288C49" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0c3b28]">Live sessions update in real time</p>
          <p className="mt-0.5 text-sm text-[#4c6e4e]">
            Sessions appear automatically. Click <strong>Join</strong> to listen with translations.
          </p>
        </div>
      </div>

      {/* Live Sessions */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="font-serif text-2xl font-semibold text-[#0c3b28]">Live Sessions</h2>
          <span className="flex items-center gap-1.5 rounded-full bg-[#eef7ec] px-3 py-0.5">
            <span className="h-2 w-2 rounded-full bg-[#288C49] animate-pulse" />
            <span className="text-xs font-semibold text-[#288C49]">Live</span>
          </span>
        </div>
        <SessionsList currentUser={user} />
      </div>
    </div>
  )
}
